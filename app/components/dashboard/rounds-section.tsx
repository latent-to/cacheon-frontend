import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import { fetchRounds, type Round } from '~/lib/api.client'
import {
  fmtScore,
  truncHotkey,
  relativeTimeAgo,
  GlassCard,
  Skeleton,
  StatusPill,
  ImageTag,
} from './shared'

export function RoundsSection() {
  const rounds = usePoll(fetchRounds, 30_000)
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)

  const list = rounds.data?.rounds ?? []
  const visible = list.slice(0, visibleCount)

  return (
    <section>
      {rounds.loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : rounds.error ? (
        <GlassCard className="text-secondary/50 px-6 py-10 text-center font-mono text-sm">
          Could not load data
        </GlassCard>
      ) : list.length === 0 ? (
        <GlassCard className="text-secondary/50 px-6 py-10 text-center font-mono text-sm">
          No evaluation rounds yet
        </GlassCard>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((round) => (
              <RoundCard
                key={round.evaluation_block}
                round={round}
                expanded={expandedBlock === round.evaluation_block}
                onToggle={() =>
                  setExpandedBlock(
                    expandedBlock === round.evaluation_block ? null : round.evaluation_block,
                  )
                }
              />
            ))}
          </div>
          {visibleCount < list.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 10)}
              className="border-border/40 tracking-caps text-secondary hover:border-border hover:text-primary mt-4 w-full cursor-pointer rounded-lg border bg-transparent py-2.5 font-mono text-xs font-semibold uppercase transition-colors"
            >
              Load more ({list.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </section>
  )
}

function RoundCard({
  round,
  expanded,
  onToggle,
}: {
  round: Round
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <GlassCard>
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3.5"
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        role="button"
        tabIndex={0}
      >
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-primary font-mono text-sm font-bold">
            {relativeTimeAgo(round.evaluated_at)}
          </span>
          <span className="text-2xs text-secondary/40 font-mono">
            Block #{round.evaluation_block}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xs text-secondary rounded-md bg-white/[0.04] px-2 py-0.5 font-mono font-semibold">
            {round.n_challengers} challenger{round.n_challengers !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={cn(
              'text-secondary/40 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-border/30 border-t px-5 py-3">
          <div className="space-y-1.5">
            {round.challengers.map((c) => (
              <div
                key={`${c.hotkey}:${round.evaluation_block}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 font-mono text-xs',
                  c.disqualified && 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'w-10 font-bold',
                    c.disqualified ? 'text-error/60' : 'text-primary',
                  )}
                >
                  {c.uid}
                </span>
                <span className="text-secondary/50 min-w-0 flex-1 truncate" title={c.hotkey}>
                  {truncHotkey(c.hotkey)}
                </span>
                <ImageTag image={c.image} className="hidden max-w-[24rem] sm:flex" />
                <span
                  className={cn(
                    'w-16 text-right font-bold',
                    c.disqualified ? 'text-error/60' : 'text-accent',
                  )}
                >
                  {fmtScore(c.score)}
                </span>
                <StatusPill active={!c.disqualified} label={c.disqualified ? 'DQ' : 'OK'} />
              </div>
            ))}
          </div>
          {round.challengers
            .filter((c) => c.disqualified && c.disqualify_reason)
            .map((c) => (
              <div
                key={`dq-${c.hotkey}`}
                className="border-error/20 bg-error/[0.05] text-error/80 mt-2 rounded-lg border px-3 py-2 font-mono text-xs"
              >
                UID {c.uid}: {c.disqualify_reason}
              </div>
            ))}
        </div>
      )}
    </GlassCard>
  )
}
