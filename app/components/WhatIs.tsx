import { cn } from '~/lib/cn'
import SectionHeader from './SectionHeader'

const COMPETITORS = [
  {
    rank: 1,
    name: 'Your Kernel',
    tag: 'Cacheon champion',
    speed: 1.37,
    pass: true,
    leader: true,
  },
  {
    rank: 2,
    name: 'sglang',
    tag: 'baseline',
    speed: 1.0,
    pass: true,
    leader: false,
  },
  {
    rank: 3,
    name: 'Fast But Unfaithful',
    tag: 'fidelity gate failed',
    speed: 2.8,
    pass: false,
    leader: false,
  },
] as const

const MAX_SPEED = 3.2

function SpeedBar({ speed, pass, leader }: { speed: number; pass: boolean; leader: boolean }) {
  const pct = Math.min((speed / MAX_SPEED) * 100, 100)

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-sm bg-white/[0.06]">
      <div className="absolute inset-0 flex items-stretch">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex-1 border-r border-white/[0.03]" />
        ))}
      </div>

      <div
        className={cn(
          'relative h-full rounded-sm transition-all duration-700',
          !pass
            ? 'from-error/60 to-error/80 bg-gradient-to-r'
            : leader
              ? 'from-accent/70 to-accent bg-gradient-to-r'
              : 'bg-gradient-to-r from-white/10 to-white/20',
        )}
        style={{ width: `${pct}%` }}
      />

      {leader && (
        <div
          className="shadow-accent-md pointer-events-none absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  )
}

function StatusPill({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className={cn(
        'tracking-caps inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs font-bold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs',
        pass ? 'bg-accent/15 text-accent' : 'bg-error/15 text-error',
      )}
    >
      <span
        className={cn(
          'inline-block size-1.5 rounded-full sm:size-2',
          pass ? 'bg-accent shadow-accent-sm' : 'bg-error shadow-error-sm',
        )}
      />
      {label}
    </span>
  )
}

export default function WhatIs() {
  return (
    <section id="about" className="border-border/50 relative border-t">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader eyebrow="01 — Overview" title="What is Cacheon?" />

        <p className="text-lg2 text-secondary -mt-8 mb-14 max-w-2xl font-sans leading-[1.65]">
          An arena where GPU kernels race the stock sglang baseline. The fastest kernel that stays
          faithful takes the slot. The board below is illustrative: it shows the scoring shape, not
          a claimed result.
        </p>

        {/* Leaderboard */}
        <div className="border-border/60 bg-surface-raised overflow-hidden rounded-xl border">
          <div className="border-border/40 flex items-center justify-between border-b bg-white/[0.015] px-4 py-3 sm:px-8 sm:py-3.5">
            <span className="tracking-caps text-primary font-mono text-xs font-bold uppercase">
              Fast is not enough. Faithful wins.
            </span>
            <span className="text-2xs tracking-caps text-secondary/40 hidden font-mono uppercase sm:block">
              Throughput (higher is better) →
            </span>
          </div>

          {COMPETITORS.map((c, i) => (
            <div
              key={c.rank}
              className={cn(i > 0 && 'border-border/20 border-t', c.leader && 'bg-accent/[0.035]')}
            >
              <div className="grid grid-cols-[1.5rem_1fr_auto_auto] items-center gap-x-2 px-4 py-4 sm:grid-cols-[3rem_11rem_1fr_5rem_auto] sm:gap-x-6 sm:px-8 sm:py-5">
                <div
                  className={cn(
                    'font-mono text-xl leading-none font-black tracking-tight sm:text-2xl',
                    c.leader ? 'text-accent' : c.pass ? 'text-white/20' : 'text-error/30',
                  )}
                >
                  {c.rank}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {c.leader && (
                      <span className="text-base leading-none drop-shadow-[0_0_8px_var(--accent-glow)] sm:text-xl">
                        👑
                      </span>
                    )}
                    {!c.pass && <span className="text-sm leading-none sm:text-base">⚠️</span>}
                    <span
                      className={cn(
                        'text-sm2 sm:text-base2 font-mono font-bold',
                        c.leader
                          ? 'text-primary'
                          : c.pass
                            ? 'text-secondary/80'
                            : 'text-secondary/50 decoration-error/40 line-through',
                      )}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'text-2xs tracking-caps mt-0.5 font-mono font-semibold uppercase sm:mt-1',
                      c.leader ? 'text-accent/60' : c.pass ? 'text-secondary/30' : 'text-error/40',
                    )}
                  >
                    {c.tag}
                  </div>
                </div>

                <div className="hidden sm:flex sm:flex-col">
                  <SpeedBar speed={c.speed} pass={c.pass} leader={c.leader} />
                </div>

                <div
                  className={cn(
                    'text-right font-mono text-base font-black tracking-tight sm:text-xl',
                    c.leader ? 'text-accent' : c.pass ? 'text-white/30' : 'text-error/60',
                  )}
                >
                  {c.speed.toFixed(c.speed === 1.0 ? 1 : 2)}x
                </div>

                <div className="flex justify-end">
                  <StatusPill pass={c.pass} label={!c.pass ? 'FAIL' : c.leader ? 'PASS' : 'BASE'} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring surface */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {[
            { metric: 'THROUGHPUT', direction: '↑ higher is better', accent: true },
            { metric: 'KL FIDELITY', direction: 'must pass the gate', accent: false },
            { metric: 'BENCHMARK ACCURACY', direction: 'must not regress', accent: false },
          ].map((item) => (
            <div key={item.metric} className="text-center">
              <div
                className={cn(
                  'tracking-caps font-mono text-base font-bold',
                  item.accent ? 'text-accent' : 'text-primary',
                )}
              >
                {item.metric}
              </div>
              <div className="text-sm2 tracking-caps text-secondary mt-1 font-mono uppercase">
                {item.direction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
