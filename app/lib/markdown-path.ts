export function markdownPathToSlugs(segs: string[]): string[] {
  if (segs.length === 0) return []

  const out = [...segs]
  out[out.length - 1] = out[out.length - 1].replace(/\.mdx?$/, '')
  if (out.length === 1 && out[0] === 'index') out.pop()
  return out
}

export function slugsToMarkdownPath(slugs: string[]): string {
  if (slugs.length === 0) return '/docs/index.md'
  return `/docs/${slugs.join('/')}.md`
}
