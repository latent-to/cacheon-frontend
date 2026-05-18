import { Outlet, NavLink } from 'react-router'
import type { Route } from './+types/dashboard'
import Nav from '~/components/Nav'
import Footer from '~/components/Footer'
import { DASHBOARD_TABS } from '~/components/dashboard/shared'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Mainnet (Dry Run) Dashboard · Cacheon' },
    {
      name: 'description',
      content: 'Live monitoring dashboard for the Cacheon inference arena.',
    },
  ]
}

export default function DashboardLayout() {
  const tabCls = ({ isActive }: { isActive: boolean }) =>
    `cursor-pointer whitespace-nowrap border-b-2 bg-transparent px-1 pb-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-colors no-underline ${
      isActive
        ? 'border-accent text-accent'
        : 'border-transparent text-secondary hover:text-primary'
    }`

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-primary font-mono text-[clamp(1.6rem,3.4vw,2.2rem)] leading-[1.15] font-bold tracking-tight">
            Mainnet (Dry Run) Dashboard
          </h1>
        </div>

        <nav
          className="border-border/40 bg-bg/90 sticky top-[64px] z-40 -mx-6 mb-10 flex flex-wrap gap-6 border-b px-6 backdrop-blur-lg"
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
