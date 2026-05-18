import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { cn } from '~/lib/cn'
import { usePoll } from '~/lib/use-poll'
import { fetchValidatorLogs, fetchValidatorLog, type ValidatorLogEntry } from '~/lib/api.client'
import { LogViewer, type LogEntry } from './log-viewer'

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
  { value: 'time_desc', label: 'Time ↓' },
  { value: 'time_asc', label: 'Time ↑' },
  { value: 'size_desc', label: 'Size ↓' },
  { value: 'size_asc', label: 'Size ↑' },
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

function fmtLogDate(label: string): string {
  const parts = label.split('_')
  const date = parts[parts.length - 2]
  const time = parts[parts.length - 1]
  if (!date || !time || date.length !== 8 || time.length !== 6) return ''
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
}

function ValidatorLogLabel({ entry }: { entry: LogEntry }): ReactNode {
  const isGpu = entry.label.startsWith('gpu_')
  const dateStr = fmtLogDate(entry.label)
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          'shrink-0 rounded px-1 py-px font-mono text-[0.55rem] font-bold tracking-[0.1em] uppercase',
          isGpu ? 'bg-info/15 text-info' : 'bg-accent/10 text-accent',
        )}
      >
        {isGpu ? 'GPU' : 'CPU'}
      </span>
      <span className="min-w-0 truncate font-mono text-xs">{dateStr || entry.label}</span>
    </span>
  )
}

const compactInputCls =
  'w-full min-w-0 rounded border border-border/50 bg-surface/40 px-2 py-1 font-mono text-xs text-primary outline-none placeholder:text-secondary/30 focus:border-accent/40'

export function ValidatorLogsSection() {
  const logs = usePoll(fetchValidatorLogs, 60_000)
  const [logType, setLogType] = useState<LogType>('all')
  const [sortBy, setSortBy] = useState<ValidatorSortOption>('time_desc')

  const list = logs.data?.logs ?? []

  const processedLogs: LogEntry[] = useMemo(() => {
    const filtered = list.filter((log) => typeMatches(log.label, logType))
    return sortLogs(filtered, sortBy)
  }, [list, logType, sortBy])

  const fetchLog = useCallback((label: string) => fetchValidatorLog(label), [])

  const emptyMessage =
    list.length > 0 && processedLogs.length === 0
      ? 'No logs match your filters'
      : 'No logs available'

  const controls = (
    <div className="space-y-2">
      <div className="text-secondary/40 font-mono text-[0.6rem] font-semibold tracking-[0.14em] uppercase">
        Filter &amp; sort
      </div>
      {/* Type filter as pill tabs */}
      <div className="flex gap-1">
        {(['all', 'cpu', 'gpu'] as LogType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLogType(t)}
            className={cn(
              'flex-1 cursor-pointer rounded border py-1 font-mono text-[0.6rem] font-bold tracking-[0.1em] uppercase transition-colors',
              logType === t
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border/40 text-secondary/50 hover:text-primary bg-transparent',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as ValidatorSortOption)}
        className={cn(compactInputCls, 'cursor-pointer')}
        aria-label="Sort log files"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )

  const footer =
    !logs.loading && list.length > 0 ? (
      <p className="text-secondary/35 font-mono text-[0.6rem]">
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
        renderLabel={(entry) => <ValidatorLogLabel entry={entry} />}
        title="Validator Logs"
        emptyMessage={emptyMessage}
        sidebarControls={controls}
        sidebarFooter={footer}
      />
    </section>
  )
}
