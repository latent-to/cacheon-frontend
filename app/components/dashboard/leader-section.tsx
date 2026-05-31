import { Trophy, Medal } from 'lucide-react'
import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import {
  fetchLeader,
  fetchLeaderHistory,
  type LeaderRecord,
  type LeaderHistoryEntry,
} from '~/lib/api.client'
import {
  fmtScore,
  fmtImprovement,
  fmtPct,
  truncHotkey,
  relativeTimeAgo,
  GlassCard,
  Skeleton,
  MiniStat,
  ImageTag,
} from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { LinkButton } from '~/components/ui/link-button'
import type { ReactNode } from 'react'

export function LeaderSection() {
  const leader = usePoll(fetchLeader, 30_000)
  const history = usePoll(fetchLeaderHistory, 30_000)

  const l = leader.data?.leader
  const ru = leader.data?.runner_up

  return (
    <section>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <RankCard
            title="Current Leader"
            icon={<Trophy size={24} strokeWidth={1.5} className="text-accent" />}
            iconGlow
            record={l}
            loading={leader.loading}
            error={!!leader.error}
            emptyText="No leader yet"
            accent
          />
          <RankCard
            title="Runner-up"
            icon={<Medal size={24} strokeWidth={1.5} className="text-secondary/60" />}
            record={ru}
            loading={leader.loading}
            error={!!leader.error}
            emptyText="No runner-up yet"
          />
        </div>

        <GlassCard className="p-4 sm:p-6">
          <div className="text-2xs tracking-caps text-secondary mb-4 font-mono font-semibold uppercase">
            Leader History
          </div>
          {history.loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !history.data?.history.length ? (
            <p className="text-secondary/60 font-mono text-sm">
              {history.error ? 'Could not load data' : 'No history yet'}
            </p>
          ) : (
            <div className="relative space-y-0">
              <div className="bg-border/60 absolute top-2 bottom-2 left-[7px] w-px" />
              {[...history.data.history].reverse().map((entry, i) => (
                <LeaderHistoryNode key={entry.block} entry={entry} isLatest={i === 0} />
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  )
}

function RankCard({
  title,
  icon,
  iconGlow,
  record,
  loading,
  error,
  emptyText,
  accent,
}: {
  title: string
  icon: ReactNode
  iconGlow?: boolean
  record: LeaderRecord | null | undefined
  loading: boolean
  error: boolean
  emptyText: string
  accent?: boolean
}) {
  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="text-2xs tracking-caps text-secondary mb-4 font-mono font-semibold uppercase">
        {title}
      </div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : error ? (
        <p className="text-secondary/60 font-mono text-sm">Could not load data</p>
      ) : !record ? (
        <p className="text-secondary/60 font-mono text-sm">{emptyText}</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className={iconGlow ? 'drop-shadow-[0_0_8px_var(--accent-glow)]' : ''}>
              {icon}
            </span>
            <span
              className={cn(
                'min-w-0 truncate font-mono text-2xl font-black tracking-tight sm:text-3xl',
                accent ? 'text-accent' : 'text-primary',
              )}
            >
              {truncHotkey(record.hotkey)}
            </span>
          </div>

          <div className="text-sm2 mb-4 space-y-2 font-mono">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="text-secondary/50">UID</span>
              <span className="text-secondary">{record.uid}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <span className="text-secondary/50 shrink-0">Image</span>
              <ImageTag image={record.image} />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <span className="text-secondary/50 shrink-0">Won</span>
              <div className="text-sm2 flex min-w-0 flex-col gap-0.5 font-mono">
                <span className="text-primary">{relativeTimeAgo(record.evaluated_at)}</span>
                <span className="text-secondary/45 text-xs">Block #{record.won_at_block}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Score" value={fmtScore(record.score)} accent={accent} />
            <MiniStat label="Speed" value={fmtImprovement(record.speed_improvement)} />
            <MiniStat label="Token Match" value={fmtPct(record.token_match_rate)} />
          </div>
        </>
      )}
    </GlassCard>
  )
}

function LeaderHistoryNode({ entry, isLatest }: { entry: LeaderHistoryEntry; isLatest: boolean }) {
  return (
    <div className="relative flex gap-3 py-3 pl-5 sm:gap-4 sm:pl-6">
      <span
        className={cn(
          'absolute top-4 left-0 size-[14px] rounded-full border-2',
          isLatest ? 'border-accent bg-accent/30 shadow-accent-sm' : 'border-border bg-surface',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span
            className={cn('font-mono text-sm font-bold', isLatest ? 'text-accent' : 'text-primary')}
          >
            {truncHotkey(entry.new_leader_hotkey)}
          </span>
          <CopyButton value={entry.new_leader_hotkey} />
        </div>
        <div className="text-secondary/55 mt-0.5 font-mono text-xs">UID {entry.new_leader_uid}</div>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-xs">
          <span className="text-primary">{relativeTimeAgo(entry.ts)}</span>
          <span className="text-secondary/30">·</span>
          <span className="text-secondary/40">Block #{entry.block}</span>
          <LinkButton href={`https://tao.app/block/${entry.block}`} />
        </div>
        <div className="text-secondary/60 mt-1 font-mono text-xs">
          Score {fmtScore(entry.new_leader_score)}
          {entry.prev_leader_uid != null && (
            <span className="text-secondary/40">
              {' '}
              (overtook UID {entry.prev_leader_uid}, was {fmtScore(entry.prev_leader_score)})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
