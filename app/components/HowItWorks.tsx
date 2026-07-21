import { cn } from '~/lib/cn'
import SectionHeader from './SectionHeader'
import { GlassCard } from './dashboard/shared'

const STEPS = [
  {
    num: '01',
    title: 'Write a kernel',
    desc: (
      <>
        Write a Triton or CuteDSL kernel for a typed <strong>slot</strong> (an op, a fused block, or
        a collective) in the fixed model. Verify it locally against the reference with{' '}
        <code>optima verify</code>.
      </>
    ),
  },
  {
    num: '02',
    title: 'Commit-reveal your bundle',
    desc: (
      <>
        Package the kernel source in a bundle and{' '}
        <a
          href="/docs/miners/submitting"
          className="text-accent underline-offset-2 hover:underline"
        >
          commit-reveal
        </a>{' '}
        it, so nobody can copy your submission before it is scored.
      </>
    ),
  },
  {
    num: '03',
    title: 'Validator scores it',
    desc: (
      <>
        The validator swaps your kernel into a pinned <code>sglang</code> engine and runs two
        launches, scoring throughput gated by fidelity. Beat the slot champion by a margin to take
        the crown: per-slot king-of-the-hill.
      </>
    ),
  },
]

type MetricRow = {
  value: string
  label: string
  desc: React.ReactNode
  highlight?: boolean
}

const METRICS: MetricRow[] = [
  {
    value: 'throughput',
    label: 'The score',
    desc: 'Output tokens/sec vs. the pinned sglang baseline, measured across two launches on the same hardware.',
    highlight: true,
  },
  {
    value: 'KL',
    label: 'Fidelity gate',
    desc: (
      <>
        Per-token KL divergence vs. a stock reference run must stay under the slot&apos;s calibrated
        threshold.{' '}
        <a
          href="/docs/validators/fidelity"
          className="text-accent underline-offset-2 hover:underline"
        >
          See how it works.
        </a>
      </>
    ),
  },
  {
    value: 'accuracy',
    label: 'Capability floor',
    desc: 'Real-benchmark task accuracy (GSM8K + MMLU) must not regress vs. the baseline.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-border/50 relative border-t">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader eyebrow="02 — How it works" title="Submit. Evaluate. Win." />

        {/* Steps */}
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <GlassCard key={s.num} className="p-5 sm:p-7">
              <div className="tracking-caps-wide text-accent mb-4 font-mono text-xs font-semibold uppercase">
                {s.num}
              </div>
              <h3 className="text-primary mb-3 font-sans text-base font-semibold">{s.title}</h3>
              <p className="text-base2 text-secondary font-sans leading-[1.6]">{s.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Score formula */}
        <GlassCard className="mb-8 p-5 sm:p-7">
          <div className="tracking-caps-wide text-accent mb-4 font-mono text-xs font-semibold uppercase">
            scoring
          </div>
          <pre className="text-sm2 text-primary sm:text-sm2 m-0 overflow-x-auto font-mono leading-[1.85]">
            <span className="text-secondary">if</span>
            {' not kl_gate_pass or accuracy_regressed:'}
            {'\n    score = '}
            <span className="text-accent">0.0</span>
            <span className="text-secondary"> # fidelity gate: fast-but-wrong is worthless</span>
            {'\n'}
            <span className="text-secondary">else</span> {'\n'}
            <span className="text-secondary">
              {'    '}
              // Two launches, same model + seed; only the slot kernel differs
            </span>
            {'\n    baseline_tput = throughput(OPTIMA_ACTIVE='}
            <span className="text-accent">0</span>
            {')'}
            <span className="text-secondary"> # stock sglang</span>
            {'\n    cand_tput     = throughput(OPTIMA_ACTIVE='}
            <span className="text-accent">1</span>
            {')'}
            <span className="text-secondary"> # your kernel</span>
            {'\n    speedup = cand_tput / baseline_tput'}
            <span className="text-secondary">
              {'\n    # bracket the candidate with a baseline before AND after (B, C, B'}
              &apos;{')'}
            </span>
            {'\n    require speedup >= '}
            <span className="text-accent">1</span>
            {' + '}
            <span className="text-accent">max</span>
            {'('}
            <span className="text-accent">0.02</span>
            {', k * measured_noise)'}
            {'\n    score = speedup'}
            <span className="text-secondary"> # else NO-DECISION (never crowns)</span>
          </pre>
        </GlassCard>

        {/* Metric cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className={cn(
                'hover:border-border hover:bg-surface/80 rounded-xl border p-5 backdrop-blur-sm transition-colors sm:p-6',
                m.highlight ? 'border-accent/50 bg-accent/5' : 'border-border/60 bg-surface/60',
              )}
            >
              <div className="text-primary mb-2 font-mono text-2xl leading-none font-bold sm:text-3xl">
                {m.value}
              </div>
              <div className="tracking-caps text-accent mb-2 font-mono text-xs font-semibold uppercase">
                {m.label}
              </div>
              <p className="text-base2 text-secondary font-sans leading-[1.55]">{m.desc}</p>
            </div>
          ))}
        </div>

        <p className="border-border/40 text-base2 text-secondary mt-2 border-t pt-6 text-center font-sans leading-[1.65]">
          Throughput comes from two launches of the same model, baseline (stock kernels) and
          candidate (your kernel), so the delta is attributable to the one slot. Fidelity is scored
          separately with KL and benchmark accuracy. Both relative to the same pinned sglang
          baseline on the same hardware.
        </p>
      </div>
    </section>
  )
}
