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
} from 'lucide-react'
import { usePoll } from '~/lib/use-poll'
import {
  fetchHealth,
  fetchStatus,
  fetchEvalProgress,
  type EvalProgressResponse,
  type EvalProgressChallenger,
  type EvalProgressStep,
} from '~/lib/api.client'
import { fmtScore, truncHotkey, truncImage, MetricCard, LastEvalMetric, StatusDot } from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { LinkButton } from '~/components/ui/link-button'

export function PulseSection() {
  const health = usePoll(fetchHealth, 10_000)
  const status = usePoll(fetchStatus, 30_000)
  const progress = usePoll(fetchEvalProgress, 10_000)

  const alive = health.loading ? null : !health.error
  const s = status.data

  return (
    <section>
      <div className="mb-8 flex items-center gap-3">
        <StatusDot alive={alive} />
        <h3 className="text-secondary font-mono text-[0.68rem] font-semibold tracking-[0.2em] uppercase">
          {alive === null ? 'Connecting...' : alive ? 'API Online' : 'API Unreachable'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="King UID" value={s?.king_uid ?? '-'} accent loading={status.loading} />
        <MetricCard
          label="King Score"
          value={s ? fmtScore(s.king_score) : '-'}
          accent
          loading={status.loading}
        />
        <MetricCard label="Active" value={s?.n_active ?? '-'} loading={status.loading} />
        <MetricCard
          label="Disqualified"
          value={s?.n_disqualified ?? '-'}
          loading={status.loading}
        />
        <MetricCard label="Evaluated" value={s?.n_evaluated ?? '-'} loading={status.loading} />
        <LastEvalMetric ts={s?.last_eval_ts} loading={status.loading} />
      </div>

      {s && (s.last_scan_block || s.last_weights_set_block) && (
        <div className="text-secondary/70 mt-3 flex flex-wrap gap-4 font-mono text-xs tracking-wide">
          {s.last_scan_block != null && <span>Last scan: block #{s.last_scan_block}</span>}
          {s.last_weights_set_block != null && (
            <span>Weights set: block #{s.last_weights_set_block}</span>
          )}
        </div>
      )}

      {progress.data && progress.data.status === 'running' && (
        <EvalProgressBanner progress={progress.data} />
      )}
    </section>
  )
}

// ── Phase config ─────────────────────────────────────────

const PHASE_META: Record<string, { label: string; icon: ReactNode }> = {
  challengers_found: {
    label: 'Challengers identified',
    icon: <Users size={10} strokeWidth={1.5} />,
  },
  gpu_searching: { label: 'Searching for GPU', icon: <Search size={10} strokeWidth={1.5} /> },
  gpu_match_found: { label: 'GPU matched', icon: <Cpu size={10} strokeWidth={1.5} /> },
  gpu_renting: { label: 'Renting pod', icon: <CreditCard size={10} strokeWidth={1.5} /> },
  gpu_ready: { label: 'Pod ready', icon: <Server size={10} strokeWidth={1.5} /> },
  gpu_setup: { label: 'Setting up pod', icon: <Wrench size={10} strokeWidth={1.5} /> },
  gpu_setup_complete: {
    label: 'Pod setup complete',
    icon: <CheckCircle size={10} strokeWidth={1.5} />,
  },
  gpu_eval_started: { label: 'GPU eval running', icon: <Play size={10} strokeWidth={1.5} /> },
  prompts_generated: { label: 'Prompts generated', icon: <FileText size={10} strokeWidth={1.5} /> },
  baseline_running: { label: 'Running baseline', icon: <Activity size={10} strokeWidth={1.5} /> },
  baseline_complete: { label: 'Baseline complete', icon: <Check size={10} strokeWidth={1.5} /> },
  challenger_eval: { label: 'Evaluating challengers', icon: <Zap size={10} strokeWidth={1.5} /> },
  eval_complete: { label: 'Eval complete', icon: <Award size={10} strokeWidth={1.5} /> },
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
      dot: 'bg-yellow-400',
      bg: 'bg-yellow-400/[0.04]',
      text: 'text-yellow-400',
      label: 'Pulling',
    },
    started: {
      dot: 'bg-yellow-400',
      bg: 'bg-yellow-400/[0.04]',
      text: 'text-yellow-400',
      label: 'Starting',
    },
    evaluating: {
      dot: 'bg-accent',
      bg: 'bg-accent/[0.04]',
      text: 'text-accent',
      label: 'Evaluating',
    },
    scored: {
      dot: 'bg-green-400',
      bg: 'bg-green-400/[0.04]',
      text: 'text-green-400',
      label: 'Scored',
    },
    dq: { dot: 'bg-red-400', bg: 'bg-red-400/[0.04]', text: 'text-red-400', label: 'DQ' },
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

  const borderColor = stale ? 'border-yellow-500/25' : 'border-accent/20'
  const accentColor = stale ? 'text-yellow-500' : 'text-accent'
  const pingColor = stale ? 'bg-yellow-500/50' : 'bg-accent/50'
  const dotColor = stale ? 'bg-yellow-500' : 'bg-accent'

  const completed = challengers.filter(
    (c) => c.status === 'scored' || c.status === 'dq' || c.status === 'skipped',
  )

  return (
    <div className={`mt-6 overflow-hidden rounded-xl border ${borderColor} bg-white/[0.015]`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className="relative flex size-2.5 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${pingColor}`}
          />
          <span className={`relative inline-flex size-2.5 rounded-full ${dotColor}`} />
        </span>
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className={`font-mono text-[0.9rem] leading-none font-semibold ${accentColor}`}>
            {stale ? 'Signal stale' : phaseLabel(progress.phase, progress.detail)}
          </span>
          {progress.started_at != null && (
            <span className="text-secondary/60 flex items-center gap-1 font-mono text-xs leading-none">
              <Clock size={11} strokeWidth={1.5} className="shrink-0 opacity-60" />
              <ElapsedTime startedAt={progress.started_at} />
            </span>
          )}
        </div>
        {progress.round_block != null && (
          <span className="text-secondary/60 shrink-0 font-mono text-xs">
            #{progress.round_block}
          </span>
        )}
      </div>

      {/* GPU + meta pills */}
      {(gpu || challengers.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
          {gpu?.provider && (
            <Pill>
              {gpu.provider}
              {gpu.gpu_type ? ` ${gpu.num_gpus ?? ''}x ${gpu.gpu_type}` : ''}
            </Pill>
          )}
          {gpu?.pod_id && <Pill>{gpu.pod_id}</Pill>}
          {challengers.length > 0 && (
            <Pill>
              {challengers.length} challenger{challengers.length !== 1 ? 's' : ''}
            </Pill>
          )}
          {progress.phase === 'challenger_eval' && challengers.length > 0 && (
            <Pill accent>
              {completed.length}/{challengers.length} done
            </Pill>
          )}
        </div>
      )}

      {/* Progress bar (during challenger eval) */}
      {progress.phase === 'challenger_eval' && challengers.length > 0 && (
        <div className="mx-5 mb-3 h-[3px] overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="bg-accent/60 h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width:
                challengers.length > 0
                  ? `${Math.round((completed.length / challengers.length) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      )}

      {/* Challenger list */}
      {challengers.length > 0 && (
        <div className="border-t border-white/[0.04]">
          {challengers.map((c, i) => (
            <ChallengerRow
              key={c.idx}
              challenger={c}
              active={c.idx === progress.current_idx}
              last={i === challengers.length - 1}
            />
          ))}
        </div>
      )}

      {/* Step timeline */}
      {steps.length > 0 && <StepTimeline steps={steps} />}
    </div>
  )
}

// ── Pill ─────────────────────────────────────────────────

function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 font-mono text-xs tracking-wide ${
        accent ? 'bg-accent/10 text-accent font-semibold' : 'text-secondary/75 bg-white/[0.06]'
      }`}
    >
      {children}
    </span>
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

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 font-mono transition-colors ${
        active ? style.bg : ''
      } ${!last ? 'border-b border-white/[0.06]' : ''}`}
    >
      {/* Status dot (pings when live) */}
      <span className="relative flex size-2.5 shrink-0">
        {isLive && active && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.dot} opacity-60`}
          />
        )}
        <span className={`relative inline-flex size-2.5 rounded-full ${style.dot}`} />
      </span>

      {/* UID */}
      <span className="text-secondary/70 w-12 shrink-0 text-xs">UID {c.uid}</span>

      {/* Hotkey + image */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-secondary/85 truncate text-xs leading-none">
            {truncHotkey(c.hotkey)}
          </span>
          <CopyButton value={c.hotkey} />
        </div>
        {c.image &&
          (() => {
            const image = truncImage(c.image)
            return (
              <div className="flex min-w-0 items-center gap-1">
                <span className="text-secondary/85 truncate text-xs leading-none">{image}</span>
                <CopyButton value={image} />
                <LinkButton href={`https://hub.docker.com/r/${image}`} />
              </div>
            )
          })()}
      </div>

      {/* Score / DQ reason */}
      {c.score != null && c.status === 'scored' && (
        <span className="shrink-0 text-xs font-semibold text-green-400">{fmtScore(c.score)}</span>
      )}
      {c.dq_reason && (
        <span
          className="max-w-[12rem] shrink-0 truncate text-xs text-red-400/80"
          title={c.dq_reason}
        >
          {c.dq_reason}
        </span>
      )}

      {/* Status badge */}
      <span
        className={`inline-flex w-20 shrink-0 items-center justify-end text-xs font-semibold tracking-wider uppercase ${style.text}`}
      >
        {style.label}
      </span>
    </div>
  )
}

// ── Step timeline ────────────────────────────────────────

function StepTimeline({ steps }: { steps: EvalProgressStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? steps : steps.slice(-5)
  const hidden = steps.length - visible.length

  return (
    <div className="border-t border-white/[0.06] px-5 py-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-secondary/55 hover:text-secondary/80 mb-3 flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
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
      <div className="relative flex flex-col gap-0">
        {visible.map((step, i) => (
          <TimelineEntry
            key={`${step.ts}-${step.phase}`}
            step={step}
            last={i === visible.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineEntry({ step, last }: { step: EvalProgressStep; last: boolean }) {
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
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center">
        <span className="bg-secondary/50 mt-[5px] inline-block size-1.5 shrink-0 rounded-full" />
        {!last && <span className="bg-secondary/20 w-px flex-1" style={{ minHeight: 14 }} />}
      </div>
      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 pb-2">
        <span className="text-secondary/55 shrink-0 font-mono text-xs tabular-nums">{time}</span>
        <span className="text-secondary/80 inline-flex items-center gap-1.5 font-mono text-xs leading-snug">
          {phaseIcon(step.phase)}
          {phaseLabel(step.phase, typeof step.step === 'string' ? step.step : undefined)}
        </span>
        {extra.length > 0 && (
          <span className="text-secondary/55 font-mono text-[0.65rem]">{extra.join(' · ')}</span>
        )}
      </div>
    </div>
  )
}
