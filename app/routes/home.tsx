import Nav from '~/components/Nav'
import Footer from '~/components/Footer'
import Benchmarks from '~/components/Benchmarks'
import ContactForm from '~/components/ContactForm'
import { submitContact } from '~/lib/contact.server'
import { modelBenchmarks } from '~/constants/benchmarks'
import type { Route } from './+types/home'
import { data } from 'react-router'
import { getComparison } from '~/lib/openrouter.server'

// React Router runs this on the Worker; only public performance metrics reach the client.
// eslint-disable-next-line react-refresh/only-export-components
export async function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env
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
  return data({ comparisons }, { headers: { 'Cache-Control': 'no-store' } })
}

// React Router runs form submissions on the Worker.
// eslint-disable-next-line react-refresh/only-export-components
export async function action({ request, context }: Route.ActionArgs) {
  const result = await submitContact(request, context.cloudflare.env)
  return data(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } })
}

// Apply loader headers to the HTML document as well as client navigation data.
// eslint-disable-next-line react-refresh/only-export-components
export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

// React Router requires metadata exports in route modules.
// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  const title = 'Cacheon — Inference optimized for your workload.'
  const description =
    'We optimize inference for customers. Reduce latency, improve throughput, and get more from your infrastructure with optimization tailored to your models and workloads.'
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

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <>
      <Nav />
      <main>
        <section
          id="product"
          className="mx-auto max-w-6xl px-6 pt-36 pb-16 sm:px-8 sm:pt-44 sm:pb-24"
        >
          <p className="text-accent mb-8 flex items-center gap-3 font-mono text-xs tracking-widest uppercase">
            <span className="bg-accent h-1.5 w-1.5" /> Inference optimization for your business
          </p>
          <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <h1 className="text-[clamp(3.5rem,7.5vw,6rem)] leading-[1.02] font-medium tracking-[-0.055em]">
              Your inference.
              <br />
              <span className="text-accent">Optimized.</span>
            </h1>
            <div className="pb-2">
              <p className="text-secondary mb-7 max-w-md text-lg leading-relaxed">
                We optimize inference for customers. We work with your models, hardware, and
                workloads to reduce latency, increase throughput, and get more from your
                infrastructure.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <a href="#access" className={primaryLink}>
                  Contact us <span aria-hidden="true">↗</span>
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
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-secondary mb-2 text-xs">Output speed</dt>
                    <dd className="font-mono text-[clamp(1.5rem,3vw,2.25rem)] tracking-tight tabular-nums">
                      {model.cacheon.throughput.toFixed(1)}
                    </dd>
                    <dd className="text-secondary mt-1 text-xs">tok/s/user</dd>
                  </div>
                  <div>
                    <dt className="text-secondary mb-2 text-xs">TTFT</dt>
                    <dd className="font-mono tabular-nums">
                      {model.cacheon.ttft === null ? (
                        <span className="text-sm">Not published</span>
                      ) : (
                        <>
                          <span className="text-[clamp(1.5rem,3vw,2.25rem)] tracking-tight">
                            {model.cacheon.ttft.toFixed(3)}
                          </span>
                          <span className="text-secondary mt-1 block text-xs">seconds</span>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="text-secondary mt-3 text-xs">
                  {model.id === 'qwen' ? 'Tuned checkpoint · measured median' : 'AIPerf benchmark'}
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

        <Benchmarks comparisons={loaderData.comparisons} />

        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <p className="text-accent mb-5 font-mono text-xs tracking-widest uppercase">
            02 / Built around your workload
          </p>
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <h2 className="text-3xl leading-tight font-medium tracking-tight sm:text-5xl">
                Your workload.
                <br />
                Our focus.
              </h2>
              <p className="text-secondary mt-6 max-w-md leading-relaxed">
                Inference optimization starts with what your customers need. We help you identify
                bottlenecks, tune performance, and evaluate improvements against the traffic your
                application actually serves.
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
                  'Understand your requirements',
                  'Start with your models, hardware, context lengths, and concurrency. Define the latency, throughput, and cost targets that matter to your application.',
                ],
                [
                  '02',
                  'Optimize your inference',
                  'Focus on the bottlenecks in your inference stack to improve time to first token, token generation speed, and infrastructure efficiency.',
                ],
                [
                  '03',
                  'Validate the improvement',
                  'Compare before-and-after performance on representative workloads, with clear measurement conditions and tradeoffs.',
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
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 sm:py-20 md:grid-cols-2 md:items-start md:gap-16">
            <div>
              <p className="text-accent mb-5 font-mono text-xs tracking-widest uppercase">
                03 / Contact us
              </p>
              <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
                Bring your workload.
              </h2>
              <p className="text-secondary mt-5 max-w-lg">
                Tell us what you run and what you want to improve. We’ll discuss how Cacheon can
                optimize inference for your team and help plan the next steps.
              </p>
            </div>
            <ContactForm initialResult={actionData} />
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
