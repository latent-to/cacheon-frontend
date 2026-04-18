import type { ReactNode } from "react";

export default function SectionHeader({
  eyebrow,
  title,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  align?: "left" | "center";
}) {
  const center = align === "center";
  return (
    <div className={`mb-14 ${center ? "text-center" : ""}`}>
      <div
        className={`mb-5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent ${
          center ? "inline-block" : ""
        }`}
      >
        <span className="opacity-55">{"// "}</span>
        {eyebrow}
      </div>
      <h2 className="font-mono text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold leading-[1.15] tracking-tight text-primary">
        {title}
      </h2>
    </div>
  );
}
