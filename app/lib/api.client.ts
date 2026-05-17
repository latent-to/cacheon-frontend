const API_BASE = '/proxy-api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function getText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.text()
}

// ── Response types ──────────────────────────────────────

export interface HealthResponse {
  status: string
}

export interface StatusResponse {
  king_uid: number | null
  king_score: number | null
  king_image: string | null
  n_evaluated: number
  n_active: number
  n_disqualified: number
  last_eval_ts: number | null
  last_eval_age_min: number | null
  last_scan_block: number | null
  last_weights_set_block: number | null
}

export interface KingRecord {
  uid: number
  hotkey: string
  commit_block: number
  image: string
  digest: string
  score: number
  ttft_improvement: number
  throughput_improvement: number
  token_match_rate: number
  evaluated_at: number
  evaluation_block: number
  crowned_at_block: number
}

export interface KingResponse {
  king: KingRecord | null
  message?: string
}

export interface KingHistoryEntry {
  ts: number
  block: number
  new_king_uid: number
  new_king_hotkey: string
  new_king_score: number
  new_king_image: string
  new_king_digest: string
  dethrone_threshold: number
  prev_king_uid?: number
  prev_king_hotkey?: string
  prev_king_score?: number
}

export interface KingHistoryResponse {
  history: KingHistoryEntry[]
  total: number
}

export interface EvaluationRecord {
  uid: number
  hotkey: string
  commit_block: number
  image: string
  digest: string
  score: number
  ttft_improvement: number
  throughput_improvement: number
  token_match_rate: number
  disqualified: boolean
  disqualify_reason: string | null
  evaluated_at: number
  evaluation_block: number
  per_prompt?: Array<{
    ttft_s: number
    throughput_tps: number
    output_tokens: number
    token_match_rate: number
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
  score: number | null
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
  status: 'pending' | 'pulling' | 'started' | 'evaluating' | 'scored' | 'dq' | 'skipped'
  score?: number
  dq_reason?: string
}

export interface EvalProgressStep {
  ts: number
  phase: string
  [key: string]: unknown
}

export interface EvalProgressResponse {
  status: 'idle' | 'running'
  phase?: string
  detail?: string
  round_block?: number
  current_idx?: number | null
  challengers?: EvalProgressChallenger[]
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

// ── Fetchers ────────────────────────────────────────────

export const fetchHealth = () => get<HealthResponse>('/api/health')
export const fetchStatus = () => get<StatusResponse>('/api/status')
export const fetchKing = () => get<KingResponse>('/api/king')
export const fetchKingHistory = () => get<KingHistoryResponse>('/api/king/history')
export const fetchEvaluations = (status?: 'active' | 'dq') =>
  get<EvaluationsResponse>(`/api/evaluations${status ? `?status=${status}` : ''}`)
export const fetchEvaluationsByUid = (uid: number) =>
  get<EvaluationsByUidResponse>(`/api/evaluations/${uid}`)
export const fetchRounds = () => get<RoundsResponse>('/api/rounds')
export const fetchEvalProgress = () => get<EvalProgressResponse>('/api/eval-progress')
export const fetchContainerLogs = () => get<ContainerLogsResponse>('/api/container-logs')
export const fetchContainerLog = (label: string) =>
  getText(`/api/container-log/${encodeURIComponent(label)}`)
