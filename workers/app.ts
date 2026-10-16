import { rewriteMarkdownRequest } from '~/lib/docs-markdown-rewrite'
import { createRequestHandler } from 'react-router'
import type {} from '../app/load-context'

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
