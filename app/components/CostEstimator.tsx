import { useState } from 'react'
import type { ModelBenchmark } from '~/constants/benchmarks'
import type { GpuMarketRate } from '~/lib/gpu-market'
import { leadingProviders } from '~/lib/comparisons'
import type { Comparison } from '~/lib/comparisons'
import { estimateGpuCost } from '~/lib/cost-estimate'
import { calculatorThroughput, clampConcurrency, concurrencyRange } from '~/lib/concurrency'

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
  const points = model.cacheon.concurrency
  const range = concurrencyRange(points)
  const maxUsers = range ? Math.min(24, range.max) : 1
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
    users: String(clampConcurrency(points, 24) ?? ''),
    utilization: '80',
  })
  const users = Number(values.users || NaN)
  const speedEstimate = calculatorThroughput(points, users)
  const speed = speedEstimate?.throughput ?? null
  const result = estimateGpuCost(
    Number(values.rate || NaN),
    model.hardware.count,
    users,
    speed ?? NaN,
    Number(values.utilization || NaN),
  )
  const fields = [
    { key: 'rate', label: 'USD / GPU-hour', min: 0, max: undefined, step: '0.01' },
    { key: 'users', label: 'Concurrent users', min: 1, max: maxUsers, step: '1' },
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
              readOnly={key === 'users' && maxUsers === 1}
              aria-describedby={key === 'users' ? 'concurrency-evidence' : undefined}
              onChange={(event) => {
                const value = event.target.value
                setValues({
                  ...values,
                  [key]:
                    key === 'users' && value !== ''
                      ? String(clampConcurrency(points, Number(value)) ?? '')
                      : value,
                })
              }}
              className="border-border bg-bg text-primary focus:border-accent mt-2 block w-full border p-3 font-mono text-base outline-none"
            />
          </label>
        ))}
        <div className="text-secondary text-xs">
          {speedEstimate?.basis === 'measured'
            ? 'Measured'
            : speedEstimate?.basis === 'assumed'
              ? 'Assumed'
              : 'Estimated'}{' '}
          tok/s per user
          <output
            className="border-border bg-bg text-primary mt-2 block w-full border p-3 font-mono text-base"
            aria-live="polite"
          >
            {speed === null ? '—' : speed.toFixed(1)}
          </output>
        </div>
      </div>
      <p id="concurrency-evidence" className="text-secondary mt-3 text-xs leading-relaxed">
        {maxUsers === 1
          ? 'This checkpoint was measured at 1 concurrent user, so its calculator is capped at 1.'
          : `Choose 1–${maxUsers} concurrent users. The cap follows the highest verified concurrency, up to 24.`}{' '}
        {points.length === 1 && maxUsers > 1
          ? `Speed was measured at ${range?.max} users. At lower concurrency, the calculator assumes the same tok/s per user; more measurements are needed to estimate how speed changes.`
          : points.length > 1
            ? `Speed is interpolated between measured points. Below ${range?.min} users, it assumes the speed at the lowest measured concurrency.`
            : ''}{' '}
        <a href={model.cacheon.evidence} className="text-accent underline underline-offset-4">
          Benchmark evidence ↗
        </a>
      </p>
      {!result && (
        <p role="status" className="mt-3 text-sm">
          Enter a nonnegative hourly rate, a whole number of users within the allowed range, and
          utilization above 0 and at most 100%.
        </p>
      )}
      <p className="text-secondary mt-5 text-xs leading-relaxed">
        Defaults are 24 concurrent users where measured and 80% usage. Cost = GPU count × hourly
        rate ÷ (users × tok/s/user × 3,600 × utilization). This is a decode-only cost estimate;
        concurrent sessions are not continuously decoding. GPU cost excludes input processing, idle
        overhead beyond the utilization setting, networking, storage, operations, and Cacheon fees.
        Provider API prices include services beyond GPU rental.
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
              <p className="text-secondary mt-3 text-sm">
                <span className="text-primary font-mono tabular-nums">
                  {provider.throughput === null
                    ? 'Speed unavailable'
                    : `${provider.throughput.toFixed(1)} tok/s`}
                </span>{' '}
                · Output speed (P50)
              </p>
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
