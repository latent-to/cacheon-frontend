import type { Route } from './+types/dashboard.leader'
import { LeaderSection } from '~/components/dashboard/leader-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Leader · Dashboard · Cacheon' }]
}

export default function DashboardLeaderRoute() {
  return <LeaderSection />
}
