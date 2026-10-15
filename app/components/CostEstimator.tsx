import { useState } from 'react'
import type { ModelBenchmark } from '~/constants/benchmarks'
import { estimateGpuCost } from '~/lib/cost-estimate'

export default function CostEstimator({ model }: { model: ModelBenchmark }) {
  const [values, setValues] = useState({
    rate: String(model.hardware.hourlyRate),
    users: '1',
    speed: String(Number(model.cacheon.throughput.toFixed(1))),
    utilization: '100',
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
        Illustrative assumptions, editable above. GPU-hour rates are examples, not rental quotes.
        Cost = GPU count × hourly rate ÷ (users × tok/s/user × 3,600 × utilization). Speed starts at
        the internal result; maintaining that speed at higher concurrency is an assumption, not a
        measured scaling result. Adjust it for your workload. GPU cost excludes input processing,
        idle overhead beyond the utilization setting, networking, storage, operations, and Cacheon
        fees. Provider API prices include services beyond GPU rental.
      </p>
    </div>
  )
}
