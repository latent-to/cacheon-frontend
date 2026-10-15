import { useState } from 'react'
import type { ModelBenchmark } from '~/constants/benchmarks'
import type { GpuMarketRate } from '~/lib/gpu-market'
import { leadingProviders } from '~/lib/comparisons'
import type { Comparison } from '~/lib/comparisons'
import { estimateGpuCost } from '~/lib/cost-estimate'

const price = (value: number | null) =>
  value === null
    ? 'Not available'
    : `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`

export default function CostEstimator({
  model,
  market,
  comparison,
}: {
  model: ModelBenchmark
  market: GpuMarketRate
  comparison: Comparison
}) {
  const providers = leadingProviders(comparison.providers, 'throughput')
  const updated =
    comparison.fetchedAt === null
      ? null
      : new Date(comparison.fetchedAt).toLocaleString('en-US', {
          timeZone: 'UTC',
          dateStyle: 'medium',
          timeStyle: 'short',
        }) + ' UTC'
  const [values, setValues] = useState({
    rate: String(market.hourlyRate),
    users: '24',
    speed: String(Number(model.cacheon.throughput.toFixed(1))),
    utilization: '80',
  })
  const result = estimateGpuCost(
    Number(values.rate || NaN),
    model.hardware.count,
    Number(values.users || NaN),
    Number(values.speed || NaN),
    Number(values.utilization || NaN),
  )
  const fields = [
    { key: 'rate', label: 'USD / GPU-hour', min: 0, max: undefined, step: '0.01' },
    { key: 'users', label: 'Concurrent generating users', min: 1, max: undefined, step: '1' },
    { key: 'speed', label: 'Assumed tok/s per user', min: 0.1, max: undefined, step: '0.1' },
    { key: 'utilization', label: 'Time spent generating (%)', min: 0.1, max: 100, step: '0.1' },
  ] as const
  return (
    <div className="border-border bg-surface mt-6 border p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="text-xl font-medium">Estimate your GPU cost with Cacheon</h3>
          <p className="text-secondary mt-2 text-sm">
            {model.name} · {model.hardware.count} × {model.hardware.gpu}
          </p>
          <a
            href={model.hardware.source}
            className="text-accent mt-2 inline-block text-xs underline underline-offset-4"
          >
            Hardware reference ↗
          </a>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <p className="text-accent font-mono text-3xl">
            {result ? `$${result.perMillion.toFixed(2)}` : '—'}
          </p>
          <p className="text-secondary mt-1 text-xs">GPU cost / 1M output tokens</p>
          {result && (
            <p className="text-secondary mt-1 text-xs">
              ${result.hourly.toFixed(2)} / hour for all GPUs
            </p>
          )}
        </div>
      </div>
      <p className="text-secondary mb-5 text-xs">
        Default GPU rate:{' '}
        <a
          href={market.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          Lium{' '}
          {market.basis === 'listed'
            ? 'starting listed price'
            : 'reference price (no available listings)'}
        </a>{' '}
        · {price(market.hourlyRate)}/GPU-hour · observed{' '}
        {new Date(market.observedAt).toLocaleString('en-US', {
          timeZone: 'UTC',
          dateStyle: 'medium',
          timeStyle: 'short',
        })}{' '}
        UTC
        {market.fallback && ' · Saved snapshot; live feed unavailable'}. Availability and minimum
        rental size vary. You can edit the rate below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map(({ key, label, min, max, step }) => (
          <label key={key} className="text-secondary text-xs">
            {label}
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={values[key]}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              className="border-border bg-bg text-primary focus:border-accent mt-2 block w-full border p-3 font-mono text-base outline-none"
            />
          </label>
        ))}
      </div>
      {!result && (
        <p role="status" className="mt-3 text-sm">
          Enter a nonnegative hourly rate, a whole number of users, positive speed, and utilization
          between 0 and 100%.
        </p>
      )}
      <p className="text-secondary mt-5 text-xs leading-relaxed">
        Workload assumptions are editable above; defaults are 24 concurrent generating users and 80%
        usage. Cost = GPU count × hourly rate ÷ (users × tok/s/user × 3,600 × utilization). Speed
        starts at the internal result; maintaining that speed at higher concurrency is an
        assumption, not a measured scaling result. Adjust it for your workload. GPU cost excludes
        input processing, idle overhead beyond the utilization setting, networking, storage,
        operations, and Cacheon fees. Provider API prices include services beyond GPU rental.
      </p>
      <div className="border-border mt-7 border-t pt-7">
        <h4 className="text-lg font-medium">Compare API pricing</h4>
        <p className="text-secondary mt-2 text-sm">
          {model.name} · USD per 1M tokens · same three fastest OpenRouter endpoints shown above.
        </p>
        <p className="text-secondary mt-2 text-xs">
          {updated
            ? `OpenRouter snapshot: ${updated}${comparison.status === 'stale' ? ' · Stale; refresh pending or failed' : ''}`
            : 'OpenRouter data temporarily unavailable.'}
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {providers.map((provider) => (
            <div key={provider.id} className="border-border bg-bg border p-5">
              <p className="text-secondary mb-4 text-sm">{provider.name}</p>
              <p className="font-mono text-3xl tabular-nums">{price(provider.pricing.output)}</p>
              <p className="text-secondary mt-1 text-xs">API output / 1M tokens</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-secondary">Input / 1M</dt>
                  <dd className="font-mono">{price(provider.pricing.input)}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-secondary">Cached input / 1M</dt>
                  <dd className="font-mono">{price(provider.pricing.cachedInput)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        {providers.length === 0 && (
          <p className="text-secondary mt-4 text-sm">
            No ranked provider prices available for this snapshot.
          </p>
        )}
        <p className="text-secondary mt-4 text-xs">
          Provider API charges and your GPU-only estimate cover different costs. Input and output
          are billed separately; no blended-price or savings claim is assumed.
        </p>
      </div>
    </div>
  )
}
