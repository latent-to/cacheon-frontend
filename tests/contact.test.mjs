import test from 'node:test'
import assert from 'node:assert/strict'
import { submitContact } from '../app/lib/contact.server.ts'

const fields = {
  name: 'Alex Chen',
  email: 'alex@example.com',
  company: 'Example',
  message: 'Optimize Qwen for 20 concurrent users. Unicode: 日本語',
  website: '',
}
const request = (values = fields, headers = {}) =>
  new Request('https://cacheon.ai/', {
    method: 'POST',
    headers: { Origin: 'https://cacheon.ai', 'CF-Connecting-IP': '192.0.2.1', ...headers },
    body: new URLSearchParams(values),
  })
function setup() {
  const sent = []
  const keys = []
  return {
    sent,
    keys,
    env: {
      SALES_EMAIL: {
        async send(message) {
          sent.push(message)
        },
      },
      CONTACT_RATE_LIMITER: {
        async limit({ key }) {
          keys.push(key)
          return { success: true }
        },
      },
    },
  }
}

test('sends only to sales with a fixed sender and validated reply address', async () => {
  const { env, sent, keys } = setup()
  const result = await submitContact(
    request({ ...fields, to: 'attacker@example.com', from: 'fake@example.com' }),
    env,
  )
  assert.equal(result.status, 200)
  assert.equal(result.body.ok, true)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, 'sales@cacheon.ai')
  assert.equal(sent[0].from, 'website@cacheon.ai')
  assert.equal(sent[0].replyTo, fields.email)
  assert.ok(sent[0].text.includes(fields.message))
  assert.deepEqual(keys, ['192.0.2.1'])
})

test('does not report success before email acceptance', async () => {
  const { env } = setup()
  let accept
  env.SALES_EMAIL.send = () =>
    new Promise((resolve) => {
      accept = resolve
    })
  let finished = false
  const submission = submitContact(request(), env).then((result) => {
    finished = true
    return result
  })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(finished, false)
  accept()
  assert.equal((await submission).body.ok, true)
})

test('rejects empty, oversized and header-injection fields without sending', async () => {
  for (const [field, value] of [
    ['name', ' '],
    ['name', 'a'.repeat(121)],
    ['email', 'bad'],
    ['email', 'a@example.com\r\nBcc: bad@example.com'],
    ['company', 'a'.repeat(161)],
    ['message', ' '],
    ['message', 'a'.repeat(5001)],
  ]) {
    const { env, sent } = setup()
    const result = await submitContact(request({ ...fields, [field]: value }), env)
    assert.equal(result.status, 400)
    assert.ok(result.body.errors[field])
    assert.equal(sent.length, 0)
  }
})

test('rejects cross-origin requests, unsupported content and bots', async () => {
  const { env, sent } = setup()
  assert.equal(
    (await submitContact(request(fields, { Origin: 'https://other.example' }), env)).status,
    403,
  )
  assert.equal(
    (await submitContact(request(fields, { 'Content-Type': 'application/json' }), env)).status,
    415,
  )
  assert.equal((await submitContact(request({ ...fields, website: 'spam' }), env)).status, 400)
  assert.equal((await submitContact(new Request('https://cacheon.ai/'), env)).status, 405)
  assert.equal(sent.length, 0)
})

test('caps the actual request body without relying on Content-Length', async () => {
  const { env, sent } = setup()
  assert.equal(
    (await submitContact(request({ ...fields, message: 'a'.repeat(33000) }), env)).status,
    413,
  )
  assert.equal(sent.length, 0)
})

test('rate limits before delivery and fails closed without required bindings', async () => {
  const { env, sent } = setup()
  env.CONTACT_RATE_LIMITER.limit = async () => ({ success: false })
  assert.equal((await submitContact(request(), env)).status, 429)
  assert.equal((await submitContact(request(), { SALES_EMAIL: env.SALES_EMAIL })).status, 503)
  assert.equal(
    (await submitContact(request(), { CONTACT_RATE_LIMITER: env.CONTACT_RATE_LIMITER })).status,
    503,
  )
  assert.equal(sent.length, 0)
})

test('email failure returns a retry error without exposing provider details', async () => {
  const { env } = setup()
  env.SALES_EMAIL.send = async () => {
    throw new Error('Private provider detail')
  }
  const result = await submitContact(request(), env)
  assert.equal(result.status, 503)
  assert.equal(result.body.ok, false)
  assert.ok(result.body.message.includes('sales@cacheon.ai'))
  assert.ok(!JSON.stringify(result).includes('Private provider detail'))
})
