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
        className="flex cursor-pointer flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
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
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-2xs text-secondary rounded-md bg-white/[0.04] px-2 py-0.5 font-mono font-semibold">
            {round.n_challengers} challenger{round.n_challengers !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={cn(
              'text-secondary/40 shrink-0 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-border/30 border-t px-4 py-3 sm:px-5">
          <div className="space-y-2">
            {round.challengers.map((c) => (
              <div
                key={`${c.hotkey}:${round.evaluation_block}`}
                className={cn(
                  'flex flex-col gap-2 rounded-lg px-3 py-2.5 font-mono text-xs sm:flex-row sm:items-center sm:gap-3',
                  c.disqualified && 'opacity-50',
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-3 sm:contents">
                  <span
                    className={cn(
                      'shrink-0 font-bold sm:w-10',
                      c.disqualified ? 'text-error/60' : 'text-primary',
                    )}
                  >
                    {c.uid}
                  </span>
                  <StatusPill active={!c.disqualified} label={c.disqualified ? 'DQ' : 'OK'} />
                </div>
                <span
                  className="text-secondary/50 min-w-0 flex-1 truncate sm:order-none"
                  title={c.hotkey}
                >
                  {truncHotkey(c.hotkey)}
                </span>
                <ImageTag image={c.image} className="max-w-full sm:max-w-[24rem]" />
                <span
                  className={cn(
                    'shrink-0 font-bold sm:w-16 sm:text-right',
                    c.disqualified ? 'text-error/60' : 'text-accent',
                  )}
                >
                  {fmtScore(c.score)}
                </span>
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
