import { Outlet, NavLink } from 'react-router'
import type { Route } from './+types/dashboard'
import Nav from '~/components/Nav'
import Footer from '~/components/Footer'
import { DASHBOARD_TABS } from '~/components/dashboard/shared'
import { cn } from '~/lib/cn'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Dashboard · Cacheon' },
    {
      name: 'description',
      content: 'Live monitoring dashboard for the Cacheon inference arena.',
    },
  ]
}

export default function DashboardLayout() {
  const tabCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.12em] no-underline transition-colors',
      isActive
        ? 'bg-accent/12 text-accent'
        : 'text-secondary hover:bg-white/[0.03] hover:text-primary',
    )

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="mb-6">
          <h1 className="text-primary font-mono text-[clamp(1.1rem,2vw,1.4rem)] leading-[1.2] font-semibold tracking-tight">
            Mainnet Dashboard
          </h1>
        </div>

        <nav
          className="border-border/40 bg-bg/90 sticky top-[64px] z-40 -mx-6 mb-10 flex flex-wrap gap-2 border-b px-6 pb-2 backdrop-blur-lg"
          aria-label="Dashboard sections"
        >
          {DASHBOARD_TABS.map(({ slug, label }) => (
            <NavLink key={slug} to={slug} className={tabCls} prefetch="intent">
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
      <Footer />
    </>
  )
}
