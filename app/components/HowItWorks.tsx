import { cn } from '~/lib/cn'
import SectionHeader from './SectionHeader'
import { GlassCard } from './dashboard/shared'

const STEPS = [
  {
    num: '01',
    title: 'Build a server',
    desc: (
      <>
        Containerize your inference server. Any language, any framework, any optimization. Serve{' '}
        <code>Qwen2.5-72B-Instruct</code> via <code>/v1/chat/completions</code>.
      </>
    ),
  },
  {
    num: '02',
    title: 'Validator evaluates',
    desc: (
      <>
        The validator pulls your image, starts the container on GPU, and runs a{' '}
        <a
          href="/docs/evaluation/harness"
          className="text-accent underline-offset-2 hover:underline"
        >
          one-pass eval
        </a>{' '}
        that measures end-to-end speed and correctness.
      </>
    ),
  },
  {
    num: '03',
    title: 'Fastest server wins',
    desc: (
      <>
        Beat the current leader's speed while passing the correctness gate and you take the top
        spot. The leader and runner-up split the competition emission.
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
  // TODO? Seems misaligned with current scoring axes
  {
    value: '50%',
    label: 'TTFT weight',
    desc: 'Time-to-first-token improvement vs. vLLM baseline. Measures prefill efficiency.',
  },
  {
    value: '50%',
    label: 'Throughput weight',
    desc: 'Output tokens/sec improvement vs. vLLM baseline. Measures decode speed.',
  },
  {
    value: 'pass / fail',
    label: 'Correctness gate',
    desc: (
      <>
        First-mismatch logprob check.{' '}
        <a
          href="/docs/evaluation/scoring"
          className="text-accent underline-offset-2 hover:underline"
        >
          See how it works.
        </a>
      </>
    ),
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
            {' pass1_match_fail or not correctness_pass:'}
            {'\n    score = '}
            <span className="text-secondary">0.0</span>
            {'\n'}
            <span className="text-secondary">else</span> {'\n'}
            <span className="text-secondary">
              {'    '}
              // Per prompt: wall time from request start to aligned k-th token
            </span>
            {'\n    k = '}
            <span className="text-accent">min</span>
            {'(baseline_N, miner_N)'}
            {'\n    require k >= '}
            <span className="text-accent">max</span>
            {'('}
            <span className="text-accent">2</span>
            {', ceil('}
            <span className="text-accent">0.9</span>
            {'* baseline_N))'}
            <span className="text-secondary"> # tolerance band</span>
            {'\n    miner_e2e = miner_ttft + miner_decode[k - '}
            <span className="text-accent">1</span>
            {']'}
            {'\n    baseline_e2e = baseline_ttft + baseline_decode[k - '}
            <span className="text-accent">1</span>
            {']'}
            {'\n    improvement = '}
            <span className="text-accent">max</span>
            {'('} <span className="text-accent">0</span>
            {', (baseline_e2e - miner_e2e) / baseline_e2e)'}
            {'\n    speed_improvement = '}
            <span className="text-accent">median</span>
            {'(improvement across'} <span className="text-accent">10</span>
            {' scored prompts)'}
            {'\n    score = speed_improvement'}
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
          Speed is measured in a streaming pass without logprobs. Correctness is measured separately
          with logprobs enabled. Both relative to the same vLLM baseline on the same hardware.
        </p>
      </div>
    </section>
  )
}
