import { createRequestHandler } from 'react-router'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const API_UPSTREAM = 'https://api.cacheon.ai'
const PROXY_PREFIX = '/proxy-api/'

// Cache TTLs in seconds per endpoint path prefix.
// High-frequency polls get a short TTL so many concurrent visitors share
// a single upstream hit rather than each counting against the 60 RPM limit.
const CACHE_TTL: Array<{ prefix: string; ttl: number }> = [
  { prefix: '/api/health', ttl: 20 },
  { prefix: '/api/eval-progress', ttl: 8 },
  { prefix: '/api/status', ttl: 25 },
  { prefix: '/api/leader', ttl: 30 },
  { prefix: '/api/evaluations', ttl: 30 },
  { prefix: '/api/rounds', ttl: 30 },
]

function cacheTtl(upstreamPath: string): number {
  for (const { prefix, ttl } of CACHE_TTL) {
    if (upstreamPath.startsWith(prefix)) return ttl
  }
  // No caching for log endpoints (large, infrequently polled, user-triggered).
  return 0
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname.startsWith(PROXY_PREFIX) || url.pathname === '/proxy-api') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 })
      }
      const upstream = url.pathname.replace(/^\/proxy-api/, '') || '/'
      if (!upstream.startsWith('/api/')) {
        return new Response('Not found', { status: 404 })
      }

      const target = `${API_UPSTREAM}${upstream}${url.search}`
      const ttl = cacheTtl(upstream)

      if (ttl > 0) {
        const cache = caches.default
        const cacheKey = new Request(target, { method: 'GET' })
        const cached = await cache.match(cacheKey)
        if (cached) {
          const h = new Headers(cached.headers)
          h.set('access-control-allow-origin', '*')
          h.set('x-cache', 'HIT')
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: h,
          })
        }

        const res = await fetch(target, {
          method: 'GET',
          headers: { 'User-Agent': 'cacheon-frontend-proxy' },
        })

        const headers = new Headers(res.headers)
        headers.delete('access-control-allow-origin')
        headers.set('access-control-allow-origin', '*')
        headers.set('x-cache', 'MISS')

        if (res.ok) {
          // Clone before consuming the body, then store with explicit TTL.
          const toStore = new Response(res.clone().body, {
            status: res.status,
            statusText: res.statusText,
            headers: new Headers({
              ...Object.fromEntries(headers),
              'Cache-Control': `public, max-age=${ttl}`,
            }),
          })
          ctx.waitUntil(cache.put(cacheKey, toStore))
        }

        return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
      }

      // No caching (log endpoints etc.)
      const res = await fetch(target, {
        method: 'GET',
        headers: { 'User-Agent': 'cacheon-frontend-proxy' },
      })
      const headers = new Headers(res.headers)
      headers.delete('access-control-allow-origin')
      headers.set('access-control-allow-origin', '*')
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    })
  },
} satisfies ExportedHandler<Env>
