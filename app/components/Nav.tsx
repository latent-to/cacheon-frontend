import { useEffect, useState } from "react";
import { Link } from "react-router";

const navLinkClass =
  "text-[0.82rem] font-medium uppercase tracking-[0.14em] text-secondary no-underline transition-colors hover:text-primary";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-border bg-bg/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link
          to="/"
          className="flex items-center gap-0.5 text-2xl font-bold tracking-wide text-primary no-underline"
        >
          <span className="font-mono text-accent">C</span>acheon
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
            className="ml-1 rounded-md border border-border/80 bg-surface/60 px-3.5 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline transition-colors hover:border-border hover:bg-surface"
          >
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          className="flex cursor-pointer border-none bg-transparent p-1 text-primary md:hidden"
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
        <div className="flex flex-col gap-3 border-b border-border bg-bg px-6 pb-4 pt-2 font-mono md:hidden">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className={navLinkClass}
          >
            Home
          </Link>
          <Link
            to="/docs"
            onClick={() => setMenuOpen(false)}
            className={navLinkClass}
          >
            Docs
          </Link>
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="w-fit rounded-md border border-border/80 bg-surface/60 px-3.5 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline transition-colors hover:bg-surface"
          >
            GitHub
          </a>
        </div>
      )}
    </nav>
  );
}
