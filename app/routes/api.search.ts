import type { Route } from './+types/api.search'
import { docsSearch } from '~/lib/docs-search.server'

const server = docsSearch

export async function loader({ request }: Route.LoaderArgs) {
  return server.GET(request)
}
