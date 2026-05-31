const API_BASE = '/proxy-api'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
  get isRateLimit() {
    return this.status === 429
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function getText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`)
  return res.text()
}

// ── Response types ──────────────────────────────────────

export interface HealthResponse {
  status: string
}

export interface StatusResponse {
  leader_uid: number | null
  leader_score: number | null
  leader_image: string | null
  n_evaluated: number
  n_active: number
  n_disqualified: number
  last_eval_ts: number | null
  last_eval_age_min: number | null
  last_scan_block: number | null
  last_weights_set_block: number | null
}

export interface LeaderRecord {
  uid: number
  hotkey: string
  commit_block: number
  image: string
  digest: string
  score: number
  speed_improvement: number
  token_match_rate: number
  evaluated_at: number
  evaluation_block: number
  won_at_block: number
}

export interface LeaderResponse {
  leader: LeaderRecord | null
  runner_up: LeaderRecord | null
  message?: string
}

export interface LeaderHistoryEntry {
  ts: number
  block: number
  new_leader_uid: number
  new_leader_hotkey: string
  new_leader_score: number
  new_leader_image: string
  new_leader_digest: string
  overtake_threshold: number
  prev_leader_uid?: number
  prev_leader_hotkey?: string
  prev_leader_score?: number
}

export interface LeaderHistoryResponse {
  history: LeaderHistoryEntry[]
  total: number
}

export interface EvaluationRecord {
  uid: number
  hotkey: string
  commit_block: number
  image: string
  digest: string
  score: number
  speed_improvement: number
  token_match_rate: number
  disqualified: boolean
  disqualify_reason: string | null
  evaluated_at: number
  evaluation_block: number
  per_prompt?: Array<{
    ttft_s: number
    e2e_s: number
    output_tokens: number
    token_match_rate: number
    baseline_e2e_s?: number
  }>
}

export interface EvaluationsResponse {
  evaluations: EvaluationRecord[]
  total: number
}

export interface EvaluationsByUidResponse {
  uid: number
  evaluations: EvaluationRecord[]
  total: number
}

export interface RoundChallenger {
  uid: number
  hotkey: string
  image: string
  commit_block: number | null
  score: number | null
  speed_improvement: number | null
  token_match_rate: number | null
  disqualified: boolean
  disqualify_reason: string | null
}

export interface Round {
  evaluation_block: number
  evaluated_at: number | null
  n_challengers: number
  challengers: RoundChallenger[]
}

export interface RoundsResponse {
  rounds: Round[]
  total: number
}

export interface EvalProgressChallenger {
  idx: number
  uid: number
  hotkey: string
  image: string
  status:
    | 'pending'
    | 'pulling'
    | 'started'
    | 'evaluating'
    | 'awaiting_correctness'
    | 'scored'
    | 'dq'
    | 'skipped'
  score?: number
  dq_reason?: string
}

export interface EvalProgressStep {
  ts: number
  phase: string
  [key: string]: unknown
}

export interface EvalProgressIncumbent {
  uid: number
  hotkey: string
  image: string
  status?: EvalProgressChallenger['status']
  score?: number
  dq_reason?: string
}

export interface EvalProgressResponse {
  status: 'idle' | 'running' | 'complete'
  phase?: string
  detail?: string
  round_block?: number
  current_idx?: number | null
  challengers?: EvalProgressChallenger[]
  leader?: EvalProgressIncumbent | null
  runner_up?: EvalProgressIncumbent | null
  gpu?: {
    provider?: string
    pod_id?: string
    gpu_type?: string
    num_gpus?: number
    cost_per_hr?: number
  } | null
  steps?: EvalProgressStep[]
  started_at?: number
  updated_at?: number
  completed_at?: number
  possibly_stale?: boolean
}

export interface ContainerLogEntry {
  label: string
  filename: string
  size_bytes: number
}

export interface ContainerLogsResponse {
  logs: ContainerLogEntry[]
  total: number
}

export interface ValidatorLogEntry {
  label: string
  filename: string
  size_bytes: number
}

export interface ValidatorLogsResponse {
  logs: ValidatorLogEntry[]
  total: number
}

// ── Fetchers ────────────────────────────────────────────

export const fetchHealth = () => get<HealthResponse>('/api/health')
export const fetchStatus = () => get<StatusResponse>('/api/status')
export const fetchLeader = () => get<LeaderResponse>('/api/leader')
export const fetchLeaderHistory = () => get<LeaderHistoryResponse>('/api/leader/history')
export const fetchEvaluations = (status?: 'active' | 'dq') =>
  get<EvaluationsResponse>(`/api/evaluations${status ? `?status=${status}` : ''}`)
export const fetchEvaluationsByUid = (uid: number) =>
  get<EvaluationsByUidResponse>(`/api/evaluations/${uid}`)
export const fetchRounds = () => get<RoundsResponse>('/api/rounds')
export const fetchEvalProgress = () => get<EvalProgressResponse>('/api/eval-progress')
export const fetchContainerLogs = () => get<ContainerLogsResponse>('/api/container-logs')
export const fetchContainerLog = (label: string) =>
  getText(`/api/container-log/${encodeURIComponent(label)}`)
export const fetchValidatorLogs = () => get<ValidatorLogsResponse>('/api/validator-logs')
export const fetchValidatorLog = (label: string) =>
  getText(`/api/validator-log/${encodeURIComponent(label)}`)
