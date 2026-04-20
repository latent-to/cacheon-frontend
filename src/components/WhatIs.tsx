import SectionHeader from "./SectionHeader";

export default function WhatIs() {
  return (
    <section id="about" className="relative border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader eyebrow="01 — Overview" title="What is Cacheon?" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            title="For everyone"
            items={[
              "LLM inference is slow and expensive. Memory has been the bottleneck",
              "Cacheon is a live benchmark where engineers compete to run the same AI faster and cheaper",
              "Results are on-chain and auditable. The best submission wins real rewards",
              "Winning policies ship to real infrastructure",
            ]}
          />
          <Card
            title="For ML engineers"
            items={[
              <>
                Implement <code>KVCachePolicy</code> — <code>write()</code>{" "}
                stores K/V, <code>attend()</code> owns the full attention pass
              </>,
              <>
                King of the hill, winner-take-all: champion earns{" "}
                <code>27+ TAO</code>/day (≈ <code>7k USD</code>; prices
                fluctuate).
              </>,
              <>
                Scoring:{" "}
                <code>0.6 × memory_reduction + 0.4 × latency_improvement</code>
              </>,
              <>
                Hard KL gate at <code>0.1 nats</code> — exceed it and score is 0
              </>,
              <>
                Model: <code>Qwen2.5-7B-Instruct</code> on H100 80 GB
              </>,
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Card({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/60 p-7 backdrop-blur-sm transition-colors hover:border-border hover:bg-surface/80">
      <h3 className="mb-5 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-accent">
        {title}
      </h3>
      <ul className="flex list-none flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="relative pl-5 font-sans text-[0.92rem] leading-[1.6] text-secondary"
          >
            <span className="absolute left-0 font-mono text-accent/70">›</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
