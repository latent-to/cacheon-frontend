import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { cn } from '~/lib/cn'
import { findBaselineScoringLogLabel, findContainerLogLabel } from '~/lib/eval-gates'
import { usePoll } from '~/lib/use-poll'
import { fetchContainerLogs, fetchContainerLog, type ContainerLogEntry } from '~/lib/api.client'
import { LogViewer, type LogEntry } from './log-viewer'

function logLabelUidDigits(label: string): string | null {
  const m = /^uid(\d+)_/i.exec(label)
  return m ? m[1] : null
}

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
  { value: 'size_desc', label: 'Size ↓' },
  { value: 'size_asc', label: 'Size ↑' },
  { value: 'uid_asc', label: 'UID ↑' },
  { value: 'uid_desc', label: 'UID ↓' },
  { value: 'time_desc', label: 'Time ↓' },
  { value: 'time_asc', label: 'Time ↑' },
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

const compactInputCls =
  'w-full min-w-0 rounded border border-border/50 bg-surface/40 px-2 py-1 font-mono text-xs text-primary outline-none placeholder:text-secondary/30 focus:border-accent/40'

export function LogsSection() {
  const [searchParams] = useSearchParams()
  const logs = usePoll(fetchContainerLogs, 60_000)
  const [uidFilter, setUidFilter] = useState('')
  const [hotkeyFilter, setHotkeyFilter] = useState('')
  const [sortBy, setSortBy] = useState<LogsSortOption>('size_desc')
  const [excludeBaseline, setExcludeBaseline] = useState(false)

  useEffect(() => {
    const uid = searchParams.get('uid')
    if (uid) setUidFilter(uid)
  }, [searchParams])

  const list = logs.data?.logs ?? []

  const initialSelectedLabel = useMemo(() => {
    const labels = list.map((l) => l.label)
    const labelParam = searchParams.get('label')
    if (labelParam && labels.includes(labelParam)) {
      return labelParam
    }
    const blockParam = searchParams.get('block')
    if (blockParam) {
      const block = parseInt(blockParam, 10)
      if (Number.isFinite(block)) {
        const scoring = findBaselineScoringLogLabel(labels, block)
        if (scoring) return scoring
      }
    }
    const uidParam = searchParams.get('uid')
    if (!uidParam || !blockParam) return null
    const uid = parseInt(uidParam, 10)
    const block = parseInt(blockParam, 10)
    if (!Number.isFinite(uid) || !Number.isFinite(block)) return null
    return findContainerLogLabel(labels, uid, block)
  }, [searchParams, list])

  const processedLogs: LogEntry[] = useMemo(() => {
    const filtered = list.filter(
      (log) =>
        uidFilterMatches(log.label, uidFilter) &&
        hotkeyFilterMatches(log.label, hotkeyFilter) &&
        (!excludeBaseline || !log.label.toLowerCase().startsWith('baseline')),
    )
    return sortLogs(filtered, sortBy)
  }, [list, uidFilter, hotkeyFilter, sortBy, excludeBaseline])

  const fetchLog = useCallback((label: string) => fetchContainerLog(label), [])

  const emptyMessage =
    list.length > 0 && processedLogs.length === 0
      ? 'No logs match your filters'
      : 'No logs available'

  const controls = (
    <div className="space-y-2.5">
      <div className="text-secondary/55 font-mono text-xs font-semibold tracking-[0.1em] uppercase">
        Filter &amp; sort
      </div>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Filter by UID…"
        value={uidFilter}
        onChange={(e) => setUidFilter(e.target.value)}
        className={compactInputCls}
        aria-label="Filter logs by miner UID"
      />
      <input
        type="text"
        autoComplete="off"
        placeholder="Filter by hotkey…"
        value={hotkeyFilter}
        onChange={(e) => setHotkeyFilter(e.target.value)}
        className={compactInputCls}
        aria-label="Filter logs by hotkey substring"
      />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as LogsSortOption)}
        className={cn(compactInputCls, 'cursor-pointer')}
        aria-label="Sort log files"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={excludeBaseline}
          onChange={(e) => setExcludeBaseline(e.target.checked)}
          className="accent-accent h-3 w-3 cursor-pointer rounded"
          aria-label="Exclude baseline logs"
        />
        <span className="text-secondary/70 font-mono text-xs select-none">Hide baseline</span>
      </label>
    </div>
  )

  const footer =
    !logs.loading && list.length > 0 ? (
      <p className="text-secondary/50 font-mono text-xs">
        {processedLogs.length} / {list.length} log{list.length === 1 ? '' : 's'}
      </p>
    ) : undefined

  return (
    <section>
      <LogViewer
        entries={processedLogs}
        loading={logs.loading}
        error={!!logs.error}
        fetchLog={fetchLog}
        title="Container Logs"
        emptyMessage={emptyMessage}
        sidebarControls={controls}
        sidebarFooter={footer}
        initialSelectedLabel={initialSelectedLabel}
      />
    </section>
  )
}
