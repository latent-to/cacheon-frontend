import SectionHeader from './SectionHeader'

const STEPS = [
  {
    num: '01',
    title: 'Build a server',
    desc: (
      <>
        Package your inference server in a Docker container. Any language, any framework, any
        optimization. Serve <code>Qwen2.5-72B-Instruct</code> on 4x H200 via{' '}
        <code>/v1/chat/completions</code>.
      </>
    ),
  },
  {
    num: '02',
    title: 'Validator evaluates',
    desc: (
      <>
        The validator pulls your image, starts the container with GPU access, and runs a two-pass
        evaluation: streaming for speed (TTFT + throughput), then non-streaming for correctness
        (token match + logprob checks).
      </>
    ),
  },
  {
    num: '03',
    title: 'Fastest server wins',
    desc: (
      <>
        Beat the king's speed while passing the correctness gate: you're the new king. All emission
        flows to the winner. No partial credit.
      </>
    ),
  },
]

type MetricRow = {
  value: string
  label: string
  desc: string
  highlight?: boolean
}

const METRICS: MetricRow[] = [
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
    value: '99%',
    label: 'Token match gate',
    desc: 'Minimum greedy token match rate. Below this, your score is zero.',
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
            <article
              key={s.num}
              className="border-border/60 bg-surface/60 hover:border-border hover:bg-surface/80 rounded-xl border p-7 backdrop-blur-sm transition-colors"
            >
              <div className="text-accent mb-4 font-mono text-[0.7rem] font-semibold tracking-[0.22em] uppercase">
                {s.num}
              </div>
              <h3 className="text-primary mb-3 font-sans text-[1rem] font-semibold">{s.title}</h3>
              <p className="text-secondary font-sans text-[0.92rem] leading-[1.6]">{s.desc}</p>
            </article>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-14 flex items-center gap-4">
          <div className="bg-border/40 h-px flex-1" />
          <span className="text-secondary font-mono text-[0.7rem] font-semibold tracking-[0.22em] uppercase">
            Scoring
          </span>
          <div className="bg-border/40 h-px flex-1" />
        </div>

        {/* Score formula */}
        <div className="border-border/60 bg-surface/60 mb-8 rounded-xl border p-7 backdrop-blur-sm">
          <div className="text-accent mb-4 font-mono text-[0.7rem] font-semibold tracking-[0.22em] uppercase">
            scoring
          </div>
          <pre className="text-primary m-0 overflow-auto font-mono text-[0.85rem] leading-[1.85]">
            <span className="text-secondary">{'// Correctness gate'}</span>
            {'\n'}
            <span className="text-secondary">if</span>
            {' token_match_rate < '}
            <span className="text-accent">0.99</span>
            {'\n    score = '}
            <span className="text-secondary">0.0</span>
            {'\n'}
            <span className="text-secondary">else</span>
            {'\n    ttft_imp = '}
            <span className="text-accent">max</span>
            {'(0, (baseline - miner) / baseline)'}
            {'\n    tps_imp  = '}
            <span className="text-accent">max</span>
            {'(0, (miner - baseline) / baseline)'}
            {'\n    score    = '}
            <span className="text-accent">0.5</span>
            {' x ttft_imp + '}
            <span className="text-accent">0.5</span>
            {' x tps_imp'}
          </pre>
        </div>

        {/* Metric cards */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className={`hover:border-border hover:bg-surface/80 rounded-xl border p-6 backdrop-blur-sm transition-colors ${
                m.highlight ? 'border-accent/50 bg-accent/5' : 'border-border/60 bg-surface/60'
              }`}
            >
              <div className="text-primary mb-2 font-mono text-3xl leading-none font-bold">
                {m.value}
              </div>
              <div className="text-accent mb-2 font-mono text-[0.72rem] font-semibold tracking-[0.18em] uppercase">
                {m.label}
              </div>
              <p className="text-secondary font-sans text-[0.9rem] leading-[1.55]">{m.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-secondary border-border/40 mt-2 border-t pt-6 text-center font-sans text-[0.93rem] leading-[1.65]">
          Speed is measured in a streaming pass without logprobs. Correctness is measured separately
          with logprobs enabled. Both relative to the same vLLM baseline on the same hardware.
        </p>
      </div>
    </section>
  )
}
