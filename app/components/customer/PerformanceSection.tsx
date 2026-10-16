import {
  deepseekCaseStudy,
  type CustomerModel,
  type CustomerModelId,
} from '~/constants/customer-results'
import { priceTriple, type MarketView } from '~/lib/provider-market'
import ModelTabs from './ModelTabs'
import { eyebrow, h2, note, panel, section, textLink } from './styles'

export default function PerformanceSection({
  model,
  market,
  onModelChange,
  methodologyOpen,
  onMethodologyToggle,
  onShowCaseStudyDetails,
}: {
  model: CustomerModel
  market: MarketView
  onModelChange: (id: CustomerModelId) => void
  methodologyOpen: boolean
  onMethodologyToggle: (open: boolean) => void
  onShowCaseStudyDetails: () => void
}) {
  const { leader, providers } = market
  const scale = Math.max(model.speed, leader?.throughput ?? 0)
  const width = (value: number) => `${(value / scale) * 100}%`
  const leaderPrices = leader ? priceTriple(leader) : null

  return (
    <section id="benchmarks" className={section}>
      <div className="mb-7 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className={eyebrow}>Performance</p>
          <h2 className={h2}>Put the numbers in context.</h2>
        </div>
        <ModelTabs value={model.id} onChange={onModelChange} label="Comparison model" />
      </div>

      <div className={`${panel} px-5 py-6 sm:px-6`} aria-live="polite">
        <div className="text-secondary mb-5 flex justify-between gap-4 text-xs">
          <span>{model.name}</span>
          <span>Output speed · tok/s/user</span>
        </div>

        <SpeedRow
          label="Cacheon"
          detail={model.stat}
          value={model.speed.toFixed(1)}
          width={width(model.speed)}
          own
        />
        <SpeedRow
          label="Fastest measured endpoint"
          detail={leader ? `${leader.name} · OpenRouter P50` : 'Comparison unavailable'}
          value={leader ? leader.throughput.toFixed(1) : '—'}
          width={leader ? width(leader.throughput) : '0%'}
        />

        <div className="border-border text-secondary mt-3 flex flex-col justify-between gap-3 border-t py-4 text-xs leading-relaxed sm:flex-row">
          <span>{leader ? leader.name : 'Reference API pricing'}</span>
          <span>
            {leaderPrices
              ? `Input ${leaderPrices[0]} · cached ${leaderPrices[1]} · output ${leaderPrices[2]} /M`
              : 'See current prices on OpenRouter'}
          </span>
        </div>
        <div className="text-secondary flex flex-wrap justify-between gap-2.5 text-xs leading-relaxed">
          <span>{market.statusLine}</span>
          <a href={model.marketUrl} target="_blank" rel="noopener noreferrer" className={textLink}>
            View provider table ↗
          </a>
        </div>
        <p className={note}>
          Separate workloads and measurement methods; these numbers are not a controlled
          head-to-head test.
        </p>

        <details
          id="methodology"
          open={methodologyOpen}
          onToggle={(event) => onMethodologyToggle(event.currentTarget.open)}
          className="text-secondary mt-5 scroll-mt-24 text-xs leading-relaxed"
        >
          <summary className="text-primary min-h-11 cursor-pointer py-2">
            Measurement details
          </summary>
          <p className="my-2">{model.detail}</p>
          <p className="my-2">
            The OpenRouter reference is the available endpoint with the highest reported
            last-30-minute P50 output speed, including Fast tiers. Its input, cached-input, and
            output prices are kept together. Models, precision, prompts, load, and measurement
            boundaries can differ.
          </p>
        </details>

        <details className="text-secondary mt-2 text-xs leading-relaxed">
          <summary className="text-primary min-h-11 cursor-pointer py-2">
            {market.tableTitle}
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr>
                  {['Endpoint', 'tok/s', 'TTFT', 'Input / cached / output per M'].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="border-border border-b py-3 pr-4 font-normal"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="border-border border-b py-3 pr-4 font-normal">
                      {row.name}
                    </th>
                    <td className="border-border border-b py-3 pr-4 font-mono tabular-nums">
                      {row.throughput.toFixed(1)}
                    </td>
                    <td className="border-border border-b py-3 pr-4 font-mono tabular-nums">
                      {row.ttft !== null ? `${row.ttft.toFixed(2)} s` : '—'}
                    </td>
                    <td className="border-border border-b py-3 pr-4 font-mono tabular-nums">
                      {priceTriple(row).join(' / ')}
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3">
                      No measurements are available here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="mt-6 grid items-center gap-5 py-6 md:grid-cols-[1fr_1.3fr_auto]">
        <div>
          <p className={eyebrow}>A measured engine improvement</p>
          <h3 className="text-lg font-medium">
            Same hardware.
            <br />
            Same replay workload.
          </h3>
        </div>
        <div>
          <p className="font-mono text-3xl tracking-tight tabular-nums">
            {deepseekCaseStudy.baseline.toFixed(1)} <span className="text-accent">→</span>{' '}
            {deepseekCaseStudy.candidate.toFixed(1)}
          </p>
          <p className={note}>
            DeepSeek decode tok/s/user · paired baseline → candidate
            <br />
            Two B300s per lane · candidate audit PASS
          </p>
        </div>
        <a href="#methodology" onClick={onShowCaseStudyDetails} className={textLink}>
          Measurement details ↓
        </a>
      </div>
    </section>
  )
}

function SpeedRow({
  label,
  detail,
  value,
  width,
  own = false,
}: {
  label: string
  detail: string
  value: string
  width: string
  own?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_4rem] items-center gap-x-3 gap-y-2 py-4 sm:grid-cols-[13rem_1fr_4rem] sm:gap-5">
      <div className="col-span-2 sm:col-span-1">
        <strong className="block text-sm font-medium">{label}</strong>
        <small className="text-secondary mt-1 block text-xs">{detail}</small>
      </div>
      <div className="bg-border/40 h-4" aria-hidden="true">
        <div
          className={`h-full transition-[width] duration-300 motion-reduce:transition-none ${own ? 'bg-accent' : 'bg-slate-500'}`}
          style={{ width }}
        />
      </div>
      <strong className="text-right font-mono text-xl font-medium tabular-nums">{value}</strong>
    </div>
  )
}
