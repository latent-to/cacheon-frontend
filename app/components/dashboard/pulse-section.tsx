import { usePoll } from '~/lib/use-poll'
import { fetchHealth, fetchStatus, fetchEvalJob, type EvalJob } from '~/lib/api.client'
import { fmtScore, relativeTimeAgo, MetricCard, LastEvalMetric, StatusDot } from './shared'

export function PulseSection() {
  const health = usePoll(fetchHealth, 10_000)
  const status = usePoll(fetchStatus, 30_000)
  const evalJob = usePoll(fetchEvalJob, 30_000)

  const alive = health.data ? health.data.status === 'ok' : null
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
        <div className="text-secondary/60 mt-3 flex flex-wrap gap-4 font-mono text-[0.62rem] tracking-wide">
          {s.last_scan_block != null && <span>Last scan: block #{s.last_scan_block}</span>}
          {s.last_weights_set_block != null && (
            <span>Weights set: block #{s.last_weights_set_block}</span>
          )}
        </div>
      )}

      {evalJob.data?.eval_job && <EvalJobBanner job={evalJob.data.eval_job} />}
    </section>
  )
}

function EvalJobBanner({ job }: { job: EvalJob }) {
  return (
    <div className="border-accent/30 bg-accent/[0.04] mt-4 flex flex-wrap items-start gap-3 rounded-lg border px-5 py-3">
      <span className="relative mt-0.5 flex size-2.5 shrink-0">
        <span className="bg-accent/60 absolute inline-flex h-full w-full animate-ping rounded-full" />
        <span className="bg-accent relative inline-flex size-2.5 rounded-full" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-accent font-mono text-[0.75rem] leading-snug font-semibold">
          {relativeTimeAgo(job.created_at)}
        </span>
        <span className="text-secondary/55 font-mono text-[0.65rem] leading-snug">
          Block #{job.block} · {job.challengers.length} challenger
          {job.challengers.length !== 1 ? 's' : ''} queued
        </span>
      </div>
    </div>
  )
}
