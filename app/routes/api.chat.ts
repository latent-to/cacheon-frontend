import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai'
import { Document, type DocumentData } from 'flexsearch'
import { z } from 'zod'
import type { ChatUIMessage, SearchTool } from '~/components/ai/search'
import { source } from '~/lib/source.server'
import type { Route } from './+types/api.chat'

const DEFAULT_MODEL = 'moonshotai/kimi-k2.6:free'

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

const systemPrompt = [
  'You are an AI assistant for the Cacheon documentation site.',
  'Use the `search` tool to retrieve relevant docs context before answering when needed.',
  'The `search` tool returns raw JSON results from documentation. Use those results to ground your answer and cite sources as markdown links using the document `url` field when available.',
  'If you cannot find the answer in search results, say you do not know and suggest a better search query.',
].join('\n')

const searchTool = tool({
  description: 'Search the docs content and return raw JSON results.',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer
    return await search.searchAsync(query, { limit, merge: true, enrich: true })
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
    stopWhen: stepCountIs(5),
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
