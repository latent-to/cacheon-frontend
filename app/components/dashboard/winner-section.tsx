import { Trophy } from 'lucide-react'
import { usePoll } from '~/lib/use-poll'
import { fetchLeader, fetchLeaderHistory, type LeaderHistoryEntry } from '~/lib/api.client'
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

export function LeaderSection() {
  const leader = usePoll(fetchLeader, 30_000)
  const history = usePoll(fetchLeaderHistory, 30_000)

  const w = leader.data?.leader

  return (
    <section>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard className="p-6">
          <div className="text-secondary mb-4 font-mono text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
            Current Leader
          </div>
          {leader.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : leader.error ? (
            <p className="text-secondary/60 font-mono text-sm">Could not load data</p>
          ) : !w ? (
            <p className="text-secondary/60 font-mono text-sm">No leader yet</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
                  <Trophy size={28} strokeWidth={1.5} className="text-accent" />
                </span>
                <span className="text-accent font-mono text-3xl font-black tracking-tight">
                  UID {w.uid}
                </span>
              </div>

              <div className="mb-4 space-y-1.5 font-mono text-[0.78rem]">
                <div className="flex gap-2">
                  <span className="text-secondary/50">Hotkey</span>
                  <span className="text-secondary" title={w.hotkey}>
                    {truncHotkey(w.hotkey)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Image</span>
                  <ImageTag image={w.image} />
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Won</span>
                  <div className="flex min-w-0 flex-col gap-0.5 font-mono text-[0.78rem]">
                    <span className="text-primary">{relativeTimeAgo(w.evaluated_at)}</span>
                    <span className="text-secondary/45 text-[0.65rem]">
                      Block #{w.won_at_block}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Score" value={fmtScore(w.score)} accent />
                <MiniStat label="TTFT" value={fmtImprovement(w.ttft_improvement)} />
                <MiniStat label="Throughput" value={fmtImprovement(w.throughput_improvement)} />
                <MiniStat label="Token Match" value={fmtPct(w.token_match_rate)} />
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-secondary mb-4 font-mono text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
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

function LeaderHistoryNode({ entry, isLatest }: { entry: LeaderHistoryEntry; isLatest: boolean }) {
  return (
    <div className="relative flex gap-4 py-3 pl-6">
      <span
        className={`absolute top-4 left-0 size-[14px] rounded-full border-2 ${
          isLatest
            ? 'border-accent bg-accent/30 shadow-[0_0_8px_rgba(45,212,191,0.4)]'
            : 'border-border bg-surface'
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span
            className={`font-mono text-sm font-bold ${isLatest ? 'text-accent' : 'text-primary'}`}
          >
            {truncHotkey(entry.new_leader_hotkey)}
          </span>
          <CopyButton value={entry.new_leader_hotkey} />
        </div>
        <div className="text-secondary/55 mt-0.5 font-mono text-[0.65rem]">
          UID {entry.new_leader_uid}
        </div>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[0.68rem]">
          <span className="text-primary">{relativeTimeAgo(entry.ts)}</span>
          <span className="text-secondary/30">·</span>
          <span className="text-secondary/40">Block #{entry.block}</span>
          <LinkButton href={`https://tao.app/block/${entry.block}`} />
        </div>
        <div className="text-secondary/60 mt-1 font-mono text-[0.68rem]">
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
