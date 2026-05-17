import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('dashboard', 'routes/dashboard.tsx', [
    index('routes/dashboard._index.tsx'),
    route('pulse', 'routes/dashboard.pulse.tsx'),
    route('king', 'routes/dashboard.king.tsx'),
    route('evaluations', 'routes/dashboard.evaluations.tsx'),
    route('rounds', 'routes/dashboard.rounds.tsx'),
    route('logs', 'routes/dashboard.logs.tsx'),
  ]),
  route('docs/*', 'routes/docs.tsx'),
  route('api/search', 'routes/api.search.ts'),
] satisfies RouteConfig
