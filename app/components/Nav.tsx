import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const navLinkClass =
  'text-[0.82rem] font-medium uppercase tracking-[0.14em] text-secondary no-underline transition-colors hover:text-primary'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

        {/* Desktop */}
        <div className="hidden items-center gap-8 font-mono md:flex">
          <Link to="/" className={navLinkClass}>
            Home
          </Link>
          <Link to="/docs" className={navLinkClass}>
            Docs
          </Link>
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border/80 bg-surface/60 text-primary hover:border-border hover:bg-surface ml-1 rounded-md border px-3.5 py-1.5 text-[0.78rem] font-semibold tracking-[0.14em] uppercase no-underline transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-border bg-bg flex flex-col gap-3 border-b px-6 pt-2 pb-4 font-mono md:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)} className={navLinkClass}>
            Home
          </Link>
          <Link to="/docs" onClick={() => setMenuOpen(false)} className={navLinkClass}>
            Docs
          </Link>
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="border-border/80 bg-surface/60 text-primary hover:bg-surface w-fit rounded-md border px-3.5 py-1.5 text-[0.78rem] font-semibold tracking-[0.14em] uppercase no-underline transition-colors"
          >
            GitHub
          </a>
        </div>
      )}
    </nav>
  )
}
