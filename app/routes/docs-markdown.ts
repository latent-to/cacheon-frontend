import type { Route } from './+types/docs-markdown'
import { getLLMText } from '~/lib/get-llm-text'
import { source } from '~/lib/source.server'
import { legacyDocsRedirect } from '~/lib/docs-redirects.js'
import { redirect } from 'react-router'

function splatToSlugs(splat: string | undefined): string[] {
  const segments = (splat ?? '').split('/').filter(Boolean)
  if (segments.length === 1 && segments[0] === 'index') return []
  return segments
}

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = splatToSlugs(params['*'])
  const legacyTarget = legacyDocsRedirect(slugs)
  if (legacyTarget) {
    throw redirect(`/docs/${legacyTarget.join('/')}.md`, 301)
  }
  const page = source.getPage(slugs)
  if (!page) {
    throw new Response('Not Found', { status: 404 })
  }

  return new Response(await getLLMText(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
