import { cn } from '~/lib/cn'
import { ROADMAP, type RoadmapPhase } from '../constants/roadmap'
import SectionHeader from './SectionHeader'

export default function Roadmap() {
  return (
    <section id="roadmap" className="border-border/50 relative border-t">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader eyebrow="04 — Roadmap" title="From arena to production." />

        <div className="relative pl-8">
          <div className="bg-border/80 absolute top-2 bottom-2 left-[0.45rem] w-px" />

          {ROADMAP.map((phase, i) => (
            <PhaseCard key={phase.version} phase={phase} isLast={i === ROADMAP.length - 1} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PhaseCard({ phase, isLast }: { phase: RoadmapPhase; isLast: boolean }) {
  const isActive = phase.status === 'active'
  const isComplete = phase.status === 'complete'
  const dimmed = phase.status === 'future'

  return (
    <div
      className={cn(
        'relative transition-opacity duration-200',
        !isLast && 'mb-8',
        dimmed && 'opacity-65',
      )}
    >
      <div
        className={cn(
          'absolute top-[0.5rem] -left-7 size-3 rounded-full',
          isActive ? 'border-accent bg-accent border-2' : 'border-border bg-bg border-2',
        )}
      />

      <div
        className={cn(
          'rounded-xl border px-4 py-4 backdrop-blur-sm transition-colors sm:px-6 sm:py-5',
          isActive
            ? 'border-accent/50 bg-accent/[0.04] shadow-accent-lg'
            : 'border-border/60 bg-surface/60 hover:border-border hover:bg-surface/80',
        )}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="tracking-caps text-accent font-mono text-xs font-semibold uppercase">
            {phase.version}
          </span>
          <span className="text-primary font-sans text-base font-semibold">{phase.label}</span>
          {isActive && (
            <span className="border-accent/60 bg-accent/10 text-2xs tracking-caps text-accent rounded-full border px-2.5 py-0.5 font-mono font-bold uppercase">
              Live
            </span>
          )}
          {isComplete && (
            <span className="border-border text-2xs tracking-caps text-secondary rounded-full border px-2.5 py-0.5 font-mono font-bold uppercase">
              Complete
            </span>
          )}
        </div>

        <ul className="flex list-none flex-col gap-1.5">
          {phase.items.map((item, i) => (
            <li
              key={i}
              className="text-base2 text-secondary relative pl-4 font-sans leading-[1.55]"
            >
              <span className="text-secondary/50 absolute left-0 font-mono">–</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
