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
    { title: 'Cacheon: Fastest Inference Arena (Bittensor SN14)' },
    {
      name: 'description',
      content:
        'Cacheon (Bittensor Subnet 14) is a live competition to build the fastest inference server for top open-source models. Submit a Docker container, beat vLLM, win emission.',
    },
    { property: 'og:title', content: 'Cacheon: Fastest Inference Arena' },
    {
      property: 'og:description',
      content:
        'Build the fastest inference server on Bittensor. Any language, any runtime. Beat vLLM or go home.',
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
