import { cn } from '~/lib/cn'
import SectionHeader from './SectionHeader'

const TARGETS = [
  {
    name: 'RMSNorm kernel',
    detail: '+37% over incumbent',
    crowned: true,
  },
  {
    name: 'Attention block',
    detail: 'no challenger yet',
    crowned: false,
  },
  {
    name: 'Collective op',
    detail: '+12% over incumbent',
    crowned: true,
  },
] as const

function StatusPill({ crowned }: { crowned: boolean }) {
  return (
    <span
      className={cn(
        'tracking-caps text-2xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold sm:px-3 sm:text-xs',
        crowned ? 'bg-accent/15 text-accent' : 'border-border/60 text-secondary/50 border',
      )}
    >
      {crowned && (
        <span className="bg-accent shadow-accent-sm inline-block size-1.5 rounded-full sm:size-2" />
      )}
      {crowned ? 'crowned' : 'open'}
    </span>
  )
}

export default function WhatIs() {
  return (
    <section id="about" className="border-border/50 relative border-t">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader eyebrow="01 — Overview" title="What is Cacheon?" />

        <p className="text-lg2 text-secondary -mt-8 mb-14 max-w-2xl font-sans leading-[1.65]">
          An arena where GPU kernels race the stock sglang baseline. Improve inference performance
          with your kernel, without impacting quality, and get a reward scaled to your impact.
          Bigger improvements mean bigger rewards.
        </p>

        {/* Many targets, independently judged */}
        <div className="border-border/60 bg-surface-raised overflow-hidden rounded-xl border">
          <div className="border-border/40 border-b bg-white/[0.015] px-4 py-3 sm:px-8 sm:py-3.5">
            <span className="tracking-caps text-primary font-mono text-xs font-bold uppercase">
              No single leaderboard. Every target crowns on its own.
            </span>
          </div>

          {TARGETS.map((t, i) => (
            <div
              key={t.name}
              className={cn(i > 0 && 'border-border/20 border-t', t.crowned && 'bg-accent/[0.035]')}
            >
              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5">
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-sm2 sm:text-base2 font-mono font-bold',
                      t.crowned ? 'text-primary' : 'text-secondary/80',
                    )}
                  >
                    {t.name}
                  </div>
                  <div
                    className={cn(
                      'text-2xs tracking-caps mt-0.5 font-mono font-semibold uppercase sm:mt-1',
                      t.crowned ? 'text-accent/60' : 'text-secondary/30',
                    )}
                  >
                    {t.detail}
                  </div>
                </div>

                <StatusPill crowned={t.crowned} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-2xs tracking-caps text-secondary/40 mt-3 font-mono uppercase">
          Every registered target is judged against its own incumbent. Many kernels can hold a crown
          at the same time.
        </p>

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
