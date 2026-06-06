import { rewriteMarkdownRequest } from '~/lib/docs-markdown-rewrite'
import { createRequestHandler } from 'react-router'

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env
      ctx: ExecutionContext
    }
  }
}

const API_UPSTREAM = import.meta.env.PROD ? 'https://api.cacheon.ai' : 'http://127.0.0.1:8080'
const PROXY_PREFIX = '/proxy-api/'

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
      const res = await fetch(target, {
        method: 'GET',
        headers: { 'User-Agent': 'cacheon-frontend-proxy' },
      })
      const headers = new Headers(res.headers)
      headers.delete('access-control-allow-origin')
      headers.set('access-control-allow-origin', '*')
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const key = request.headers.get('CF-Connecting-IP') ?? 'anonymous'
      const { success } = await env.CHAT_RATE_LIMITER.limit({ key })
      if (!success) {
        return new Response('Too Many Requests', { status: 429 })
      }
    }

    const markdownRequest = rewriteMarkdownRequest(request)
    return requestHandler(markdownRequest ?? request, {
      cloudflare: { env, ctx },
    })
  },
} satisfies ExportedHandler<Env>
