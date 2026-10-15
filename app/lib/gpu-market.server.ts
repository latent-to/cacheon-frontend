import { fallbackGpuMarket } from './gpu-market.ts'
import type { GpuMarket } from './gpu-market.ts'

type CacheStore = {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}
const key = new Request('https://cacheon.ai/__cache/lium/v1')
const hour = 3_600_000
let pending: Promise<GpuMarket> | undefined

export function parseGpuMarket(payload: unknown): GpuMarket {
  const data = payload as { generated_at?: string; models?: Record<string, unknown>[] }
  if (
    !data ||
    !data.generated_at ||
    !Number.isFinite(Date.parse(data.generated_at)) ||
    !Array.isArray(data.models)
  )
    throw new Error('Invalid GPU price feed')
  const market = {} as GpuMarket
  for (const [id, name] of [
    ['b300', 'NVIDIA B300 SXM6 AC'],
    ['h100', 'NVIDIA H100 80GB HBM3'],
  ] as const) {
    const row = data.models.find((item) => item?.model === name)
    const listed = typeof row?.available_nodes === 'number' && row.available_nodes > 0
    const rate = row?.[listed ? 'min_price_usd_per_gpu_hour' : 'reference_price_usd_per_gpu_hour']
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0)
      throw new Error('Missing GPU price')
    market[id] = {
      hourlyRate: rate,
      observedAt: data.generated_at,
      source: fallbackGpuMarket[id].source,
      basis: listed ? 'listed' : 'reference',
      fallback: false,
    }
  }
  return market
}

export async function getGpuMarket(
  cache: CacheStore,
  fetcher: typeof fetch = fetch,
  now = Date.now,
): Promise<GpuMarket> {
  const hit = await cache.match(key)
  if (hit) {
    const saved = (await hit.json()) as { rates: GpuMarket; expires: number }
    if (saved.expires > now()) return saved.rates
  }
  if (pending) return pending
  pending = (async () => {
    let rates: GpuMarket
    let ttl = hour
    try {
      const response = await fetcher('https://lium.io/pricing.json', {
        signal: AbortSignal.timeout(4000),
      })
      if (!response.ok) throw new Error('GPU price feed unavailable')
      rates = parseGpuMarket(await response.json())
    } catch {
      rates = fallbackGpuMarket
      ttl = 300_000
    }
    await cache.put(
      key,
      Response.json(
        { rates, expires: now() + ttl },
        { headers: { 'Cache-Control': `public, max-age=${ttl / 1000}` } },
      ),
    )
    return rates
  })().finally(() => {
    pending = undefined
  })
  return pending
}
