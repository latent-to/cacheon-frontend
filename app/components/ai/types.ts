import type { Tool, UIMessage } from 'ai'

export type ChatUIMessage = UIMessage<
  never,
  {
    client: {
      location: string
    }
  }
>

export type SearchResult = {
  url: string
  title: string
  description: string
  excerpt: string
}

export type SearchTool = Tool<{ query: string; limit: number }, SearchResult[]>
