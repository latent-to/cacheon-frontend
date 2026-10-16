import { useEffect, useRef, useState } from 'react'
import { data, useRevalidator } from 'react-router'
import Nav from '~/components/Nav'
import Footer from '~/components/Footer'
import CustomerHero from '~/components/customer/CustomerHero'
import PerformanceSection from '~/components/customer/PerformanceSection'
import {
  ContactSection,
  EngineSection,
  FaqSection,
  ImprovementLoopSection,
  OutcomesSection,
  PathsSection,
  WorkflowSection,
} from '~/components/customer/CustomerSections'
import {
  customerModels,
  providerSnapshots,
  type CustomerModelId,
} from '~/constants/customer-results'
import { getModelComparisons } from '~/lib/model-comparisons.server'
import { resolveMarket } from '~/lib/provider-market'
import { submitContact } from '~/lib/contact.server'
import type { Route } from './+types/home'

const REFRESH_MS = 5 * 60 * 1000

// React Router runs this on the Worker; only public provider metrics and prices reach the client.
// eslint-disable-next-line react-refresh/only-export-components
export async function loader({ context }: Route.LoaderArgs) {
  return data(
    { comparisons: await getModelComparisons(context) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
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

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  const title = 'Cacheon — Faster agents. More from every GPU.'
  const description =
    'Use Cacheon-hosted inference, or optimize the serving stack you already run. Faster open-model inference for agents and applications.'
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://cacheon.ai' },
  ]
}

/** Re-run the loader every five minutes while the tab is visible. */
function useVisibleRefresh() {
  const { revalidate } = useRevalidator()
  const lastRefresh = useRef(0)

  useEffect(() => {
    // The page's loader data is fresh as of mount.
    lastRefresh.current = Date.now()
    const refresh = () => {
      lastRefresh.current = Date.now()
      void revalidate()
    }
    const interval = setInterval(() => {
      if (!document.hidden) refresh()
    }, REFRESH_MS)
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastRefresh.current > REFRESH_MS) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [revalidate])
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const [modelId, setModelId] = useState<CustomerModelId>('deepseek')
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  useVisibleRefresh()

  const model = customerModels.find((item) => item.id === modelId)!
  const market = resolveMarket(loaderData.comparisons[modelId], providerSnapshots[modelId])

  return (
    <>
      <a
        href="#top"
        className="bg-accent text-bg fixed -top-20 left-4 z-[60] p-3 font-medium focus:top-3"
      >
        Skip to content
      </a>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 sm:px-8">
        <CustomerHero model={model} onModelChange={setModelId} />
        <PathsSection />
        <OutcomesSection />
        <EngineSection />
        <PerformanceSection
          model={model}
          market={market}
          onModelChange={setModelId}
          methodologyOpen={methodologyOpen}
          onMethodologyToggle={setMethodologyOpen}
          onShowCaseStudyDetails={() => {
            setModelId('deepseek')
            setMethodologyOpen(true)
          }}
        />
        <ImprovementLoopSection />
        <WorkflowSection />
        <FaqSection />
        <ContactSection initialResult={actionData} />
      </main>
      <Footer />
    </>
  )
}
