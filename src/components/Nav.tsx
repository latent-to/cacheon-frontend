import { useEffect, useState } from "react";

const LINKS: Array<{ label: string; href: string; active?: boolean }> = [
  { label: "Home", href: "#hero", active: true },
  { label: "About", href: "#about" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Team", href: "#team" },
];

function Icon({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} className="fill-current">
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}

export default function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark") || "dark"
    );
  });
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-border bg-bg/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <a
          href="#"
          className="flex items-center gap-0.5 text-2xl font-bold tracking-wide text-primary no-underline"
        >
          <span className="font-mono text-accent">C</span>acheon
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-8 font-mono md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={
                l.active
                  ? "text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline transition-colors"
                  : "text-[0.82rem] font-medium uppercase tracking-[0.14em] text-secondary no-underline transition-colors hover:text-primary"
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 rounded-md border border-border/80 bg-surface/60 px-3.5 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline transition-colors hover:border-border hover:bg-surface"
          >
            GitHub
          </a>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex cursor-pointer items-center justify-center rounded-md border border-border/80 bg-transparent p-2 text-secondary transition-colors hover:border-border hover:text-primary"
          >
            <Icon id={theme === "dark" ? "icon-sun" : "icon-moon"} size={20} />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
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
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={
                l.active
                  ? "text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline"
                  : "text-[0.82rem] font-medium uppercase tracking-[0.14em] text-secondary no-underline"
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com/latent-to/cacheon"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="w-fit rounded-md border border-border/80 bg-surface/60 px-3.5 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-primary no-underline transition-colors hover:bg-surface"
          >
            GitHub
          </a>
          <button
            onClick={toggleTheme}
            className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-transparent px-3 py-1.5 text-sm text-secondary"
          >
            <Icon id={theme === "dark" ? "icon-sun" : "icon-moon"} />
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      )}
    </nav>
  );
}
