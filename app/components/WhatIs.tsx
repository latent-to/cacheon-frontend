import SectionHeader from './SectionHeader'

const COMPETITORS = [
  {
    rank: 1,
    name: 'Your Server',
    tag: 'Cacheon winner',
    speed: 1.37,
    pass: true,
    winner: true,
  },
  {
    rank: 2,
    name: 'vLLM',
    tag: 'baseline',
    speed: 1.0,
    pass: true,
    winner: false,
  },
  {
    rank: 3,
    name: 'Fast But Wrong',
    tag: 'disqualified',
    speed: 2.8,
    pass: false,
    winner: false,
  },
] as const

const MAX_SPEED = 3.2

function SpeedBar({ speed, pass, winner }: { speed: number; pass: boolean; winner: boolean }) {
  const pct = Math.min((speed / MAX_SPEED) * 100, 100)

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-sm bg-white/[0.06]">
      <div className="absolute inset-0 flex items-stretch">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex-1 border-r border-white/[0.03]" />
        ))}
      </div>

      <div
        className={`relative h-full rounded-sm transition-all duration-700 ${
          !pass
            ? 'bg-gradient-to-r from-red-500/60 to-red-400/80'
            : winner
              ? 'from-accent/70 to-accent bg-gradient-to-r'
              : 'bg-gradient-to-r from-white/10 to-white/20'
        }`}
        style={{ width: `${pct}%` }}
      />

      {winner && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-sm"
          style={{
            width: `${pct}%`,
            boxShadow: '0 0 16px rgba(45,212,191,0.4), 0 0 4px rgba(45,212,191,0.25)',
          }}
        />
      )}
    </div>
  )
}

function StatusPill({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[0.65rem] font-bold tracking-widest sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.72rem] ${
        pass ? 'bg-accent/15 text-accent' : 'bg-red-400/15 text-red-400'
      }`}
    >
      <span
        className={`inline-block size-1.5 rounded-full sm:size-2 ${
          pass
            ? 'bg-accent shadow-[0_0_6px_rgba(45,212,191,0.6)]'
            : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
        }`}
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

        <p className="text-secondary -mt-8 mb-14 max-w-2xl font-sans text-[1.08rem] leading-[1.65]">
          An arena where inference servers race to beat the baseline. The fastest correct one
          becomes the king.
        </p>

        {/* Leaderboard */}
        <div className="border-border/60 overflow-hidden rounded-xl border bg-[#060709]">
          <div className="border-border/40 flex items-center justify-between border-b bg-white/[0.015] px-4 py-3 sm:px-8 sm:py-3.5">
            <span className="text-primary font-mono text-[0.68rem] font-bold tracking-[0.2em] uppercase sm:text-[0.72rem]">
              Fast is not enough. Correct wins.
            </span>
            <span className="text-secondary/40 hidden font-mono text-[0.6rem] tracking-[0.16em] uppercase sm:block">
              Speed (higher is better) →
            </span>
          </div>

          {COMPETITORS.map((c, i) => (
            <div
              key={c.rank}
              className={`${i > 0 ? 'border-border/20 border-t' : ''} ${
                c.winner ? 'bg-accent/[0.035]' : ''
              }`}
            >
              <div className="grid grid-cols-[1.5rem_1fr_auto_auto] items-center gap-x-2 px-4 py-4 sm:grid-cols-[3rem_11rem_1fr_5rem_auto] sm:gap-x-6 sm:px-8 sm:py-5">
                <div
                  className={`font-mono text-xl leading-none font-black tracking-tight sm:text-2xl ${
                    c.winner ? 'text-accent' : c.pass ? 'text-white/20' : 'text-red-400/30'
                  }`}
                >
                  {c.rank}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {c.winner && (
                      <span className="text-base leading-none drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] sm:text-xl">
                        👑
                      </span>
                    )}
                    {!c.pass && <span className="text-sm leading-none sm:text-base">⚠️</span>}
                    <span
                      className={`font-mono text-[0.82rem] font-bold sm:text-[0.95rem] ${
                        c.winner
                          ? 'text-primary'
                          : c.pass
                            ? 'text-secondary/80'
                            : 'text-secondary/50 line-through decoration-red-400/40'
                      }`}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 font-mono text-[0.58rem] font-semibold tracking-[0.18em] uppercase sm:mt-1 sm:text-[0.62rem] ${
                      c.winner ? 'text-accent/60' : c.pass ? 'text-secondary/30' : 'text-red-400/40'
                    }`}
                  >
                    {c.tag}
                  </div>
                </div>

                <div className="hidden sm:flex sm:flex-col">
                  <SpeedBar speed={c.speed} pass={c.pass} winner={c.winner} />
                </div>

                <div
                  className={`text-right font-mono text-base font-black tracking-tight sm:text-xl ${
                    c.winner ? 'text-accent' : c.pass ? 'text-white/30' : 'text-red-400/60'
                  }`}
                >
                  {c.speed.toFixed(c.speed === 1.0 ? 1 : 2)}x
                </div>

                <div className="flex justify-end">
                  <StatusPill pass={c.pass} label={!c.pass ? 'FAIL' : c.winner ? 'PASS' : 'BASE'} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring surface */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {[
            { metric: 'TTFT', direction: '↓ lower is better', accent: true },
            { metric: 'TOKENS/SEC', direction: '↑ higher is better', accent: true },
            { metric: 'CORRECTNESS', direction: 'must pass to score', accent: false },
          ].map((item) => (
            <div key={item.metric} className="text-center">
              <div
                className={`font-mono text-[0.85rem] font-bold tracking-[0.15em] ${
                  item.accent ? 'text-accent' : 'text-primary'
                }`}
              >
                {item.metric}
              </div>
              <div className="text-secondary/50 mt-1 font-mono text-[0.6rem] tracking-[0.1em] uppercase">
                {item.direction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
