import { useState } from 'react'
import { modelBenchmarks } from '~/constants/benchmarks'
import type { GpuMarket } from '~/lib/gpu-market'
import CostEstimator from './CostEstimator'
import { leadingProviders } from '~/lib/comparisons'
import type { Comparison, ProviderResult } from '~/lib/comparisons'

function money(value: number | null) {
  return value === null
    ? 'Not available'
    : `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
}

export default function Benchmarks({
  comparisons,
  gpuMarket,
}: {
  comparisons: Record<string, Comparison>
  gpuMarket: GpuMarket
}) {
  const [modelId, setModelId] = useState(modelBenchmarks[0].id)
  const model = modelBenchmarks.find((item) => item.id === modelId)!
  const comparison = comparisons[modelId]
  const providers = leadingProviders(comparison.providers, 'throughput')
  const maximum = Math.max(1, model.cacheon.throughput, ...providers.map((p) => p.throughput ?? 0))
  const updated =
    comparison.fetchedAt === null
      ? null
      : new Date(comparison.fetchedAt).toLocaleString('en-US', {
          timeZone: 'UTC',
          dateStyle: 'medium',
          timeStyle: 'short',
        }) + ' UTC'
  function stats(
    name: string,
    throughput: number | null,
    ttft: number | null,
    cacheon = false,
    pricing?: ProviderResult['pricing'],
  ) {
    return (
      <div className="border-border/50 border-b py-4 last:border-b-0">
        <p className={`mb-3 text-sm ${cacheon ? 'text-accent font-semibold' : 'text-secondary'}`}>
          {name}
        </p>
        <dl className="grid grid-cols-2 gap-5">
          <div>
            <dt className="text-secondary mb-1 text-xs">Output speed</dt>
            <dd className="font-mono text-xl tabular-nums">
              {throughput === null ? (
                <span className="text-sm">{cacheon ? 'Awaiting source' : 'Not published'}</span>
              ) : (
                <>
                  {throughput.toFixed(1)} <span className="text-secondary text-xs">tok/s</span>
                </>
              )}
            </dd>
            {throughput !== null && (
              <div className="bg-border/40 mt-2 h-2" aria-hidden="true">
                <div
                  className={cacheon ? 'bg-accent h-full' : 'h-full bg-slate-500'}
                  style={{ width: `${(throughput / maximum) * 100}%` }}
                />
              </div>
            )}
          </div>
          <div>
            <dt className="text-secondary mb-1 text-xs">
              TTFT <span className="sr-only">(time to first token)</span>
            </dt>
            <dd className="font-mono text-xl tabular-nums">
              {ttft === null ? (
                <span className="text-sm">{cacheon ? 'Awaiting source' : 'Not published'}</span>
              ) : (
                <>
                  {ttft.toFixed(3)} <span className="text-secondary text-xs">s</span>
                </>
              )}
            </dd>
          </div>
        </dl>
        {pricing && (
          <p className="text-secondary mt-3 text-xs">
            API price / 1M tokens: input {money(pricing.input)} · output {money(pricing.output)}
            {pricing.cachedInput !== null && ` · cached input ${money(pricing.cachedInput)}`}
          </p>
        )}
      </div>
    )
  }

  return (
    <section id="benchmarks" className="border-border border-y py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-accent mb-5 font-mono text-xs tracking-widest uppercase">
          01 / Performance
        </p>
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-xl text-3xl leading-tight font-medium tracking-tight sm:text-5xl">
            How do we compare?
          </h2>
          <p className="text-secondary max-w-sm text-sm">
            Compare speed, time to first token, and cost with leading providers on OpenRouter.
          </p>
        </div>
        <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Choose a model">
          {modelBenchmarks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === modelId}
              onClick={() => setModelId(item.id)}
              className={`cursor-pointer border px-4 py-3 text-sm transition-colors ${item.id === modelId ? 'border-accent bg-accent/10 text-accent' : 'border-border text-secondary hover:border-secondary'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="border-border bg-surface border">
          <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:px-8">
            <p className="text-sm font-medium">Output speed &amp; time to first token</p>
            <span className="text-secondary font-mono text-xs">↑ Higher tok/s · ↓ Lower TTFT</span>
          </div>
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <div className="p-5 sm:p-8" aria-live="polite" aria-atomic="true">
              <h3 className="mb-4 text-lg font-medium">{model.name}</h3>
              <p className="text-secondary text-xs">Internal result · {model.cacheon.label}</p>
              {stats('Cacheon', model.cacheon.throughput, model.cacheon.ttft, true)}
              <div className="border-border mt-5 border-t pt-5">
                <p className="text-secondary mb-2 text-xs">
                  OpenRouter · P50 over the last 30 minutes
                </p>
                <p className="text-secondary mb-3 text-xs">
                  {updated
                    ? `Last refreshed ${updated}${comparison.status === 'stale' ? ' · Stale data; refresh pending or failed' : ''}`
                    : 'Provider data temporarily unavailable.'}
                </p>
                {providers.map((provider) => (
                  <div key={provider.id}>
                    {stats(
                      provider.name,
                      provider.throughput,
                      provider.ttft,
                      false,
                      provider.pricing,
                    )}
                  </div>
                ))}
                {providers.length === 0 && comparison.status !== 'unavailable' && (
                  <p className="text-secondary py-4 text-sm">
                    OpenRouter is not returning throughput measurements for this model right now.
                    Check back after the next refresh.
                  </p>
                )}
              </div>
            </div>
            <aside className="border-border border-t p-5 sm:p-8 lg:border-t-0 lg:border-l">
              <h3 className="mb-3 font-medium">What these numbers measure</h3>
              <p className="text-secondary mb-5 text-sm leading-relaxed">
                These are separate measurements, not a controlled head-to-head test. Cacheon reports
                internal runs; OpenRouter reports provider traffic. Workload, token counting,
                hardware, and cache behavior can differ.
              </p>
              <p className="text-secondary mb-5 text-sm leading-relaxed">
                {model.cacheon.methodology}
              </p>
              <a
                href={model.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-sm underline underline-offset-4"
              >
                View OpenRouter source ↗
              </a>
              {model.cacheon.resultSource && (
                <a
                  href={model.cacheon.resultSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent mt-3 block text-sm underline underline-offset-4"
                >
                  View measurement source ↗
                </a>
              )}
              {model.cacheon.evidence && (
                <a
                  href={model.cacheon.evidence}
                  className="text-accent mt-3 block text-sm underline underline-offset-4"
                >
                  Download Cacheon measurements ↓
                </a>
              )}
            </aside>
          </div>
          <details className="border-border border-t">
            <summary className="text-secondary cursor-pointer p-5 text-sm sm:px-8">
              OpenRouter provider stats
            </summary>
            <div className="max-h-96 overflow-auto px-5 pb-6 sm:px-8">
              <table className="w-full min-w-[380px] text-left text-sm">
                <caption className="text-secondary mb-4 text-left text-xs">
                  OpenRouter reports P50 performance over the last 30 minutes for available
                  endpoints. API prices are USD per million tokens; Cacheon reports internal results
                  under the conditions above.
                  {updated && ` OpenRouter last refreshed ${updated}.`}
                </caption>
                <thead className="text-secondary">
                  <tr>
                    {[
                      'Provider / endpoint',
                      'tok/s',
                      'TTFT',
                      'Input / 1M',
                      'Output / 1M',
                      'Cached input / 1M',
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="border-border border-b py-3 pr-5 font-normal"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-accent">
                    <th scope="row" className="border-border border-b py-3 pr-5 font-medium">
                      Cacheon · internal
                    </th>
                    {[
                      model.cacheon.throughput.toFixed(1),
                      model.cacheon.ttft === null
                        ? 'Awaiting source'
                        : `${model.cacheon.ttft.toFixed(3)} s`,
                      '—',
                      'GPU estimate below',
                      '—',
                    ].map((value, index) => (
                      <td
                        key={index}
                        className="border-border border-b py-3 pr-5 font-mono tabular-nums"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                  {comparison.providers.map((provider) => (
                    <tr key={provider.id}>
                      <th scope="row" className="border-border border-b py-3 pr-5 font-normal">
                        {provider.name}
                      </th>
                      {[
                        provider.throughput === null
                          ? 'Not published'
                          : provider.throughput.toFixed(1),
                        provider.ttft === null ? 'Not published' : `${provider.ttft.toFixed(3)} s`,
                        money(provider.pricing.input),
                        money(provider.pricing.output),
                        money(provider.pricing.cachedInput),
                      ].map((value, index) => (
                        <td
                          key={index}
                          className="border-border border-b py-3 pr-5 font-mono tabular-nums"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
        <CostEstimator
          key={model.id}
          model={model}
          market={gpuMarket[model.hardware.marketId]}
          comparison={comparison}
        />
        <p className="text-secondary mt-4 text-xs">
          OpenRouter data refreshes on demand after one hour. The comparison shows the three fastest
          available endpoints by output speed, with TTFT alongside, including Fast tiers. Missing
          metrics are not ranked. No cross-source speedup or quality-equivalence claim is implied.
        </p>
      </div>
    </section>
  )
}
