'use client'

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useChat, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIToolInvocation } from 'ai'
import { ScrollArea, ScrollViewport } from 'fumadocs-ui/components/ui/scroll-area'
import { GlassCard } from '~/components/dashboard/shared'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Markdown } from '~/components/markdown'
import { cn } from '~/lib/cn'
import {
  processAssistantCitations,
  uniqueCitations,
  type Citation,
} from '~/components/ai/citations'
import type { ChatUIMessage, SearchResult, SearchTool } from '~/components/ai/types'

const STORAGE_KEY = '__docs_ask_ai_input'

const Context = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  chat: UseChatHelpers<ChatUIMessage>
} | null>(null)

const CHAT_TIMEOUT_MS = 90_000

export function DocsAskAI({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const chat = useChat<ChatUIMessage>({
    id: 'docs-ask-ai',
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  useEffect(() => {
    if (chat.status !== 'streaming' && chat.status !== 'submitted') return
    const timer = window.setTimeout(() => chat.stop(), CHAT_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [chat.status, chat.stop])

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>{children}</Context>
  )
}

export function DocsAskAITrigger({ className, ...props }: ComponentProps<'button'>) {
  const { open, setOpen } = useContext()

  return (
    <Button
      type="button"
      variant="primary"
      aria-label="Ask Cacheon"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'fixed right-4 bottom-4 z-40 rounded-full px-4 py-2.5 text-sm shadow-lg transition-[translate,opacity]',
        open && 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      onClick={() => setOpen(true)}
      {...props}
    >
      <Sparkles className="size-4" />
      Ask AI
    </Button>
  )
}

export function DocsAskAIPanel() {
  const { open, setOpen } = useContext()
  useHotKey()

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Ask Cacheon"
        className="fixed right-4 bottom-4 z-50 h-[min(88vh,900px)] w-[min(720px,calc(100vw-2rem))]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <GlassCard className="border-border/80 bg-surface/95 text-primary shadow-accent-lg flex size-full flex-col overflow-hidden rounded-2xl backdrop-blur-md">
          <PanelHeader onClose={() => setOpen(false)} />
          <MessageList />
          <PanelFooter />
        </GlassCard>
      </div>
    </>
  )
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  const { status } = useChatContext()
  const isLoading = status === 'streaming' || status === 'submitted'

  return (
    <div className="border-border/60 flex shrink-0 items-center gap-3 border-b px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Ask Cacheon</p>
          {isLoading ? (
            <Badge variant="accent" dot>
              Answering
            </Badge>
          ) : (
            <Badge variant="neutral">Docs assistant</Badge>
          )}
        </div>
        <p className="text-secondary mt-1 text-xs">
          AI may make mistakes. Verify answers in the docs before you act.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        aria-label="Close"
        className="size-9 shrink-0 rounded-full p-0"
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

function PanelFooter() {
  const { messages, status, setMessages, regenerate } = useChatContext()
  const isLoading = status === 'streaming' || status === 'submitted'
  const showActions = messages.length > 0

  return (
    <div className="border-border/60 shrink-0 space-y-2 border-t p-3">
      <GlassCard className="p-2">
        <ChatInput />
      </GlassCard>
      {showActions ? (
        <div className="flex items-center gap-2">
          {!isLoading && messages.at(-1)?.role === 'assistant' ? (
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-3 py-1.5 text-xs"
              onClick={() => regenerate()}
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="rounded-full px-3 py-1.5 text-xs"
            onClick={() => setMessages([])}
          >
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ChatInput() {
  const { status, sendMessage, stop } = useChatContext()
  const [input, setInput] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const isLoading = status === 'streaming' || status === 'submitted'

  const submit = (e?: SyntheticEvent) => {
    e?.preventDefault()
    const message = input.trim()
    if (!message) return

    void sendMessage({
      role: 'user',
      parts: [
        { type: 'data-client', data: { location: location.href } },
        { type: 'text', text: message },
      ],
    })
    setInput('')
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <form className="flex items-end gap-2" onSubmit={submit}>
      <textarea
        value={input}
        rows={1}
        placeholder={isLoading ? 'Answering…' : 'Ask about Cacheon docs…'}
        disabled={isLoading}
        className="border-border/60 bg-surface-raised/80 text-primary placeholder:text-secondary/50 focus:border-accent/40 max-h-28 min-h-10 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
        onChange={(e) => {
          setInput(e.target.value)
          localStorage.setItem(STORAGE_KEY, e.target.value)
        }}
        onKeyDown={(e) => {
          if (!e.shiftKey && e.key === 'Enter') submit(e)
        }}
      />
      {isLoading ? (
        <Button
          type="button"
          variant="secondary"
          aria-label="Stop"
          className="size-10 shrink-0 rounded-full p-0"
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin" />
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          aria-label="Send"
          disabled={input.trim().length === 0}
          className="size-10 shrink-0 rounded-full p-0 disabled:opacity-40"
        >
          <Send className="size-4" />
        </Button>
      )}
    </form>
  )
}

function MessageList() {
  const chat = useChatContext()
  const viewportRef = useRef<HTMLDivElement>(null)
  const messages = chat.messages.filter((msg) => msg.role !== 'system')
  const isLoading = chat.status === 'streaming' || chat.status === 'submitted'

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, chat.status])

  return (
    <ScrollArea className="min-h-0 flex-1">
      <ScrollViewport ref={viewportRef} className="px-4 py-3">
        {messages.length === 0 ? (
          <GlassCard className="text-secondary flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
            <MessageCircle className="text-accent size-10 opacity-60" />
            <p>Ask about miners, scoring, validators, or setup.</p>
            <Badge variant="neutral">Cmd/Ctrl + / to open</Badge>
          </GlassCard>
        ) : (
          <div className="flex flex-col gap-3">
            {chat.error ? (
              <GlassCard className="border-error/30 w-fit max-w-full p-3">
                <Badge variant="error" className="mb-2">
                  Request failed
                </Badge>
                <p className="text-sm">{chat.error.message}</p>
              </GlassCard>
            ) : null}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isLoading && message.id === messages.at(-1)?.id}
              />
            ))}
          </div>
        )}
      </ScrollViewport>
    </ScrollArea>
  )
}

function ChatMessage({ message, isStreaming }: { message: ChatUIMessage; isStreaming?: boolean }) {
  const parsed = parseAssistantParts(message.parts ?? [])
  const citationContent = useMemo(
    () =>
      message.role === 'assistant'
        ? processAssistantCitations(parsed.markdown, parsed.sources)
        : { markdown: parsed.markdown, citations: [] as Citation[] },
    [message.role, parsed.markdown, parsed.sources],
  )
  const searchStatus =
    [...parsed.searchCalls].reverse().find((call) => call.output != null) ??
    parsed.searchCalls.at(-1) ??
    null

  const isUser = message.role === 'user'
  const hasContent = citationContent.markdown.trim().length > 0
  const citations = uniqueCitations(citationContent.citations)
  const reasoningText = parsed.reasoning.join('\n\n').trim()
  const searchComplete = isSearchComplete(
    parsed.searchCalls,
    parsed.sources,
    hasContent,
    searchStatus,
  )
  const showReasoning =
    isStreaming && reasoningText.length > 0 && (parsed.reasoningStreaming || !hasContent)
  const showThinking =
    isStreaming &&
    !hasContent &&
    !showReasoning &&
    !searchComplete &&
    parsed.searchCalls.length === 0
  const showSearching = isStreaming && !searchComplete && parsed.searchCalls.length > 0
  const showSearchError =
    getSearchPhase(searchStatus) === 'error' &&
    !parsed.searchCalls.some((call) => call.output != null)
  const hasSearchParts = parsed.searchCalls.length > 0
  const showEmptyFallback =
    !hasContent && !isStreaming && message.role === 'assistant' && hasSearchParts
  const showStatusStack = showThinking || showSearching || showSearchError || showReasoning
  const showTrace =
    message.role === 'assistant' &&
    (hasSearchParts || parsed.reasoning.length > 0 || parsed.stepCount > 0)
  const hasBody = hasContent || showStatusStack || showEmptyFallback || showTrace

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <GlassCard className={cn('w-fit max-w-[94%] border-0 p-3', isUser && 'bg-surface-raised/70')}>
        {isUser ? (
          <Badge variant="neutral" className={cn(hasContent && 'mb-2')}>
            You
          </Badge>
        ) : (
          <>
            <Badge variant="accent" className={cn(hasBody && 'mb-2')}>
              Cacheon
            </Badge>
            {showStatusStack ? (
              <div className="mb-2 flex flex-col items-start gap-2">
                {showThinking ? (
                  <div className="text-secondary flex items-center gap-2 text-sm">
                    <Loader2 className="size-3.5 animate-spin" />
                    Thinking…
                  </div>
                ) : null}
                {showReasoning ? <ReasoningPreview text={reasoningText} streaming /> : null}
                {showSearching || showSearchError ? <SearchStatus call={searchStatus} /> : null}
              </div>
            ) : null}
          </>
        )}

        {hasContent ? (
          <div className="prose prose-invert [&_a]:text-accent max-w-none text-sm [&_a]:underline-offset-2 hover:[&_a]:underline [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
            <Markdown text={citationContent.markdown} />
            {citations.length > 0 ? <CitationSources citations={citations} /> : null}
          </div>
        ) : null}

        {showEmptyFallback ? (
          <p className="text-secondary text-sm">
            Search finished but no answer was returned. Try again or rephrase your question.
          </p>
        ) : null}

        {showTrace ? (
          <MessageTrace
            searchCalls={parsed.searchCalls}
            sources={parsed.sources}
            reasoning={parsed.reasoning}
            stepCount={parsed.stepCount}
            hasAnswer={hasContent}
            isStreaming={!!isStreaming}
          />
        ) : null}
      </GlassCard>
    </div>
  )
}

function parseAssistantParts(parts: ChatUIMessage['parts']) {
  let markdown = ''
  const searchCalls: UIToolInvocation<SearchTool>[] = []
  const reasoning: string[] = []
  let reasoningStreaming = false
  let stepCount = 0

  for (const part of parts) {
    if (part.type === 'text') {
      markdown += part.text
      continue
    }
    if (part.type === 'step-start') {
      stepCount += 1
      continue
    }
    if (part.type === 'reasoning' && 'text' in part && typeof part.text === 'string') {
      reasoning.push(part.text)
      if ('state' in part && part.state === 'streaming') reasoningStreaming = true
      continue
    }
    if (!part.type.startsWith('tool-')) continue

    const toolName = part.type.slice('tool-'.length)
    if (toolName !== 'search') continue

    const call = part as UIToolInvocation<SearchTool>
    if (!call.toolCallId) continue
    searchCalls.push(call)
  }

  return {
    markdown,
    searchCalls,
    reasoning,
    reasoningStreaming,
    stepCount,
    sources: collectSources(searchCalls),
  }
}

function CitationSources({ citations }: { citations: Citation[] }) {
  return (
    <div className="border-border/25 mt-3 border-t pt-2.5 not-prose">
      <p className="text-secondary/45 mb-1.5 text-[10px] tracking-wider uppercase">Sources</p>
      <ul className="space-y-1.5">
        {citations.map((citation) => (
          <li key={citation.url}>
            <a
              href={citation.url}
              className="text-secondary/75 hover:text-accent group/link inline-flex items-start gap-1.5 text-sm transition-colors"
            >
              <ExternalLink className="mt-0.5 size-3 shrink-0 opacity-50 group-hover/link:opacity-80" />
              <span className="min-w-0">
                <span className="block">{citation.title}</span>
                <span className="text-secondary/40 block text-[11px]">{citation.url}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function collectSources(searchCalls: UIToolInvocation<SearchTool>[]) {
  const byUrl = new Map<string, SearchResult>()

  for (const call of searchCalls) {
    if (!Array.isArray(call.output)) continue
    for (const result of call.output) {
      if (!result?.url || byUrl.has(result.url)) continue
      byUrl.set(result.url, result)
    }
  }

  return [...byUrl.values()]
}

function getSearchQuery(call: UIToolInvocation<SearchTool> | null | undefined) {
  if (!call) return null
  const input = call.input
  if (input && typeof input === 'object' && 'query' in input && typeof input.query === 'string') {
    return input.query
  }
  return null
}

function MessageTrace({
  searchCalls,
  sources,
  reasoning,
  stepCount,
  hasAnswer,
  isStreaming,
}: {
  searchCalls: UIToolInvocation<SearchTool>[]
  sources: SearchResult[]
  reasoning: string[]
  stepCount: number
  hasAnswer: boolean
  isStreaming: boolean
}) {
  const completedSearch =
    [...searchCalls].reverse().find((call) => call.output != null) ?? searchCalls.at(-1) ?? null
  const lastSearch = searchCalls.at(-1)
  const query = getSearchQuery(completedSearch) ?? getSearchQuery(lastSearch)
  const resultCount = completedSearch?.output?.length ?? 0
  const searchDone = isSearchComplete(searchCalls, sources, hasAnswer, completedSearch)
  const hasSearchOutput = searchCalls.some((call) => call.output != null)
  const searchFailed =
    !hasSearchOutput &&
    searchCalls.some((call) => call.state === 'output-error' || call.state === 'output-denied')

  const stepItems: { label: string; detail?: string; status: 'done' | 'active' | 'error' }[] = []

  const reasoningText = reasoning.join('\n\n').trim()

  if (reasoningText.length > 0) {
    stepItems.push({
      label: 'Reasoning',
      status: isStreaming && !hasAnswer ? 'active' : 'done',
    })
  }

  if (searchCalls.length > 0) {
    const searchStatus = searchFailed
      ? 'error'
      : searchDone
        ? 'done'
        : isStreaming
          ? 'active'
          : 'done'
    stepItems.push({
      label: 'Search docs',
      status: searchStatus,
      detail:
        searchStatus === 'done' && query
          ? `"${query}" · ${resultCount} result${resultCount === 1 ? '' : 's'}`
          : query
            ? `"${query}"`
            : undefined,
    })
  }

  if (hasAnswer) {
    stepItems.push({ label: 'Write answer', status: isStreaming ? 'active' : 'done' })
  } else if (!isStreaming && searchDone && !searchFailed) {
    stepItems.push({ label: 'Write answer', status: 'error' })
  } else if (isStreaming && searchDone && !searchFailed) {
    stepItems.push({ label: 'Write answer', status: 'active' })
  }

  const toolsUsed = searchCalls.length > 0 ? ['search'] : []
  const hasDetails =
    stepItems.length > 0 || sources.length > 0 || reasoning.length > 0 || toolsUsed.length > 0

  if (!hasDetails) return null

  return (
    <details className="border-border/20 group mt-3 border-t border-dashed pt-2.5">
      <summary className="text-secondary/45 hover:text-secondary/70 flex cursor-pointer list-none items-center gap-1.5 text-[11px] transition-colors [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-3 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
        <span>How this was answered</span>
        {sources.length > 0 ? (
          <span className="text-secondary/35">
            · {sources.length} source{sources.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </summary>

      <div className="mt-2.5 space-y-3 text-[11px]">
        {toolsUsed.length > 0 ? (
          <div>
            <p className="text-secondary/40 mb-1 text-[10px] tracking-wider uppercase">Tools</p>
            <div className="flex flex-wrap gap-1">
              {toolsUsed.map((tool) => (
                <span
                  key={tool}
                  className="bg-surface-raised/50 text-secondary/60 rounded px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {stepItems.length > 0 ? (
          <div>
            <p className="text-secondary/40 mb-1 text-[10px] tracking-wider uppercase">Steps</p>
            <ol className="space-y-1">
              {stepItems.map((step, index) => (
                <li key={`${step.label}-${index}`} className="flex items-start gap-2">
                  <StepStatusIcon status={step.status} />
                  <span className="min-w-0">
                    <span className="text-secondary/75">{step.label}</span>
                    {step.detail ? (
                      <span className="text-secondary/45 block truncate">{step.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
            {stepCount > stepItems.length ? (
              <p className="text-secondary/35 mt-1">{stepCount} model steps total</p>
            ) : null}
          </div>
        ) : null}

        {sources.length > 0 ? (
          <div>
            <p className="text-secondary/40 mb-1 text-[10px] tracking-wider uppercase">
              Referenced docs
            </p>
            <ul className="space-y-1.5">
              {sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    className="text-secondary/65 hover:text-accent group/link inline-flex items-start gap-1.5 transition-colors"
                  >
                    <ExternalLink className="mt-0.5 size-2.5 shrink-0 opacity-50 group-hover/link:opacity-80" />
                    <span className="min-w-0">
                      <span className="text-secondary/80 block">{source.title}</span>
                      {source.description ? (
                        <span className="text-secondary/40 line-clamp-2 block">
                          {source.description}
                        </span>
                      ) : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {reasoning.length > 0 && !isStreaming ? (
          <div>
            <p className="text-secondary/40 mb-1 text-[10px] tracking-wider uppercase">Reasoning</p>
            <ReasoningPreview text={reasoning.join('\n\n')} />
          </div>
        ) : null}
      </div>
    </details>
  )
}

function ReasoningPreview({ text, streaming }: { text: string; streaming?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [text])

  return (
    <div className="w-full">
      {streaming ? (
        <span className="text-secondary/50 mb-1.5 flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
          <Loader2 className="size-2.5 animate-spin" />
          Reasoning
        </span>
      ) : null}
      <div
        ref={scrollRef}
        className="bg-surface-raised/40 text-secondary/60 border-border/15 max-h-40 overflow-y-auto rounded-md border p-2 font-mono text-[0.65rem] leading-relaxed whitespace-pre-wrap"
      >
        {text}
      </div>
    </div>
  )
}

function isSearchComplete(
  searchCalls: UIToolInvocation<SearchTool>[],
  sources: SearchResult[],
  hasAnswer: boolean,
  latestCall: UIToolInvocation<SearchTool> | null,
) {
  if (searchCalls.length === 0) return false
  if (searchCalls.some((call) => call.output != null)) return true
  if (sources.length > 0) return true
  if (hasAnswer) return true
  if (getSearchPhase(latestCall) === 'done') return true
  return false
}

function StepStatusIcon({ status }: { status: 'done' | 'active' | 'error' }) {
  if (status === 'active') {
    return <Loader2 className="text-secondary/40 mt-0.5 size-2.5 shrink-0 animate-spin" />
  }
  if (status === 'error') {
    return <span className="bg-error/70 mt-1 size-1.5 shrink-0 rounded-full" />
  }
  return <span className="bg-secondary/30 mt-1 size-1.5 shrink-0 rounded-full" />
}

function getSearchPhase(call: UIToolInvocation<SearchTool> | null) {
  if (!call) return null
  if (call.state === 'output-error' || call.state === 'output-denied') return 'error'
  if (call.output != null) return 'done'
  if (
    call.state === 'input-streaming' ||
    call.state === 'input-available' ||
    call.state === 'approval-requested'
  ) {
    return 'searching'
  }
  return null
}

function SearchStatus({ call }: { call: UIToolInvocation<SearchTool> | null }) {
  if (!call) return null

  if (call.state === 'output-error' || call.state === 'output-denied') {
    return (
      <Badge variant="error">
        <Search className="size-3" />
        Search failed
      </Badge>
    )
  }

  if (call.output != null) {
    const count = Array.isArray(call.output) ? call.output.length : 0
    if (count === 0) {
      return (
        <Badge variant="neutral">
          <Search className="size-3" />
          No results
        </Badge>
      )
    }
    return (
      <Badge variant="info">
        <Search className="size-3" />
        {count} doc{count === 1 ? '' : 's'}
      </Badge>
    )
  }

  if (
    call.state === 'input-streaming' ||
    call.state === 'input-available' ||
    call.state === 'approval-requested'
  ) {
    return (
      <Badge variant="accent" dot>
        <Search className="size-3" />
        Searching docs
      </Badge>
    )
  }

  return null
}

function useHotKey() {
  const { open, setOpen } = useContext()

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false)
      e.preventDefault()
    }
    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true)
      e.preventDefault()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress)
    return () => window.removeEventListener('keydown', onKeyPress)
  }, [])
}

function useContext() {
  return use(Context)!
}

function useChatContext() {
  return use(Context)!.chat
}
