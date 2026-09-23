const EXACT_REDIRECTS = new Map([
  ['concepts/why-it-matters', 'get-started/concepts'],
  ['concepts/competition-model', 'architecture/product-model'],
  ['concepts/submission-model', 'architecture/product-model'],
  ['vision', 'get-started/concepts'],
  ['roadmap', 'reference/state-of-record'],
  ['decisions', 'architecture/product-model'],
])

export const sourceDocsRedirects = Object.freeze(
  Object.fromEntries([...EXACT_REDIRECTS].filter(([source]) => /^[A-Z][A-Z0-9_]*$/.test(source))),
)

export function legacyDocsRedirect(slugs) {
  const currentPath = slugs.join('/')
  const exact = EXACT_REDIRECTS.get(currentPath)
  if (exact) return exact.split('/')

  if (slugs[0] === 'miners') {
    return slugs.length === 1 ? ['miner-guide', 'overview'] : ['miner-guide', ...slugs.slice(1)]
  }
  if (currentPath === 'validators/minimax-m3-case-study') {
    return ['results', 'minimax-m3']
  }
  if (slugs[0] === 'validators') {
    return slugs.length === 1
      ? ['validator-guide', 'overview']
      : ['validator-guide', ...slugs.slice(1)]
  }
  return null
}
