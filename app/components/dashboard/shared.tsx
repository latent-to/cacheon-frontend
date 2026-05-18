import { LinkButton } from '~/components/ui/link-button'

export const DASHBOARD_TABS = [
  { slug: 'pulse', label: 'Pulse' },
  { slug: 'leader', label: 'Leader' },
  { slug: 'evaluations', label: 'Evaluations' },
  { slug: 'rounds', label: 'Rounds' },
  { slug: 'logs', label: 'Miner Logs' },
  { slug: 'validator-logs', label: 'Validator Logs' },
] as const

// ── Formatters ──────────────────────────────────────────

export function relativeTimeAgo(ts: number | null | undefined): string {
  if (ts == null || ts <= 0) return '-'
  let sec = Math.floor(Date.now() / 1000 - ts)
  if (sec < 0) sec = 0
  if (sec < 60) return 'Less than 1 min ago'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const days = Math.floor(hr / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

export function truncImage(img: string | null | undefined): string {
  if (!img) return ''
  return img.replace(/^docker\.io\//, '')
}

export function truncHotkey(hk: string | undefined | null): string {
  if (!hk) return '-'
  if (hk.length <= 12) return hk
  return `${hk.slice(0, 6)}...${hk.slice(-4)}`
}

export function fmtScore(n: number | null | undefined): string {
  if (n == null) return '-'
  return n.toFixed(4)
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '-'
  return `${(n * 100).toFixed(1)}%`
}

export function fmtImprovement(n: number | null | undefined): string {
  if (n == null) return '-'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${(n * 100).toFixed(1)}%`
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── UI primitives ───────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-border/30 animate-pulse rounded ${className}`} />
}

export function GlassCard({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`border-border/60 bg-surface/60 rounded-xl border backdrop-blur-sm ${onClick ? 'hover:border-border hover:bg-surface/80 cursor-pointer transition-colors' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export function StatusDot({ alive }: { alive: boolean | null }) {
  if (alive === null) return <span className="bg-border/60 inline-block size-2 rounded-full" />
  return (
    <span
      className={`inline-block size-2 rounded-full ${
        alive
          ? 'bg-accent shadow-[0_0_6px_rgba(45,212,191,0.6)]'
          : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
      }`}
    />
  )
}

export function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[0.65rem] font-bold tracking-widest ${
        active ? 'bg-accent/15 text-accent' : 'bg-red-400/15 text-red-400'
      }`}
    >
      <span
        className={`inline-block size-1.5 rounded-full ${
          active
            ? 'bg-accent shadow-[0_0_6px_rgba(45,212,191,0.6)]'
            : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
        }`}
      />
      {label}
    </span>
  )
}

export function MetricCard({
  label,
  value,
  accent = false,
  loading = false,
  valueClassName,
}: {
  label: string
  value: string | number
  accent?: boolean
  loading?: boolean
  valueClassName?: string
}) {
  return (
    <GlassCard className="px-5 py-4">
      <div className="text-secondary mb-1 font-mono text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-20" />
      ) : (
        <div
          className={`font-mono text-2xl font-black tracking-tight ${accent ? 'text-accent' : 'text-primary'} ${valueClassName ?? ''}`}
        >
          {value}
        </div>
      )}
    </GlassCard>
  )
}

export function ImageTag({
  image,
  className = '',
}: {
  image: string | null | undefined
  className?: string
}) {
  const clean = truncImage(image)
  if (!clean)
    return <span className={`text-secondary/40 font-mono text-[0.72rem] ${className}`}>-</span>
  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      <span className="min-w-0 truncate font-mono text-[0.72rem]">{clean}</span>
      <LinkButton href={`https://hub.docker.com/r/${clean.replace(/:.*$/, '')}`} />
    </div>
  )
}

export function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="border-border/40 rounded-lg border bg-white/[0.015] px-3 py-2">
      <div className="text-secondary/50 font-mono text-[0.56rem] tracking-[0.18em] uppercase">
        {label}
      </div>
      <div className={`font-mono text-sm font-bold ${accent ? 'text-accent' : 'text-primary'}`}>
        {value}
      </div>
    </div>
  )
}
