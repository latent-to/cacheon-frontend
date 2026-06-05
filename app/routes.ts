import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('dashboard', 'routes/dashboard.tsx', [
    index('routes/dashboard._index.tsx'),
    route('pulse', 'routes/dashboard.pulse.tsx'),
    route('leader', 'routes/dashboard.leader.tsx'),
    route('evaluations', 'routes/dashboard.evaluations.tsx'),
    route('rounds', 'routes/dashboard.rounds.tsx'),
    route('logs', 'routes/dashboard.logs.tsx'),
    route('validator-logs', 'routes/dashboard.validator-logs.tsx'),
  ]),
  route('llms.txt', 'routes/llms.ts'),
  route('llms-full.txt', 'routes/llms-full.ts'),
  route('docs/*', 'routes/docs.tsx'),
  route('api/search', 'routes/api.search.ts'),
] satisfies RouteConfig
