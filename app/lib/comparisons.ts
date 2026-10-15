export type Pricing = {
  input: number | null
  output: number | null
  cacheRead: number | null
}

export type ProviderResult = {
  id: string
  name: string
  throughput: number | null
  ttft: number | null
  pricing: Pricing
}

export type Comparison = {
  providers: ProviderResult[]
  fetchedAt: number | null
  status: 'fresh' | 'stale' | 'unavailable'
}

export function formatPrice(value: number | null) {
  return value === null
    ? 'Not published'
    : `$${value.toLocaleString('en-US', { maximumFractionDigits: 6 })}`
}

export function leadingProviders(providers: ProviderResult[], metric: 'throughput' | 'ttft') {
  return providers
    .filter((p) => p[metric] !== null)
    .sort(
      (a, b) =>
        (metric === 'throughput' ? b[metric]! - a[metric]! : a[metric]! - b[metric]!) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3)
}
