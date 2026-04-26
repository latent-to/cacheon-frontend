import type { Route } from './+types/home'
import Nav from '~/components/Nav'
import Hero from '~/components/Hero'
import WhatIs from '~/components/WhatIs'
import HowItWorks from '~/components/HowItWorks'
import Roadmap from '~/components/Roadmap'
import Team from '~/components/Team'
import Community from '~/components/Community'
import Footer from '~/components/Footer'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Cacheon: Inference Optimization (Bittensor SN14)' },
    {
      name: 'description',
      content:
        'Cacheon (Bittensor Subnet 14) optimizes inference-time KV-cache behavior. Miners compete to run models cheaper and faster while keeping output quality.',
    },
    { property: 'og:title', content: 'Cacheon: Inference Optimization' },
    {
      property: 'og:description',
      content:
        'KV-cache optimization on Bittensor. Miners compete on memory + latency under a quality floor.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://cacheon.ai' },
  ]
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <HowItWorks />
        <Roadmap />
        <Team />
        <Community />
      </main>
      <Footer />
    </>
  )
}
