import assert from 'node:assert/strict'
import test from 'node:test'
import { legacyDocsRedirect, sourceDocsRedirects } from '../app/lib/docs-redirects.js'

test('redirects legacy miner and validator trees to canonical paths', () => {
  assert.deepEqual(legacyDocsRedirect(['miners']), ['miner-guide', 'overview'])
  assert.deepEqual(legacyDocsRedirect(['miners', 'submitting']), ['miner-guide', 'submitting'])
  assert.deepEqual(legacyDocsRedirect(['validators', 'qualification']), [
    'validator-guide',
    'qualification',
  ])
  assert.deepEqual(legacyDocsRedirect(['validators']), ['validator-guide', 'overview'])
  assert.deepEqual(legacyDocsRedirect(['validators', 'minimax-m3-case-study']), [
    'results',
    'minimax-m3',
  ])
})

test('redirects retired frontend prose to its canonical engineering page', () => {
  assert.deepEqual(legacyDocsRedirect(['concepts', 'competition-model']), [
    'architecture',
    'product-model',
  ])
  assert.deepEqual(legacyDocsRedirect(['vision']), ['get-started', 'concepts'])
  assert.deepEqual(legacyDocsRedirect(['roadmap']), ['reference', 'state-of-record'])
  assert.deepEqual(legacyDocsRedirect(['concepts', 'submission-model']), [
    'architecture',
    'product-model',
  ])
  assert.deepEqual(legacyDocsRedirect(['decisions']), ['architecture', 'product-model'])
})

test('covers every typed Cacheon root compatibility path', () => {
  assert.equal(Object.keys(sourceDocsRedirects).length, 19)
  assert.deepEqual(legacyDocsRedirect(['HOW_CACHEON_WORKS']), ['architecture', 'overview'])
  assert.deepEqual(legacyDocsRedirect(['STATE_OF_RECORD']), ['reference', 'state-of-record'])
  assert.deepEqual(legacyDocsRedirect(['MINER_GUIDE']), ['miner-guide', 'overview'])
  for (const [source, target] of Object.entries(sourceDocsRedirects)) {
    assert.equal(legacyDocsRedirect([source]).join('/'), target)
  }
})

test('leaves canonical and unknown paths untouched', () => {
  assert.equal(legacyDocsRedirect(['miner-guide', 'submitting']), null)
  assert.equal(legacyDocsRedirect(['unknown']), null)
})
