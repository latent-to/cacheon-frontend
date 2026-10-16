import 'react-router'
import type { ContactEnv } from './lib/contact.server'

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: ContactEnv & { OPENROUTER_API_KEY?: string }
      ctx: { waitUntil(task: Promise<unknown>): void }
    }
  }
}
