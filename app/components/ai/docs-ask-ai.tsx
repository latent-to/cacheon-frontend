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
import { Loader2, MessageCircle, RefreshCw, Search, Send, Sparkles, X } from 'lucide-react'
import { useChat, type UseChatHelpers } from '@ai-sdk/react'
import { DefaultChatTransport, type UIToolInvocation } from 'ai'
import { Button } from '~/components/ui/button'
import { Markdown } from '~/components/markdown'
import { cn } from '~/lib/cn'
import type { ChatUIMessage, SearchTool } from '~/components/ai/types'

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
    <button
      type="button"
      aria-label="Ask Cacheon"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'border-border/80 bg-btn-primary text-btn-primary-fg fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-lg transition-[translate,opacity] hover:opacity-90',
        open && 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      onClick={() => setOpen(true)}
      {...props}
    >
      <Sparkles className="size-4" />
      Ask AI
    </button>
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
        className="border-border/80 bg-surface text-primary fixed right-4 bottom-4 z-50 flex h-[min(88vh,900px)] w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <PanelHeader onClose={() => setOpen(false)} />
        <MessageList />
        <PanelFooter />
      </div>
    </>
  )
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-border/60 flex shrink-0 items-start gap-2 border-b px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Ask Cacheon</p>
        <p className="text-secondary mt-0.5 text-xs">
          Answers from docs. Verify before acting on them.
        </p>
      </div>
      <button
        type="button"
        aria-label="Close"
        className="text-secondary hover:text-primary rounded-full p-1 transition-colors"
        onClick={onClose}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

function PanelFooter() {
  const { messages, status, setMessages, regenerate } = useChatContext()
  const isLoading = status === 'streaming' || status === 'submitted'
  const showActions = messages.length > 0

  return (
    <div className="border-border/60 shrink-0 border-t p-3">
      <ChatInput />
      {showActions ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
        className="border-border/60 bg-surface-raised text-primary placeholder:text-secondary/50 focus:border-accent/40 max-h-28 min-h-10 flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
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
          className="shrink-0 rounded-full px-3 py-2"
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin" />
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          className="shrink-0 rounded-full px-3 py-2"
          disabled={input.trim().length === 0}
        >
          <Send className="size-4" />
        </Button>
      )}
    </form>
  )
}

function MessageList() {
  const chat = useChatContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const messages = chat.messages.filter((msg) => msg.role !== 'system')
  const isLoading = chat.status === 'streaming' || chat.status === 'submitted'

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, chat.status])

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      {messages.length === 0 ? (
        <div className="text-secondary flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center text-sm">
          <MessageCircle className="size-8 opacity-40" />
          <p>Ask about miners, scoring, validators, or setup.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {chat.error ? (
            <div className="border-border/60 bg-surface-raised rounded-lg border p-3 text-sm">
              <p className="text-secondary text-xs">Request failed</p>
              <p className="mt-1">{chat.error.message}</p>
            </div>
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
    </div>
  )
}

function ChatMessage({ message, isStreaming }: { message: ChatUIMessage; isStreaming?: boolean }) {
  let markdown = ''
  let searchStatus: UIToolInvocation<SearchTool> | null = null

  for (const part of message.parts ?? []) {
    if (part.type === 'text') {
      markdown += part.text
      continue
    }
    if (!part.type.startsWith('tool-')) continue

    const toolName = part.type.slice('tool-'.length)
    if (toolName !== 'search') continue

    const call = part as UIToolInvocation<SearchTool>
    if (!call.toolCallId) continue
    searchStatus = call
  }

  const label = message.role === 'user' ? 'You' : 'Cacheon'

  return (
    <div>
      <p
        className={cn(
          'text-secondary mb-1.5 text-xs font-medium tracking-wide uppercase',
          message.role === 'assistant' && 'text-accent',
        )}
      >
        {label}
      </p>
      {markdown ? (
        <div className="prose prose-invert max-w-none text-sm [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
          <Markdown text={markdown} />
        </div>
      ) : isStreaming ? (
        <p className="text-secondary text-sm">Thinking…</p>
      ) : message.role === 'assistant' && searchStatus?.output ? (
        <p className="text-secondary text-sm">
          Search finished but no answer was returned. Try again or rephrase your question.
        </p>
      ) : null}
      <SearchStatus call={searchStatus} />
    </div>
  )
}

function SearchStatus({ call }: { call: UIToolInvocation<SearchTool> | null }) {
  if (!call) return null
  if (call.state === 'output-error' || call.state === 'output-denied') {
    return (
      <p className="text-secondary mt-2 flex items-center gap-1.5 text-xs">
        <Search className="size-3.5 shrink-0" />
        Docs search failed
      </p>
    )
  }
  if (
    call.state === 'input-streaming' ||
    call.state === 'input-available' ||
    call.state === 'approval-requested'
  ) {
    return (
      <p className="text-secondary mt-2 flex items-center gap-1.5 text-xs">
        <Search className="size-3.5 shrink-0 animate-pulse" />
        Searching docs…
      </p>
    )
  }
  if (!call.output) return null
  const count = Array.isArray(call.output) ? call.output.length : 0
  if (count === 0) return null

  return (
    <p className="text-secondary mt-2 flex items-center gap-1.5 text-xs">
      <Search className="size-3.5 shrink-0" />
      Found {count} doc{count === 1 ? '' : 's'}
    </p>
  )
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
