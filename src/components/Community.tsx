import SectionHeader from "./SectionHeader";

function Icon({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} className="fill-current">
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}

export default function Community() {
  return (
    <section className="relative border-t border-border/50">
      <div className="mx-auto max-w-3xl px-6 py-28 text-center max-sm:py-16">
        <SectionHeader
          align="center"
          eyebrow="Get involved"
          title="Join the community."
        />

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://discord.gg/bittensor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-btn-primary px-6 py-2.5 font-sans text-[0.92rem] font-semibold text-btn-primary-fg no-underline transition-opacity hover:opacity-85"
          >
            <Icon id="icon-discord" />
            Discord
          </a>
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-surface/60 px-6 py-2.5 font-sans text-[0.92rem] font-medium text-primary backdrop-blur-sm no-underline transition-colors hover:border-border hover:bg-surface"
          >
            <Icon id="icon-github" />
            GitHub
          </a>
          <a
            href="https://tao.app/subnets/14"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-surface/60 px-6 py-2.5 font-sans text-[0.92rem] font-medium text-primary backdrop-blur-sm no-underline transition-colors hover:border-border hover:bg-surface"
          >
            TAO.app
          </a>
        </div>
      </div>
    </section>
  );
}
