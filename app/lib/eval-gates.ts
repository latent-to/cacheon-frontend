/** Speed pre-filter aggregate token-match DQ threshold (matches validator default). */
export const PASS1_MATCH_DQ_THRESHOLD = 0.1

export type PassStatus = 'pass' | 'fail' | 'skipped' | 'na'

export interface EvalGateSummary {
  prefix: string | null
  /** Compact label for list rows, e.g. "Correctness" */
  shortLabel: string | null
  pass1: PassStatus
  pass2: PassStatus
  isInfraFail: boolean
}

export function disqualifyPrefix(reason: string | null | undefined): string | null {
  if (!reason) return null
  const idx = reason.indexOf(':')
  if (idx === -1) return reason.trim().toLowerCase()
  return reason.slice(0, idx).trim().toLowerCase()
}

export function summarizeEvalGates(ev: {
  disqualified: boolean
  disqualify_reason: string | null
  token_match_rate: number
}): EvalGateSummary {
  const prefix = disqualifyPrefix(ev.disqualify_reason)
  const pass1MatchOk = ev.token_match_rate >= PASS1_MATCH_DQ_THRESHOLD

  if (prefix === 'duplicate_of_leader') {
    return {
      prefix,
      shortLabel: 'Skipped',
      pass1: 'na',
      pass2: 'na',
      isInfraFail: false,
    }
  }

  if (!ev.disqualified) {
    return {
      prefix: null,
      shortLabel: null,
      pass1: pass1MatchOk ? 'pass' : 'fail',
      pass2: pass1MatchOk ? 'pass' : 'skipped',
      isInfraFail: false,
    }
  }

  if (prefix === 'pass1_match_fail') {
    return {
      prefix,
      shortLabel: 'Match',
      pass1: 'fail',
      pass2: 'skipped',
      isInfraFail: false,
    }
  }

  if (prefix === 'correctness_fail') {
    return {
      prefix,
      shortLabel: 'Correctness',
      pass1: 'pass',
      pass2: 'fail',
      isInfraFail: false,
    }
  }

  if (prefix === 'scoring_infra_fail' || prefix === 'baseline_scoring_unavailable') {
    return {
      prefix,
      shortLabel: 'Scoring infra',
      pass1: 'pass',
      pass2: 'fail',
      isInfraFail: true,
    }
  }

  if (prefix === 'prompt_errors') {
    return {
      prefix,
      shortLabel: 'Prompt error',
      pass1: pass1MatchOk ? 'pass' : 'fail',
      pass2: pass1MatchOk ? 'fail' : 'skipped',
      isInfraFail: false,
    }
  }

  return {
    prefix,
    shortLabel: prefix ? prefix.replace(/_/g, ' ').slice(0, 20) : 'DQ',
    pass1: pass1MatchOk ? 'pass' : 'fail',
    pass2: pass1MatchOk ? 'fail' : 'skipped',
    isInfraFail: false,
  }
}

export function buildContainerLogLabel(
  uid: number,
  hotkey: string,
  evaluationBlock: number,
): string {
  return `uid${uid}_${hotkey.slice(0, 8)}_${evaluationBlock}`
}

export function findContainerLogLabel(
  labels: string[],
  uid: number,
  evaluationBlock: number,
): string | null {
  const uidStr = String(uid)
  const blockStr = String(evaluationBlock)
  return (
    labels.find((label) => {
      const m = /^uid(\d+)_/i.exec(label)
      if (!m || m[1] !== uidStr) return false
      const parts = label.split('_')
      return parts[parts.length - 1] === blockStr
    }) ?? null
  )
}

/** Parse `YYYYMMDD_HHMMSS` suffix from a log label into a sortable integer. */
function logTimestampSortKey(label: string, pattern: RegExp): number {
  const m = pattern.exec(label)
  if (!m) return -1
  return parseInt(m[1].replace('_', ''), 10)
}

function pickNewestLabel(labels: string[], pattern: RegExp): string | null {
  if (labels.length === 0) return null
  const sorted = [...labels].sort(
    (a, b) => logTimestampSortKey(b, pattern) - logTimestampSortKey(a, pattern),
  )
  return sorted[0] ?? null
}

/** Block from validator log label: cpu_{block}_{ts} or gpu_{block}_{ts}. */
export function blockFromValidatorLogLabel(label: string): number | null {
  const m = /^(cpu|gpu)_(\d+)_\d{8}_\d{6}$/.exec(label)
  return m ? parseInt(m[2], 10) : null
}

export function findValidatorLogForBlock(
  validatorLabels: string[],
  block: number,
  kind: 'cpu' | 'gpu',
): string | null {
  const prefix = `${kind}_${block}_`
  const matches = validatorLabels.filter((l) => l.startsWith(prefix))
  if (matches.length === 0) return null
  return pickNewestLabel(matches, new RegExp(`^${kind}_\\d+_(\\d{8}_\\d{6})$`))
}

/** Container log for generation baseline vLLM (`baseline_{block}_{cid}`). */
export function findBaselineGenerationLogLabel(
  containerLabels: string[],
  evaluationBlock: number,
): string | null {
  const prefix = `baseline_${evaluationBlock}_`
  const matches = containerLabels.filter(
    (l) => l.startsWith(prefix) && !l.startsWith('baseline_scoring_'),
  )
  if (matches.length === 0) return null
  return matches.sort((a, b) => b.localeCompare(a))[0] ?? null
}

/** Container log for teacher-forcing scoring vLLM (`baseline_scoring_{block}_{ts}`). */
export function findBaselineScoringLogLabel(
  containerLabels: string[],
  evaluationBlock: number,
): string | null {
  const blockPrefix = `baseline_scoring_${evaluationBlock}_`
  const blockSpecific = containerLabels.filter((l) => l.startsWith(blockPrefix))
  if (blockSpecific.length === 0) return null
  return pickNewestLabel(blockSpecific, /^baseline_scoring_\d+_(\d{8}_\d{6})$/)
}

export interface EvalRunLogLabels {
  baselineScoring: string | null
  baselineGeneration: string | null
  gpuEval: string | null
  cpuLog: string | null
}

/** Resolve log labels for an evaluation block (container + validator log lists). */
export function findEvalRunLogLabels(
  containerLabels: string[],
  validatorLabels: string[],
  evaluationBlock: number,
): EvalRunLogLabels {
  const baselineScoring = findBaselineScoringLogLabel(containerLabels, evaluationBlock)
  const baselineGeneration = findBaselineGenerationLogLabel(containerLabels, evaluationBlock)
  const gpuEval = findValidatorLogForBlock(validatorLabels, evaluationBlock, 'gpu')
  const cpuLog = findValidatorLogForBlock(validatorLabels, evaluationBlock, 'cpu')
  return { baselineScoring, baselineGeneration, gpuEval, cpuLog }
}

export function validatorLogHref(label: string | null): string {
  if (!label) return '/dashboard/validator-logs'
  return `/dashboard/validator-logs?label=${encodeURIComponent(label)}`
}

export function containerLogHref(label: string | null): string {
  if (!label) return '/dashboard/logs'
  return `/dashboard/logs?label=${encodeURIComponent(label)}`
}
