import type { Route } from './+types/dashboard.winner'
import { WinnerSection } from '~/components/dashboard/winner-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Winner · Dashboard · Cacheon' }]
}

export default function DashboardWinnerRoute() {
  return <WinnerSection />
}
