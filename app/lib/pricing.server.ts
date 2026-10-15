import type { Pricing } from './comparisons.ts'

// Configuration is in USD per million tokens; null means unpublished, zero means free.
export function readPricing(config: unknown, modelIds: string[]): Record<string, Pricing> {
  const value = typeof config === 'string' ? JSON.parse(config) : config
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('CACHEON_PRICING must be a model-to-price JSON object')
  }
  const entries = value as Record<string, unknown>
  for (const id of Object.keys(entries)) {
    if (!modelIds.includes(id)) throw new Error(`Unknown CACHEON_PRICING model: ${id}`)
  }
  return Object.fromEntries(
    modelIds.map((id) => {
      const row = entries[id] ?? {}
      if (typeof row !== 'object' || Array.isArray(row))
        throw new Error(`Invalid pricing for ${id}`)
      const price = row as Record<string, unknown>
      for (const key of Object.keys(price)) {
        if (!['input', 'output', 'cacheRead'].includes(key))
          throw new Error(`Unknown price field: ${id}.${key}`)
      }
      const result = {} as Pricing
      for (const key of ['input', 'output', 'cacheRead'] as const) {
        const amount = price[key] ?? null
        if (
          amount !== null &&
          (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)
        ) {
          throw new Error(`Invalid USD per million price: ${id}.${key}`)
        }
        result[key] = amount as number | null
      }
      return [id, result]
    }),
  )
}
