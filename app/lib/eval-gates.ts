/** Pass 1 aggregate token-match DQ threshold (matches validator default). */
export const PASS1_MATCH_DQ_THRESHOLD = 0.25

export type PassStatus = 'pass' | 'fail' | 'skipped' | 'na'

export interface EvalGateSummary {
  prefix: string | null
  /** Compact label for list rows, e.g. "P2 · correctness" */
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
      shortLabel: 'P1 · match',
      pass1: 'fail',
      pass2: 'skipped',
      isInfraFail: false,
    }
  }

  if (prefix === 'correctness_fail') {
    return {
      prefix,
      shortLabel: 'P2 · correctness',
      pass1: 'pass',
      pass2: 'fail',
      isInfraFail: false,
    }
  }

  if (prefix === 'scoring_infra_fail' || prefix === 'baseline_scoring_unavailable') {
    return {
      prefix,
      shortLabel: 'P2 · infra',
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
