import Nav from '~/components/Nav'
import Footer from '~/components/Footer'
import Benchmarks from '~/components/Benchmarks'
import { COMMUNITY_DISCORD_URL } from '~/constants/links'
import { modelBenchmarks } from '~/constants/benchmarks'
import type { Route } from './+types/home'
import { data } from 'react-router'
import { readPricing } from '~/lib/pricing.server'
import { getComparison } from '~/lib/openrouter.server'

// React Router runs this on the Worker; only public prices and metrics reach the client.
// eslint-disable-next-line react-refresh/only-export-components
export async function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env
  const pricing = readPricing(
    env.CACHEON_PRICING,
    modelBenchmarks.map((model) => model.id),
  )
  const cache = await caches.open('openrouter-comparisons')
  const comparisons = Object.fromEntries(
    await Promise.all(
      modelBenchmarks.map(async (model) => [
        model.id,
        await getComparison(model.openRouterModel, {
          cache,
          waitUntil: (task) => context.cloudflare.ctx.waitUntil(task),
          apiKey: env.OPENROUTER_API_KEY,
        }),
      ]),
    ),
  )
  return data({ pricing, comparisons }, { headers: { 'Cache-Control': 'no-store' } })
}

// Apply loader headers to the HTML document as well as client navigation data.
// eslint-disable-next-line react-refresh/only-export-components
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

// React Router requires metadata exports in route modules.
// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  const title = 'Cacheon — Open models. Faster inference.'
  const description =
    'Inference acceleration for open models. Explore Cacheon throughput and time-to-first-token results alongside leading OpenRouter providers, and discuss access for your workload.'
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://cacheon.ai' },
  ]
}

const primaryLink =
  'inline-flex items-center justify-center gap-8 bg-accent px-6 py-3.5 text-sm font-semibold text-bg no-underline hover:bg-teal-200 hover:text-bg hover:no-underline'

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Nav />
      <main>
        <section
          id="product"
          className="mx-auto max-w-6xl px-6 pt-36 pb-16 sm:px-8 sm:pt-44 sm:pb-24"
        >
          <p className="text-accent mb-8 flex items-center gap-3 font-mono text-xs tracking-widest uppercase">
            <span className="bg-accent h-1.5 w-1.5" /> Inference, accelerated
          </p>
          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <h1 className="text-[clamp(3.5rem,7.5vw,6rem)] leading-[1.02] font-medium tracking-[-0.055em]">
              Open models.
              <br />
              <span className="text-accent">Faster inference.</span>
            </h1>
            <div className="pb-2">
              <p className="text-secondary mb-7 max-w-md text-lg leading-relaxed">
                Your application runs on tokens. We make them move faster. Cacheon optimizes
                inference for the open models behind agents, coding tools, and interactive AI.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <a href="#access" className={primaryLink}>
                  Discuss access <span aria-hidden="true">↗</span>
                </a>
                <a href="#benchmarks" className="text-sm">
                  Explore benchmarks ↓
                </a>
              </div>
            </div>
          </div>
          <div className="border-border mt-16 grid border-y sm:mt-20 sm:grid-cols-3">
            {modelBenchmarks.map((model, index) => (
              <div
                key={model.id}
                className={`py-7 ${index > 0 ? 'border-border border-t sm:border-t-0 sm:border-l sm:pl-8' : 'sm:pr-8'}`}
              >
                <p className="text-secondary mb-3 text-sm">{model.name}</p>
                <p className="font-mono text-4xl tracking-tight tabular-nums">
                  {model.cacheon.throughput.toFixed(1)}{' '}
                  <span className="text-secondary text-sm">tok/s/user</span>
                </p>
                <p className="text-secondary mt-3 text-xs">
                  {model.id === 'qwen'
                    ? 'Tuned checkpoint · measured median'
                    : 'Internally reported · protocol pending'}
                </p>
              </div>
            ))}
          </div>
          <p className="text-secondary mt-4 text-xs">
            Internal performance results. Conditions vary by model.{' '}
            <a href="#benchmarks" className="underline underline-offset-4">
              See measurement details.
            </a>
          </p>
        </section>

        <Benchmarks pricing={loaderData.pricing} comparisons={loaderData.comparisons} />

        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <p className="text-accent mb-5 font-mono text-xs tracking-widest uppercase">
            02 / Built for the waiting time
          </p>
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <h2 className="text-3xl leading-tight font-medium tracking-tight sm:text-5xl">
                Every turn adds up.
              </h2>
              <p className="text-secondary mt-6 max-w-md leading-relaxed">
                A coding agent can make dozens of model calls before it finishes a task. Both the
                wait for the first token and the speed of the remaining response matter.
              </p>
              <a
                href="/docs/get-started/concepts"
                className="text-accent mt-6 inline-block text-sm"
              >
                Explore Cacheon Engine ↗
              </a>
            </div>
            <div className="space-y-7">
              {[
                [
                  '01',
                  'Start responding sooner',
                  'Time to first token measures how long a user or agent waits before generation begins.',
                ],
                [
                  '02',
                  'Finish the response faster',
                  'Output tokens per second measures how quickly reasoning, code, and answers are generated after the first token.',
                ],
                [
                  '03',
                  'Measure your actual workload',
                  'Prompt length, concurrent requests, reasoning settings, and cache hits all affect performance. Evaluate the traffic you plan to send.',
                ],
              ].map(([number, title, body]) => (
                <div key={number} className="border-border flex gap-6 border-b pb-7">
                  <span className="text-accent pt-1 font-mono text-xs">{number}</span>
                  <div>
                    <h3 className="mb-2 text-lg font-medium">{title}</h3>
                    <p className="text-secondary text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="access" className="border-border bg-surface border-y">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 sm:py-20 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-accent mb-5 font-mono text-xs tracking-widest uppercase">
                03 / Get started
              </p>
              <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
                Bring your workload.
              </h2>
              <p className="text-secondary mt-5 max-w-lg">
                Tell us which model you use, your typical context length, and your expected
                concurrency. Talk with the team about model availability, API access, and pricing.
              </p>
            </div>
            <div className="md:justify-self-end">
              <a
                className={primaryLink}
                href={COMMUNITY_DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk to the team <span aria-hidden="true">↗</span>
              </a>
              <p className="text-secondary mt-3 text-xs">Connect with Cacheon on Discord.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col justify-between gap-5 px-6 py-12 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-lg font-medium">Help build the next improvement.</h2>
            <p className="text-secondary max-w-xl text-sm">
              The Cacheon subnet rewards contributors who make inference faster. Explore the
              competition, miner guides, and validator tools.
            </p>
          </div>
          <a href="/subnet" className="text-accent shrink-0 text-sm">
            Explore the subnet →
          </a>
        </section>
      </main>
      <Footer />
    </>
  )
}
