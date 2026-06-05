import { llms } from 'fumadocs-core/source'
import { source } from '~/lib/source.server'

export function loader() {
  return new Response(llms(source).index(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
