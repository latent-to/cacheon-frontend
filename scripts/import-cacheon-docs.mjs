#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createLocalSource,
  createRemoteSource,
  defaults,
  importCacheonDocs,
} from './cacheon-docs.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(repositoryRoot, 'content', 'docs')
const manifestPath = path.join(repositoryRoot, 'content', 'cacheon-docs-source.json')
const sitemapPath = path.join(repositoryRoot, 'public', 'sitemap.xml')

async function main() {
  const source = process.env.CACHEON_DOCS_SOURCE_DIR
    ? await createLocalSource(process.env.CACHEON_DOCS_SOURCE_DIR, {
        allowDirty: process.env.CACHEON_DOCS_ALLOW_DIRTY === '1',
      })
    : await createRemoteSource({
        repository: process.env.CACHEON_DOCS_REPOSITORY ?? defaults.repository,
        ref: process.env.CACHEON_DOCS_REF ?? defaults.ref,
      })

  const result = await importCacheonDocs({
    source,
    outputDirectory,
    manifestPath,
    sitemapPath,
  })
  process.stdout.write(
    `Imported ${result.pageCount} ${result.siteName} documentation pages and verified ${result.redirectCount} compatibility redirects from ${result.repository}@${result.revision}.\n`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
