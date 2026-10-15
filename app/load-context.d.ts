import 'react-router'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: { CACHEON_PRICING: unknown; OPENROUTER_API_KEY?: string }
      ctx: { waitUntil(task: Promise<unknown>): void }
    }
  }
}
