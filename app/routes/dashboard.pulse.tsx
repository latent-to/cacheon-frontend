import type { Route } from './+types/dashboard.pulse'
import { PulseSection } from '~/components/dashboard/pulse-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Pulse · Dashboard · Cacheon' }]
}

export default function DashboardPulseRoute() {
  return <PulseSection />
}
