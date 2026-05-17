import type { Route } from './+types/dashboard.rounds'
import { RoundsSection } from '~/components/dashboard/rounds-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Rounds · Dashboard · Cacheon' }]
}

export default function DashboardRoundsRoute() {
  return <RoundsSection />
}
