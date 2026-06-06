import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'
import type { ChatUIMessage, SearchResult, SearchTool } from '~/components/ai/types'
import { docsSearch } from '~/lib/docs-search.server'
import type { Route } from './+types/api.chat'

const DEFAULT_MODEL = 'qwen/qwen3.6-flash'

type ChatEnv = Env & { OPENROUTER_API_KEY?: string }

type DocsSearchHit = {
  type: string
  content: string
  breadcrumbs?: string[]
  url: string
}

const SEARCH_EXCERPT_CHARS = 2500
const SEARCH_TIMEOUT_MS = 15_000
const CHAT_TIMEOUT_MS = 90_000

const REASONING_MAX_TOKENS = 512

const systemPrompt = [
  'You are a docs assistant for the Cacheon documentation site.',
  'Be concise. Do not narrate your plan or overthink. Keep reasoning brief, then act.',
  'Call `search` once with a short keyword query (2-5 words). Do not paste the full user question into search.',
  'Search results include url, title, description, and excerpt. Cite with inline markdown links using descriptive page titles (e.g. [Key decisions](/docs/decisions)). Do not use numeric footnotes like [^1] or [1].',
  'High confidence (clear, direct match in excerpts): give a short, accurate explanation grounded only in those excerpts. Stay brief.',
  'Low confidence (weak results, ambiguity, gaps, or complexity): do not guess. Act as a navigator: point to the best pages to read, say what each covers in one line, and note what is unclear.',
  'Never infer, speculate, or fill gaps beyond the cited docs.',
  'If still uncertain, say so plainly and tell the user to reach out on the Subnet 14 Cacheon channel in Bittensor Discord (https://discord.gg/bittensor) or the Cacheon Discord server (https://discord.gg/cacheon).',
  'After search returns, write your response. Never call `search` again.',
].join('\n')

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function stripSearchHighlight(content: string) {
  return content.replace(/<\/?mark>/g, '').replace(/\*\*/g, '')
}

function searchResultKey(url: string) {
  return url.includes('#') ? url : url.split('#')[0]
}

function excerptSortKey(text: string) {
  if (text.startsWith('Decision:')) return 0
  if (text.startsWith('Reasoning:')) return 1
  if (text.startsWith('Rejected:')) return 2
  return 3
}

function mergeExcerpts(excerpts: string[]) {
  const unique = [...new Set(excerpts.filter(Boolean))]
  unique.sort((a, b) => excerptSortKey(a) - excerptSortKey(b) || b.length - a.length)
  return unique.join('\n\n').slice(0, SEARCH_EXCERPT_CHARS)
}

function mapSearchHits(hits: DocsSearchHit[]): SearchResult[] {
  const byKey = new Map<string, SearchResult & { excerpts: string[] }>()

  for (const hit of hits) {
    const key = searchResultKey(hit.url)
    const excerpt = stripSearchHighlight(hit.content)
    const breadcrumbs = hit.breadcrumbs?.join(' · ') ?? ''

    if (hit.type === 'page') {
      byKey.set(key, {
        url: hit.url.split('#')[0],
        title: excerpt,
        description: breadcrumbs,
        excerpt,
        excerpts: [excerpt],
      })
      continue
    }

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, {
        url: hit.url,
        title: hit.breadcrumbs?.at(-1) ?? excerpt.slice(0, 100),
        description: breadcrumbs,
        excerpt,
        excerpts: [excerpt],
      })
      continue
    }

    existing.excerpts.push(excerpt)
    existing.excerpt = mergeExcerpts(existing.excerpts)
    if (!existing.title && hit.breadcrumbs?.length) {
      existing.title = hit.breadcrumbs.at(-1) ?? existing.title
    }
  }

  return [...byKey.values()].map(({ excerpts: _excerpts, ...result }) => result)
}

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'and',
  'or',
  'if',
  'but',
  'about',
  'what',
  'which',
  'who',
  'how',
  'all',
  'each',
  'more',
  'most',
  'some',
  'such',
  'no',
  'not',
  'only',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'you',
  'your',
  'we',
  'they',
  'it',
  'its',
  'using',
  'use',
  'used',
  'different',
  'check',
  'checks',
])

const WHY_INTENT = /\b(why|reason|design|policy|architecture|rationale)\b/i

function extractKeywords(...texts: string[]) {
  const seen = new Set<string>()
  const keywords: string[] = []

  for (const text of texts) {
    for (const raw of text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)) {
      const word = raw.trim()
      if (word.length < 2 || SEARCH_STOP_WORDS.has(word) || seen.has(word)) continue
      seen.add(word)
      keywords.push(word)
    }
  }

  return keywords
}

function hasWhyIntent(...texts: string[]) {
  return texts.some((text) => WHY_INTENT.test(text))
}

function buildSearchQueries(query: string, userMessage = '') {
  const trimmed = query.trim()
  const queries = [trimmed]
  const keywords = extractKeywords(trimmed, userMessage)
  const topicKeywords = keywords.filter(
    (word) =>
      !['why', 'reason', 'design', 'policy', 'architecture', 'rationale', 'decisions'].includes(
        word,
      ),
  )

  for (const size of [2, 3, 4]) {
    if (topicKeywords.length >= size) {
      queries.push(topicKeywords.slice(0, size).join(' '))
    }
  }

  if (hasWhyIntent(trimmed, userMessage) && topicKeywords.length > 0) {
    queries.push(`decisions ${topicKeywords.slice(0, 4).join(' ')}`)
  }

  return [...new Set(queries)].filter(Boolean).slice(0, 6)
}

function prioritizeSearchResults(results: SearchResult[], query: string, userMessage = '') {
  const keywords = extractKeywords(query, userMessage)
  const whyIntent = hasWhyIntent(query, userMessage)

  const score = (result: SearchResult) => {
    const haystack = `${result.url} ${result.title} ${result.excerpt}`.toLowerCase()
    let value = 0

    if (whyIntent && result.url.startsWith('/docs/decisions')) value += 50

    for (const keyword of keywords) {
      if (haystack.includes(keyword)) value += 5
    }

    value += Math.min(result.excerpt.length / 200, 10)
    return value
  }

  return [...results].sort((a, b) => score(b) - score(a))
}

function getLastUserMessage(messages?: ChatUIMessage[]) {
  if (!messages?.length) return ''

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'user') continue

    const text = message.parts
      ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join(' ')

    if (text?.trim()) return text.trim()
  }

  return ''
}

async function runDocsSearch(query: string, limit: number, userMessage = '') {
  const perQueryLimit = Math.min(limit * 4, 24)
  const queries = buildSearchQueries(query, userMessage)
  const byPage = new Map<string, SearchResult>()

  for (const q of queries) {
    const hits = await docsSearch.search(q, { limit: perQueryLimit })
    const hitList = Array.isArray(hits) ? hits : []
    for (const result of mapSearchHits(hitList as DocsSearchHit[])) {
      const key = searchResultKey(result.url)
      const existing = byPage.get(key)
      if (!existing) {
        byPage.set(key, result)
        continue
      }
      const merged = mergeExcerpts([existing.excerpt, result.excerpt])
      if (merged.length > existing.excerpt.length) {
        byPage.set(key, { ...existing, excerpt: merged })
      }
    }
  }

  return prioritizeSearchResults([...byPage.values()], query, userMessage).slice(0, limit)
}

function createSearchTool(userMessage: string) {
  return tool({
    description: 'Search the docs content and return raw JSON results.',
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().int().min(1).max(20).default(5),
    }),
    async execute({ query, limit }) {
      const queries = buildSearchQueries(query, userMessage)
      // #region agent log
      fetch('http://127.0.0.1:7361/ingest/23d70945-8e6f-4426-9da5-12aa9aaeaec4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'eed662' },
        body: JSON.stringify({
          sessionId: 'eed662',
          hypothesisId: 'H1',
          location: 'api.chat.ts:search-start',
          message: 'search execute start',
          data: { query, limit, queries, whyIntent: hasWhyIntent(query, userMessage) },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      try {
        const results = await withTimeout(
          runDocsSearch(query, limit, userMessage),
          SEARCH_TIMEOUT_MS,
          'Docs search',
        )
        // #region agent log
        fetch('http://127.0.0.1:7361/ingest/23d70945-8e6f-4426-9da5-12aa9aaeaec4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'eed662' },
          body: JSON.stringify({
            sessionId: 'eed662',
            hypothesisId: 'H2',
            location: 'api.chat.ts:search-done',
            message: 'search execute done',
            data: {
              query,
              queries,
              resultCount: results.length,
              topUrls: results.slice(0, 3).map((r) => r.url),
              hasVersions: results.some(
                (r) => r.excerpt.includes('v0.22') && r.excerpt.includes('v0.9'),
              ),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        return results
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7361/ingest/23d70945-8e6f-4426-9da5-12aa9aaeaec4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'eed662' },
          body: JSON.stringify({
            sessionId: 'eed662',
            hypothesisId: 'H3',
            location: 'api.chat.ts:search-error',
            message: 'search execute failed',
            data: { query, error: err instanceof Error ? err.message : String(err) },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        throw err
      }
    },
  }) satisfies SearchTool
}

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const env = context.cloudflare.env as ChatEnv
  const apiKey = env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response('Chat is not configured', { status: 503 })
  }

  const reqJson = (await request.json()) as { messages?: ChatUIMessage[] }
  const userMessage = getLastUserMessage(reqJson.messages)
  const model = env.OPENROUTER_MODEL ?? DEFAULT_MODEL

  const openrouter = createOpenRouter({ apiKey })

  const result = streamText({
    model: openrouter.chat(model),
    stopWhen: stepCountIs(6),
    timeout: CHAT_TIMEOUT_MS,
    maxRetries: 1,
    providerOptions: {
      openrouter: {
        reasoning: { max_tokens: REASONING_MAX_TOKENS, exclude: false },
      },
    },
    tools: {
      search: createSearchTool(userMessage),
    },
    prepareStep({ steps }) {
      const searchCalls = steps.flatMap((s) => s.toolCalls?.map((t) => t.toolName) ?? [])
      const searchCount = searchCalls.filter((name) => name === 'search').length
      if (searchCount >= 1) {
        return { activeTools: [], toolChoice: 'none' as const }
      }
      return {}
    },
    messages: [
      { role: 'system', content: systemPrompt },
      ...(await convertToModelMessages<ChatUIMessage>(reqJson.messages ?? [], {
        convertDataPart(part) {
          if (part.type === 'data-client') {
            return {
              type: 'text',
              text: `[Client Context: ${JSON.stringify(part.data)}]`,
            }
          }
        },
      })),
    ],
    toolChoice: 'auto',
  })

  return result.toUIMessageStreamResponse({ sendReasoning: true })
}
