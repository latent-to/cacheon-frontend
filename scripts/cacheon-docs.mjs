import { execFileSync } from 'node:child_process'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { sourceDocsRedirects } from '../app/lib/docs-redirects.js'

const DEFAULT_REPOSITORY = 'latent-to/cacheon'
const DEFAULT_REF = 'main'
const DOCS_DIRECTORY = 'docs'
const SHA_PATTERN = /^[0-9a-f]{40}$/i

function unquote(value) {
  const trimmed = value.trim()
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function splitNavigationEntry(value, lineNumber) {
  let quote = null
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if ((character === '"' || character === "'") && value[index - 1] !== '\\') {
      quote = quote === character ? null : (quote ?? character)
    }
    if (character === ':' && quote === null) {
      const label = unquote(value.slice(0, index))
      const target = value.slice(index + 1).trim()
      if (!label) {
        throw new Error(`mkdocs.yml:${lineNumber}: navigation label is empty`)
      }
      return { label, target: target ? unquote(target) : null }
    }
  }
  throw new Error(`mkdocs.yml:${lineNumber}: expected "Label: target" navigation entry`)
}

export function parseMkDocsConfiguration(contents) {
  const lines = contents.replace(/\r\n?/g, '\n').split('\n')
  const siteNameLine = lines.find((line) => /^site_name:\s*/.test(line))
  if (!siteNameLine) {
    throw new Error('mkdocs.yml must declare site_name')
  }
  const siteName = unquote(siteNameLine.replace(/^site_name:\s*/, ''))
  if (!siteName) {
    throw new Error('mkdocs.yml site_name cannot be empty')
  }

  const navLineIndex = lines.findIndex((line) => /^nav:\s*(?:#.*)?$/.test(line))
  if (navLineIndex === -1) {
    throw new Error('mkdocs.yml must declare a block-style nav')
  }

  const roots = []
  const ancestors = []
  for (let index = navLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const indentation = line.length - line.trimStart().length
    if (indentation === 0) break
    if (line.slice(0, indentation).includes('\t')) {
      throw new Error(`mkdocs.yml:${index + 1}: tabs are not supported in nav indentation`)
    }

    const match = line.match(/^\s*-\s+(.+)$/)
    if (!match) {
      throw new Error(`mkdocs.yml:${index + 1}: unsupported navigation syntax`)
    }
    const { label, target } = splitNavigationEntry(match[1], index + 1)
    const node = target === null ? { label, children: [] } : { label, target }

    while (ancestors.length > 0 && ancestors.at(-1).indentation >= indentation) {
      ancestors.pop()
    }
    if (ancestors.length === 0) {
      roots.push(node)
    } else {
      ancestors.at(-1).node.children.push(node)
    }
    if ('children' in node) {
      ancestors.push({ indentation, node })
    }
  }
  if (roots.length === 0) {
    throw new Error('mkdocs.yml nav cannot be empty')
  }

  const notInNav = []
  const notInNavIndex = lines.findIndex((line) => /^not_in_nav:\s*\|\s*(?:#.*)?$/.test(line))
  if (notInNavIndex !== -1) {
    for (let index = notInNavIndex + 1; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line.trim() || line.trimStart().startsWith('#')) continue
      if (line.length === line.trimStart().length) break
      notInNav.push(line.trim())
    }
  }
  return { siteName, navigation: roots, notInNav }
}

function isExternalTarget(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target)
}

function validateDocumentPath(documentPath) {
  const normalized = documentPath.replaceAll('\\', '/')
  if (
    normalized !== documentPath ||
    path.posix.isAbsolute(normalized) ||
    normalized.split('/').includes('..') ||
    !normalized.endsWith('.md')
  ) {
    throw new Error(`unsafe or unsupported documentation path in nav: ${documentPath}`)
  }
  return normalized
}

export function collectNavigationPages(navigation) {
  const pages = []
  const seen = new Set()
  const visit = (nodes, group = null) => {
    for (const node of nodes) {
      if ('children' in node) {
        visit(node.children, node.label)
        continue
      }
      if (isExternalTarget(node.target)) continue
      const documentPath = validateDocumentPath(node.target)
      if (seen.has(documentPath)) {
        throw new Error(`duplicate documentation path in nav: ${documentPath}`)
      }
      seen.add(documentPath)
      pages.push({ label: node.label, documentPath, group })
    }
  }
  visit(navigation)
  if (pages.length === 0) {
    throw new Error('mkdocs.yml nav contains no Markdown pages')
  }
  return pages
}

export function parseTypedDocsRedirect(documentPath, contents) {
  const source = validateDocumentPath(documentPath)
  if (source.includes('/')) {
    throw new Error(`${source}: docs-redirect compatibility pages must remain at the docs root`)
  }
  const marker = contents
    .replace(/\r\n?/g, '\n')
    .match(/^<!-- docs-redirect:\s+([^\s]+\.md)\s+-->(?:\n|$)/)
  if (!marker) {
    throw new Error(`${source}: expected a first-line docs-redirect marker`)
  }
  const target = validateDocumentPath(marker[1])
  return {
    source: source.replace(/\.md$/i, ''),
    target: target.replace(/\.md$/i, ''),
  }
}

function assertRedirectParity(redirects) {
  const actual = Object.fromEntries(redirects.map(({ source, target }) => [source, target]))
  const expectedKeys = Object.keys(sourceDocsRedirects).sort()
  const actualKeys = Object.keys(actual).sort()
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    const missing = actualKeys.filter((key) => !(key in sourceDocsRedirects))
    const stale = expectedKeys.filter((key) => !(key in actual))
    throw new Error(
      `docs-redirect parity failed (unmapped source paths: ${missing.join(', ') || 'none'}; stale frontend paths: ${stale.join(', ') || 'none'})`,
    )
  }
  for (const key of actualKeys) {
    if (actual[key] !== sourceDocsRedirects[key]) {
      throw new Error(
        `docs-redirect parity failed for ${key}: Cacheon points to ${actual[key]}, frontend points to ${sourceDocsRedirects[key]}`,
      )
    }
  }
}

function stripMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function deriveDescription(contents) {
  const paragraphs = contents.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
  for (const paragraph of paragraphs) {
    const candidate = paragraph.trim()
    if (
      !candidate ||
      /^(?:#|```|~~~|!!!|>|[-*+] |\d+\. |\||<)/.test(candidate) ||
      /^\*\*[^*\n]+\*\*$/.test(candidate) ||
      candidate.includes('\n```') ||
      candidate.includes('<') ||
      candidate.includes('>')
    ) {
      continue
    }
    const description = stripMarkdown(candidate)
    if (description.length < 24) continue
    return description.length <= 220 ? description : `${description.slice(0, 217).trimEnd()}…`
  }
  return null
}

function resolveInternalDocsTarget(target, documentPath) {
  if (
    !target ||
    target.startsWith('#') ||
    target.startsWith('/') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  ) {
    return null
  }
  const hashIndex = target.indexOf('#')
  const pathname = hashIndex === -1 ? target : target.slice(0, hashIndex)
  const anchor = hashIndex === -1 ? '' : target.slice(hashIndex)
  if (!pathname.endsWith('.md') && !pathname.endsWith('/')) return null

  const routePath = pathname.replace(/\.md$/i, '').replace(/\/+$/, '')
  let resolved = path.posix.normalize(path.posix.join(path.posix.dirname(documentPath), routePath))
  if (resolved === '..' || resolved.startsWith('../') || path.posix.isAbsolute(resolved)) {
    throw new Error(`${documentPath}: internal documentation link escapes docs/: ${target}`)
  }
  resolved = resolved.replace(/(?:^|\/)index$/, '')
  return `/docs${resolved ? `/${resolved}` : ''}${anchor}`
}

function rewriteLine(line, documentPath) {
  return line
    .replace(/\]\(([^)\s]+)(\s+["'][^)]*["'])?\)/g, (match, target, title = '') => {
      const resolved = resolveInternalDocsTarget(target, documentPath)
      return resolved ? `](${resolved}${title})` : match
    })
    .replace(/href=(["'])([^"']+)\1/gi, (match, quote, target) => {
      const resolved = resolveInternalDocsTarget(target, documentPath)
      return resolved ? `href=${quote}${resolved}${quote}` : match
    })
    .replace(/\)\{(?:\s+(?:\.[\w-]+|#[\w-]+))+\s*\}/g, ')')
    .replace(/\smarkdown(?:=(?:"[^"]*"|'[^']*'))?(?=[\s>])/g, '')
    .replace(/(<[a-z][^>]*?)\sclass=(["'])/gi, '$1 className=$2')
}

function normalizeIndexMarkdown(markdown) {
  return markdown
    .replace(
      /^<div class="(?:optima|cacheon)-eyebrow">([^<]+)<\/div>$/gm,
      (_, label) => `**${label.trim()}**`,
    )
    .replace(
      /<div class="(?:optima|cacheon)-actions" markdown>\n([\s\S]*?)\n<\/div>/g,
      (_, actions) =>
        actions
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `- ${line.trim()}`)
          .join('\n'),
    )
    .replace(
      /<a class="(?:optima|cacheon)-card" href="([^"]+)">\n<strong>([^<]+)<\/strong>\n<span>([^<]+)<\/span>\n<\/a>/g,
      (_, href, title, description) => `[**${title.trim()}**](${href})\n\n${description.trim()}`,
    )
    .replace(/^<\/?div(?:\s+class="(?:optima|cacheon)-(?:hero|grid)"\s+markdown)?>\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
}

function normalizeFenceLanguage(line) {
  return line.replace(/^(\s*```|~~~)cron\s*$/, '$1text')
}

function convertAdmonitions(lines) {
  const output = []
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      output.push(line)
      continue
    }
    const match = !inFence && line.match(/^!!!\s+([\w-]+)(?:\s+"([^"]+)")?\s*$/)
    if (!match) {
      output.push(line)
      continue
    }

    const kind = match[1].replaceAll('-', ' ')
    const heading = match[2]
      ? `${kind[0].toUpperCase()}${kind.slice(1)} — ${match[2]}`
      : `${kind[0].toUpperCase()}${kind.slice(1)}`
    output.push(`> **${heading}**`)

    let cursor = index + 1
    const body = []
    while (cursor < lines.length) {
      const bodyLine = lines[cursor]
      if (bodyLine.startsWith('    ')) {
        body.push(bodyLine.slice(4))
        cursor += 1
        continue
      }
      if (!bodyLine.trim()) {
        body.push('')
        cursor += 1
        continue
      }
      break
    }
    while (body.at(-1) === '') body.pop()
    for (const bodyLine of body) {
      output.push(bodyLine ? `> ${bodyLine}` : '>')
    }
    index = cursor - 1
  }
  return output
}

export function convertMarkdownToMdx(
  markdown,
  { navTitle, documentPath, repository, revision, siteName },
) {
  const normalizedSource = markdown.replace(/\r\n?/g, '\n')
  const normalized =
    documentPath === 'index.md' ? normalizeIndexMarkdown(normalizedSource) : normalizedSource
  const lines = normalized.split('\n')
  const titleIndex = lines.findIndex((line) => /^#\s+\S/.test(line))
  if (titleIndex === -1) {
    throw new Error(`${documentPath}: expected a level-one heading`)
  }
  const sourceTitle = lines[titleIndex].replace(/^#\s+/, '')
  if (sourceTitle.includes('<') || sourceTitle.includes('>')) {
    throw new Error(`${documentPath}: level-one heading cannot contain raw HTML`)
  }
  const title = stripMarkdown(sourceTitle)
  if (!title) {
    throw new Error(`${documentPath}: level-one heading cannot be empty`)
  }
  lines.splice(titleIndex, 1)

  const description = deriveDescription(lines.join('\n'))
  const converted = convertAdmonitions(lines)
  let inFence = false
  const body = converted
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence
        return normalizeFenceLanguage(line)
      }
      return inFence ? line : rewriteLine(line, documentPath)
    })
    .join('\n')
    .replace(/^\n+/, '')

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(navTitle)}`,
    `displayTitle: ${JSON.stringify(title)}`,
    ...(description ? [`description: ${JSON.stringify(description)}`] : []),
    `siteName: ${JSON.stringify(siteName)}`,
    `sourceRepository: ${JSON.stringify(repository)}`,
    `sourceRevision: ${JSON.stringify(revision)}`,
    `sourcePath: ${JSON.stringify(`${DOCS_DIRECTORY}/${documentPath}`)}`,
    '---',
    '',
  ]
  return `${frontmatter.join('\n')}${body.trimEnd()}\n`
}

export function navigationMetadata(siteName, navigation, pages) {
  const rootPages = []
  const appendNodes = (nodes) => {
    for (const node of nodes) {
      if ('children' in node) {
        rootPages.push(`---${node.label}---`)
        appendNodes(node.children)
      } else if (isExternalTarget(node.target)) {
        rootPages.push(`external:[${node.label}](${node.target})`)
      } else {
        rootPages.push(`./${validateDocumentPath(node.target).replace(/\.md$/i, '')}`)
      }
    }
  }
  appendNodes(navigation)

  const orderedMetadataPages = rootPages
    .filter((entry) => entry.startsWith('./'))
    .map((entry) => `${entry.slice(2)}.md`)
  const orderedSourcePages = pages.map((page) => page.documentPath)
  if (JSON.stringify(orderedMetadataPages) !== JSON.stringify(orderedSourcePages)) {
    throw new Error('generated Fumadocs page order does not match mkdocs.yml nav')
  }

  const metadata = new Map()
  metadata.set('meta.json', { title: `${siteName} Docs`, pages: rootPages })
  return metadata
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function generateSitemap(pages, siteUrl = 'https://cacheon.ai') {
  const root = siteUrl.replace(/\/+$/, '')
  const locations = [
    `${root}/`,
    ...pages.map(({ documentPath }) => {
      const route = documentPath.replace(/\.md$/i, '').replace(/(?:^|\/)index$/, '')
      return `${root}/docs${route ? `/${route}` : ''}`
    }),
  ]
  if (new Set(locations).size !== locations.length) {
    throw new Error('generated sitemap contains duplicate URLs')
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations.flatMap((location) => [
      '  <url>',
      `    <loc>${escapeXml(location)}</loc>`,
      '  </url>',
    ]),
    '</urlset>',
    '',
  ].join('\n')
}

function git(repositoryRoot, args) {
  return execFileSync('git', ['-C', repositoryRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

export async function createLocalSource(sourceDirectory, { allowDirty = false } = {}) {
  const repositoryRoot = path.resolve(sourceDirectory)
  const docsRoot = path.join(repositoryRoot, DOCS_DIRECTORY)
  const revision = git(repositoryRoot, ['rev-parse', 'HEAD'])
  if (!SHA_PATTERN.test(revision)) {
    throw new Error(`unable to resolve an exact Cacheon revision from ${repositoryRoot}`)
  }
  const dirty = git(repositoryRoot, [
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    'mkdocs.yml',
    DOCS_DIRECTORY,
  ])
  if (dirty && !allowDirty) {
    throw new Error(
      'CACHEON_DOCS_SOURCE_DIR contains uncommitted documentation changes; commit them first or set CACHEON_DOCS_ALLOW_DIRTY=1 for a non-production preview',
    )
  }
  return {
    kind: dirty ? 'local-dirty' : 'local',
    repository: process.env.CACHEON_DOCS_REPOSITORY ?? DEFAULT_REPOSITORY,
    revision,
    readConfig: () => readFile(path.join(repositoryRoot, 'mkdocs.yml'), 'utf8'),
    readDocument: (documentPath) => readFile(path.join(docsRoot, documentPath), 'utf8'),
  }
}

async function fetchText(url, headers = {}) {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

export async function createRemoteSource({
  repository = DEFAULT_REPOSITORY,
  ref = DEFAULT_REF,
  token = process.env.GITHUB_TOKEN,
} = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error(`invalid CACHEON_DOCS_REPOSITORY: ${repository}`)
  }
  let revision = ref
  if (!SHA_PATTERN.test(revision)) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cacheon-docs-importer',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const response = await fetch(
      `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`,
      { headers },
    )
    if (!response.ok) {
      throw new Error(
        `failed to resolve ${repository}@${ref}: ${response.status} ${response.statusText}`,
      )
    }
    const payload = await response.json()
    revision = payload.sha
  }
  if (!SHA_PATTERN.test(revision)) {
    throw new Error(`GitHub returned an invalid revision for ${repository}@${ref}`)
  }

  const rawRoot = `https://raw.githubusercontent.com/${repository}/${revision}`
  return {
    kind: 'remote',
    repository,
    revision: revision.toLowerCase(),
    readConfig: () => fetchText(`${rawRoot}/mkdocs.yml`),
    readDocument: (documentPath) =>
      fetchText(`${rawRoot}/${DOCS_DIRECTORY}/${encodeURI(documentPath)}`),
  }
}

export async function importCacheonDocs({
  source,
  outputDirectory,
  manifestPath,
  sitemapPath,
  enforceRedirectParity = true,
}) {
  const configuration = parseMkDocsConfiguration(await source.readConfig())
  const pages = collectNavigationPages(configuration.navigation)
  const pagePaths = new Set(pages.map((page) => page.documentPath.replace(/\.md$/i, '')))
  const redirects = await Promise.all(
    configuration.notInNav.map(async (documentPath) =>
      parseTypedDocsRedirect(documentPath, await source.readDocument(documentPath)),
    ),
  )
  for (const redirect of redirects) {
    if (!pagePaths.has(redirect.target)) {
      throw new Error(
        `${redirect.source}.md redirects to ${redirect.target}.md, which is not a public nav page`,
      )
    }
  }
  if (enforceRedirectParity) assertRedirectParity(redirects)
  const documents = await Promise.all(
    pages.map(async (page) => ({
      ...page,
      markdown: await source.readDocument(page.documentPath),
    })),
  )

  const outputRoot = path.resolve(outputDirectory)
  const temporaryRoot = `${outputRoot}.tmp-${process.pid}`
  await rm(temporaryRoot, { recursive: true, force: true })
  await mkdir(temporaryRoot, { recursive: true })
  try {
    for (const document of documents) {
      const destination = path.join(temporaryRoot, document.documentPath.replace(/\.md$/i, '.mdx'))
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(
        destination,
        convertMarkdownToMdx(document.markdown, {
          navTitle: document.label,
          documentPath: document.documentPath,
          repository: source.repository,
          revision: source.revision,
          siteName: configuration.siteName,
        }),
      )
    }

    const metadata = navigationMetadata(configuration.siteName, configuration.navigation, pages)
    for (const [metadataPath, value] of metadata) {
      const destination = path.join(temporaryRoot, metadataPath)
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`)
    }

    await rm(outputRoot, { recursive: true, force: true })
    await rename(temporaryRoot, outputRoot)
    await mkdir(path.dirname(manifestPath), { recursive: true })
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          repository: source.repository,
          revision: source.revision,
          siteName: configuration.siteName,
          source: source.kind,
          pages: pages.map((page) => page.documentPath),
          redirects: Object.fromEntries(
            redirects.map(({ source: redirectSource, target }) => [redirectSource, target]),
          ),
        },
        null,
        2,
      )}\n`,
    )
    if (sitemapPath) {
      await mkdir(path.dirname(sitemapPath), { recursive: true })
      await writeFile(
        sitemapPath,
        generateSitemap(pages, process.env.CACHEON_SITE_URL ?? 'https://cacheon.ai'),
      )
    }
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true })
    throw error
  }

  return {
    pageCount: pages.length,
    repository: source.repository,
    revision: source.revision,
    siteName: configuration.siteName,
    redirectCount: redirects.length,
  }
}

export const defaults = {
  repository: DEFAULT_REPOSITORY,
  ref: DEFAULT_REF,
}
