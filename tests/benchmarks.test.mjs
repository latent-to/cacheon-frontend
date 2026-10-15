import assert from 'node:assert/strict'
import test from 'node:test'
import { getComparison, parseEndpoints } from '../app/lib/openrouter.server.ts'
import { leadingProviders } from '../app/lib/comparisons.ts'

const model = 'qwen/test'
const hour = 3_600_000
const endpoint = (overrides = {}) => ({
  provider_name: 'Provider',
  tag: 'provider/fp8',
  status: 0,
  throughput_last_30m: { p50: 100, p90: 40 },
  latency_last_30m: { p50: 400, p90: 2000 },
  pricing: { prompt: '0.0000001', completion: '0.0000005', input_cache_read: '0' },
  ...overrides,
})
const payload = (endpoints = [endpoint()], id = model) => ({ data: { id, endpoints } })

function harness() {
  let time = 1_800_000_000_000
  let calls = 0
  let handler = async () => Response.json(payload())
  const entries = new Map()
  const tasks = []
  const options = {
    now: () => time,
    cache: {
      async match(key) {
        return entries.get(key.url)?.clone()
      },
      async put(key, response) {
        entries.set(key.url, response.clone())
      },
    },
    waitUntil: (task) => tasks.push(task),
    fetcher: async (...args) => {
      calls++
      return handler(...args)
    },
  }
  return {
    options,
    entries,
    advance: (ms) => {
      time += ms
    },
    calls: () => calls,
    respond: (next) => {
      handler = next
    },
    flush: () => Promise.all(tasks.splice(0)),
  }
}

test('API normalization converts TTFT milliseconds to seconds and omits all pricing', () => {
  const rows = parseEndpoints(
    payload([
      endpoint(),
      endpoint({
        tag: 'provider/fp8/fast',
        service_tier: 'fast',
        throughput_last_30m: null,
        latency_last_30m: { p99: 4 },
        pricing: { prompt: '', completion: '-1', input_cache_read: 'Infinity' },
      }),
      endpoint({ status: -5 }),
    ]),
    model,
  )
  assert.equal(rows.length, 2)
  assert.ok(rows.every((row) => !('pricing' in row)))
  assert.equal(rows[0].throughput, 100)
  assert.equal(rows[0].ttft, 0.4)
  assert.equal(rows[1].throughput, null)
  assert.equal(rows[1].ttft, null)
  assert.notEqual(rows[0].id, rows[1].id)
  assert.throws(() => parseEndpoints(payload([], 'wrong/model'), model))
  assert.throws(() => parseEndpoints({ data: { id: model } }, model))
})

test('ranking follows the selected metric and excludes missing values', () => {
  const rows = parseEndpoints(
    payload(
      [80, 50, 120, 90, null].map((speed, i) =>
        endpoint({
          tag: `provider/${i}`,
          throughput_last_30m: { p50: speed },
          latency_last_30m: { p50: i * 100 },
        }),
      ),
    ),
    model,
  )
  assert.deepEqual(
    leadingProviders(rows, 'throughput').map((p) => p.throughput),
    [120, 90, 80],
  )
  assert.deepEqual(
    leadingProviders(rows, 'ttft').map((p) => p.ttft),
    [0, 0.1, 0.2],
  )
  assert.equal(leadingProviders(rows, 'throughput')[0], rows[2])
  assert.equal(rows[0].throughput, 80)
})

test('cold requests coalesce, fresh hits avoid the upstream, and hourly refresh runs in background', async () => {
  const h = harness()
  h.options.apiKey = 'test-key'
  h.respond(async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/models/qwen/test/endpoints')
    assert.equal(options.headers.Authorization, 'Bearer test-key')
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json(payload())
  })
  const [a, b] = await Promise.all([
    getComparison(model, h.options),
    getComparison(model, h.options),
  ])
  assert.deepEqual(a, b)
  assert.equal(h.calls(), 1)
  assert.equal(a.status, 'fresh')
  assert.ok(!JSON.stringify(a).includes('test-key'))
  h.advance(hour - 1)
  await getComparison(model, h.options)
  assert.equal(h.calls(), 1)
  h.advance(1)
  h.respond(async () => Response.json(payload([endpoint({ throughput_last_30m: { p50: 200 } })])))
  const stale = await getComparison(model, h.options)
  assert.equal(stale.status, 'stale')
  assert.equal(stale.fetchedAt, a.fetchedAt)
  assert.equal(stale.providers[0].throughput, 100)
  await h.flush()
  const refreshed = await getComparison(model, h.options)
  assert.equal(refreshed.status, 'fresh')
  assert.equal(refreshed.providers[0].throughput, 200)
  assert.equal(refreshed.fetchedAt, a.fetchedAt + hour)
  assert.equal(h.calls(), 2)
})

test('failed refresh preserves its timestamp, backs off, and never extends data past 24 hours', async (t) => {
  t.mock.method(console, 'error', () => {})
  const h = harness()
  const original = await getComparison(model, h.options)
  h.advance(hour)
  h.respond(async () => new Response('Rate limited', { status: 429 }))
  await getComparison(model, h.options)
  await h.flush()
  h.advance(299_999)
  const stale = await getComparison(model, h.options)
  assert.equal(h.calls(), 2)
  assert.equal(stale.status, 'stale')
  assert.equal(stale.fetchedAt, original.fetchedAt)
  assert.equal([...h.entries.values()][0].headers.get('cache-control'), 'public, max-age=82800')
  h.advance(24 * hour)
  const expired = await getComparison(model, h.options)
  assert.equal(expired.status, 'unavailable')
  assert.equal(expired.fetchedAt, null)
  assert.deepEqual(expired.providers, [])
})

test('cold failures are cached briefly and recover on subsequent traffic', async (t) => {
  t.mock.method(console, 'error', () => {})
  const h = harness()
  h.respond(async () => {
    throw new Error('Network unavailable')
  })
  assert.equal((await getComparison(model, h.options)).status, 'unavailable')
  await getComparison(model, h.options)
  assert.equal(h.calls(), 1)
  h.advance(5 * 60_000)
  h.respond(async () => Response.json(payload()))
  await getComparison(model, h.options)
  await h.flush()
  assert.equal((await getComparison(model, h.options)).status, 'fresh')
})

test('a successful response with missing metrics replaces old metrics rather than misdating them', async () => {
  const h = harness()
  await getComparison(model, h.options)
  h.advance(hour)
  h.respond(async () =>
    Response.json(payload([endpoint({ throughput_last_30m: null, latency_last_30m: null })])),
  )
  await getComparison(model, h.options)
  await h.flush()
  const result = await getComparison(model, h.options)
  assert.equal(result.status, 'fresh')
  assert.equal(result.providers[0].throughput, null)
  assert.equal(result.providers[0].ttft, null)
  assert.ok(!JSON.stringify(result).includes('pricing'))
})

test('one failed model does not discard another model’s cached results', async (t) => {
  t.mock.method(console, 'error', () => {})
  const h = harness()
  h.respond(async (url) =>
    url.includes('/qwen/test/') ? Response.json(payload()) : new Response('', { status: 500 }),
  )
  const [good, bad] = await Promise.all([
    getComparison(model, h.options),
    getComparison('glm/test', h.options),
  ])
  assert.equal(good.status, 'fresh')
  assert.equal(bad.status, 'unavailable')
  assert.equal(h.entries.size, 2)
})

test('adding authentication bypasses previously cached empty public metrics without caching credentials', async () => {
  const h = harness()
  h.respond(async () =>
    Response.json(payload([endpoint({ throughput_last_30m: null, latency_last_30m: null })])),
  )
  assert.equal((await getComparison(model, h.options)).providers[0].throughput, null)
  h.options.apiKey = 'private-test-key'
  h.respond(async () => Response.json(payload()))
  const authenticated = await getComparison(model, h.options)
  assert.equal(authenticated.providers[0].throughput, 100)
  assert.equal(authenticated.providers[0].ttft, 0.4)
  assert.equal(h.calls(), 2)
  assert.ok([...h.entries.keys()].every((key) => !key.includes('private-test-key')))
})
