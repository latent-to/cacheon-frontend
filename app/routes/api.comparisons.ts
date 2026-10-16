import type { Route } from './+types/api.comparisons'
import { modelBenchmarks } from '~/constants/benchmarks'
import { getComparison } from '~/lib/openrouter.server'

/** Serve the homepage's public provider measurements to the standalone customer site. */
export async function loader({ context }: Route.LoaderArgs) {
  const cache = await caches.open('openrouter-comparisons')
  const comparisons = Object.fromEntries(
    await Promise.all(
      modelBenchmarks.map(async (model) => [
        model.id,
        await getComparison(model.openRouterModel, {
          cache,
          waitUntil: (task) => context.cloudflare.ctx.waitUntil(task),
          apiKey: context.cloudflare.env.OPENROUTER_API_KEY,
        }),
      ]),
    ),
  )
  return Response.json(
    { comparisons },
    { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } },
  )
}
