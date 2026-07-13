export default function Footer() {
  const links = [    
    { label: 'GitHub', href: 'https://github.com/latent-to/optima' },
    { label: 'Discord', href: 'https://discord.gg/bittensor' },
    { label: 'TAO.app', href: 'https://tao.app/subnets/14' },
    { label: 'Bittensor', href: 'https://bittensor.com' },
  ]

  return (
    <footer className="border-border/60 border-t px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <div className="text-base2 flex items-center gap-2 font-sans">
          <img src="/icon-192.png" alt="Cacheon" className="h-5 w-5" />
          <span className="text-sm2 text-secondary">· SN14 · MIT License</span>
        </div>

        <div className="tracking-caps flex flex-wrap justify-center gap-4 font-mono text-xs uppercase sm:gap-5">
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
