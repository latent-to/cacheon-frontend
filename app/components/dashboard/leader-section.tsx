import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import { fetchLeaderHistory, type LeaderHistoryEntry } from '~/lib/api.client'
import { fmtScore, truncHotkey, relativeTimeAgo, GlassCard, Skeleton } from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { LinkButton } from '~/components/ui/link-button'

export function LeaderSection() {
  const history = usePoll(fetchLeaderHistory, 30_000)

  return (
    <section>
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
    </section>
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
