import { getLLMText } from '~/lib/get-llm-text'
import { source } from '~/lib/source.server'

export async function loader() {
  const pages = await Promise.all(source.getPages().map(getLLMText))
  return new Response(pages.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
