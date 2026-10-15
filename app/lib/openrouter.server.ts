import type { Comparison, ProviderResult } from './comparisons.ts'

const FRESH_MS = 60 * 60 * 1000
const RETAIN_MS = 24 * FRESH_MS
const RETRY_MS = 5 * 60 * 1000

type Snapshot = {
  providers: ProviderResult[]
  fetchedAt: number | null
  refreshAfter: number
  failed: boolean
}
type CacheStore = {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}
type Options = {
  cache: CacheStore
  waitUntil: (task: Promise<unknown>) => void
  apiKey?: string
  fetcher?: typeof fetch
  now?: () => number
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

export function parseEndpoints(payload: unknown, model: string): ProviderResult[] {
  const data = record(record(payload).data)
  if (data.id !== model || !Array.isArray(data.endpoints))
    throw new Error('Invalid OpenRouter model response')
  return data.endpoints.flatMap((item, index) => {
    const row = record(item)
    if (row.status !== 0 || typeof row.provider_name !== 'string' || typeof row.tag !== 'string')
      return []
    const latencyMs = number(record(row.latency_last_30m).p50)
    return [
      {
        id: `${row.tag}:${String(row.service_tier ?? 'default')}:${index}`,
        name: `${row.provider_name} · ${row.tag}${row.service_tier ? ` · ${row.service_tier}` : ''}`,
        throughput: number(record(row.throughput_last_30m).p50),
        // OpenRouter latency is milliseconds; internal results and UI use seconds.
        ttft: latencyMs === null ? null : latencyMs / 1000,
      },
    ]
  })
}

// The Cache API is per Cloudflare location. Coalesce concurrent misses within an
// isolate; the shared edge entry handles subsequent requests in that location.
const inFlight = new Map<string, Promise<Snapshot>>()

export async function getComparison(model: string, options: Options): Promise<Comparison> {
  const { cache, waitUntil, apiKey, fetcher = fetch, now = Date.now } = options
  const key = new Request(
    `https://cacheon.ai/__cache/openrouter/v2/${apiKey ? 'authenticated' : 'public'}/${model}`,
  )
  const hit = await cache.match(key)
  let cached = hit ? ((await hit.json()) as Snapshot) : null
  if (cached?.fetchedAt !== null && cached && now() - cached.fetchedAt >= RETAIN_MS) cached = null

  function view(snapshot: Snapshot): Comparison {
    return {
      providers: snapshot.providers,
      fetchedAt: snapshot.fetchedAt,
      status:
        snapshot.fetchedAt === null
          ? 'unavailable'
          : snapshot.failed || now() - snapshot.fetchedAt >= FRESH_MS
            ? 'stale'
            : 'fresh',
    }
  }

  function refresh(): Promise<Snapshot> {
    const pending = inFlight.get(key.url)
    if (pending) return pending
    const task = (async () => {
      let result: Snapshot
      try {
        const response = await fetcher(`https://openrouter.ai/api/v1/models/${model}/endpoints`, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`)
        const providers = parseEndpoints(await response.json(), model)
        result = { providers, fetchedAt: now(), refreshAfter: now() + FRESH_MS, failed: false }
      } catch (error) {
        console.error(
          `OpenRouter refresh failed for ${model}`,
          error instanceof Error ? error.message : 'Unknown error',
        )
        const retained =
          cached?.fetchedAt !== null && cached && now() - cached.fetchedAt < RETAIN_MS
            ? cached
            : null
        result = {
          providers: retained?.providers ?? [],
          fetchedAt: retained?.fetchedAt ?? null,
          refreshAfter: now() + RETRY_MS,
          failed: true,
        }
      }
      const remaining =
        result.fetchedAt === null ? RETRY_MS : RETAIN_MS - (now() - result.fetchedAt)
      await cache.put(
        key,
        Response.json(result, {
          headers: {
            'Cache-Control': `public, max-age=${Math.max(1, Math.floor(remaining / 1000))}`,
          },
        }),
      )
      return result
    })().finally(() => inFlight.delete(key.url))
    inFlight.set(key.url, task)
    return task
  }

  if (cached) {
    if (now() >= cached.refreshAfter) waitUntil(refresh())
    return view(cached)
  }
  return view(await refresh())
}
