import type { Route } from './+types/docs'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
  DocsBody,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import { redirect } from 'react-router'
import browserCollections from 'collections/browser'
import { slugsToMarkdownPath } from '~/lib/markdown-path'
import { source } from '~/lib/source.server'
import { baseOptions } from '~/lib/layout.shared'
import { getMDXComponents } from '~/components/mdx'
import { legacyDocsRedirect } from '~/lib/docs-redirects.js'

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: Mdx },
    props?: { markdownUrl?: string; githubUrl?: string },
  ) {
    const { markdownUrl = '', githubUrl } = props ?? {}
    return (
      <DocsPage toc={toc}>
        <div className="flex flex-row items-center gap-2 border-b pt-2 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
        </div>
        <DocsTitle>{frontmatter.displayTitle ?? frontmatter.title}</DocsTitle>
        <DocsBody>
          <Mdx components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = (params['*'] ?? '').split('/').filter(Boolean)
  const legacyTarget = legacyDocsRedirect(slugs)
  if (legacyTarget) {
    throw redirect(`/docs/${legacyTarget.join('/')}`, 301)
  }
  const page = source.getPage(slugs)
  if (!page) {
    throw new Response('Not Found', { status: 404 })
  }

  await clientLoader.preload(page.path)

  const markdownUrl = slugsToMarkdownPath(slugs)
  const githubUrl = `https://github.com/${page.data.sourceRepository}/blob/${page.data.sourceRevision}/${page.data.sourcePath}`

  return {
    tree: await source.serializePageTree(source.getPageTree()),
    path: page.path,
    title: page.data.displayTitle ?? page.data.title,
    description: page.data.description,
    siteName: page.data.siteName,
    sourceRevision: page.data.sourceRevision,
    sourcePath: page.data.sourcePath,
    markdownUrl,
    githubUrl,
  }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: 'Docs' }]
  return [
    { title: `${data.title} — ${data.siteName} Docs` },
    ...(data.description ? [{ name: 'description', content: data.description }] : []),
    { name: 'cacheon-docs-revision', content: data.sourceRevision },
    { name: 'cacheon-docs-source-path', content: data.sourcePath },
  ]
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { tree } = useFumadocsLoader(loaderData)
  return (
    <DocsLayout {...baseOptions()} tree={tree}>
      {clientLoader.useContent(loaderData.path, {
        markdownUrl: loaderData.markdownUrl,
        githubUrl: loaderData.githubUrl,
      })}
    </DocsLayout>
  )
}
