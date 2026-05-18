import { useEffect, useState } from 'react'

import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import { fetchEvaluations, fetchEvaluationsByUid, type EvaluationRecord } from '~/lib/api.client'
import {
  fmtScore,
  fmtPct,
  fmtImprovement,
  truncHotkey,
  relativeTimeAgo,
  GlassCard,
  Skeleton,
  StatusPill,
  MiniStat,
  ImageTag,
} from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { CloseButton } from '~/components/ui/close-button'

type EvalFilter = 'all' | 'active' | 'dq'

export function EvaluationsSection() {
  const [filter, setFilter] = useState<EvalFilter>('all')
  const [selectedUid, setSelectedUid] = useState<number | null>(null)

  const evals = usePoll(fetchEvaluations, 30_000)
  const allEvals = evals.data?.evaluations ?? []
  const list =
    filter === 'active'
      ? allEvals.filter((e) => !e.disqualified)
      : filter === 'dq'
        ? allEvals.filter((e) => e.disqualified)
        : allEvals

  return (
    <section>
      <div className="mb-4 flex items-center gap-1">
        {(['all', 'active', 'dq'] as EvalFilter[]).map((f) => {
          const count = evals.data
            ? f === 'all'
              ? allEvals.length
              : f === 'active'
                ? allEvals.filter((e) => !e.disqualified).length
                : allEvals.filter((e) => e.disqualified).length
            : null
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'text-2xs tracking-caps inline-flex cursor-pointer items-center gap-1.5 rounded border bg-transparent px-2.5 py-1 font-mono font-medium uppercase transition-colors',
                filter === f
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border/40 text-secondary/60 hover:text-secondary',
              )}
            >
              {f === 'dq' ? 'Disqualified' : f === 'active' ? 'Scored' : 'All'}
              {count !== null && (
                <span
                  className={cn(
                    'text-2xs rounded px-1 py-px font-mono tabular-nums',
                    filter === f
                      ? 'bg-accent/15 text-accent/70'
                      : 'text-secondary/40 bg-white/[0.06]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <GlassCard className="overflow-x-auto">
        {evals.loading ? (
          <div className="space-y-0 px-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-border/20 border-b py-4">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : evals.error ? (
          <div className="text-secondary/50 px-6 py-10 text-center font-mono text-sm">
            Could not load data
          </div>
        ) : list.length === 0 ? (
          <div className="text-secondary/50 px-6 py-10 text-center font-mono text-sm">
            No evaluations found
          </div>
        ) : (
          <table className="w-full min-w-[720px] font-mono">
            <thead>
              <tr className="border-border/30 border-b bg-white/[0.015]">
                <th className="text-2xs tracking-caps text-secondary/40 w-14 px-4 py-2.5 text-left font-semibold uppercase">
                  UID
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 px-3 py-2.5 text-left font-semibold uppercase">
                  Hotkey
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 px-3 py-2.5 text-left font-semibold uppercase">
                  Image
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 w-20 px-3 py-2.5 text-right font-semibold uppercase">
                  Score
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 w-16 px-3 py-2.5 text-right font-semibold uppercase">
                  TTFT
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 w-16 px-3 py-2.5 text-right font-semibold uppercase">
                  TPS
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 w-16 px-3 py-2.5 text-right font-semibold uppercase">
                  Match
                </th>
                <th className="text-2xs tracking-caps text-secondary/40 w-24 px-4 py-2.5 text-right font-semibold uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((ev) => (
                <EvalRow
                  key={`${ev.hotkey}:${ev.commit_block}`}
                  ev={ev}
                  onSelect={setSelectedUid}
                />
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {selectedUid !== null && (
        <EvalDetailDrawer uid={selectedUid} onClose={() => setSelectedUid(null)} />
      )}
    </section>
  )
}

function EvalRow({ ev, onSelect }: { ev: EvaluationRecord; onSelect: (uid: number) => void }) {
  const dq = ev.disqualified
  return (
    <tr
      className={cn(
        'border-border/20 cursor-pointer border-b transition-colors hover:bg-white/[0.02]',
        dq && 'opacity-60',
      )}
      onClick={() => onSelect(ev.uid)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(ev.uid)}
      role="button"
      tabIndex={0}
    >
      <td
        className={cn(
          'px-4 py-3 text-sm font-bold tabular-nums',
          dq ? 'text-error/60' : 'text-primary',
        )}
      >
        {ev.uid}
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-secondary/60 truncate text-xs" title={ev.hotkey}>
            {truncHotkey(ev.hotkey)}
          </span>
          <CopyButton value={ev.hotkey} />
        </div>
      </td>
      <td className="px-3 py-3">
        <ImageTag image={ev.image} />
      </td>
      <td
        className={cn(
          'px-3 py-3 text-right text-sm font-bold tabular-nums',
          dq ? 'text-error/60' : 'text-accent',
        )}
      >
        {fmtScore(ev.score)}
      </td>
      <td className="text-secondary px-3 py-3 text-right text-xs tabular-nums">
        {fmtImprovement(ev.ttft_improvement)}
      </td>
      <td className="text-secondary px-3 py-3 text-right text-xs tabular-nums">
        {fmtImprovement(ev.throughput_improvement)}
      </td>
      <td className="text-secondary px-3 py-3 text-right text-xs tabular-nums">
        {fmtPct(ev.token_match_rate)}
      </td>
      <td className="px-4 py-3 text-right">
        <StatusPill active={!dq} label={dq ? 'DQ' : 'SCORED'} />
      </td>
    </tr>
  )
}

function EvalDetailDrawer({ uid, onClose }: { uid: number; onClose: () => void }) {
  const [data, setData] = useState<EvaluationRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    fetchEvaluationsByUid(uid)
      .then((r) => {
        if (!cancelled) setData(r.evaluations)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  const ev = data?.[0]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="border-border/60 bg-bg relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l">
        <div className="border-border/40 flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-primary font-mono text-sm font-bold">UID {uid}</h3>
          <CloseButton onClick={onClose} size={20} />
        </div>

        <div className="flex-1 space-y-6 p-6">
          {error && (
            <div className="border-error/30 bg-error/10 text-error rounded-lg border px-4 py-3 font-mono text-sm">
              {error}
            </div>
          )}

          {!data && !error && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}

          {ev && (
            <>
              <div className="text-sm2 space-y-1.5 font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-secondary/50 shrink-0">Hotkey</span>
                  <span className="text-secondary min-w-0 break-all">{ev.hotkey}</span>
                  <CopyButton value={ev.hotkey} />
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Image</span>
                  <ImageTag image={ev.image} />
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Digest</span>
                  <span className="text-secondary text-xs break-all">{ev.digest}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-secondary/50 shrink-0">Evaluated</span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-secondary">{relativeTimeAgo(ev.evaluated_at)}</span>
                    <span className="text-secondary/40 text-xs">
                      Evaluation block #{ev.evaluation_block} · Commit block #{ev.commit_block}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Score" value={fmtScore(ev.score)} accent />
                <MiniStat label="TTFT" value={fmtImprovement(ev.ttft_improvement)} />
                <MiniStat label="Throughput" value={fmtImprovement(ev.throughput_improvement)} />
                <MiniStat label="Token Match" value={fmtPct(ev.token_match_rate)} />
              </div>

              {ev.disqualified && (
                <div className="border-error/30 bg-error/10 rounded-lg border px-4 py-3">
                  <div className="text-2xs tracking-caps text-error mb-1 font-mono font-bold uppercase">
                    Disqualified
                  </div>
                  <div className="text-sm2 text-error/80 font-mono">
                    {ev.disqualify_reason || 'No reason provided'}
                  </div>
                </div>
              )}

              {ev.per_prompt && ev.per_prompt.length > 0 && (
                <div>
                  <div className="text-2xs tracking-caps text-secondary/50 mb-2 font-mono font-semibold uppercase">
                    Per-Prompt Breakdown
                  </div>
                  <div className="border-border/40 overflow-x-auto rounded-lg border">
                    <table className="w-full font-mono text-xs">
                      <thead>
                        <tr className="border-border/30 border-b bg-white/[0.015]">
                          <th className="text-secondary/50 px-3 py-2 text-left font-semibold">#</th>
                          <th className="text-secondary/50 px-3 py-2 text-right font-semibold">
                            TTFT
                          </th>
                          <th className="text-secondary/50 px-3 py-2 text-right font-semibold">
                            TPS
                          </th>
                          <th className="text-secondary/50 px-3 py-2 text-right font-semibold">
                            Tokens
                          </th>
                          <th className="text-secondary/50 px-3 py-2 text-right font-semibold">
                            Match
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ev.per_prompt.map((pp, i) => (
                          <tr key={i} className="border-border/20 border-b">
                            <td className="text-secondary/40 px-3 py-1.5">{i + 1}</td>
                            <td className="text-secondary px-3 py-1.5 text-right">
                              {pp.ttft_s != null ? `${pp.ttft_s.toFixed(3)}s` : '-'}
                            </td>
                            <td className="text-secondary px-3 py-1.5 text-right">
                              {pp.throughput_tps?.toFixed(1)}
                            </td>
                            <td className="text-secondary px-3 py-1.5 text-right">
                              {pp.output_tokens}
                            </td>
                            <td className="text-secondary px-3 py-1.5 text-right">
                              {fmtPct(pp.token_match_rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {data && data.length > 1 && (
                <div>
                  <div className="text-2xs tracking-caps text-secondary/50 mb-2 font-mono font-semibold uppercase">
                    Evaluation History ({data.length} total)
                  </div>
                  <div className="space-y-2">
                    {data.slice(1).map((e) => (
                      <div
                        key={`${e.hotkey}:${e.commit_block}`}
                        className="border-border/30 grid grid-cols-1 gap-2 rounded-lg border bg-white/[0.01] px-3 py-2 font-mono text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-secondary truncate">{truncHotkey(e.hotkey)}</span>
                            <CopyButton value={e.hotkey} />
                          </div>
                          <span className="text-2xs text-secondary/45">
                            {relativeTimeAgo(e.evaluated_at)} · Block #{e.evaluation_block}
                          </span>
                        </div>
                        <span className={e.disqualified ? 'text-error/60' : 'text-accent'}>
                          {fmtScore(e.score)}
                        </span>
                        <span className="justify-self-start sm:justify-self-end">
                          <StatusPill
                            active={!e.disqualified}
                            label={e.disqualified ? 'DQ' : 'SCORED'}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
