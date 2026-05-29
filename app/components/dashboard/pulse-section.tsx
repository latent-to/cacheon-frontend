import { useEffect, useState, type ReactNode } from 'react'
import {
  Users,
  Search,
  Cpu,
  CreditCard,
  Server,
  Wrench,
  CheckCircle,
  Play,
  FileText,
  Activity,
  Check,
  Zap,
  Award,
  Clock,
  ChevronDown,
  ChevronRight,
  Hourglass,
  Crown,
  Medal,
} from 'lucide-react'
import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import {
  fetchStatus,
  fetchEvalProgress,
  fetchEvalJob,
  type EvalProgressResponse,
  type EvalProgressChallenger,
  type EvalProgressStep,
  type EvalJobResponse,
} from '~/lib/api.client'
import { fmtScore, relativeTimeAgo, truncHotkey, truncImage, MetricCard, StatusDot } from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { LinkButton } from '~/components/ui/link-button'
import { Badge } from '~/components/ui/badge'

/** Splits "38 min ago" → { n: "38", unit: "min ago" } for two-line metric display. */
function splitRelativeTime(s: string): { n: string; unit: string } | null {
  if (s === '-') return null
  // "Less than 1 min ago"
  if (s.startsWith('Less')) return { n: '<1', unit: 'min ago' }
  const m = /^(\d+)\s+(.+)$/.exec(s)
  if (!m) return null
  return { n: m[1], unit: m[2] }
}

function LastEvalValue({ ts }: { ts: number | null | undefined }) {
  const raw = relativeTimeAgo(ts)
  const split = splitRelativeTime(raw)
  if (!split)
    return (
      <span className="text-primary font-mono text-xl leading-none font-black tracking-tight sm:text-[1.9rem]">
        —
      </span>
    )
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
      <span className="text-primary font-mono text-xl leading-none font-black tracking-tight sm:text-[1.9rem]">
        {split.n}{' '}
      </span>
      <span className="text-secondary/60 font-mono text-[0.65rem] font-semibold sm:text-xs">
        {' '}
        {split.unit}
      </span>
    </div>
  )
}

export function PulseSection() {
  const status = usePoll(fetchStatus, 30_000)
  const progress = usePoll(fetchEvalProgress, 10_000)
  const evalJob = usePoll(fetchEvalJob, 30_000)
  const [, setTick] = useState(0)

  // Derive API liveness from the two polls we already run.
  // - null  = still loading (no answer yet from either)
  // - true  = at least one returned data, or both are only rate-limited (API is up)
  // - false = both failed with a hard error (network down or server truly unreachable)
  const alive: boolean | null = (() => {
    const bothPending = status.loading && progress.loading
    if (bothPending) return null
    if (status.data != null || progress.data != null) return true
    // If every failure is just a rate-limit the API is reachable.
    const allRateLimited =
      (status.error == null || status.rateLimited) &&
      (progress.error == null || progress.rateLimited)
    if (allRateLimited) return true
    return false
  })()

  const s = status.data

  useEffect(() => {
    if (s?.last_eval_ts == null || s.last_eval_ts <= 0) return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [s?.last_eval_ts])

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <StatusDot alive={alive} />
        <h3 className="text-secondary font-mono text-sm font-semibold tracking-[0.12em] uppercase">
          {alive === null
            ? 'Connecting...'
            : alive
              ? 'API Online'
              : status.rateLimited || progress.rateLimited
                ? 'API Busy'
                : 'API Unreachable'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        <MetricCard
          label="Leader UID"
          value={s?.leader_uid ?? '-'}
          accent
          loading={status.loading}
        />
        <MetricCard
          label="Leader Score"
          value={s ? fmtScore(s.leader_score) : '-'}
          accent
          loading={status.loading}
        />
        <MetricCard label="Scored" value={s?.n_active ?? '-'} loading={status.loading} />
        <MetricCard
          label="Disqualified"
          value={s?.n_disqualified ?? '-'}
          loading={status.loading}
        />
        <MetricCard label="Evaluated" value={s?.n_evaluated ?? '-'} loading={status.loading} />
        <MetricCard
          label="Last eval"
          value={<LastEvalValue ts={s?.last_eval_ts} />}
          loading={status.loading}
        />
      </div>

      {s && (s.last_scan_block != null || s.last_weights_set_block != null) && (
        <div className="text-secondary/70 mt-4 flex flex-wrap gap-4 font-mono text-sm">
          {s.last_scan_block != null && <span>Last scan: block #{s.last_scan_block}</span>}
          {s.last_weights_set_block != null && (
            <span>Weights set: block #{s.last_weights_set_block}</span>
          )}
        </div>
      )}

      {progress.data && progress.data.status === 'running' && (
        <EvalProgressBanner progress={progress.data} />
      )}

      {progress.data?.status !== 'running' &&
        evalJob.data?.eval_job &&
        evalJob.data.eval_job.challengers.length > 0 && (
          <EvalPendingBanner job={evalJob.data.eval_job} />
        )}
    </section>
  )
}

// ── Phase config ─────────────────────────────────────────

const PHASE_META: Record<string, { label: string; icon: ReactNode }> = {
  challengers_found: {
    label: 'Challengers identified',
    icon: <Users size={13} strokeWidth={1.5} />,
  },
  gpu_searching: { label: 'Searching for GPU', icon: <Search size={13} strokeWidth={1.5} /> },
  gpu_match_found: { label: 'GPU matched', icon: <Cpu size={13} strokeWidth={1.5} /> },
  gpu_renting: { label: 'Renting pod', icon: <CreditCard size={13} strokeWidth={1.5} /> },
  gpu_ready: { label: 'Pod ready', icon: <Server size={13} strokeWidth={1.5} /> },
  gpu_setup: { label: 'Setting up pod', icon: <Wrench size={13} strokeWidth={1.5} /> },
  gpu_setup_complete: {
    label: 'Pod setup complete',
    icon: <CheckCircle size={13} strokeWidth={1.5} />,
  },
  gpu_eval_started: { label: 'GPU eval running', icon: <Play size={13} strokeWidth={1.5} /> },
  prompts_generated: { label: 'Prompts generated', icon: <FileText size={13} strokeWidth={1.5} /> },
  baseline_running: { label: 'Running baseline', icon: <Activity size={13} strokeWidth={1.5} /> },
  baseline_complete: { label: 'Baseline complete', icon: <Check size={13} strokeWidth={1.5} /> },
  challenger_eval: { label: 'Evaluating challengers', icon: <Zap size={13} strokeWidth={1.5} /> },
  eval_complete: { label: 'Eval complete', icon: <Award size={13} strokeWidth={1.5} /> },
  leader_running: { label: 'Leader running', icon: <Crown size={13} strokeWidth={1.5} /> },
  runner_up_running: { label: 'Runner-up running', icon: <Medal size={13} strokeWidth={1.5} /> },
}

function phaseLabel(phase: string | undefined, detail?: string | null): string {
  if (!phase) return 'Starting...'
  const meta = PHASE_META[phase]
  const base = meta?.label ?? phase.replace(/_/g, ' ')
  if (phase === 'gpu_setup' && detail) return `Setup: ${detail}`
  return base
}

function phaseIcon(phase: string | undefined): ReactNode {
  if (!phase) return <span className="opacity-40">·</span>
  return PHASE_META[phase]?.icon ?? <span className="opacity-40">·</span>
}

const CHALLENGER_STYLES: Record<string, { dot: string; bg: string; text: string; label: string }> =
  {
    pending: { dot: 'bg-secondary/30', bg: '', text: 'text-secondary/50', label: 'Queued' },
    pulling: {
      dot: 'bg-warning',
      bg: 'bg-warning/[0.04]',
      text: 'text-warning',
      label: 'Pulling',
    },
    started: {
      dot: 'bg-warning',
      bg: 'bg-warning/[0.04]',
      text: 'text-warning',
      label: 'Starting',
    },
    evaluating: {
      dot: 'bg-accent',
      bg: 'bg-accent/[0.04]',
      text: 'text-accent',
      label: 'Evaluating',
    },
    scored: {
      dot: 'bg-success',
      bg: 'bg-success/[0.04]',
      text: 'text-success',
      label: 'Scored',
    },
    dq: { dot: 'bg-error', bg: 'bg-error/[0.04]', text: 'text-error', label: 'DQ' },
    skipped: { dot: 'bg-secondary/40', bg: '', text: 'text-secondary/40', label: 'Skipped' },
  }

// ── Elapsed time (ticks every second) ────────────────────

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const sec = Math.max(0, Math.floor(Date.now() / 1000 - startedAt))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return (
    <span className="tabular-nums">
      {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

// ── Main banner ──────────────────────────────────────────

function EvalProgressBanner({ progress }: { progress: EvalProgressResponse }) {
  const challengers = progress.challengers ?? []
  const gpu = progress.gpu
  const stale = progress.possibly_stale
  const steps = progress.steps ?? []

  const borderColor = stale ? 'border-warning/25' : 'border-accent/20'
  const accentColor = stale ? 'text-warning' : 'text-accent'
  const pingColor = stale ? 'bg-warning/50' : 'bg-accent/50'
  const dotColor = stale ? 'bg-warning' : 'bg-accent'

  function incumbentStatus(idx: number): EvalProgressChallenger['status'] {
    const cur = progress.current_idx
    if (cur == null) return 'pending'
    if (cur > idx) return 'scored'
    if (cur === idx) return 'evaluating'
    return 'pending'
  }

  // Build ordered list matching GPU eval order: leader → runner_up → challengers
  const incumbents: EvalProgressChallenger[] = [
    ...(progress.leader
      ? [
          {
            idx: -2,
            uid: progress.leader.uid,
            hotkey: progress.leader.hotkey,
            image: progress.leader.image,
            status: incumbentStatus(-2),
          },
        ]
      : []),
    ...(progress.runner_up
      ? [
          {
            idx: -1,
            uid: progress.runner_up.uid,
            hotkey: progress.runner_up.hotkey,
            image: progress.runner_up.image,
            status: incumbentStatus(-1),
          },
        ]
      : []),
  ]
  const allRows = [...incumbents, ...challengers]

  const completed = challengers.filter(
    (c) => c.status === 'scored' || c.status === 'dq' || c.status === 'skipped',
  )

  return (
    <div className={cn('mt-8 overflow-hidden rounded-xl border bg-white/[0.015]', borderColor)}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-6">
        <span className="relative flex size-2.5 shrink-0">
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full',
              pingColor,
            )}
          />
          <span className={cn('relative inline-flex size-2.5 rounded-full', dotColor)} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={cn('font-mono text-sm leading-none font-semibold sm:text-base', accentColor)}
          >
            {stale ? 'Signal stale' : phaseLabel(progress.phase, progress.detail)}
          </span>
          {progress.started_at != null && (
            <span className="text-secondary/60 flex items-center gap-1 font-mono text-sm leading-none">
              <Clock size={11} strokeWidth={1.5} className="shrink-0 opacity-60" />
              <ElapsedTime startedAt={progress.started_at} />
            </span>
          )}
        </div>
        {progress.round_block != null && (
          <span className="text-secondary/60 flex shrink-0 items-center gap-1 font-mono text-sm">
            #{progress.round_block}
            <LinkButton href={`https://tao.app/block/${progress.round_block}`} />
          </span>
        )}
      </div>

      {/* GPU + meta pills */}
      {(gpu || challengers.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6">
          {gpu?.provider && (
            <Badge>
              {gpu.provider}
              {gpu.gpu_type ? ` ${gpu.num_gpus ?? ''}x ${gpu.gpu_type}` : ''}
            </Badge>
          )}
          {gpu?.pod_id && (
            <Badge>
              Pod ID:{' '}
              {gpu.pod_id.length > 8
                ? `${gpu.pod_id.slice(0, 6)}...${gpu.pod_id.slice(-4)}`
                : gpu.pod_id}
            </Badge>
          )}
          {challengers.length > 0 && (
            <Badge>
              {challengers.length} challenger{challengers.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {progress.phase === 'challenger_eval' && challengers.length > 0 && (
            <Badge variant="accent">
              {completed.length}/{challengers.length} done
            </Badge>
          )}
        </div>
      )}

      {/* Eval list: leader → runner_up → challengers (GPU eval order) */}
      {allRows.length > 0 && (
        <div className="border-t border-white/[0.04]">
          {allRows.map((c, i) => (
            <ChallengerRow
              key={c.idx}
              challenger={c}
              active={c.idx === progress.current_idx}
              last={i === allRows.length - 1}
            />
          ))}
        </div>
      )}

      {/* Step timeline */}
      {steps.length > 0 && <StepTimeline steps={steps} />}
    </div>
  )
}

// ── Challenger row ───────────────────────────────────────

function ChallengerRow({
  challenger: c,
  active,
  last,
}: {
  challenger: EvalProgressChallenger
  active: boolean
  last: boolean
}) {
  const style = CHALLENGER_STYLES[c.status] ?? CHALLENGER_STYLES.pending
  const isLive = c.status === 'pulling' || c.status === 'started' || c.status === 'evaluating'
  const isLeader = c.idx === -2
  const isRunnerUp = c.idx === -1

  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-4 py-3 font-mono transition-colors sm:flex-row sm:items-center sm:gap-4 sm:px-6',
        active && style.bg,
        !last && 'border-b border-white/[0.06]',
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:contents">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          {/* Status dot */}
          <span className="relative flex size-2.5 shrink-0">
            {isLive && active && (
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                  style.dot,
                )}
              />
            )}
            <span className={cn('relative inline-flex size-2.5 rounded-full', style.dot)} />
          </span>

          {/* UID */}
          <span className="text-secondary/70 shrink-0 text-sm whitespace-nowrap sm:w-16">
            UID {c.uid}
          </span>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-end text-xs font-semibold tracking-[0.1em] uppercase sm:w-20 sm:text-sm',
            style.text,
          )}
        >
          {isLeader && (
            <Crown size={13} className="text-accent mr-1 mb-[2px] shrink-0 opacity-80" />
          )}
          {isRunnerUp && <Medal size={13} className="text-secondary/50 mr-1 mb-[2px] shrink-0" />}
          {style.label}
        </span>
      </div>

      {/* Hotkey + image */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-[8rem]">
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-secondary/85 truncate text-sm leading-none">
            {truncHotkey(c.hotkey)}
          </span>
          <CopyButton value={c.hotkey} />
        </div>
        {c.image && (
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-secondary/85 truncate text-sm leading-none">
              {truncImage(c.image)}
            </span>
            <CopyButton value={c.image} />
            <LinkButton
              href={`https://hub.docker.com/r/${c.image.replace(/:.*$/, '').replace(/^[^/]+\.[^/]+\//, '')}`}
            />
          </div>
        )}
      </div>

      {/* Score / DQ reason */}
      {(c.score != null && c.status === 'scored') || c.dq_reason ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:shrink-0 sm:justify-end">
          {c.score != null && c.status === 'scored' && (
            <span className="text-success text-sm font-semibold">{fmtScore(c.score)}</span>
          )}
          {c.dq_reason && (
            <span
              className="text-error/80 max-w-full truncate text-sm sm:max-w-[12rem]"
              title={c.dq_reason}
            >
              {c.dq_reason}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ── Step timeline ────────────────────────────────────────

function StepTimeline({ steps }: { steps: EvalProgressStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? steps : steps.slice(-5)
  const hidden = steps.length - visible.length

  return (
    <div className="border-t border-white/[0.06] px-4 py-4 sm:px-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="tracking-caps text-secondary/55 hover:text-secondary/80 mb-3 flex cursor-pointer items-center gap-1.5 border-none bg-transparent font-mono text-xs uppercase transition-colors"
      >
        <span>
          {expanded ? (
            <ChevronDown size={12} strokeWidth={2} />
          ) : (
            <ChevronRight size={12} strokeWidth={2} />
          )}
        </span>
        <span>Timeline{!expanded && hidden > 0 ? ` (+${hidden} earlier)` : ''}</span>
      </button>
      <div className="flex flex-col gap-0">
        {visible.map((step) => (
          <TimelineEntry key={`${step.ts}-${step.phase}`} step={step} />
        ))}
      </div>
    </div>
  )
}

function TimelineEntry({ step }: { step: EvalProgressStep }) {
  const d = new Date(step.ts * 1000)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const extra: string[] = []
  if (step.step && typeof step.step === 'string') extra.push(step.step)
  if (typeof step.n === 'number') extra.push(`n=${step.n}`)
  if (typeof step.elapsed_s === 'number') extra.push(`${step.elapsed_s}s`)
  if (typeof step.timeout_min === 'number') extra.push(`timeout ${step.timeout_min}m`)
  if (typeof step.uid === 'number') extra.push(`UID ${step.uid}`)
  if (step.status && typeof step.status === 'string' && step.phase === 'challenger_eval')
    extra.push(step.status as string)

  return (
    <div className="flex items-start gap-3">
      <span className="bg-secondary/50 mt-[6px] inline-block size-1.5 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 pb-1">
        <span className="text-secondary/55 shrink-0 font-mono text-sm leading-snug tabular-nums">
          {time}
        </span>
        <span className="text-secondary/80 inline-flex items-center gap-1.5 font-mono text-sm leading-snug">
          {phaseIcon(step.phase)}
          {phaseLabel(step.phase, typeof step.step === 'string' ? step.step : undefined)}
        </span>
        {extra.length > 0 && (
          <span className="text-secondary/55 font-mono text-sm leading-snug">
            {extra.join(' · ')}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Pending eval job banner ──────────────────────────────

function EvalPendingBanner({ job }: { job: NonNullable<EvalJobResponse['eval_job']> }) {
  const { block, challengers, created_at } = job

  return (
    <div className="border-border/40 mt-8 overflow-hidden rounded-xl border bg-white/[0.015]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3">
        <Hourglass size={14} strokeWidth={1.5} className="text-secondary/50 shrink-0" />
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="text-secondary/80 font-mono text-base leading-none font-semibold">
            Evaluation pending
          </span>
          <span className="text-secondary/45 font-mono text-sm leading-none">
            {relativeTimeAgo(created_at)}
          </span>
        </div>
        <span className="text-secondary/50 flex shrink-0 items-center gap-1 font-mono text-sm">
          #{block}
          <LinkButton href={`https://tao.app/block/${block}`} />
        </span>
      </div>

      {/* Challenger count pill */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
        <Badge>
          {challengers.length} challenger{challengers.length !== 1 ? 's' : ''} queued
        </Badge>
      </div>

      {/* Challenger list */}
      {challengers.length > 0 && (
        <div className="border-t border-white/[0.04]">
          {challengers.map((c, i) => (
            <div
              key={c.uid}
              className={cn(
                'flex items-center gap-4 px-6 py-3 font-mono',
                i < challengers.length - 1 && 'border-b border-white/[0.06]',
              )}
            >
              <span className="bg-secondary/25 relative inline-flex size-2.5 shrink-0 rounded-full" />

              <span className="text-secondary/70 w-16 shrink-0 text-sm whitespace-nowrap">
                UID {c.uid}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="text-secondary/85 truncate text-sm leading-none">
                    {truncHotkey(c.hotkey)}
                  </span>
                  <CopyButton value={c.hotkey} />
                </div>
                {c.image && (
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="text-secondary/85 truncate text-sm leading-none">
                      {truncImage(c.image)}
                    </span>
                    <CopyButton value={c.image} />
                    <LinkButton
                      href={`https://hub.docker.com/r/${c.image.replace(/:.*$/, '').replace(/^[^/]+\.[^/]+\//, '')}`}
                    />
                  </div>
                )}
              </div>

              <span className="text-secondary/40 shrink-0 font-mono text-xs tracking-[0.1em] uppercase">
                Queued
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
