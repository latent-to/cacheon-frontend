import { lazy, Suspense, useEffect, useState } from 'react'

const FaultyTerminal = lazy(() => import('./FaultyTerminal'))

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : null
}

const FEATURES = [
  {
    title: 'Inference arena',
    body: 'Build the fastest server for a top open-source model. The best server earns the most emission.',
  },
  {
    title: 'Any stack, any language',
    body: 'Submit a Docker container. Use any language, framework, custom CUDA, or your own crazy optimizations. Anything that makes inference faster.',
  },
  {
    title: 'vLLM is the line',
    body: 'Same model, same machine class, same prompts. Beat the winner to prove you are actually faster.',
  },
]

export default function Hero() {
  return (
    <section id="hero" className="relative flex min-h-screen flex-col overflow-hidden">
      {/* WebGL terminal background (client-only) */}
      <div className="absolute inset-0 z-0">
        <ClientOnly>
          <Suspense fallback={null}>
            <FaultyTerminal
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
          </Suspense>
        </ClientOnly>
      </div>

      {/* Readability scrim */}
      <div
        className="from-bg/90 via-bg/70 to-bg pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b"
        aria-hidden
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-0 text-center">
        {/* Pill */}
        <div className="border-accent/40 bg-accent-surface text-accent mb-8 inline-flex items-center rounded-full border px-3.5 py-1 font-mono text-[0.72rem] font-semibold tracking-[0.22em] uppercase">
          Launching on May 19, 2026
        </div>

        {/* Headline */}
        <h1 className="mb-6 max-w-[min(100%,48rem)] font-mono text-[clamp(1.75rem,4.6vw,3.15rem)] leading-[1.22] font-extrabold tracking-tight text-balance">
          <span className="text-accent [text-shadow:0_0_32px_rgba(45,212,191,0.18)]">
            Build the Fastest
          </span>
          <span className="text-secondary/45"> </span>
          <span className="text-primary">Inference Server</span>
        </h1>

        {/* Sub-copy */}
        <p className="text-secondary mb-10 max-w-xl font-sans text-base leading-[1.65] sm:text-lg sm:leading-[1.6]">
          Inference has been a limiting factor for serving LLMs at scale.{' '}
          <span className="text-primary font-medium">Cacheon</span> is a live competition to serve{' '}
          <code className="text-accent text-[0.88em]">Qwen2.5-72B</code> faster than anyone else.
          Submit a containerized server, beat vLLM, and earn{' '}
          <span className="group relative inline-block">
            <span className="border-primary/45 text-primary cursor-help border-b border-dotted font-medium whitespace-nowrap">
              up to 33 TAO
            </span>
            <span
              role="tooltip"
              className="border-border bg-surface/95 text-secondary pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border px-3 py-2 text-xs break-words opacity-0 shadow-md transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              Rewards are paid in SN14 tokens. Both the SN14/TAO price and the TAO/USD exchange
              rates fluctuate, so fiat values will vary over time.
            </span>
          </span>{' '}
          per day.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/docs"
            className="bg-btn-primary text-btn-primary-fg inline-flex items-center gap-2 rounded-md px-6 py-2.5 font-sans text-[0.92rem] font-semibold no-underline transition-opacity hover:opacity-85"
          >
            Read the docs <span aria-hidden>→</span>
          </a>
          <a
            href="https://discord.gg/bittensor"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border/80 bg-surface/60 text-primary hover:border-border hover:bg-surface inline-flex items-center gap-2 rounded-md border px-6 py-2.5 font-sans text-[0.92rem] font-medium no-underline backdrop-blur-sm transition-colors"
          >
            Join Discord
          </a>
        </div>
      </div>

      {/* Feature strip */}
      <div className="relative z-10 mt-auto px-4 pt-10 pb-12 sm:px-8 lg:px-10">
        <div className="border-border/40 mx-auto grid max-w-6xl grid-cols-1 gap-y-8 border-t pt-10 sm:grid-cols-3 sm:gap-x-12 sm:gap-y-8 lg:gap-x-16 xl:gap-x-20">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center sm:px-2 lg:px-4">
              <h2 className="text-primary mb-2 font-mono text-[0.8rem] font-semibold tracking-[0.16em] uppercase sm:text-[0.85rem]">
                {f.title}
              </h2>
              <p className="text-secondary font-sans text-[0.95rem] leading-[1.6] sm:text-base sm:leading-[1.55]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
