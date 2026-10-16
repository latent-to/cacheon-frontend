import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { cn } from '~/lib/cn'

const linkCls =
  'text-sm font-medium uppercase tracking-caps text-secondary no-underline transition-colors hover:text-primary'

const navLinks = [
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#benchmarks', label: 'Benchmarks' },
  { to: '/subnet', label: 'Subnet' },
  { to: '/docs', label: 'Docs' },
  { to: '/#contact-us', label: 'Contact us ↗' },
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
      return (
        <Link key={l.label} to={l.to} onClick={onClick} className={linkCls}>
          {l.label}
        </Link>
      )
    })

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-border bg-bg/85 border-b backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
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
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
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
        <div
          id="mobile-navigation"
          className="border-border bg-bg flex flex-col gap-3 border-b px-6 pt-2 pb-4 font-mono md:hidden"
        >
          {renderLinks(() => setMenuOpen(false))}
        </div>
      )}
    </nav>
  )
}
