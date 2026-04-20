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
    body: "Compete to optimize how models store attention memory. King of the hill, winner-take-all.",
  },
  {
    title: "Open & auditable",
    body: "Commitments and scoring live on-chain so progress and rankings stay transparent to the community.",
  },
  {
    title: "From competition to product",
    body: "Turn winning policies into ready-to-deploy configs for vLLM, Hugging Face, and beyond.",
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
          scale={2.75}
          gridMul={[2, 1]}
          digitSize={1.25}
          timeScale={0.33}
          scanlineIntensity={0.2}
          glitchAmount={0.2}
          flickerAmount={0.4}
          noiseAmp={0.45}
          chromaticAberration={0}
          dither={0.25}
          curvature={0}
          tint="#ffffff"
          mouseReact
          mouseStrength={0.2}
          pageLoadAnimation
          brightness={0.6}
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
        <div className="mb-8 inline-flex items-center rounded-full border border-accent/40 bg-accent-surface px-3.5 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-accent">
          Bittensor subnet · SN14
        </div>

        {/* Headline — three beats, one size; accent bookends + primary center */}
        <h1 className="mb-6 max-w-[min(100%,48rem)] text-balance font-mono text-[clamp(1.75rem,4.6vw,3.15rem)] font-extrabold leading-[1.22] tracking-tight">
          <span
            className={
              isLight
                ? "text-accent"
                : "text-accent [text-shadow:0_0_32px_rgba(45,212,191,0.18)]"
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
                : "text-accent [text-shadow:0_0_24px_rgba(45,212,191,0.12)]"
            }
          >
            Same Quality
          </span>
        </h1>

        {/* Sub-copy */}
        <p className="mb-10 max-w-xl font-sans text-base leading-[1.65] text-secondary sm:text-lg sm:leading-[1.6]">
          KV cache has been the bottleneck for LLM inference at scale.{" "}
          <span className="text-primary font-medium">Cacheon</span> turns it
          into a live competition: submit a smarter memory policy, beat the
          reigning champion, and earn{" "}
          <span className="group relative inline-block">
            <span className="cursor-help whitespace-nowrap border-b border-dotted border-primary/45 text-primary font-medium">
              up to 28 TAO
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 break-words rounded-md border border-border bg-surface/95 px-3 py-2 text-xs text-secondary opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              Rewards are paid in SN14 tokens. Both the SN14/TAO price and the
              TAO/USD (and other fiat) exchange rates fluctuate, so fiat values
              will vary over time.
            </span>
          </span>{" "}
          per day.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-btn-primary px-6 py-2.5 font-sans text-[0.92rem] font-semibold text-btn-primary-fg no-underline transition-opacity hover:opacity-85"
          >
            Read the docs <span aria-hidden>→</span>
          </a>
          <a
            href="https://discord.gg/64BVP8Vu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-surface/60 px-6 py-2.5 font-sans text-[0.92rem] font-medium text-primary backdrop-blur-sm no-underline transition-colors hover:border-border hover:bg-surface"
          >
            Join Discord
          </a>
        </div>
      </div>

      {/* Feature strip — pinned to the bottom of the viewport */}
      <div className="relative z-10 mt-auto px-6 pb-12 pt-10 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-10 border-t border-border/40 pt-10 sm:grid-cols-3 sm:gap-x-12 sm:gap-y-8 lg:gap-x-16 xl:gap-x-20">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center sm:px-2 lg:px-4">
              <h2 className="mb-2 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-primary sm:text-[0.85rem]">
                {f.title}
              </h2>
              <p className="font-sans text-[0.95rem] leading-[1.6] text-secondary sm:text-base sm:leading-[1.55]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
