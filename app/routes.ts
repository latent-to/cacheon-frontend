import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('llms.txt', 'routes/llms.ts'),
  route('llms-full.txt', 'routes/llms-full.ts'),
  route('docs-markdown', 'routes/docs-markdown.ts', { id: 'docs-markdown-index' }),
  route('docs-markdown/*', 'routes/docs-markdown.ts', { id: 'docs-markdown-page' }),
  route('docs/*', 'routes/docs.tsx'),
  route('api/search', 'routes/api.search.ts'),
] satisfies RouteConfig
