export default function Footer() {
  const links = [
    { label: "GitHub", href: "https://github.com/latent-to/cacheon" },
    {
      label: "Discord",
      href: "https://discord.com/channels/799672011265015819/1364251338707570698",
    },
    { label: "TAO.app", href: "https://tao.app/subnets/14" },
    { label: "Bittensor", href: "https://bittensor.com" },
  ];

  return (
    <footer className="border-t border-border/60 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-sans text-[0.88rem]">
          <span className="font-semibold text-primary">
            <span className="font-mono text-accent">C</span>acheon
          </span>
          <span className="text-[0.78rem] text-secondary">
            · SN14 · MIT License
          </span>
        </div>

        <div className="flex gap-5 font-mono text-[0.7rem] uppercase tracking-[0.18em]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary no-underline transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
