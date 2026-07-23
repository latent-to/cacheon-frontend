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
    { title: 'Cacheon: Inference Optimization Arena' },
    {
      name: 'description',
      content:
        'Compete to write the fastest GPU kernels for LLM inference. Fair benchmark, crowned wins, real reason to route traffic.',
    },
    { property: 'og:title', content: 'Cacheon: Inference Optimization Arena' },
    {
      property: 'og:description',
      content:
        'Compete to write the fastest GPU kernels for LLM inference. Fair benchmark, crowned wins, real reason to route traffic.',
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
