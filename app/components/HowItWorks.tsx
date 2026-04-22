import SectionHeader from "./SectionHeader";

const STEPS = [
  {
    num: "01",
    title: "Submit a policy",
    desc: (
      <>
        Write a <code>KVCachePolicy</code>: Python that controls how KV pairs
        are stored and how attention is computed. Commit it on-chain with a
        pointer to a public repo.
      </>
    ),
  },
  {
    num: "02",
    title: "Validator evaluates",
    desc: (
      <>
        Fetches your policy, runs static analysis and sandbox isolation, then
        executes it on the same prompts, model, and hardware as the baseline.
        Memory, latency, and output quality are measured.
      </>
    ),
  },
  {
    num: "03",
    title: "Best policy wins",
    desc: (
      <>
        Beat the king's score and pass the KL quality gate: you're the new king.
        All emission flows to the winner. No partial credit.
      </>
    ),
  },
];

type MetricRow = {
  value: string;
  label: string;
  desc: string;
  highlight?: boolean;
};

const METRICS: MetricRow[] = [
  {
    value: "60%",
    label: "Memory weight",
    desc: "Peak GPU memory reduction vs. baseline. The primary bottleneck at scale.",
  },
  {
    value: "40%",
    label: "Latency weight",
    desc: "Time-to-first-token and tokens/sec vs. baseline.",
  },
  {
    value: "0.1",
    label: "KL gate (nats)",
    desc: "Hard reject threshold. Exceed it and your score is zero.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader
          eyebrow="02 — How it works"
          title="Submit. Evaluate. Win."
        />

        {/* Steps */}
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <article
              key={s.num}
              className="rounded-xl border border-border/60 bg-surface/60 p-7 backdrop-blur-sm transition-colors hover:border-border hover:bg-surface/80"
            >
              <div className="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
                {s.num}
              </div>
              <h3 className="mb-3 font-sans text-[1rem] font-semibold text-primary">
                {s.title}
              </h3>
              <p className="font-sans text-[0.92rem] leading-[1.6] text-secondary">
                {s.desc}
              </p>
            </article>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-border/40" />
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-secondary">
            Scoring
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {/* Score formula */}
        <div className="mb-8 rounded-xl border border-border/60 bg-surface/60 p-7 backdrop-blur-sm">
          <div className="mb-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
            scoring.py
          </div>
          <pre className="m-0 overflow-auto font-mono text-[0.85rem] leading-[1.85] text-primary">
            <span className="text-secondary">
              {"// Quality gate — hard reject"}
            </span>
            {"\n"}
            <span className="text-secondary">if</span>
            {" kl_divergence > "}
            <span className="text-accent">0.1</span>
            {"  "}
            <span className="text-secondary">{"// nats"}</span>
            {"\n    score = "}
            <span className="text-secondary">0.0</span>
            {"\n"}
            <span className="text-secondary">else</span>
            {"\n    score = "}
            <span className="text-accent">0.6</span>
            {" × memory_reduction + "}
            <span className="text-accent">0.4</span>
            {" × latency_improvement"}
          </pre>
        </div>

        {/* Metric cards */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className={`rounded-xl border p-6 backdrop-blur-sm transition-colors hover:border-border hover:bg-surface/80 ${
                m.highlight
                  ? "border-accent/50 bg-accent/5"
                  : "border-border/60 bg-surface/60"
              }`}
            >
              <div className="mb-2 font-mono text-3xl font-bold leading-none text-primary">
                {m.value}
              </div>
              <div className="mb-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-accent">
                {m.label}
              </div>
              <p className="font-sans text-[0.9rem] leading-[1.55] text-secondary">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="max-w-xl font-sans text-[0.88rem] leading-[1.6] text-secondary">
          Memory via <code>torch.cuda.max_memory_allocated()</code> — not
          self-reported. Latency is wall-clock. Both relative to the same
          passthrough baseline on the same hardware.
        </p>
      </div>
    </section>
  );
}
