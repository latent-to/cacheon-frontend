import { ROADMAP, type RoadmapPhase } from "../constants/roadmap";
import SectionHeader from "./SectionHeader";

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative border-t border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-28 max-sm:py-16">
        <SectionHeader
          eyebrow="04 — Roadmap"
          title="From KV cache to full inference."
        />

        <div className="relative pl-8">
          <div className="absolute top-2 bottom-2 left-[0.45rem] w-px bg-border/80" />

          {ROADMAP.map((phase, i) => (
            <PhaseCard
              key={phase.version}
              phase={phase}
              isLast={i === ROADMAP.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  phase,
  isLast,
}: {
  phase: RoadmapPhase;
  isLast: boolean;
}) {
  const isActive = phase.status === "active";
  const dimmed = phase.status === "future";

  return (
    <div
      className={`relative transition-opacity duration-200 ${isLast ? "" : "mb-8"}`}
      style={{ opacity: dimmed ? 0.65 : 1 }}
    >
      <div
        className={`absolute -left-7 top-[0.5rem] size-3 rounded-full ${
          isActive
            ? "border-2 border-accent bg-accent"
            : "border-2 border-border bg-bg"
        }`}
      />

      <div
        className={`rounded-xl border px-6 py-5 backdrop-blur-sm transition-colors ${
          isActive
            ? "border-accent/50 bg-accent/[0.04] shadow-[0_0_24px_rgba(45,212,191,0.05)]"
            : "border-border/60 bg-surface/60 hover:border-border hover:bg-surface/80"
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-accent">
            {phase.version}
          </span>
          <span className="font-sans text-[1rem] font-semibold text-primary">
            {phase.label}
          </span>
          {isActive && (
            <span className="rounded-full border border-accent/60 bg-accent/10 px-2.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-accent">
              Live
            </span>
          )}
        </div>

        <ul className="flex list-none flex-col gap-1.5">
          {phase.items.map((item, i) => (
            <li
              key={i}
              className="relative pl-4 font-sans text-[0.9rem] leading-[1.55] text-secondary"
            >
              <span className="absolute left-0 font-mono text-secondary/50">–</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
