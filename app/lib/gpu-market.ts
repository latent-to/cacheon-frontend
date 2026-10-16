export type GpuMarketRate = {
  hourlyRate: number
  source: string
  observedAt: string
  basis: 'listed' | 'reference'
  fallback: boolean
}
export type GpuMarket = Record<'b300' | 'h100', GpuMarketRate>

// Dated public-feed fallback, used only when the hourly market fetch fails.
export const fallbackGpuMarket: GpuMarket = {
  b300: {
    hourlyRate: 8,
    source: 'https://lium.io/gpu/b300-sxm6-ac',
    observedAt: '2026-10-15T19:02:16.726Z',
    basis: 'listed',
    fallback: true,
  },
  h100: {
    hourlyRate: 3.75,
    source: 'https://lium.io/gpu/h100',
    observedAt: '2026-10-15T19:02:16.726Z',
    basis: 'listed',
    fallback: true,
  },
}
