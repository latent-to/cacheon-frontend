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
        className={`mb-5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent ${
          center ? "inline-block" : ""
        }`}
      >
        {eyebrow}
      </div>
      <h2 className="font-mono text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold leading-[1.15] tracking-tight text-primary">
        {title}
      </h2>
    </div>
  );
}
