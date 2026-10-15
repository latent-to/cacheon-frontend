import 'react-router'
import type { ContactEnv } from './lib/contact.server'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: ContactEnv & { CACHEON_PRICING: unknown; OPENROUTER_API_KEY?: string }
      ctx: { waitUntil(task: Promise<unknown>): void }
    }
  }
}
