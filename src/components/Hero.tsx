import { useEffect, useState } from "react";
import FaultyTerminal from "./FaultyTerminal";

function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const next =
        (root.getAttribute("data-theme") as "light" | "dark") || "dark";
      setTheme(next);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

const FEATURES = [
  {
    title: "KV cache competition",
    body: "Contributors compete to improve how models store and reuse attention memory. King of the hill, winner-take-all.",
  },
  {
    title: "Open & auditable",
    body: "Commitments and scoring live on-chain so progress and rankings stay transparent to the community.",
  },
  {
    title: "From competition to product",
    body: "Turn winning policies into configs that can plug into your existing infra: vLLM, Hugging Face, TensorRT-LLM, & beyond.",
  },
];

export default function Hero() {
  const theme = useTheme();
  const isLight = theme === "light";

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col overflow-hidden"
    >
      {/* WebGL terminal background */}
      <div
        className={`absolute inset-0 z-0 ${
          isLight ? "opacity-[0.45] mix-blend-multiply" : ""
        }`}
      >
        <FaultyTerminal
          key={theme}
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0.5}
          curvature={0.025}
          tint={isLight ? "#0f766e" : "#9effe3"}
          mouseReact
          mouseStrength={0.3}
          pageLoadAnimation
          brightness={isLight ? 1 : 0.5}
          className="h-full w-full"
        />
      </div>

      {/* Readability scrim */}
      <div
        className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b ${
          isLight ? "from-bg/70 via-bg/50 to-bg" : "from-bg/90 via-bg/70 to-bg"
        }`}
        aria-hidden
      />

      {/* Hero content — vertically centered in viewport */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-0 text-center">
        {/* Pill */}
        <div className="mb-8 inline-flex items-center rounded-full border border-accent/45 bg-accent-surface px-4 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
          Bittensor subnet · SN14
        </div>

        {/* Headline — three beats, one size; accent bookends + primary center */}
        <h1 className="mb-6 max-w-[min(100%,48rem)] text-balance font-mono text-[clamp(1.75rem,4.6vw,3.15rem)] font-extrabold leading-[1.22] tracking-tight">
          <span
            className={
              isLight
                ? "text-accent"
                : "text-accent [text-shadow:0_0_36px_rgba(158,255,227,0.32)]"
            }
          >
            Faster Inference
          </span>
          <span className="text-secondary/45">, </span>
          <span className="text-primary">Better Performance</span>
          <span className="text-secondary/45">, </span>
          <span
            className={
              isLight
                ? "text-accent"
                : "text-accent [text-shadow:0_0_28px_rgba(158,255,227,0.22)]"
            }
          >
            Same Quality
          </span>
        </h1>

        {/* Sub-copy */}
        <p className="mb-10 max-w-md font-mono text-[0.88rem] leading-[1.75] text-secondary">
          KV cache has been the bottleneck for LLM inference at scale.{" "}
          <span className="text-accent">Cacheon</span> turns it into a live
          competition: submit a smarter memory policy, beat the reigning
          champion, and earn <span className="text-accent">&gt;7,000* USD</span>{" "}
          per day!
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-6 py-2.5 font-mono text-[0.88rem] font-semibold text-btn-primary-fg no-underline transition-opacity hover:opacity-85"
          >
            Read the docs <span aria-hidden>→</span>
          </a>
          <a
            href="https://discord.gg/bittensor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface/60 px-6 py-2.5 font-mono text-[0.88rem] font-medium text-primary backdrop-blur-sm no-underline transition-colors hover:border-accent/40"
          >
            Join Discord
          </a>
        </div>
      </div>

      {/* Feature strip — pinned to the bottom of the viewport */}
      <div className="relative z-10 mt-auto px-6 pb-12 pt-10">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 border-t border-border/40 pt-10 sm:grid-cols-3 sm:gap-10">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <h2 className="mb-2 font-mono text-[0.82rem] font-semibold uppercase tracking-wide text-primary">
                {f.title}
              </h2>
              <p className="font-mono text-[0.78rem] leading-[1.7] text-secondary">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
