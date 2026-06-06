import type { Route } from './+types/docs'
import { Sparkles } from 'lucide-react'
import { AISearch, AISearchPanel, AISearchTrigger } from '~/components/ai/search'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import browserCollections from 'collections/browser'
import { slugsToMarkdownPath } from '~/lib/markdown-path'
import { source } from '~/lib/source.server'
import { baseOptions } from '~/lib/layout.shared'
import { getMDXComponents } from '~/components/mdx'

const DOCS_REPO = 'https://github.com/latent-to/cacheon-frontend/blob/main/content/docs'

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

  const markdownUrl = slugsToMarkdownPath(slugs)
  const githubUrl = `${DOCS_REPO}/${page.path}`

  return {
    tree: await source.serializePageTree(source.getPageTree()),
    path: page.path,
    title: page.data.title,
    description: page.data.description,
    markdownUrl,
    githubUrl,
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
    <AISearch>
      <AISearchPanel />
      <DocsLayout {...baseOptions()} tree={tree}>
        {clientLoader.useContent(loaderData.path, {
          markdownUrl: loaderData.markdownUrl,
          githubUrl: loaderData.githubUrl,
        })}
      </DocsLayout>
      <AISearchTrigger
        position="float"
        aria-label="Ask AI"
        className={buttonVariants({
          color: 'primary',
          className: 'gap-2 rounded-full px-4 py-2.5 shadow-lg',
        })}
      >
        <Sparkles className="size-4" />
        Ask AI
      </AISearchTrigger>
    </AISearch>
  )
}
