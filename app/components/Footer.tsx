export default function Footer() {
  const links = [
    { label: 'GitHub', href: 'https://github.com/latent-to/cacheon' },
    {
      label: 'Discord',
      href: 'https://discord.gg/bittensor',
    },
    { label: 'TAO.app', href: 'https://tao.app/subnets/14' },
    { label: 'Bittensor', href: 'https://bittensor.com' },
  ]

  return (
    <footer className="border-border/60 border-t px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-sans text-[0.88rem]">
          <img src="/icon-192.png" alt="Cacheon" className="h-5 w-5" />
          <span className="text-secondary text-[0.78rem]">· SN14 · MIT License</span>
        </div>

        <div className="flex gap-5 font-mono text-[0.7rem] tracking-[0.18em] uppercase">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary no-underline transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
