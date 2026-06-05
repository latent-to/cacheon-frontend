import type { Route } from './+types/docs-markdown'
import { getLLMText } from '~/lib/get-llm-text'
import { source } from '~/lib/source.server'

function splatToSlugs(splat: string | undefined): string[] {
  const segments = (splat ?? '').split('/').filter(Boolean)
  if (segments.length === 1 && segments[0] === 'index') return []
  return segments
}

export async function loader({ params }: Route.LoaderArgs) {
  const page = source.getPage(splatToSlugs(params['*']))
  if (!page) {
    throw new Response('Not Found', { status: 404 })
  }

  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
