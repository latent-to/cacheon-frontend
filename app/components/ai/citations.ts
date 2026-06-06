import type { SearchResult } from '~/components/ai/types'

export type Citation = {
  id: string
  url: string
  title: string
}

const FOOTNOTE_DEF_RE = /^\[\^([^\]]+)\]:\s*(.+)$/gm
const REF_DEF_RE = /^\[(\d+)\]:\s*(.+)$/gm
const FOOTNOTE_REF_RE = /\[\^([^\]]+)\]/g
const NUMERIC_REF_RE = /(?<!\])\[(?!\^)(\d+)\](?!\()/g

function normalizeDocUrl(url: string) {
  try {
    const parsed = new URL(url, 'https://cacheon.ai')
    return `${parsed.pathname}${parsed.hash}`
  } catch {
    return url.startsWith('/') ? url : `/${url}`
  }
}

function titleFromDocUrl(url: string) {
  const normalized = normalizeDocUrl(url)
  const hash = normalized.includes('#') ? (normalized.split('#')[1] ?? '') : ''
  const slug = hash || normalized.split('/').filter(Boolean).pop() || 'docs'

  return slug
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isUsableSourceTitle(title: string) {
  if (!title || title.length > 140) return false
  if (/^(Decision|Rejected|Reasoning):/i.test(title)) return false
  return true
}

function resolveCitationTitle(url: string, sources: SearchResult[]) {
  const normalized = normalizeDocUrl(url)
  const pagePath = normalized.split('#')[0]

  const exact = sources.find((source) => normalizeDocUrl(source.url) === normalized)
  if (exact && isUsableSourceTitle(exact.title)) return exact.title

  const pageMatch = sources.find(
    (source) =>
      normalizeDocUrl(source.url).split('#')[0] === pagePath && isUsableSourceTitle(source.title),
  )
  if (pageMatch) return pageMatch.title

  return titleFromDocUrl(url)
}

function unwrapCitationUrl(raw: string) {
  return raw.trim().replace(/^<|>$/g, '').split(/\s/)[0] ?? raw
}

export function processAssistantCitations(markdown: string, sources: SearchResult[]) {
  const defs = new Map<string, string>()

  for (const pattern of [FOOTNOTE_DEF_RE, REF_DEF_RE]) {
    const re = new RegExp(pattern.source, pattern.flags)
    for (const match of markdown.matchAll(re)) {
      defs.set(match[1], unwrapCitationUrl(match[2]))
    }
  }

  if (defs.size === 0) {
    return { markdown, citations: [] as Citation[] }
  }

  const citations: Citation[] = [...defs.entries()].map(([id, url]) => ({
    id,
    url,
    title: resolveCitationTitle(url, sources),
  }))

  let body = markdown
    .replace(FOOTNOTE_DEF_RE, '')
    .replace(REF_DEF_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  body = body.replace(FOOTNOTE_REF_RE, (_, id: string) => {
    const citation = citations.find((entry) => entry.id === id)
    return citation ? '' : `[^${id}]`
  })

  body = body.replace(NUMERIC_REF_RE, (_, id: string) => {
    const citation = citations.find((entry) => entry.id === id)
    return citation ? '' : `[${id}]`
  })

  body = body.replace(/\s+([.,;:!?])/g, '$1').trim()

  return { markdown: body, citations }
}

export function uniqueCitations(citations: Citation[]) {
  return [...new Map(citations.map((citation) => [citation.url, citation])).values()]
}
