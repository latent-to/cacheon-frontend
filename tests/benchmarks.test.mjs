import assert from 'node:assert/strict'
import test from 'node:test'
import { getComparison, parseEndpoints } from '../app/lib/openrouter.server.ts'
import { estimateGpuCost } from '../app/lib/cost-estimate.ts'
import { leadingProviders } from '../app/lib/comparisons.ts'
import {
  clampConcurrency,
  calculatorThroughput,
  concurrencyRange,
  estimateUserThroughput,
} from '../app/lib/concurrency.ts'
import { modelBenchmarks } from '../app/constants/benchmarks.ts'
import { readFileSync } from 'node:fs'

test('concurrency interpolation preserves measurements, interpolates inside them, and never extrapolates', () => {
  // Synthetic fixture exercises interpolation; these values are not website measurements.
  const points = [
    { users: 4, throughput: 200 },
    { users: 16, throughput: 140 },
    { users: 24, throughput: 100 },
  ]
  assert.deepEqual(concurrencyRange(points), { min: 4, max: 24 })
  assert.equal(estimateUserThroughput(points, 4), 200)
  assert.equal(estimateUserThroughput(points, 10), 170)
  assert.equal(estimateUserThroughput(points, 16), 140)
  assert.equal(estimateUserThroughput(points, 20), 120)
  assert.equal(estimateUserThroughput(points, 24), 100)
  for (const users of [0, 1, 25, 1000, 4.5, NaN, Infinity]) {
    assert.equal(estimateUserThroughput(points, users), null)
  }
  assert.equal(clampConcurrency(points, 1000), 24)
  assert.equal(clampConcurrency(points, -1), 1)
  assert.equal(clampConcurrency(points, NaN), null)
})

test('calculator allows lower concurrency as an explicit assumption, interpolates supported points, and caps at 24', () => {
  const one = [{ users: 24, throughput: 338.68 }]
  assert.deepEqual(calculatorThroughput(one, 24), { throughput: 338.68, basis: 'measured' })
  for (const users of [1, 12, 23]) {
    assert.equal(clampConcurrency(one, users), users)
    assert.deepEqual(calculatorThroughput(one, users), { throughput: 338.68, basis: 'assumed' })
  }
  const many = [
    { users: 4, throughput: 200 },
    { users: 24, throughput: 100 },
    { users: 32, throughput: 80 },
  ]
  assert.deepEqual(calculatorThroughput(many, 14), { throughput: 150, basis: 'interpolated' })
  assert.deepEqual(calculatorThroughput(many, 1), { throughput: 200, basis: 'assumed' })
  assert.equal(clampConcurrency(many, 32), 24)
  for (const users of [0, -1, 25, 32, 1.5, NaN, Infinity]) {
    assert.equal(calculatorThroughput(many, users), null)
  }
  assert.equal(calculatorThroughput([{ users: 1, throughput: 529 }], 2), null)
  const low = calculatorThroughput(one, 12)
  const high = calculatorThroughput(one, 24)
  assert.equal(
    estimateGpuCost(8, 2, 12, low.throughput, 80).perMillion,
    2 * estimateGpuCost(8, 2, 24, high.throughput, 80).perMillion,
  )
})

test('invalid measurement series cannot produce a range or estimate', () => {
  for (const points of [
    [],
    [{ users: 1, throughput: 0 }],
    [{ users: 1, throughput: NaN }],
    [{ users: 0, throughput: 50 }],
    [{ users: 1.5, throughput: 50 }],
    [
      { users: 4, throughput: 50 },
      { users: 4, throughput: 40 },
    ],
    [
      { users: 4, throughput: 50 },
      { users: 1, throughput: 40 },
    ],
  ]) {
    assert.equal(concurrencyRange(points), null)
    assert.equal(estimateUserThroughput(points, 4), null)
  }
})

test('website limits match retained evidence and single-point results cannot imply a scaling curve', () => {
  for (const model of modelBenchmarks) {
    const data = JSON.parse(
      readFileSync(new URL(`../public${model.cacheon.evidence}`, import.meta.url)),
    )
    const points = model.cacheon.concurrency
    assert.deepEqual(points, [{ users: data.concurrency, throughput: model.cacheon.throughput }])
    assert.equal(clampConcurrency(points, 24), data.concurrency)
    assert.equal(clampConcurrency(points, 1000), data.concurrency)
    assert.equal(estimateUserThroughput(points, data.concurrency), model.cacheon.throughput)
    assert.equal(estimateUserThroughput(points, data.concurrency + 1), null)
    assert.equal(estimateUserThroughput(points, data.concurrency - 1), null)
    if (data.concurrency_evidence) {
      assert.ok(data.concurrency_evidence.lanes.every((lane) => lane.load === data.concurrency))
      const lanes = data.concurrency_evidence.lanes
      const mean = lanes.reduce((sum, lane) => sum + lane.decode_tps, 0) / lanes.length
      assert.ok(Math.abs(mean - model.cacheon.throughput) < 1e-9)
    }
  }
})

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

test('API normalization converts TTFT milliseconds to seconds and normalizes USD/token prices', () => {
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
  assert.ok(Math.abs(rows[0].pricing.input - 0.1) < 1e-12)
  assert.equal(rows[0].pricing.output, 0.5)
  assert.equal(rows[0].pricing.cachedInput, 0)
  assert.deepEqual(rows[1].pricing, { input: null, output: null, cachedInput: null })
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
  assert.equal(result.providers[0].pricing.output, 0.5)
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

test('GPU estimates account for hardware, concurrency, speed and utilization, rejecting invalid inputs', () => {
  assert.deepEqual(estimateGpuCost(5, 4, 10, 100, 50), {
    hourly: 20,
    perMillion: (20 / 1800000) * 1e6,
  })
  assert.deepEqual(estimateGpuCost(0, 1, 1, 100, 100), { hourly: 0, perMillion: 0 })
  for (const args of [
    [-1, 4, 1, 100, 100],
    [5, 0, 1, 100, 100],
    [5, 4, 1.5, 100, 100],
    [5, 4, 1, 0, 100],
    [5, 4, 1, 100, 0],
    [5, 4, 1, 100, 101],
    [NaN, 4, 1, 100, 100],
  ])
    assert.equal(estimateGpuCost(...args), null)
})

test('GPU market uses available listing prices and distinguishes reference fallback', async () => {
  const { parseGpuMarket, getGpuMarket } = await import('../app/lib/gpu-market.server.ts')
  const payload = {
    generated_at: '2026-10-15T19:02:16Z',
    models: [
      {
        model: 'NVIDIA B300 SXM6 AC',
        available_nodes: 3,
        min_price_usd_per_gpu_hour: 8,
        reference_price_usd_per_gpu_hour: 6,
      },
      {
        model: 'NVIDIA H100 80GB HBM3',
        available_nodes: 0,
        min_price_usd_per_gpu_hour: 3.75,
        reference_price_usd_per_gpu_hour: 1.39,
      },
    ],
  }
  const rates = parseGpuMarket(payload)
  assert.equal(rates.b300.hourlyRate, 8)
  assert.equal(rates.b300.basis, 'listed')
  assert.equal(rates.h100.hourlyRate, 1.39)
  assert.equal(rates.h100.basis, 'reference')
  assert.throws(() => parseGpuMarket({ ...payload, models: [] }))
  assert.throws(() => parseGpuMarket({ ...payload, generated_at: 'bad' }))
  const h = harness()
  h.respond(async () => Response.json(payload))
  assert.deepEqual(await getGpuMarket(h.options.cache, h.options.fetcher, h.options.now), rates)
  await getGpuMarket(h.options.cache, h.options.fetcher, h.options.now)
  assert.equal(h.calls(), 1)
  h.advance(hour)
  h.respond(async () => new Response('', { status: 503 }))
  const fallback = await getGpuMarket(h.options.cache, h.options.fetcher, h.options.now)
  assert.equal(fallback.b300.fallback, true)
  assert.equal(fallback.b300.observedAt, '2026-10-15T19:02:16.726Z')
  h.advance(300000)
  h.respond(async () => Response.json(payload))
  assert.equal(
    (await getGpuMarket(h.options.cache, h.options.fetcher, h.options.now)).b300.fallback,
    false,
  )
})
