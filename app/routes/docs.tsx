import type { Route } from './+types/docs'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import browserCollections from 'collections/browser'
import { source } from '~/lib/source.server'
import { baseOptions } from '~/lib/layout.shared'
import { getMDXComponents } from '~/components/mdx'

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: Mdx }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        {frontmatter.description ? (
          <DocsDescription>{frontmatter.description}</DocsDescription>
        ) : null}
        <DocsBody>
          <Mdx components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = (params['*'] ?? '').split('/').filter(Boolean)
  const page = source.getPage(slugs)
  if (!page) {
    throw new Response('Not Found', { status: 404 })
  }

  await clientLoader.preload(page.path)

  return {
    tree: await source.serializePageTree(source.getPageTree()),
    path: page.path,
    title: page.data.title,
    description: page.data.description,
  }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: 'Docs' }]
  return [
    { title: `${data.title} — Cacheon Docs` },
    ...(data.description ? [{ name: 'description', content: data.description }] : []),
  ]
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { tree } = useFumadocsLoader(loaderData)
  return (
    <DocsLayout {...baseOptions()} tree={tree}>
      {clientLoader.useContent(loaderData.path)}
    </DocsLayout>
  )
}
