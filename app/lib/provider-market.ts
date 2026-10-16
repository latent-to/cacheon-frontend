import type { Comparison, ProviderResult } from './comparisons'
import type { ProviderSnapshot } from '../constants/customer-results'

export type MeasuredProvider = ProviderResult & { throughput: number }

export type MarketView = {
  /** Endpoints with measured speed, fastest first. */
  providers: MeasuredProvider[]
  leader: MeasuredProvider | null
  statusLine: string
  tableTitle: string
}

const measured = (row: ProviderResult): row is MeasuredProvider =>
  row.throughput !== null && Number.isFinite(row.throughput) && row.throughput > 0

/** Use live OpenRouter data when it has measured speed; otherwise the dated snapshot. */
export function resolveMarket(
  live: Comparison | undefined,
  snapshot: ProviderSnapshot,
): MarketView {
  const useLive = live?.providers.some(measured) ?? false
  const providers = (useLive ? live!.providers : snapshot.providers)
    .filter(measured)
    .sort((a, b) => b.throughput - a.throughput || a.id.localeCompare(b.id))
  const leader = providers[0] ?? null

  let statusLine = 'Current provider metrics are available on OpenRouter'
  if (!useLive) {
    statusLine = `OpenRouter · ${snapshot.scope} · snapshot ${snapshot.observedOn}`
  } else if (leader && live!.fetchedAt !== null) {
    const fetched = new Date(live!.fetchedAt).toLocaleString('en-GB', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    statusLine = `OpenRouter · last-30-minute P50 · ${live!.status === 'stale' ? 'delayed data · ' : ''}fetched ${fetched} UTC`
  }

  return {
    providers,
    leader,
    statusLine,
    tableTitle: useLive ? 'All measured OpenRouter endpoints' : 'Providers in this snapshot',
  }
}

export function formatPrice(value: number | null) {
  return value !== null && Number.isFinite(value)
    ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
    : '—'
}

export function priceTriple({ pricing }: ProviderResult) {
  return [pricing.input, pricing.cachedInput, pricing.output].map(formatPrice)
}
