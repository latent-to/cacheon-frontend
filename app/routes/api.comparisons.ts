import type { Route } from './+types/api.comparisons'
import { getModelComparisons } from '~/lib/model-comparisons.server'

/** Public provider measurements for the benchmarked models, keyed by model ID. */
export async function loader({ context }: Route.LoaderArgs) {
  return Response.json(
    { comparisons: await getModelComparisons(context) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
