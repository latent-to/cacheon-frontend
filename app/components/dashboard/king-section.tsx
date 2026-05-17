import { Crown } from 'lucide-react'
import { usePoll } from '~/lib/use-poll'
import { fetchKing, fetchKingHistory, type KingHistoryEntry } from '~/lib/api.client'
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

export function KingSection() {
  const king = usePoll(fetchKing, 30_000)
  const history = usePoll(fetchKingHistory, 30_000)

  const k = king.data?.king

  return (
    <section>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard className="p-6">
          <div className="text-secondary mb-4 font-mono text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
            Current King
          </div>
          {king.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : king.error ? (
            <p className="text-secondary/60 font-mono text-sm">Could not load data</p>
          ) : !k ? (
            <p className="text-secondary/60 font-mono text-sm">No king crowned yet</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
                  <Crown size={28} strokeWidth={1.5} className="text-accent" />
                </span>
                <span className="text-accent font-mono text-3xl font-black tracking-tight">
                  UID {k.uid}
                </span>
              </div>

              <div className="mb-4 space-y-1.5 font-mono text-[0.78rem]">
                <div className="flex gap-2">
                  <span className="text-secondary/50">Hotkey</span>
                  <span className="text-secondary" title={k.hotkey}>
                    {truncHotkey(k.hotkey)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Image</span>
                  <ImageTag image={k.image} />
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Crowned</span>
                  <div className="flex min-w-0 flex-col gap-0.5 font-mono text-[0.78rem]">
                    <span className="text-primary">{relativeTimeAgo(k.evaluated_at)}</span>
                    <span className="text-secondary/45 text-[0.65rem]">
                      Block #{k.crowned_at_block}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Score" value={fmtScore(k.score)} accent />
                <MiniStat label="TTFT" value={fmtImprovement(k.ttft_improvement)} />
                <MiniStat label="Throughput" value={fmtImprovement(k.throughput_improvement)} />
                <MiniStat label="Token Match" value={fmtPct(k.token_match_rate)} />
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-secondary mb-4 font-mono text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
            King History
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
                <KingHistoryNode key={entry.block} entry={entry} isLatest={i === 0} />
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  )
}

function KingHistoryNode({ entry, isLatest }: { entry: KingHistoryEntry; isLatest: boolean }) {
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
            {truncHotkey(entry.new_king_hotkey)}
          </span>
          <CopyButton value={entry.new_king_hotkey} />
        </div>
        <div className="text-secondary/55 mt-0.5 font-mono text-[0.65rem]">
          UID {entry.new_king_uid}
        </div>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[0.68rem]">
          <span className="text-primary">{relativeTimeAgo(entry.ts)}</span>
          <span className="text-secondary/30">·</span>
          <span className="text-secondary/40">Block #{entry.block}</span>
          <LinkButton href={`https://tao.app/block/${entry.block}`} />
        </div>
        <div className="text-secondary/60 mt-1 font-mono text-[0.68rem]">
          Score {fmtScore(entry.new_king_score)}
          {entry.prev_king_uid != null && (
            <span className="text-secondary/40">
              {' '}
              (dethroned UID {entry.prev_king_uid}, was {fmtScore(entry.prev_king_score)})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
