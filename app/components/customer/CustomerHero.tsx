import type { CustomerModel, CustomerModelId } from '~/constants/customer-results'
import ModelTabs from './ModelTabs'
import { eyebrow, note, panel, primaryButton, secondaryButton, textLink } from './styles'

export default function CustomerHero({
  model,
  onModelChange,
}: {
  model: CustomerModel
  onModelChange: (id: CustomerModelId) => void
}) {
  return (
    <section
      id="top"
      tabIndex={-1}
      className="border-border grid scroll-mt-24 items-center gap-10 border-b pt-36 pb-14 outline-none sm:pt-44 md:grid-cols-[1.13fr_1fr]"
    >
      <div>
        <p className={eyebrow}>Open-model inference, optimized</p>
        <h1 className="mb-6 text-[clamp(2.5rem,5vw,3.6rem)] leading-[1.05] font-medium tracking-[-0.045em]">
          Faster agents.
          <br />
          <span className="text-accent">More from every GPU.</span>
        </h1>
        <p className="text-secondary mb-7 max-w-md text-base leading-relaxed">
          Use Cacheon-hosted inference, or optimize the serving stack you already run. Put
          model-specific GPU and caching improvements to work for your application.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#hosted" className={primaryButton}>
            Explore hosted inference <span aria-hidden="true">↓</span>
          </a>
          <a href="#own-stack" className={secondaryButton}>
            Optimize your stack <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className={`${panel} p-6`} aria-live="polite">
        <ModelTabs value={model.id} onChange={onModelChange} label="Model results" />
        <p className="text-secondary mt-7 mb-1 font-mono text-xs tracking-widest uppercase">
          Up to
        </p>
        <p className="flex items-start gap-1 font-mono text-[clamp(2.75rem,6vw,4.25rem)] leading-tight font-medium tracking-tight tabular-nums">
          {model.speed.toFixed(1)}
          <sup className="text-secondary text-2xl leading-loose">*</sup>
        </p>
        <p className="text-secondary mt-2 text-xs">output tokens / second / user</p>
        <div className="border-border mt-6 flex flex-wrap justify-between gap-4 border-t pt-4 text-xs">
          <span>{model.hardware}</span>
          <a href="#benchmarks" className={textLink}>
            See results ↓
          </a>
        </div>
        <p className={note}>{model.note}</p>
      </div>
    </section>
  )
}
