import type { Route } from './+types/dashboard.evaluations'
import { EvaluationsSection } from '~/components/dashboard/evaluations-section'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Evaluations · Dashboard · Cacheon' }]
}

export default function DashboardEvaluationsRoute() {
  return <EvaluationsSection />
}
