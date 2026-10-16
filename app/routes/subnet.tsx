import Nav from '~/components/Nav'
import Hero from '~/components/Hero'
import WhatIs from '~/components/WhatIs'
import HowItWorks from '~/components/HowItWorks'
import Roadmap from '~/components/Roadmap'
import Team from '~/components/Team'
import Community from '~/components/Community'
import Footer from '~/components/Footer'

// React Router requires metadata exports in route modules.
// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [
    { title: 'Cacheon Subnet: Inference Optimization Arena' },
    {
      name: 'description',
      content:
        'Compete to write the fastest GPU kernels for LLM inference. Fair benchmark, crowned wins, real reason to route traffic.',
    },
    { property: 'og:title', content: 'Cacheon Subnet: Inference Optimization Arena' },
    {
      property: 'og:description',
      content:
        'Compete to write the fastest GPU kernels for LLM inference. Fair benchmark, crowned wins, real reason to route traffic.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://cacheon.ai/subnet' },
  ]
}

export default function Subnet() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="border-border flex flex-wrap justify-center gap-6 border-y px-6 py-5 text-sm">
          <a href="https://dash.cacheon.ai/">Arena dashboard ↗</a>
          <a href="/docs/miner-guide/overview">Miner guide →</a>
          <a href="/docs/validator-guide/overview">Validator guide →</a>
          <a href="https://tao.app/subnets/14">SN14 on TAO.app ↗</a>
        </div>
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
