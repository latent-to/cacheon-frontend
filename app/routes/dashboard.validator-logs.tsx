import type { Route } from './+types/dashboard.validator-logs'
import { ValidatorLogsSection } from '~/components/dashboard/validator-logs-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Validator Logs · Dashboard · Cacheon' }]
}

export default function DashboardValidatorLogsRoute() {
  return <ValidatorLogsSection />
}
