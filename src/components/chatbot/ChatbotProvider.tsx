'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface ChatbotContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  conversationId: string | null
  setConversationId: (id: string | null) => void
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null)

/**
 * Client-only provider that tracks chatbot open/close state and the current
 * conversationId. Lives for the lifetime of the mounted tree — conversation
 * persistence is handled server-side via the chat server actions.
 */
export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const value = useMemo<ChatbotContextValue>(
    () => ({ isOpen, open, close, toggle, conversationId, setConversationId }),
    [isOpen, open, close, toggle, conversationId]
  )

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
}

export function useChatbot(): ChatbotContextValue {
  const ctx = useContext(ChatbotContext)
  if (!ctx) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return ctx
}
