import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import { Document, type DocumentData } from 'flexsearch'
import { z } from 'zod'
import type { ChatUIMessage, SearchTool } from '~/components/ai/types'
import { source } from '~/lib/source.server'
import type { Route } from './+types/api.chat'

const DEFAULT_MODEL = 'qwen/qwen3.6-flash'

type ChatEnv = Env & { OPENROUTER_API_KEY?: string }

interface CustomDocument extends DocumentData {
  url: string
  title: string
  description: string
  content: string
}

const searchServer = createSearchServer()

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: 'url',
      index: ['title', 'description', 'content'],
      store: true,
    },
  })

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!('getText' in page.data)) return null

      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        content: await page.data.getText('processed'),
      } as CustomDocument
    }),
  )

  for (const doc of docs) {
    if (doc) search.add(doc)
  }

  return search
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50
  const out: O[] = []
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))))
  }
  return out
}

const SEARCH_EXCERPT_CHARS = 2500
const SEARCH_TIMEOUT_MS = 15_000
const CHAT_TIMEOUT_MS = 90_000

const systemPrompt = [
  'You are an AI assistant for the Cacheon documentation site.',
  'Be concise. Do not narrate your plan. Call `search` when you need docs context, then answer immediately.',
  'Search results include url, title, description, and excerpt. Cite sources as markdown links using url.',
  'After every search, write a clear natural-language answer. Never end on a tool call alone.',
  'If results are insufficient, say what is missing and suggest a better query.',
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

const searchTool = tool({
  description: 'Search the docs content and return raw JSON results.',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  async execute({ query, limit }) {
    const search = await searchServer
    const raw = await withTimeout(
      search.searchAsync(query, { limit, merge: true, enrich: true }),
      SEARCH_TIMEOUT_MS,
      'Docs search',
    )
    const hits = Array.isArray(raw) ? raw : []

    return hits.flatMap((hit) => {
      const doc = hit.doc
      if (!doc) return []

      return [
        {
          url: doc.url,
          title: doc.title,
          description: doc.description,
          excerpt:
            typeof doc.content === 'string' ? doc.content.slice(0, SEARCH_EXCERPT_CHARS) : '',
        },
      ]
    })
  },
}) satisfies SearchTool

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
  const model = env.OPENROUTER_MODEL ?? DEFAULT_MODEL

  const openrouter = createOpenRouter({ apiKey })

  const result = streamText({
    model: openrouter.chat(model),
    stopWhen: stepCountIs(4),
    timeout: CHAT_TIMEOUT_MS,
    maxRetries: 1,
    providerOptions: {
      openrouter: {
        reasoning: { effort: 'low', exclude: true },
      },
    },
    tools: {
      search: searchTool,
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

  return result.toUIMessageStreamResponse()
}
