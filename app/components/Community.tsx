import SectionHeader from './SectionHeader'
import { Button } from '~/components/ui/button'

function Icon({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} className="fill-current">
      <use href={`/icons.svg#${id}`} />
    </svg>
  )
}

export default function Community() {
  return (
    <section className="border-border/50 relative border-t">
      <div className="mx-auto max-w-3xl px-6 py-28 text-center max-sm:py-16">
        <SectionHeader align="center" eyebrow="Get involved" title="Join the community." />

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            as="a"
            href="https://discord.gg/bittensor"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon id="icon-discord" />
            Discord
          </Button>
          <Button
            as="a"
            variant="secondary"
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon id="icon-github" />
            GitHub
          </Button>
          <Button
            as="a"
            variant="secondary"
            href="https://tao.app/subnets/14"
            target="_blank"
            rel="noopener noreferrer"
          >
            TAO.app
          </Button>
        </div>
      </div>
    </section>
  )
}
