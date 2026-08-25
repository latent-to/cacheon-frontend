import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  collectNavigationPages,
  convertMarkdownToMdx,
  createRemoteSource,
  generateSitemap,
  importCacheonDocs,
  navigationMetadata,
  parseMkDocsConfiguration,
  parseTypedDocsRedirect,
} from './cacheon-docs.mjs'

const REVISION = '0123456789abcdef0123456789abcdef01234567'

test('parses public Markdown leaves and ignores external navigation targets', () => {
  const configuration = parseMkDocsConfiguration(`
site_name: Optima
nav:
  - Home: index.md
  - Miner guide:
      - Overview: miner-guide/overview.md
      - Source: https://github.com/latent-to/cacheon
`)
  assert.equal(configuration.siteName, 'Optima')
  assert.deepEqual(collectNavigationPages(configuration.navigation), [
    { label: 'Home', documentPath: 'index.md', group: null },
    {
      label: 'Overview',
      documentPath: 'miner-guide/overview.md',
      group: 'Miner guide',
    },
  ])
})

test('rejects navigation paths that can escape the canonical docs directory', () => {
  const configuration = parseMkDocsConfiguration(`
site_name: Optima
nav:
  - Secret: ../WORKLOG.md
`)
  assert.throws(
    () => collectNavigationPages(configuration.navigation),
    /unsafe or unsupported documentation path/,
  )
})

test('parses only typed root compatibility redirects', () => {
  assert.deepEqual(
    parseTypedDocsRedirect(
      'STATE_OF_RECORD.md',
      '<!-- docs-redirect: reference/state-of-record.md -->\n\n# Documentation moved\n',
    ),
    { source: 'STATE_OF_RECORD', target: 'reference/state-of-record' },
  )
  assert.throws(
    () => parseTypedDocsRedirect('STATE_OF_RECORD.md', '# Documentation moved\n'),
    /first-line docs-redirect marker/,
  )
  assert.throws(
    () =>
      parseTypedDocsRedirect(
        'legacy/STATE.md',
        '<!-- docs-redirect: reference/state-of-record.md -->\n',
      ),
    /must remain at the docs root/,
  )
})

test('converts MkDocs syntax while preserving Mermaid and provenance', () => {
  const result = convertMarkdownToMdx(
    `# A canonical page

This paragraph describes the canonical engineering contract in enough detail.

!!! warning "Pinned boundary"
    Read the [contract](../architecture/contract.md#authority).

[Primary action](next.md){ .md-button .md-button--primary }

\`\`\`cron
0 9 * * 1 run-check
\`\`\`

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`,
    {
      navTitle: 'Canonical page',
      documentPath: 'guide/page.md',
      repository: 'latent-to/cacheon',
      revision: REVISION,
      siteName: 'Optima',
    },
  )

  assert.match(result, /title: "Canonical page"/)
  assert.match(result, /displayTitle: "A canonical page"/)
  assert.match(result, /siteName: "Optima"/)
  assert.match(result, new RegExp(`sourceRevision: "${REVISION}"`))
  assert.match(result, /sourcePath: "docs\/guide\/page.md"/)
  assert.match(result, /> \*\*Warning — Pinned boundary\*\*/)
  assert.match(result, /\]\(\/docs\/architecture\/contract#authority\)/)
  assert.match(result, /\[Primary action\]\(\/docs\/guide\/next\)/)
  assert.doesNotMatch(result, /md-button/)
  assert.match(result, /```text\n0 9 \* \* 1 run-check\n```/)
  assert.match(result, /```mermaid\nflowchart LR\n  A --> B\n```/)
})

test('rejects raw HTML in titles and never sanitizes it into descriptions', () => {
  const options = {
    navTitle: 'Canonical page',
    documentPath: 'guide/page.md',
    repository: 'latent-to/cacheon',
    revision: REVISION,
    siteName: 'Optima',
  }
  const result = convertMarkdownToMdx(
    `# Safe title

Reviewed <scr<script>ipt>alert(1)</scr<script>ipt> artifacts must never become metadata.

The fallback description remains plain engineering prose with no raw HTML.
`,
    options,
  )
  const frontmatter = result.split('---')[1]
  assert.match(
    frontmatter,
    /description: "The fallback description remains plain engineering prose with no raw HTML\."/,
  )
  assert.doesNotMatch(frontmatter, /<|>|alert\(1\)|scr<script>/i)
  assert.throws(
    () => convertMarkdownToMdx('# <span>Unsafe title</span>\n\nSafe body text.', options),
    /level-one heading cannot contain raw HTML/,
  )
})

test('normalizes legacy and Cacheon MkDocs landing-page wrappers into standard MDX', () => {
  for (const brand of ['optima', 'cacheon']) {
    const result = convertMarkdownToMdx(
      `<div class="${brand}-hero" markdown>
<div class="${brand}-eyebrow">Engineering boundary</div>

# Canonical landing page

<div class="${brand}-actions" markdown>
[Build](miner-guide/overview.md){ .md-button }
</div>
</div>

<div class="${brand}-grid" markdown>
<a class="${brand}-card" href="engine/overview/">
<strong>Engine</strong>
<span>Reviewed release artifacts.</span>
</a>
</div>
`,
      {
        navTitle: 'Home',
        documentPath: 'index.md',
        repository: 'latent-to/cacheon',
        revision: REVISION,
        siteName: 'Cacheon',
      },
    )
    assert.match(result, /title: "Home"/)
    assert.match(result, /displayTitle: "Canonical landing page"/)
    assert.match(result, /description: "Reviewed release artifacts\."/)
    assert.match(result, /\*\*Engineering boundary\*\*/)
    assert.match(result, /- \[Build\]\(\/docs\/miner-guide\/overview\)/)
    assert.match(result, /\[\*\*Engine\*\*\]\(\/docs\/engine\/overview\)/)
    assert.match(result, /Reviewed release artifacts\./)
    assert.doesNotMatch(result, new RegExp(`${brand}-|<div|<a `))
  }
})

test('preserves the complete mkdocs.yml page order across physical directories', () => {
  const configuration = parseMkDocsConfiguration(`
site_name: Optima
nav:
  - Home: index.md
  - Start here:
      - Concepts: get-started/concepts.md
      - Current status: reference/state-of-record.md
  - Results and development:
      - Result: results/result.md
      - History: history/changelog.md
      - Environment: dev/environment.md
  - Source: https://github.com/latent-to/cacheon
`)
  const pages = collectNavigationPages(configuration.navigation)
  const metadata = navigationMetadata('Optima', configuration.navigation, pages)
  assert.deepEqual(metadata.get('meta.json'), {
    title: 'Optima Docs',
    pages: [
      './index',
      '---Start here---',
      './get-started/concepts',
      './reference/state-of-record',
      '---Results and development---',
      './results/result',
      './history/changelog',
      './dev/environment',
      'external:[Source](https://github.com/latent-to/cacheon)',
    ],
  })
  assert.equal(metadata.size, 1)
})

test('generates the public sitemap from the same ordered page inventory', () => {
  const sitemap = generateSitemap([
    { documentPath: 'index.md' },
    { documentPath: 'get-started/concepts.md' },
  ])
  assert.match(sitemap, /<loc>https:\/\/cacheon\.ai\/<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/cacheon\.ai\/docs<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/cacheon\.ai\/docs\/get-started\/concepts<\/loc>/)
  assert.doesNotMatch(sitemap, /lastmod/)
})

test('imports only navigation pages and writes ordered metadata plus a source manifest', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cacheon-docs-test-'))
  const outputDirectory = path.join(root, 'content', 'docs')
  const manifestPath = path.join(root, 'content', 'cacheon-docs-source.json')
  const documents = new Map([
    ['index.md', '# Welcome\n\nCanonical home documentation for the system.\n'],
    ['guide/start.md', '# Start\n\nCanonical start documentation for the system.\n'],
  ])
  const source = {
    kind: 'test',
    repository: 'latent-to/cacheon',
    revision: REVISION,
    readConfig: async () => `site_name: Optima
nav:
  - Home: index.md
  - Guide:
      - Start here: guide/start.md
  - Source: https://github.com/latent-to/cacheon
`,
    readDocument: async (documentPath) => {
      assert.ok(documents.has(documentPath), `unexpected import: ${documentPath}`)
      return documents.get(documentPath)
    },
  }

  const result = await importCacheonDocs({
    source,
    outputDirectory,
    manifestPath,
    enforceRedirectParity: false,
  })
  assert.equal(result.pageCount, 2)
  assert.deepEqual(JSON.parse(await readFile(path.join(outputDirectory, 'meta.json'))), {
    title: 'Optima Docs',
    pages: [
      './index',
      '---Guide---',
      './guide/start',
      'external:[Source](https://github.com/latent-to/cacheon)',
    ],
  })
  assert.deepEqual(JSON.parse(await readFile(manifestPath, 'utf8')).pages, [
    'index.md',
    'guide/start.md',
  ])
  await assert.rejects(readFile(path.join(outputDirectory, 'unlisted.mdx')), {
    code: 'ENOENT',
  })
})

function fakeJsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    json: async () => payload,
  }
}

function fakeArchiveResponse(buffer) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    arrayBuffer: async () =>
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  }
}

function fakeErrorResponse(status, { retryAfter } = {}) {
  return {
    ok: false,
    status,
    statusText: 'error',
    headers: { get: (name) => (name === 'retry-after' ? (retryAfter ?? null) : null) },
  }
}

async function buildFixtureArchive(rootDirName, files) {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), 'cacheon-docs-fixture-'))
  const repositoryDirectory = path.join(archiveRoot, rootDirName)
  for (const [relativePath, contents] of Object.entries(files)) {
    const destination = path.join(repositoryDirectory, relativePath)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, contents)
  }
  const archivePath = path.join(archiveRoot, 'archive.tar.gz')
  execFileSync('tar', ['-czf', archivePath, '-C', archiveRoot, rootDirName])
  const archiveBuffer = await readFile(archivePath)
  return { archiveRoot, archiveBuffer }
}

test('remote source downloads a single archive and reads mkdocs.yml/docs from the extracted tree', async () => {
  const { archiveRoot, archiveBuffer } = await buildFixtureArchive(
    `latent-to-cacheon-${REVISION.slice(0, 7)}`,
    {
      'mkdocs.yml': 'site_name: Optima\nnav:\n  - Home: index.md\n',
      'docs/index.md': '# Welcome\n\nCanonical home documentation for the system.\n',
    },
  )

  const calledUrls = []
  const fetchImpl = async (url) => {
    calledUrls.push(url)
    if (url.includes('/commits/')) return fakeJsonResponse({ sha: REVISION })
    if (url.includes('/tarball/')) return fakeArchiveResponse(archiveBuffer)
    throw new Error(`unexpected fetch: ${url}`)
  }

  const source = await createRemoteSource({
    repository: 'latent-to/cacheon',
    ref: 'main',
    fetchImpl,
  })

  assert.equal(calledUrls.length, 2)
  assert.equal(source.revision, REVISION)
  assert.match(await source.readConfig(), /site_name: Optima/)
  assert.match(await source.readDocument('index.md'), /# Welcome/)

  await source.dispose()
  await assert.rejects(source.readConfig(), { code: 'ENOENT' })

  await rm(archiveRoot, { recursive: true, force: true })
})

test('remote source retries a 429 ref-resolution response before succeeding', async () => {
  const { archiveRoot, archiveBuffer } = await buildFixtureArchive(
    `latent-to-cacheon-${REVISION.slice(0, 7)}`,
    {
      'mkdocs.yml': 'site_name: Optima\nnav:\n  - Home: index.md\n',
      'docs/index.md': '# Welcome\n\nCanonical home documentation for the system.\n',
    },
  )

  let commitsCallCount = 0
  const fetchImpl = async (url) => {
    if (url.includes('/commits/')) {
      commitsCallCount += 1
      return commitsCallCount === 1
        ? fakeErrorResponse(429, { retryAfter: '0' })
        : fakeJsonResponse({ sha: REVISION })
    }
    if (url.includes('/tarball/')) return fakeArchiveResponse(archiveBuffer)
    throw new Error(`unexpected fetch: ${url}`)
  }

  const source = await createRemoteSource({
    repository: 'latent-to/cacheon',
    ref: 'main',
    fetchImpl,
  })

  assert.equal(commitsCallCount, 2)
  assert.equal(source.revision, REVISION)
  await source.dispose()
  await rm(archiveRoot, { recursive: true, force: true })
})

test('remote source rejects a GitHub archive with no repository root directory', async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), 'cacheon-docs-fixture-'))
  const loosePath = path.join(archiveRoot, 'loose.txt')
  await writeFile(loosePath, 'not a repository archive\n')
  const archivePath = path.join(archiveRoot, 'archive.tar.gz')
  execFileSync('tar', ['-czf', archivePath, '-C', archiveRoot, 'loose.txt'])
  const archiveBuffer = await readFile(archivePath)

  const fetchImpl = async (url) => {
    if (url.includes('/commits/')) return fakeJsonResponse({ sha: REVISION })
    if (url.includes('/tarball/')) return fakeArchiveResponse(archiveBuffer)
    throw new Error(`unexpected fetch: ${url}`)
  }

  await assert.rejects(
    createRemoteSource({ repository: 'latent-to/cacheon', ref: 'main', fetchImpl }),
    /did not contain a repository directory/,
  )

  await rm(archiveRoot, { recursive: true, force: true })
})
