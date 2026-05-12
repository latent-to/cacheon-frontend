import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const linkCls =
  'text-[0.82rem] font-medium uppercase tracking-[0.14em] text-secondary no-underline transition-colors hover:text-primary'

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 1200 1227" fill="currentColor">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z" />
  </svg>
)

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.71 105.71 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 0 1-10.87 5.19 77.3 77.3 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.45-12.68S53.99 46 53.9 53.05c-.09 6.95-5.11 12.64-11.45 12.64Zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68S96.23 46 96.14 53.05c-.09 6.95-5.11 12.64-11.45 12.64Z" />
  </svg>
)

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { href: 'https://discord.com/invite/bittensor', label: 'Discord', icon: <DiscordIcon /> },
  { href: 'https://x.com/cacheon_ai', label: 'X', icon: <XIcon /> },
  { href: 'https://github.com/latent-to/cacheon', label: 'GitHub' },
] as const

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const renderLinks = (onClick?: () => void) =>
    navLinks.map((l) => {
      const isExternal = 'href' in l
      const children = 'icon' in l && l.icon ? l.icon : l.label

      return isExternal ? (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={'icon' in l && l.icon ? l.label : undefined}
          onClick={onClick}
          className={linkCls}
        >
          {children}
        </a>
      ) : (
        <Link key={l.label} to={l.to} onClick={onClick} className={linkCls}>
          {children}
        </Link>
      )
    })

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'border-border bg-bg/85 border-b backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link
          to="/"
          className="text-primary flex items-center gap-2.5 text-xl font-semibold tracking-tight no-underline"
        >
          <img src="/icon-192.png" alt="" className="h-7 w-7" />
          <span>Cacheon</span>
        </Link>

        <div className="hidden items-center gap-8 font-mono md:flex">{renderLinks()}</div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          className="text-primary flex cursor-pointer border-none bg-transparent p-1 md:hidden"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-border bg-bg flex flex-col gap-3 border-b px-6 pt-2 pb-4 font-mono md:hidden">
          {renderLinks(() => setMenuOpen(false))}
        </div>
      )}
    </nav>
  )
}
