import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation'

const { rewrite: rewriteDocsMarkdown } = rewritePath('/docs{/*path}.md', '/docs-markdown{/*path}')
const { rewrite: rewriteDocsAccept } = rewritePath('/docs{/*path}', '/docs-markdown{/*path}')

export function rewriteMarkdownRequest(request: Request): Request | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null

  const url = new URL(request.url)
  let path = rewriteDocsMarkdown(url.pathname)
  if (!path && isMarkdownPreferred(request)) {
    const accepted = rewriteDocsAccept(url.pathname)
    if (accepted) path = accepted
  }

  if (!path || path === url.pathname) return null
  return new Request(new URL(path, url.origin), request)
}
