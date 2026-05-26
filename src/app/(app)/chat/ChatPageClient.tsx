'use client'

import { useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Sparkles } from 'lucide-react'
import { MessageList, type HistoricalMessage, type ProcedurePayload } from '@/components/chatbot/MessageList'
import { MessageInput } from '@/components/chatbot/MessageInput'
import { ProcedurePreviewModal } from '@/components/chatbot/ProcedurePreviewModal'
import { createConversation, loadHistory } from '@/app/actions/chat'

const SUGGESTED_QUESTIONS = [
  "When does our home insurance renew?",
  "Is the dishwasher still under warranty?",
  "What's coming up this week?",
  "Show me all the car key dates",
]

export function ChatPageClient() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [historical, setHistorical] = useState<HistoricalMessage[]>([])
  const [pendingProcedure, setPendingProcedure] = useState<ProcedurePayload | null>(null)

  // Create conversation on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await createConversation({})
      if (!cancelled && res.success && res.data) {
        setConversationId(res.data.id)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Load history
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
    return () => { cancelled = true }
  }, [conversationId])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId: conversationId ?? '' },
    }),
  })

  return (
    <div className="grid h-full gap-4" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      {/* Main chat area */}
      <div className="bg-white rounded-2xl ring-miro overflow-hidden flex flex-col">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-kinship-outline-variant flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-kinship-primary text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-display font-semibold text-sm">Chat</span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1 rounded-full bg-kinship-success-surface px-2 py-0.5 font-body text-[11px] font-medium text-kinship-success">
            docs indexed
          </span>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          historicalMessages={historical}
          status={status}
          onProcedure={(proc) => setPendingProcedure(proc)}
        />

        {/* Input */}
        <MessageInput
          disabled={(status === 'streaming' || status === 'submitted') || !conversationId}
          onSend={(text) => { void sendMessage({ text }) }}
        />
      </div>

      {/* Right sidebar — sources + suggestions */}
      <div className="flex flex-col gap-3 overflow-auto">
        {/* Try asking */}
        <div className="bg-white rounded-2xl ring-miro p-4">
          <h3 className="font-display font-semibold text-[13px] text-kinship-on-surface">
            Try asking
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (conversationId && status !== 'streaming') {
                    void sendMessage({ text: q })
                  }
                }}
                className="text-left rounded-lg bg-kinship-primary-surface px-3 py-2 font-body text-xs text-kinship-on-surface hover:bg-kinship-primary/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Sources placeholder */}
        <div className="bg-white rounded-2xl ring-miro p-4 flex-1">
          <h3 className="font-display font-semibold text-[13px] text-kinship-on-surface">
            Sources used
          </h3>
          <p className="font-body text-[11px] text-kinship-placeholder mt-1">
            What I read to answer this
          </p>
          <div className="mt-4 text-center py-8">
            <p className="font-body text-xs text-kinship-placeholder">
              Ask a question to see which documents are referenced
            </p>
          </div>
        </div>
      </div>

      {pendingProcedure && (
        <ProcedurePreviewModal
          procedure={pendingProcedure}
          onClose={() => setPendingProcedure(null)}
          onCreated={() => setPendingProcedure(null)}
        />
      )}
    </div>
  )
}
