import type { AppLoadContext } from 'react-router'
import { modelBenchmarks } from '~/constants/benchmarks'
import type { Comparison } from '~/lib/comparisons'
import { getComparison } from '~/lib/openrouter.server'

/** Cached OpenRouter comparisons for every benchmarked model, keyed by model ID. */
export async function getModelComparisons({
  cloudflare,
}: AppLoadContext): Promise<Record<string, Comparison>> {
  const cache = await caches.open('openrouter-comparisons')
  return Object.fromEntries(
    await Promise.all(
      modelBenchmarks.map(async (model) => [
        model.id,
        await getComparison(model.openRouterModel, {
          cache,
          waitUntil: (task) => cloudflare.ctx.waitUntil(task),
          apiKey: cloudflare.env.OPENROUTER_API_KEY,
        }),
      ]),
    ),
  )
}
