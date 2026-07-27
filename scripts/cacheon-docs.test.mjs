import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  collectNavigationPages,
  convertMarkdownToMdx,
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

test('normalizes the MkDocs landing-page wrappers into standard MDX', () => {
  const result = convertMarkdownToMdx(
    `<div class="optima-hero" markdown>
<div class="optima-eyebrow">Engineering boundary</div>

# Canonical landing page

<div class="optima-actions" markdown>
[Build](miner-guide/overview.md){ .md-button }
</div>
</div>

<div class="optima-grid" markdown>
<a class="optima-card" href="engine/overview/">
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
      siteName: 'Optima',
    },
  )
  assert.match(result, /title: "Home"/)
  assert.match(result, /displayTitle: "Canonical landing page"/)
  assert.match(result, /description: "Reviewed release artifacts\."/)
  assert.match(result, /\*\*Engineering boundary\*\*/)
  assert.match(result, /- \[Build\]\(\/docs\/miner-guide\/overview\)/)
  assert.match(result, /\[\*\*Engine\*\*\]\(\/docs\/engine\/overview\)/)
  assert.match(result, /Reviewed release artifacts\./)
  assert.doesNotMatch(result, /optima-|<div|<a /)
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
