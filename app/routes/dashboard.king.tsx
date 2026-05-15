import type { Route } from './+types/dashboard.king'
import { KingSection } from '~/components/dashboard/king-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'King · Dashboard · Cacheon' }]
}

export default function DashboardKingRoute() {
  return <KingSection />
}
