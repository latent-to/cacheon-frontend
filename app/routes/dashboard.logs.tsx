import type { Route } from './+types/dashboard.logs'
import { LogsSection } from '~/components/dashboard/logs-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Logs · Dashboard · Cacheon' }]
}

export default function DashboardLogsRoute() {
  return <LogsSection />
}
