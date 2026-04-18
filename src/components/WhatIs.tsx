import SectionHeader from "./SectionHeader";

export default function WhatIs() {
  return (
    <section id="about" className="relative border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader
          eyebrow="01 — Overview"
          title="What is Cacheon?"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            title="For everyone"
            items={[
              "Everyone runs the same pretrained model—no training or fine-tuning",
              "Participants submit code that uses less memory or runs attention faster",
              "Best score wins—king of the hill, winner takes all",
              "Quality is enforced: outputs must match the baseline",
            ]}
          />
          <Card
            title="For ML engineers"
            items={[
              <>
                Implement <code>KVCachePolicy</code> — <code>write()</code> stores
                K/V, <code>attend()</code> owns the full attention pass
              </>,
              <>
                King of the hill, winner-take-all: champion earns{" "}
                <code>27+ TAO</code>/day (≈ <code>7k USD</code>; prices fluctuate).
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
    <div className="rounded-xl border border-border/60 bg-surface/60 p-7 backdrop-blur-sm transition-colors hover:border-accent/30">
      <h3 className="mb-5 font-mono text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-accent">
        {title}
      </h3>
      <ul className="flex list-none flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="relative pl-5 font-mono text-[0.85rem] leading-[1.7] text-secondary"
          >
            <span className="absolute left-0 text-accent/70">›</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
