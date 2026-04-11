'use client'

import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'

export interface HistoricalMessage {
  id: string
  role: string
  content: string
  toolCalls?: unknown
  createdAt?: Date | null
}

export interface ProcedurePayload {
  title: string
  steps: Array<{ title: string; description?: string }>
}

interface MessageListProps {
  messages: UIMessage[]
  historicalMessages?: HistoricalMessage[]
  status: string
  onProcedure?: (procedure: ProcedurePayload) => void
}

/**
 * Renders historical messages (loaded from DB on dock open) followed by live
 * useChat messages. Extracts `extract_procedure` tool parts and surfaces them
 * via the `onProcedure` callback so the parent dock can show the preview modal.
 */
export function MessageList({ messages, historicalMessages = [], status, onProcedure }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const seenProcedureKeysRef = useRef<Set<string>>(new Set())

  // Auto-scroll to bottom on new messages / streaming updates
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, historicalMessages, status])

  // Detect extract_procedure tool parts and surface the latest one
  useEffect(() => {
    if (!onProcedure) return
    for (const m of messages) {
      if (m.role !== 'assistant') continue
      const parts = (m.parts ?? []) as Array<Record<string, unknown>>
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const type = part.type as string | undefined
        if (!type || !type.startsWith('tool-extract_procedure')) continue
        const key = `${m.id}:${i}`
        if (seenProcedureKeysRef.current.has(key)) continue

        const input = (part.input as ProcedurePayload | undefined) ?? undefined
        if (input && Array.isArray(input.steps) && input.steps.length > 0) {
          seenProcedureKeysRef.current.add(key)
          onProcedure(input)
        }
      }
    }
  }, [messages, onProcedure])

  const hasAnyMessages = historicalMessages.length > 0 || messages.length > 0
  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-[#fafbfc] px-5 py-4"
      role="log"
      aria-live="polite"
    >
      {!hasAnyMessages ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {historicalMessages.map((m) => (
            <HistoricalBubble key={`h-${m.id}`} message={m} />
          ))}
          {messages.map((m) => (
            <LiveBubble key={m.id} message={m} />
          ))}
          {isStreaming ? <TypingIndicator /> : null}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="font-display text-base font-semibold text-[#1c1c1e]">
        Household assistant
      </p>
      <p className="mt-2 max-w-xs font-body text-sm text-[#555a6a]">
        Ask about your uploaded documents, upcoming chores, or say
        <br />
        <em>&ldquo;turn these steps into tasks&rdquo;</em> to create chores.
      </p>
    </div>
  )
}

function HistoricalBubble({ message }: { message: HistoricalMessage }) {
  const isUser = message.role === 'user'
  return (
    <li className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl bg-[#eef0ff] px-4 py-3 font-body text-sm text-[#1c1c1e]'
            : 'max-w-[85%] rounded-2xl bg-white px-4 py-3 font-body text-sm text-[#1c1c1e] ring-1 ring-[#e0e2e8]'
        }
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </li>
  )
}

function LiveBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const parts = (message.parts ?? []) as Array<Record<string, unknown>>

  return (
    <li className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl bg-[#eef0ff] px-4 py-3 font-body text-sm text-[#1c1c1e]'
            : 'max-w-[85%] space-y-1 rounded-2xl bg-white px-4 py-3 font-body text-sm text-[#1c1c1e] ring-1 ring-[#e0e2e8]'
        }
      >
        {parts.map((part, idx) => {
          const type = part.type as string | undefined
          if (type === 'text') {
            const text = (part.text as string | undefined) ?? ''
            return (
              <p key={idx} className="whitespace-pre-wrap">
                {text}
              </p>
            )
          }
          if (type && type.startsWith('tool-extract_procedure')) {
            return (
              <p
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#2a41b6]"
              >
                Procedure ready
              </p>
            )
          }
          if (type && type.startsWith('tool-')) {
            const toolName = type.replace(/^tool-/, '')
            return (
              <p key={idx} className="text-xs italic text-[#8a8f9c]">
                Used tool: {toolName}
              </p>
            )
          }
          return null
        })}
      </div>
    </li>
  )
}

function TypingIndicator() {
  return (
    <li className="flex justify-start" aria-label="Assistant is typing">
      <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#e0e2e8]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#5b76fe]" />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-[#5b76fe]"
          style={{ animationDelay: '0.15s' }}
        />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-[#5b76fe]"
          style={{ animationDelay: '0.3s' }}
        />
      </div>
    </li>
  )
}
