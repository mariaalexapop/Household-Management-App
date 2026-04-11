'use client'

import { MessageCircle } from 'lucide-react'
import { useChatbot } from './ChatbotProvider'

/**
 * Floating action button — fixed bottom-right, opens the chatbot dock.
 * Uses the Miro primary blue-450 token (#5b76fe) with hover transition.
 */
export function ChatbotFab() {
  const { toggle, isOpen } = useChatbot()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'Close household assistant' : 'Open household assistant'}
      aria-expanded={isOpen}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b76fe] text-white shadow-lg ring-1 ring-[#e0e2e8] transition hover:scale-105 hover:bg-[#2a41b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b76fe] focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
    </button>
  )
}
