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

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
)

export default {
  async fetch(request, env, ctx) {
    const markdownRequest = rewriteMarkdownRequest(request)
    return requestHandler(markdownRequest ?? request, {
      cloudflare: { env, ctx },
    })
  },
} satisfies ExportedHandler<Env>
