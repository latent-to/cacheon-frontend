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
  const env = {
    CONTACT_DISCORD_BOT_TOKEN: 'test-token-not-real',
    CONTACT_DISCORD_CHANNEL_ID: '123456789012345678',
    CONTACT_RATE_LIMITER: {
      async limit({ key }) {
        keys.push(key)
        return { success: true }
      },
    },
  }
  const fetchImpl = async (url, options) => {
    sent.push({ url, ...options, payload: JSON.parse(options.body) })
    return Response.json({ id: '234567890123456789' })
  }
  return {
    sent,
    keys,
    env,
    fetchImpl,
    submit: (req, config = env) => submitContact(req, config, fetchImpl),
  }
}

test('uses only the configured bot and channel and disables all mentions', async () => {
  const { env, sent, keys, submit } = setup()
  const result = await submit(
    request({
      ...fields,
      channel: 'attacker',
      token: 'fake',
      message: '@everyone <@123456789012345678> ' + fields.message,
    }),
  )
  assert.equal(result.status, 200)
  assert.equal(result.body.ok, true)
  assert.equal(sent.length, 1)
  assert.equal(
    sent[0].url,
    `https://discord.com/api/v10/channels/${env.CONTACT_DISCORD_CHANNEL_ID}/messages`,
  )
  assert.equal(sent[0].headers.Authorization, `Bot ${env.CONTACT_DISCORD_BOT_TOKEN}`)
  assert.equal(sent[0].redirect, 'error')
  assert.ok(sent[0].signal instanceof AbortSignal)
  assert.deepEqual(sent[0].payload.allowed_mentions, { parse: [] })
  assert.ok(sent[0].payload.embeds[0].description.includes(fields.message))
  assert.equal(sent[0].payload.embeds[0].fields[1].value, fields.email)
  assert.deepEqual(keys, ['192.0.2.1'])
  assert.ok(!JSON.stringify(result).includes(env.CONTACT_DISCORD_BOT_TOKEN))
  assert.ok(!JSON.stringify(result).includes(env.CONTACT_DISCORD_CHANNEL_ID))
})

test('does not report success before Discord returns a message receipt', async () => {
  const { env } = setup()
  let accept
  const delivery = new Promise((resolve) => {
    accept = resolve
  })
  let finished = false
  const submission = submitContact(request(), env, () => delivery).then((result) => {
    finished = true
    return result
  })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(finished, false)
  accept(Response.json({ id: '234567890123456789' }))
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
    const { sent, submit } = setup()
    const result = await submit(request({ ...fields, [field]: value }))
    assert.equal(result.status, 400)
    assert.ok(result.body.errors[field])
    assert.equal(sent.length, 0)
  }
})

test('rejects cross-origin requests, unsupported content and bots', async () => {
  const { sent, submit } = setup()
  assert.equal((await submit(request(fields, { Origin: 'https://other.example' }))).status, 403)
  assert.equal((await submit(request(fields, { 'Content-Type': 'application/json' }))).status, 415)
  assert.equal((await submit(request({ ...fields, website: 'spam' }))).status, 400)
  assert.equal((await submit(new Request('https://cacheon.ai/'))).status, 405)
  assert.equal(sent.length, 0)
})

test('caps the actual request body without relying on Content-Length', async () => {
  const { sent, submit } = setup()
  assert.equal((await submit(request({ ...fields, message: 'a'.repeat(33000) }))).status, 413)
  assert.equal(sent.length, 0)
})

test('rate limits before delivery and fails closed without required configuration', async () => {
  const { env, sent, submit } = setup()
  env.CONTACT_RATE_LIMITER.limit = async () => ({ success: false })
  assert.equal((await submit(request())).status, 429)
  for (const key of [
    'CONTACT_DISCORD_BOT_TOKEN',
    'CONTACT_DISCORD_CHANNEL_ID',
    'CONTACT_RATE_LIMITER',
  ]) {
    assert.equal((await submit(request(), { ...env, [key]: undefined })).status, 503)
  }
  for (const channel of ['../other', 'https://example.com', '']) {
    assert.equal(
      (await submit(request(), { ...env, CONTACT_DISCORD_CHANNEL_ID: channel })).status,
      503,
    )
  }
  assert.equal(sent.length, 0)
})

test('Discord errors, redirects, missing receipts and timeouts never claim success or leak details', async () => {
  const { env } = setup()
  const deliveries = [
    ...[401, 403, 404, 429, 500, 302].map(
      (status) => async () => new Response('Private provider detail', { status }),
    ),
    async () => Response.json({}),
    async () => new Response('not JSON'),
    async () => {
      throw new DOMException('Private provider detail', 'TimeoutError')
    },
  ]
  for (const delivery of deliveries) {
    let attempts = 0
    const result = await submitContact(request(), env, async () => {
      attempts++
      return delivery()
    })
    assert.equal(attempts, 1)
    assert.equal(result.status, 503)
    assert.equal(result.body.ok, false)
    assert.ok(result.body.message.includes('Please try again'))
    for (const privateValue of [
      'sales@cacheon.ai',
      'Private provider detail',
      env.CONTACT_DISCORD_BOT_TOKEN,
      env.CONTACT_DISCORD_CHANNEL_ID,
    ]) {
      assert.ok(!JSON.stringify(result).includes(privateValue))
    }
  }
})

test('maximum input fits Discord embed limits without truncation or broken Unicode', async () => {
  for (const message of ['a'.repeat(5000), 'a'.repeat(3999) + '😀' + 'b'.repeat(999)]) {
    const { sent, submit } = setup()
    const result = await submit(
      request({
        ...fields,
        name: 'n'.repeat(120),
        email: 'e'.repeat(242) + '@example.com',
        company: 'c'.repeat(160),
        message,
      }),
    )
    assert.equal(result.status, 200)
    const embeds = sent[0].payload.embeds
    assert.equal(embeds.map((embed) => embed.description).join(''), message)
    assert.ok(
      embeds.every((embed) => embed.description.length <= 4096 && embed.description.isWellFormed()),
    )
    const characters = embeds.reduce(
      (sum, embed) =>
        sum +
        embed.title.length +
        embed.description.length +
        (embed.fields ?? []).reduce(
          (sum, field) => sum + field.name.length + field.value.length,
          0,
        ),
      0,
    )
    assert.ok(characters <= 6000)
  }
})
