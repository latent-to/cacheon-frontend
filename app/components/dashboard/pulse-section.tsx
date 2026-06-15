import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  Crown,
  Medal,
  Trophy,
} from 'lucide-react'
import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import {
  fetchStatus,
  fetchEvalProgress,
  fetchLeader,
  fetchRounds,
  type EvalProgressResponse,
  type EvalProgressChallenger,
  type EvalProgressIncumbent,
  type EvalProgressStep,
  type LeaderRecord,
  type Round,
  type StatusResponse,
} from '~/lib/api.client'
import {
  fmtScore,
  relativeTimeAgo,
  truncHotkey,
  truncImage,
  RankCard,
  Skeleton,
  StatusDot,
} from './shared'
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

function CompactLastEval({ ts }: { ts: number | null | undefined }) {
  const split = splitRelativeTime(relativeTimeAgo(ts))
  if (!split) return <span className="text-primary/85">—</span>
  return (
    <span className="flex items-baseline gap-x-1">
      <span className="text-primary/85">{split.n}</span>
      <span className="text-secondary/55 text-[0.6rem] font-semibold sm:text-[0.65rem]">
        {split.unit}
      </span>
    </span>
  )
}

function SecondaryStat({
  label,
  value,
  loading,
}: {
  label: string
  value: ReactNode
  loading: boolean
}) {
  return (
    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="text-secondary/60 mb-1 font-mono text-[0.6rem] font-semibold tracking-[0.12em] uppercase sm:text-[0.65rem]">
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <div className="text-primary/85 font-mono text-base leading-none font-bold tabular-nums sm:text-lg">
          {value}
        </div>
      )}
    </div>
  )
}

/**
 * Operational counts, intentionally quieter than the standings above
 * (Law of Common Region: one grouped, lower-emphasis strip rather than a
 * row of equal-weight hero cards).
 */
function NetworkStatsStrip({
  status,
  loading,
}: {
  status: StatusResponse | undefined
  loading: boolean
}) {
  const hasBlocks =
    status != null && (status.last_scan_block != null || status.last_weights_set_block != null)

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        <SecondaryStat label="Scored" value={status?.n_active ?? '-'} loading={loading} />
        <SecondaryStat
          label="Disqualified"
          value={status?.n_disqualified ?? '-'}
          loading={loading}
        />
        <SecondaryStat label="Evaluated" value={status?.n_evaluated ?? '-'} loading={loading} />
        <SecondaryStat
          label="Last eval"
          value={<CompactLastEval ts={status?.last_eval_ts} />}
          loading={loading}
        />
      </div>

      {hasBlocks && (
        <div className="text-secondary/55 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] px-3 py-2 font-mono text-[0.7rem] sm:px-4 sm:text-xs">
          {status!.last_scan_block != null && (
            <span>Last scan: block #{status!.last_scan_block}</span>
          )}
          {status!.last_weights_set_block != null && (
            <span>Weights set: block #{status!.last_weights_set_block}</span>
          )}
        </div>
      )}
    </div>
  )
}

type RoundLeader = {
  uid: number
  score: number
}

type RoundChartPoint = {
  roundIndex: number
  block: number
  evaluatedAt: number | null
  leader: RoundLeader | null
  nChallengers: number
  nScored: number
  nDisqualified: number
}

type ChartDot = {
  point: RoundChartPoint
  uid: number
  score: number
  isRoundLeader: boolean
}

function roundLeader(challengers: Round['challengers']): RoundLeader | null {
  const scored = challengers.filter((c) => !c.disqualified && c.score != null)
  if (scored.length === 0) return null

  const roundMax = Math.max(...scored.map((c) => c.score!))
  if (roundMax <= 0) return null

  const winner = scored.reduce((a, b) => (a.score! >= b.score! ? a : b))
  return { uid: winner.uid, score: roundMax }
}

function buildRoundChart(rounds: Round[] | undefined): RoundChartPoint[] {
  const sorted = [...(rounds ?? [])].sort((a, b) => a.evaluation_block - b.evaluation_block)
  return sorted.map((round, i) => {
    const challengers = round.challengers
    return {
      roundIndex: i + 1,
      block: round.evaluation_block,
      evaluatedAt: round.evaluated_at,
      leader: roundLeader(challengers),
      nChallengers: round.n_challengers,
      nScored: challengers.filter((c) => !c.disqualified && c.score != null).length,
      nDisqualified: challengers.filter((c) => c.disqualified).length,
    }
  })
}

function buildChartDots(points: RoundChartPoint[], rounds: Round[] | undefined): ChartDot[] {
  const sorted = [...(rounds ?? [])].sort((a, b) => a.evaluation_block - b.evaluation_block)
  const dots: ChartDot[] = []

  for (let i = 0; i < sorted.length; i++) {
    const round = sorted[i]
    const point = points[i]
    if (!point) continue

    const scored = round.challengers.filter((c) => !c.disqualified && c.score != null)
    if (scored.length === 0) continue

    for (const c of scored) {
      dots.push({
        point,
        uid: c.uid,
        score: c.score!,
        isRoundLeader: point.leader != null && c.uid === point.leader.uid,
      })
    }
  }

  return dots
}

export function PulseSection() {
  const status = usePoll(fetchStatus, 30_000)
  const progress = usePoll(fetchEvalProgress, 10_000)
  const leader = usePoll(fetchLeader, 30_000)
  const rounds = usePoll(fetchRounds, 30_000)
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

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr]">
        <RankCard
          title="Current Leader"
          icon={<Trophy size={18} strokeWidth={1.5} className="text-accent" />}
          iconGlow
          record={leader.data?.leader}
          loading={leader.loading}
          error={!!leader.error}
          emptyText="No leader yet"
          accent
        />
        <RankCard
          title="Runner-up"
          icon={<Medal size={18} strokeWidth={1.5} className="text-secondary/60" />}
          record={leader.data?.runner_up}
          loading={leader.loading}
          error={!!leader.error}
          emptyText="No runner-up yet"
        />
      </div>

      <NetworkStatsStrip status={s} loading={status.loading} />

      <ScoreHistoryChart
        loading={leader.loading || rounds.loading}
        error={!!rounds.error}
        leader={leader.data?.leader}
        rounds={rounds.data?.rounds}
      />

      <EvalScheduleBanner />

      {progress.data &&
        (progress.data.status === 'running' || progress.data.status === 'complete') && (
          <EvalProgressBanner progress={progress.data} />
        )}
    </section>
  )
}

// ── Score history chart ──────────────────────────────────

const CHART_LEADER_COLOR = '#9EFFE3'
const CHART_DOT_COLOR = 'rgba(255, 255, 255, 0.28)'
const CHART_WIDTH = 1000
const CHART_HEIGHT = 300
const CHART_MARGIN = { top: 16, right: 12, bottom: 32, left: 48 }
/** Extra inset so the tooltip clears y-axis tick labels (anchored end at margin.left - 8). */
const TOOLTIP_LEFT_INSET = CHART_MARGIN.left + 40
/** Min horizontal space per round when the chart scrolls on narrow screens. */
const MOBILE_PX_PER_ROUND = 26

function useMaxSm(): boolean {
  const [maxSm, setMaxSm] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const onChange = () => setMaxSm(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return maxSm
}

function chartTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min]
  const step = (max - min) / Math.max(count - 1, 1)
  return Array.from({ length: count }, (_, i) => min + step * i)
}

function roundXTicks(n: number, maxLabels = 6): number[] {
  if (n <= 0) return []
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i + 1)
  const step = Math.max(1, Math.floor(n / (maxLabels - 1)))
  const ticks: number[] = []
  for (let i = 1; i <= n; i += step) ticks.push(i)
  if (ticks[ticks.length - 1] !== n) ticks.push(n)
  return ticks
}

function ScoreHistoryChart({
  loading,
  error,
  leader,
  rounds,
}: {
  loading: boolean
  error: boolean
  leader: LeaderRecord | null | undefined
  rounds: Round[] | undefined
}) {
  const points = useMemo(() => buildRoundChart(rounds), [rounds])
  const chartDots = useMemo(() => buildChartDots(points, rounds), [points, rounds])
  const hasEnough = points.length >= 1
  const isNarrow = useMaxSm()
  const [hovered, setHovered] = useState<RoundChartPoint | null>(null)

  const layout = useMemo(() => {
    if (!hasEnough || chartDots.length === 0) return null

    const leaderScore = leader?.score
    const scores = [
      ...chartDots.map((d) => d.score),
      ...(leaderScore != null && leaderScore > 0 ? [leaderScore] : []),
    ]

    const yMin = 0
    const yMax = Math.max(...scores) * 1.1
    const nRounds = points.length
    const plotW = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right
    const plotH = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom

    const xAt = (roundIndex: number) =>
      CHART_MARGIN.left + (plotW * (roundIndex - 1)) / Math.max(nRounds - 1, 1)
    const yAt = (score: number) =>
      CHART_MARGIN.top + plotH - (plotH * (score - yMin)) / Math.max(yMax - yMin, 1e-6)

    const xLabelMax = nRounds > 18 ? 4 : nRounds > 10 ? 5 : 6

    return {
      nRounds,
      plotW,
      plotH,
      xAt,
      yAt,
      yTicks: chartTicks(yMin, yMax, 4),
      xTicks: roundXTicks(nRounds, xLabelMax),
      scrollMinWidth: nRounds > 12 ? nRounds * MOBILE_PX_PER_ROUND : undefined,
    }
  }, [points, chartDots, hasEnough, leader?.score])

  const leaderLinePath = useMemo(() => {
    if (!layout) return null
    const leaders = points.filter((p) => p.leader != null)
    if (leaders.length < 2) return null

    const parts: string[] = []
    let prev: RoundChartPoint | null = null

    for (const p of leaders) {
      const x = layout.xAt(p.roundIndex)
      const y = layout.yAt(p.leader!.score)
      const adjacent = prev != null && p.roundIndex - prev.roundIndex === 1
      parts.push(adjacent ? `L ${x} ${y}` : `M ${x} ${y}`)
      prev = p
    }

    return parts.some((s) => s.startsWith('L')) ? parts.join(' ') : null
  }, [layout, points])

  function viewBoxXFromClient(svg: SVGSVGElement, clientX: number, clientY: number): number | null {
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    return pt.matrixTransform(ctm.inverse()).x
  }

  function selectRoundAt(svg: SVGSVGElement, clientX: number, clientY: number) {
    if (!layout || points.length === 0) return
    const x = viewBoxXFromClient(svg, clientX, clientY)
    if (x == null) return

    let nearest = points[0]
    let nearestDist = Infinity
    for (const pt of points) {
      const dist = Math.abs(layout.xAt(pt.roundIndex) - x)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = pt
      }
    }
    setHovered(nearest)
  }

  const mobileScroll =
    isNarrow && layout?.scrollMinWidth != null ? layout.scrollMinWidth : undefined

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 sm:p-6">
      <div className="tracking-caps text-secondary mb-3 font-mono text-xs font-semibold uppercase sm:mb-4 sm:text-sm">
        Score Progress
      </div>

      {loading ? (
        <Skeleton className="h-[280px] w-full sm:h-[360px]" />
      ) : error ? (
        <p className="text-secondary/60 font-mono text-sm">Could not load score history</p>
      ) : !hasEnough || chartDots.length === 0 ? (
        <p className="text-secondary/60 font-mono text-sm">Not enough history yet</p>
      ) : (
        <>
          <div
            className={cn(
              'min-w-0',
              mobileScroll != null &&
                '-mx-1 [touch-action:pan-x] overflow-x-auto overscroll-x-contain px-1',
            )}
          >
            <div
              className="relative h-[220px] min-w-full sm:h-[300px]"
              style={
                mobileScroll != null ? { minWidth: `max(100%, ${mobileScroll}px)` } : undefined
              }
            >
              {layout && (
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  width="100%"
                  height="100%"
                  className="block touch-manipulation"
                  onMouseMove={(e) => selectRoundAt(e.currentTarget, e.clientX, e.clientY)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={(e) => {
                    const touch = e.changedTouches[0]
                    if (touch) selectRoundAt(e.currentTarget, touch.clientX, touch.clientY)
                  }}
                >
                  {layout.yTicks.map((tick) => {
                    const y = layout.yAt(tick)
                    return (
                      <g key={tick}>
                        <line
                          x1={CHART_MARGIN.left}
                          x2={CHART_WIDTH - CHART_MARGIN.right}
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <text
                          x={CHART_MARGIN.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="rgba(255,255,255,0.45)"
                          fontSize={11}
                          fontFamily="monospace"
                        >
                          {tick.toFixed(2)}
                        </text>
                      </g>
                    )
                  })}

                  <line
                    x1={CHART_MARGIN.left}
                    x2={CHART_WIDTH - CHART_MARGIN.right}
                    y1={CHART_HEIGHT - CHART_MARGIN.bottom}
                    y2={CHART_HEIGHT - CHART_MARGIN.bottom}
                    stroke="rgba(255,255,255,0.08)"
                  />

                  {layout.xTicks.map((tick) => (
                    <text
                      key={tick}
                      x={layout.xAt(tick)}
                      y={CHART_HEIGHT - 10}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.45)"
                      fontSize={11}
                      fontFamily="monospace"
                    >
                      R{tick}
                    </text>
                  ))}

                  {leaderLinePath && (
                    <path
                      d={leaderLinePath}
                      fill="none"
                      stroke={CHART_LEADER_COLOR}
                      strokeWidth={1}
                      strokeDasharray="5 4"
                      opacity={0.55}
                    />
                  )}

                  {chartDots.map(({ point: pt, uid, score, isRoundLeader }) => {
                    const active = hovered?.roundIndex === pt.roundIndex
                    return (
                      <circle
                        key={`c-${pt.block}-${uid}`}
                        cx={layout.xAt(pt.roundIndex)}
                        cy={layout.yAt(score)}
                        r={active ? 5 : isRoundLeader ? 4 : 3}
                        fill={isRoundLeader ? CHART_LEADER_COLOR : CHART_DOT_COLOR}
                      />
                    )
                  })}

                  {points.map((pt) => {
                    const slotW = layout.plotW / Math.max(layout.nRounds, 1)
                    const cx = layout.xAt(pt.roundIndex)
                    return (
                      <rect
                        key={`hit-${pt.block}`}
                        x={cx - slotW / 2}
                        y={CHART_MARGIN.top}
                        width={slotW}
                        height={layout.plotH}
                        fill="transparent"
                        className="cursor-pointer sm:pointer-events-none"
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          setHovered(pt)
                        }}
                        onClick={() => setHovered(pt)}
                      />
                    )
                  })}
                </svg>
              )}

              {hovered && <RoundTooltip point={hovered} />}
            </div>
          </div>

          {hovered && <RoundDetailBar point={hovered} className="sm:hidden" />}
        </>
      )}
    </div>
  )
}

function roundDetailMeta(point: RoundChartPoint): string {
  return [
    `${point.nChallengers} challenger${point.nChallengers !== 1 ? 's' : ''}`,
    point.nScored > 0 ? `${point.nScored} scored` : null,
    point.nDisqualified > 0 ? `${point.nDisqualified} DQ` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

function RoundDetailBar({ point, className }: { point: RoundChartPoint; className?: string }) {
  const meta = roundDetailMeta(point)
  const when =
    point.evaluatedAt != null && point.evaluatedAt > 0 ? relativeTimeAgo(point.evaluatedAt) : null

  return (
    <div
      className={cn(
        'mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono',
        className,
      )}
    >
      <div className="text-secondary/60 text-[11px] leading-snug">
        Round {point.roundIndex} · Block #{point.block}
        {when != null && <span className="text-secondary/45"> · {when}</span>}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {point.leader != null && (
          <span className="text-accent text-sm font-semibold tabular-nums">
            Leader {fmtScore(point.leader.score)}
          </span>
        )}
        {meta && <span className="text-secondary/50 text-[11px]">{meta}</span>}
      </div>
    </div>
  )
}

function RoundTooltip({ point }: { point: RoundChartPoint }) {
  const plotTopPct = (CHART_MARGIN.top / CHART_HEIGHT) * 100
  const tooltipLeftPct = (TOOLTIP_LEFT_INSET / CHART_WIDTH) * 100
  const plotWidthPct = ((CHART_WIDTH - TOOLTIP_LEFT_INSET - CHART_MARGIN.right) / CHART_WIDTH) * 100
  const meta = roundDetailMeta(point)

  return (
    <div
      className="pointer-events-none absolute z-10 hidden rounded-lg border border-white/10 bg-[#0a0a0a]/95 px-3 py-2 font-mono text-xs shadow-lg backdrop-blur-sm sm:block"
      style={{
        left: `${tooltipLeftPct}%`,
        top: `${plotTopPct}%`,
        maxWidth: `min(${plotWidthPct}%, 18rem)`,
      }}
    >
      <div className="text-secondary/60">
        Round {point.roundIndex} · Block #{point.block}
      </div>
      {point.evaluatedAt != null && point.evaluatedAt > 0 && (
        <div className="text-secondary/45 mt-1">{relativeTimeAgo(point.evaluatedAt)}</div>
      )}
      {point.leader != null && (
        <div className="text-accent mt-1.5 font-semibold tabular-nums">
          Leader {fmtScore(point.leader.score)}
        </div>
      )}
      {meta && <div className="text-secondary/50 mt-1">{meta}</div>}
    </div>
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
  teacher_forcing_running: {
    label: 'Correctness scoring',
    icon: <Activity size={13} strokeWidth={1.5} />,
  },
  teacher_forcing_complete: {
    label: 'Correctness complete',
    icon: <Check size={13} strokeWidth={1.5} />,
  },
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
    awaiting_correctness: {
      dot: 'bg-secondary/50',
      bg: 'bg-white/[0.02]',
      text: 'text-secondary/70',
      label: 'Awaiting correctness',
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

// ── Eval schedule notice ─────────────────────────────────

function EvalScheduleBanner() {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 sm:px-4">
      <Clock size={14} strokeWidth={1.5} className="text-secondary/50 mt-0.5 shrink-0" />
      <p className="text-secondary/70 font-mono text-xs leading-relaxed sm:text-sm">
        Evaluations run daily between 09:00 and 21:00 UTC.
      </p>
    </div>
  )
}

// ── Main banner ──────────────────────────────────────────

function EvalProgressBanner({ progress }: { progress: EvalProgressResponse }) {
  const challengers = progress.challengers ?? []
  const gpu = progress.gpu
  const stale = progress.possibly_stale
  const steps = progress.steps ?? []
  const isComplete = progress.status === 'complete'

  const borderColor = stale
    ? 'border-warning/25'
    : isComplete
      ? 'border-success/25'
      : 'border-accent/20'
  const accentColor = stale ? 'text-warning' : isComplete ? 'text-success' : 'text-accent'
  const pingColor = stale ? 'bg-warning/50' : 'bg-accent/50'
  const dotColor = stale ? 'bg-warning' : isComplete ? 'bg-success' : 'bg-accent'

  function incumbentStatus(idx: number): EvalProgressChallenger['status'] {
    const cur = progress.current_idx
    if (cur == null) return 'pending'
    if (cur > idx) return 'scored'
    if (cur === idx) return 'evaluating'
    return 'pending'
  }

  function incumbentRow(incumbent: EvalProgressIncumbent, idx: number): EvalProgressChallenger {
    return {
      idx,
      uid: incumbent.uid,
      hotkey: incumbent.hotkey,
      image: incumbent.image,
      status: incumbent.status ?? incumbentStatus(idx),
      score: incumbent.score,
      dq_reason: incumbent.dq_reason,
    }
  }

  // Build ordered list matching GPU eval order: leader → runner_up → challengers
  const incumbents: EvalProgressChallenger[] = [
    ...(progress.leader ? [incumbentRow(progress.leader, -2)] : []),
    ...(progress.runner_up ? [incumbentRow(progress.runner_up, -1)] : []),
  ]
  const allRows = [...incumbents, ...challengers]

  return (
    <div className={cn('mt-8 overflow-hidden rounded-xl border bg-white/[0.015]', borderColor)}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-6">
        <span className="relative flex size-2.5 shrink-0">
          {!isComplete && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full',
                pingColor,
              )}
            />
          )}
          <span className={cn('relative inline-flex size-2.5 rounded-full', dotColor)} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={cn('font-mono text-sm leading-none font-semibold sm:text-base', accentColor)}
          >
            {stale
              ? 'Signal stale'
              : isComplete
                ? 'Round complete'
                : phaseLabel(progress.phase, progress.detail)}
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

      {isComplete && (
        <div className="border-t border-white/[0.06] px-4 py-3 sm:px-6">
          <a
            href="/dashboard/rounds"
            className="text-secondary/60 hover:text-accent font-mono text-xs no-underline transition-colors"
          >
            Full results in Rounds →
          </a>
        </div>
      )}
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
  const hasScore = c.score != null && c.status === 'scored'
  const hasDq = Boolean(c.dq_reason)
  const hasOutcome = hasScore || hasDq

  return (
    <div
      className={cn(
        'grid items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 font-mono transition-colors',
        'grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]',
        'sm:grid-cols-[auto_6.25rem_minmax(0,14rem)_1fr_auto_auto] sm:grid-rows-1',
        'sm:gap-x-4 sm:px-6 sm:py-3',
        active && style.bg,
        !last && 'border-b border-white/[0.06]',
      )}
    >
      {/* Status dot */}
      <span className="relative row-span-2 flex size-2 shrink-0 self-center sm:row-span-1 sm:size-2.5">
        {isLive && active && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              style.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex size-full rounded-full', style.dot)} />
      </span>

      {/* UID + role badge (fixed width so hotkey column lines up) */}
      <div className="flex w-[5.25rem] shrink-0 items-center gap-1 sm:w-full">
        <span className="text-secondary/70 min-w-0 flex-1 truncate text-xs leading-none whitespace-nowrap sm:text-sm">
          UID {c.uid}
        </span>
        <span className="flex w-3.5 shrink-0 items-center justify-center">
          {isLeader && (
            <Crown size={16} className="text-accent shrink-0 opacity-80" strokeWidth={1.5} />
          )}
          {isRunnerUp && (
            <Medal size={16} className="text-secondary/50 shrink-0" strokeWidth={1.5} />
          )}
        </span>
      </div>

      {/* Status */}
      <span
        className={cn(
          'col-start-3 row-start-1 justify-self-end text-[10px] leading-none font-semibold tracking-[0.08em] whitespace-nowrap uppercase sm:col-start-5 sm:row-start-1 sm:text-sm sm:tracking-[0.1em]',
          style.text,
        )}
      >
        <span className="sm:hidden">
          {c.status === 'awaiting_correctness' ? 'Awaiting' : style.label}
        </span>
        <span className="hidden sm:inline">{style.label}</span>
      </span>

      {/* Score / DQ reason */}
      {hasOutcome && (
        <div className="col-start-3 row-start-2 flex max-w-[42vw] shrink-0 flex-col items-end gap-0.5 sm:col-start-6 sm:row-start-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2.5">
          {hasScore && (
            <span className="text-success text-xs leading-none font-semibold tabular-nums sm:text-sm">
              {fmtScore(c.score)}
            </span>
          )}
          {hasDq && (
            <span
              className="text-error/80 max-w-full truncate text-xs leading-none sm:max-w-[14rem] sm:text-sm"
              title={c.dq_reason ?? undefined}
            >
              {c.dq_reason}
            </span>
          )}
        </div>
      )}

      {/* Hotkey + image stack */}
      <div
        className={cn(
          'col-start-2 row-start-2 min-w-0',
          !hasOutcome && 'col-end-4',
          'sm:col-start-3 sm:col-end-auto sm:row-start-1',
        )}
      >
        <div className="flex min-w-0 flex-col justify-center gap-0.5 sm:gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-secondary/85 truncate text-xs leading-none sm:text-sm">
              {truncHotkey(c.hotkey)}
            </span>
            <CopyButton value={c.hotkey} />
          </div>
          {c.image && (
            <div className="flex min-w-0 items-center gap-1">
              <span className="text-secondary/85 truncate text-xs leading-none sm:text-sm">
                {truncImage(c.image)}
              </span>
              <CopyButton value={c.image} />
              <LinkButton
                href={`https://hub.docker.com/r/${c.image.replace(/:.*$/, '').replace(/^[^/]+\.[^/]+\//, '')}`}
              />
            </div>
          )}
        </div>
      </div>
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
