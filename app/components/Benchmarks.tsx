import { useState } from 'react'
import { modelBenchmarks, snapshotDate } from '~/constants/benchmarks'

type Metric = 'throughput' | 'ttft'

export default function Benchmarks() {
  const [modelId, setModelId] = useState('qwen')
  const [metric, setMetric] = useState<Metric>('throughput')
  const model = modelBenchmarks.find((item) => item.id === modelId)!
  const providers = [...model.providers].sort((a, b) =>
    metric === 'throughput' ? b.throughput - a.throughput : a.ttft - b.ttft,
  )
  const maximum = Math.max(model.cacheon[metric] ?? 0, ...providers.map((p) => p[metric]))
  const format = (value: number) => (metric === 'throughput' ? value.toFixed(1) : value.toFixed(3))
  const unit = metric === 'throughput' ? 'tok/s' : 's'

  function bar(name: string, value: number | null, cacheon = false) {
    return (
      <div className="py-3">
        <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
          <span className={cacheon ? 'text-accent font-semibold' : 'text-secondary'}>{name}</span>
          <span className="shrink-0 font-mono tabular-nums">
            {value === null ? (
              'Not published'
            ) : (
              <>
                {format(value)} <span className="text-secondary text-xs">{unit}</span>
              </>
            )}
          </span>
        </div>
        {value !== null && (
          <div className="bg-border/40 h-2.5" aria-hidden="true">
            <div
              className={cacheon ? 'bg-accent h-full' : 'h-full bg-slate-500'}
              style={{ width: `${(value / maximum) * 100}%` }}
            />
          </div>
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
            Our results. <br />
            The leading providers.
          </h2>
          <p className="text-secondary max-w-sm text-sm">
            Explore output speed, time to first token, and published API prices for each model.
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
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a metric">
              {(['throughput', 'ttft'] as const).map((key) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={metric === key}
                  onClick={() => setMetric(key)}
                  className={`cursor-pointer px-3 py-2 text-sm ${metric === key ? 'bg-primary text-bg' : 'text-secondary hover:bg-border'}`}
                >
                  {key === 'throughput' ? 'Output speed' : 'Time to first token'}
                </button>
              ))}
            </div>
            <span className="text-secondary font-mono text-xs">
              {metric === 'throughput' ? '↑ Higher is better' : '↓ Lower is better'}
            </span>
          </div>
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <div className="p-5 sm:p-8" aria-live="polite" aria-atomic="true">
              <h3 className="mb-4 text-lg font-medium">{model.name}</h3>
              <p className="text-secondary text-xs">Internal result · {model.cacheon.label}</p>
              {bar('Cacheon', model.cacheon[metric], true)}
              <div className="border-border mt-5 border-t pt-5">
                <p className="text-secondary mb-2 text-xs">
                  OpenRouter · published P50 · {snapshotDate}
                </p>
                {providers.map((provider) => (
                  <div key={provider.name}>{bar(provider.name, provider[metric])}</div>
                ))}
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
              Provider details & pricing
            </summary>
            <div className="overflow-x-auto px-5 pb-6 sm:px-8">
              <table className="w-full min-w-[600px] text-left text-sm">
                <caption className="text-secondary mb-4 text-left text-xs">
                  OpenRouter snapshot, {snapshotDate}. Top three throughput endpoints in Standard
                  routing, plus the lowest-TTFT endpoint when distinct. Prices in USD per million
                  tokens. Cacheon pricing is available on request.
                </caption>
                <thead className="text-secondary">
                  <tr>
                    {[
                      'Provider / endpoint',
                      'tok/s (P50)',
                      'TTFT (P50)',
                      'Input / 1M',
                      'Output / 1M',
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
                  {providers.map((provider) => (
                    <tr key={provider.name}>
                      <th scope="row" className="border-border border-b py-3 pr-5 font-normal">
                        {provider.name}
                      </th>
                      {[
                        provider.throughput,
                        `${provider.ttft.toFixed(2)} s`,
                        `$${provider.inputPrice}`,
                        `$${provider.outputPrice.toFixed(2)}`,
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
        <p className="text-secondary mt-4 text-xs">
          Dated snapshot, not a live ranking. Fast tiers are included. No cross-source speedup or
          quality-equivalence claim is implied.
        </p>
      </div>
    </section>
  )
}
