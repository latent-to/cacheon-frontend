import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '~/lib/cn'
import { fmtBytes, Skeleton } from './shared'
import { CopyButton } from '~/components/ui/copy-button'
import { CloseButton } from '~/components/ui/close-button'

export interface LogEntry {
  label: string
  size_bytes: number
}

interface LogViewerProps {
  entries: LogEntry[]
  loading: boolean
  error: boolean
  fetchLog: (label: string) => Promise<string>
  renderLabel?: (entry: LogEntry) => ReactNode
  title: string
  /** Optional controls to render above the list in the sidebar */
  sidebarControls?: ReactNode
  /** Optional footer line (e.g. "Showing X of Y") */
  sidebarFooter?: ReactNode
}

export function LogViewer({
  entries,
  loading,
  error,
  fetchLog,
  renderLabel,
  title,
  sidebarControls,
  sidebarFooter,
}: LogViewerProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [logText, setLogText] = useState<string | null>(null)
  const [logLoading, setLogLoading] = useState(false)
  const logViewerRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!selectedLabel) return
    if (!entries.some((l) => l.label === selectedLabel)) setSelectedLabel(null)
  }, [entries, selectedLabel])

  useEffect(() => {
    if (!selectedLabel) {
      setLogText(null)
      return
    }
    let cancelled = false
    setLogLoading(true)
    setLogText(null)
    fetchLog(selectedLabel)
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
  }, [selectedLabel, fetchLog])

  const empty = !loading && entries.length === 0

  return (
    <div
      className="border-border/60 bg-surface/60 overflow-hidden rounded-xl border backdrop-blur-sm"
      style={{ minHeight: '520px', display: 'flex', height: '600px' }}
    >
      {/* ── Sidebar ── */}
      <div className="border-border/40 flex w-64 shrink-0 flex-col border-r">
        {/* Controls slot */}
        {sidebarControls && <div className="border-border/40 border-b p-3">{sidebarControls}</div>}

        {/* Section label */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <span className="text-secondary/50 font-mono text-xs font-semibold tracking-[0.12em] uppercase">
            {title}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-1.5 pb-2">
          {loading ? (
            <div className="space-y-1.5 px-1 pt-1">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-secondary/50 px-2 py-4 font-mono text-xs">Could not load data</div>
          ) : empty ? (
            <div className="text-secondary/40 px-2 py-6 text-center font-mono text-xs">
              No logs available
            </div>
          ) : (
            entries.map((log) => (
              <button
                key={log.label}
                type="button"
                onClick={() => setSelectedLabel(log.label === selectedLabel ? null : log.label)}
                className={cn(
                  'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border-none bg-transparent px-2 py-1.5 text-left transition-colors',
                  selectedLabel === log.label
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary/70 hover:text-primary hover:bg-white/[0.04]',
                )}
              >
                <span className="min-w-0 truncate font-mono text-xs">
                  {renderLabel ? renderLabel(log) : log.label}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[0.6rem] tabular-nums transition-colors',
                    selectedLabel === log.label
                      ? 'text-accent/60'
                      : 'text-secondary/30 group-hover:text-secondary/50',
                  )}
                >
                  {fmtBytes(log.size_bytes)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {sidebarFooter && (
          <div className="border-border/40 border-t px-3 py-2">{sidebarFooter}</div>
        )}
      </div>

      {/* ── Viewer pane ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!selectedLabel ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="text-secondary/25 font-mono text-sm">Select a log file to view</div>
            <div className="text-secondary/15 font-mono text-xs">
              {entries.length > 0
                ? `${entries.length} file${entries.length !== 1 ? 's' : ''} available`
                : ''}
            </div>
          </div>
        ) : logLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-5 w-40" />
          </div>
        ) : (
          <>
            <div className="border-border/40 flex shrink-0 items-center justify-between border-b bg-white/[0.02] px-4 py-2.5">
              <span className="text-accent min-w-0 truncate font-mono text-xs font-semibold">
                {selectedLabel}
              </span>
              <div className="ml-2 flex shrink-0 items-center gap-0.5">
                {logText && <CopyButton value={logText} className="p-1" />}
                <CloseButton onClick={() => setSelectedLabel(null)} size={13} />
              </div>
            </div>
            <pre
              ref={logViewerRef}
              className="bg-bg/60 text-secondary/75 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-[1.7] break-all whitespace-pre-wrap"
            >
              {logText}
            </pre>
          </>
        )}
      </div>
    </div>
  )
}
