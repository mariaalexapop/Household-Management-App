'use client'

import { useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { X } from 'lucide-react'
import { useChatbot } from './ChatbotProvider'
import { MessageList, type HistoricalMessage, type ProcedurePayload } from './MessageList'
import { MessageInput } from './MessageInput'
import { ProcedurePreviewModal } from './ProcedurePreviewModal'
import { createConversation, loadHistory } from '@/app/actions/chat'

/**
 * 420px right-side dock panel that wires useChat + DefaultChatTransport
 * to the /api/chat streaming endpoint. Lazily creates a conversation on
 * first open and loads historical messages from the DB.
 */
export function ChatbotDock() {
  const { isOpen, close, conversationId, setConversationId } = useChatbot()
  const [historical, setHistorical] = useState<HistoricalMessage[]>([])
  const [pendingProcedure, setPendingProcedure] = useState<ProcedurePayload | null>(null)

  // Ensure a conversation exists on first open
  useEffect(() => {
    if (!isOpen || conversationId) return
    let cancelled = false
    ;(async () => {
      const res = await createConversation({})
      if (!cancelled && res.success && res.data) {
        setConversationId(res.data.id)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, conversationId, setConversationId])

  // Load history when conversationId becomes available
  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    ;(async () => {
      const res = await loadHistory({ conversationId })
      if (!cancelled && res.success && res.data) {
        setHistorical(
          res.data.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
            createdAt: m.createdAt,
          }))
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [conversationId])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId: conversationId ?? '' },
    }),
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop for click-outside-to-close on small screens */}
      <div
        className="fixed inset-0 z-30 bg-black/10 md:hidden"
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-0 z-40 flex flex-col bg-white shadow-2xl ring-1 ring-[#e0e2e8] sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-full sm:max-w-[420px]"
        role="dialog"
        aria-label="Household assistant"
      >
        <header className="flex items-center justify-between border-b border-[#e0e2e8] bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1c1c1e]">
              Household assistant
            </h2>
            <p className="font-body text-xs text-[#555a6a]">
              Ask about your documents or schedule
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-2 text-[#555a6a] transition hover:bg-[#f0f0f2] hover:text-[#1c1c1e]"
            aria-label="Close assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <MessageList
          messages={messages}
          historicalMessages={historical}
          status={status}
          onProcedure={(proc) => setPendingProcedure(proc)}
        />

        <MessageInput
          disabled={status !== 'ready' || !conversationId}
          onSend={(text) => {
            void sendMessage({ text })
          }}
        />
      </aside>

      {pendingProcedure ? (
        <ProcedurePreviewModal
          procedure={pendingProcedure}
          onClose={() => setPendingProcedure(null)}
          onCreated={() => setPendingProcedure(null)}
        />
      ) : null}
    </>
  )
}
