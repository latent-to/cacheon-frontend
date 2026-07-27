const EXACT_REDIRECTS = new Map([
  ['DEV_ENVIRONMENT', 'dev/environment'],
  ['EMISSIONS_POLICY', 'reference/emissions-policy'],
  ['FIDELITY', 'validator-guide/fidelity'],
  ['GPU_SETUP', 'dev/gpu-setup'],
  ['HOW_OPTIMA_WORKS', 'architecture/overview'],
  ['INCENTIVES', 'miner-guide/incentives'],
  ['INCENTIVE_LOAD_VALIDATION', 'results/incentive-load-validation'],
  ['MINER_GUIDE', 'miner-guide/overview'],
  ['PRODUCT_CONTRACT', 'architecture/product-model'],
  ['REFEREE_HARDENING_AUDIT', 'history/changelog'],
  ['REFEREE_HARDENING_DONOR_MAP', 'history/changelog'],
  ['REFEREE_HARDENING_SPLIT_PLAN', 'history/changelog'],
  ['SGLANG_TRACKING', 'dev/sglang-tracking'],
  ['SLOT_CONTRACT', 'architecture/slot-contract'],
  ['STATE_OF_RECORD', 'reference/state-of-record'],
  ['SUBMISSION_MODEL', 'architecture/product-model'],
  ['SUBMISSION_MODEL_BUILD_SPEC', 'miner-guide/override-points'],
  ['SUBMISSION_TERMS', 'legal/submission-terms'],
  ['SUBNET_BLUEPRINT', 'validator-guide/chain-loop'],
  ['TESTNET', 'validator-guide/testnet'],
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
