import { useEffect, useMemo, useRef, useState } from 'react'

import { usePoll } from '~/lib/use-poll'
import { fetchValidatorLogs, fetchValidatorLog, type ValidatorLogEntry } from '~/lib/api.client'
import { fmtBytes, GlassCard, Skeleton, inputCls, labelCls } from './shared'
import { CopyButton } from '~/components/ui/copy-button'

/**
 * Labels: cpu_validator_YYYYMMDD_HHMMSS  or  gpu_eval_YYYYMMDD_HHMMSS
 * Returns a sortable integer YYYYMMDDHHMMSS, or null if unparseable.
 */
function logLabelTimestamp(label: string): number | null {
  const parts = label.split('_')
  if (parts.length < 2) return null
  const date = parts[parts.length - 2]
  const time = parts[parts.length - 1]
  if (!/^\d{8}$/.test(date) || !/^\d{6}$/.test(time)) return null
  return parseInt(date + time, 10)
}

type LogType = 'all' | 'cpu' | 'gpu'
type ValidatorSortOption = 'time_desc' | 'time_asc' | 'size_desc' | 'size_asc'

const SORT_OPTIONS: { value: ValidatorSortOption; label: string }[] = [
  { value: 'time_desc', label: 'Time (newest first)' },
  { value: 'time_asc', label: 'Time (oldest first)' },
  { value: 'size_desc', label: 'Size (largest first)' },
  { value: 'size_asc', label: 'Size (smallest first)' },
]

function typeMatches(label: string, logType: LogType): boolean {
  if (logType === 'all') return true
  if (logType === 'cpu') return label.startsWith('cpu_')
  return label.startsWith('gpu_')
}

function sortLogs(entries: ValidatorLogEntry[], sortBy: ValidatorSortOption): ValidatorLogEntry[] {
  const out = [...entries]
  out.sort((a, b) => {
    if (sortBy === 'size_desc') return b.size_bytes - a.size_bytes
    if (sortBy === 'size_asc') return a.size_bytes - b.size_bytes
    const ta = logLabelTimestamp(a.label) ?? -1
    const tb = logLabelTimestamp(b.label) ?? -1
    if (ta !== tb) return sortBy === 'time_desc' ? tb - ta : ta - tb
    return a.label.localeCompare(b.label)
  })
  return out
}

/** Format `YYYYMMDD_HHMMSS` suffix as a compact readable date-time string. */
function fmtLogDate(label: string): string {
  const parts = label.split('_')
  const date = parts[parts.length - 2]
  const time = parts[parts.length - 1]
  if (!date || !time || date.length !== 8 || time.length !== 6) return ''
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
}

export function ValidatorLogsSection() {
  const logs = usePoll(fetchValidatorLogs, 60_000)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [logText, setLogText] = useState<string | null>(null)
  const [logLoading, setLogLoading] = useState(false)
  const logViewerRef = useRef<HTMLPreElement>(null)

  const [logType, setLogType] = useState<LogType>('all')
  const [sortBy, setSortBy] = useState<ValidatorSortOption>('time_desc')

  const list = logs.data?.logs ?? []

  const processedLogs = useMemo(() => {
    const filtered = list.filter((log) => typeMatches(log.label, logType))
    return sortLogs(filtered, sortBy)
  }, [list, logType, sortBy])

  useEffect(() => {
    if (!selectedLabel) return
    if (!processedLogs.some((l) => l.label === selectedLabel)) setSelectedLabel(null)
  }, [processedLogs, selectedLabel])

  useEffect(() => {
    if (!selectedLabel) {
      setLogText(null)
      return
    }
    let cancelled = false
    setLogLoading(true)
    setLogText(null)
    fetchValidatorLog(selectedLabel)
      .then((text) => {
        if (cancelled) return
        setLogText(text)
        requestAnimationFrame(() => {
          logViewerRef.current?.scrollTo(0, logViewerRef.current.scrollHeight)
        })
      })
      .catch(() => {
        if (!cancelled) setLogText('Failed to load log.')
      })
      .finally(() => {
        if (!cancelled) setLogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedLabel])

  const emptyRaw = !logs.loading && list.length === 0
  const emptyFiltered = !logs.loading && list.length > 0 && processedLogs.length === 0

  return (
    <section className="space-y-4">
      <GlassCard className="p-4">
        <div className="text-secondary/40 mb-3 font-mono text-[0.58rem] font-semibold tracking-[0.18em] uppercase">
          Filter &amp; sort
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className={labelCls}>
            Type
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value as LogType)}
              className={`${inputCls} cursor-pointer`}
              aria-label="Filter by log type"
            >
              <option value="all">All</option>
              <option value="cpu">CPU Validator</option>
              <option value="gpu">GPU Eval</option>
            </select>
          </label>
          <label className={`${labelCls} sm:min-w-[12rem]`}>
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ValidatorSortOption)}
              className={`${inputCls} cursor-pointer`}
              aria-label="Sort log files"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!logs.loading && list.length > 0 && (
          <p className="text-secondary/35 mt-2 font-mono text-[0.62rem]">
            Showing {processedLogs.length} of {list.length} log{list.length === 1 ? '' : 's'}
          </p>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <GlassCard className="p-3">
          <div className="text-secondary/40 mb-2 px-2 font-mono text-[0.58rem] font-semibold tracking-[0.18em] uppercase">
            Validator Logs
          </div>
          {logs.loading ? (
            <div className="space-y-2 px-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : logs.error ? (
            <div className="text-secondary/50 px-2 py-4 font-mono text-[0.72rem]">
              Could not load data
            </div>
          ) : emptyRaw ? (
            <div className="text-secondary/50 px-2 py-4 font-mono text-[0.72rem]">
              No logs available
            </div>
          ) : emptyFiltered ? (
            <div className="text-secondary/50 px-2 py-4 font-mono text-[0.72rem]">
              No logs match your filters
            </div>
          ) : (
            <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
              {processedLogs.map((log) => {
                const isGpu = log.label.startsWith('gpu_')
                const dateStr = fmtLogDate(log.label)
                return (
                  <button
                    key={log.label}
                    type="button"
                    onClick={() => setSelectedLabel(log.label === selectedLabel ? null : log.label)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-md border-none bg-transparent px-2 py-1.5 text-left transition-colors ${
                      selectedLabel === log.label
                        ? 'bg-accent/10 text-accent'
                        : 'text-secondary hover:text-primary hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`shrink-0 rounded px-1 py-px font-mono text-[0.52rem] font-bold tracking-wider uppercase ${
                            isGpu ? 'bg-purple-500/15 text-purple-400' : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {isGpu ? 'GPU' : 'CPU'}
                        </span>
                        <span className="min-w-0 truncate font-mono text-[0.68rem]">
                          {dateStr || log.label}
                        </span>
                      </span>
                    </span>
                    <span className="text-secondary/30 ml-2 shrink-0 font-mono text-[0.58rem]">
                      {fmtBytes(log.size_bytes)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col">
          {!selectedLabel ? (
            <div className="text-secondary/30 flex flex-1 items-center justify-center py-16 font-mono text-sm">
              Select a log file to view
            </div>
          ) : logLoading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Skeleton className="h-6 w-40" />
            </div>
          ) : (
            <>
              <div className="border-border/30 flex items-center justify-between border-b px-4 py-2">
                <span className="text-accent font-mono text-[0.68rem] font-semibold">
                  {selectedLabel}
                </span>
                <div className="flex items-center gap-1">
                  {logText && <CopyButton value={logText} className="p-1" />}
                  <button
                    type="button"
                    onClick={() => setSelectedLabel(null)}
                    className="text-secondary hover:text-primary cursor-pointer border-none bg-transparent p-1"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <pre
                ref={logViewerRef}
                className="text-secondary/80 flex-1 overflow-auto bg-[#060709] px-4 py-3 font-mono text-[0.72rem] leading-relaxed break-all whitespace-pre-wrap"
                style={{ maxHeight: '500px' }}
              >
                {logText}
              </pre>
            </>
          )}
        </GlassCard>
      </div>
    </section>
  )
}
