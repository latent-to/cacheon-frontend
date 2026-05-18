import { useEffect, useMemo, useRef, useState } from 'react'

import { usePoll } from '~/lib/use-poll'
import { fetchContainerLogs, fetchContainerLog, type ContainerLogEntry } from '~/lib/api.client'
import { fmtBytes, GlassCard, Skeleton, inputCls, labelCls } from './shared'
import { CopyButton } from '~/components/ui/copy-button'

/** Miner log labels use `uid{n}_{hotkey}_{block#}` (see validator log capture). */
function logLabelUidDigits(label: string): string | null {
  const m = /^uid(\d+)_/i.exec(label)
  return m ? m[1] : null
}

/** Extract block number from the last underscore-separated segment (strictly numeric). */
function logLabelBlockNum(label: string): number | null {
  const parts = label.split('_')
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]
  if (!/^\d+$/.test(last)) return null
  return parseInt(last, 10)
}

function uidFilterMatches(label: string, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  const id = logLabelUidDigits(label)
  if (id === null) return false
  if (/^\d+$/.test(q)) return id === q || id.startsWith(q)
  return id.includes(q)
}

function hotkeyFilterMatches(label: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return label.toLowerCase().includes(q)
}

type LogsSortOption = 'size_desc' | 'size_asc' | 'uid_asc' | 'uid_desc' | 'time_desc' | 'time_asc'

const SORT_OPTIONS: { value: LogsSortOption; label: string }[] = [
  { value: 'size_desc', label: 'Size (largest first)' },
  { value: 'size_asc', label: 'Size (smallest first)' },
  { value: 'uid_asc', label: 'UID (low → high)' },
  { value: 'uid_desc', label: 'UID (high → low)' },
  { value: 'time_desc', label: 'Time (newest first)' },
  { value: 'time_asc', label: 'Time (oldest first)' },
]

function sortLogs(entries: ContainerLogEntry[], sortBy: LogsSortOption): ContainerLogEntry[] {
  const out = [...entries]
  out.sort((a, b) => {
    if (sortBy === 'size_desc') return b.size_bytes - a.size_bytes
    if (sortBy === 'size_asc') return a.size_bytes - b.size_bytes
    if (sortBy === 'time_desc' || sortBy === 'time_asc') {
      const ba = logLabelBlockNum(a.label) ?? -1
      const bb = logLabelBlockNum(b.label) ?? -1
      if (ba !== bb) return sortBy === 'time_desc' ? bb - ba : ba - bb
      return a.label.localeCompare(b.label)
    }
    const na = logLabelUidDigits(a.label)
    const nb = logLabelUidDigits(b.label)
    const va = na != null ? parseInt(na, 10) : Number.POSITIVE_INFINITY
    const vb = nb != null ? parseInt(nb, 10) : Number.POSITIVE_INFINITY
    if (sortBy === 'uid_asc') {
      if (va !== vb) return va - vb
      return a.label.localeCompare(b.label)
    }
    if (va !== vb) return vb - va
    return a.label.localeCompare(b.label)
  })
  return out
}

export function LogsSection() {
  const logs = usePoll(fetchContainerLogs, 60_000)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [logText, setLogText] = useState<string | null>(null)
  const [logLoading, setLogLoading] = useState(false)
  const logViewerRef = useRef<HTMLPreElement>(null)

  const [uidFilter, setUidFilter] = useState('')
  const [hotkeyFilter, setHotkeyFilter] = useState('')
  const [sortBy, setSortBy] = useState<LogsSortOption>('size_desc')
  const [excludeBaseline, setExcludeBaseline] = useState(false)

  const list = logs.data?.logs ?? []

  const processedLogs = useMemo(() => {
    const filtered = list.filter(
      (log) =>
        uidFilterMatches(log.label, uidFilter) &&
        hotkeyFilterMatches(log.label, hotkeyFilter) &&
        (!excludeBaseline || !log.label.toLowerCase().startsWith('baseline')),
    )
    return sortLogs(filtered, sortBy)
  }, [list, uidFilter, hotkeyFilter, sortBy, excludeBaseline])

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
    fetchContainerLog(selectedLabel)
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
            UID
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3"
              value={uidFilter}
              onChange={(e) => setUidFilter(e.target.value)}
              className={inputCls}
              aria-label="Filter logs by miner UID"
            />
          </label>
          <label className={labelCls}>
            Hotkey
            <input
              type="text"
              autoComplete="off"
              placeholder="Substring in label"
              value={hotkeyFilter}
              onChange={(e) => setHotkeyFilter(e.target.value)}
              className={inputCls}
              aria-label="Filter logs by hotkey substring"
            />
          </label>
          <label className={`${labelCls} sm:min-w-[12rem]`}>
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LogsSortOption)}
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
          <label className="mt-auto flex cursor-pointer items-center gap-2 pb-1.5">
            <input
              type="checkbox"
              checked={excludeBaseline}
              onChange={(e) => setExcludeBaseline(e.target.checked)}
              className="accent-accent h-3.5 w-3.5 cursor-pointer rounded"
              aria-label="Exclude baseline logs"
            />
            <span className="text-secondary font-mono text-[0.68rem] select-none">
              Exclude baseline
            </span>
          </label>
        </div>
        {!logs.loading && list.length > 0 && (
          <p className="text-secondary/35 mt-2 font-mono text-[0.62rem]">
            Showing {processedLogs.length} of {list.length} log{list.length === 1 ? '' : 's'}
          </p>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <GlassCard className="p-3">
          <div className="text-secondary/40 mb-2 px-2 font-mono text-[0.58rem] font-semibold tracking-[0.18em] uppercase">
            Container Logs
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
              {processedLogs.map((log) => (
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
                  <span className="min-w-0 truncate font-mono text-[0.68rem]">{log.label}</span>
                  <span className="text-secondary/30 ml-2 shrink-0 font-mono text-[0.58rem]">
                    {fmtBytes(log.size_bytes)}
                  </span>
                </button>
              ))}
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
