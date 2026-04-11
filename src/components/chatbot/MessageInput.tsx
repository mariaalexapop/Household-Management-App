'use client'

import { Send } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface MessageInputProps {
  disabled: boolean
  onSend: (text: string) => void
}

/**
 * Text input + send button. Enter submits, Shift+Enter inserts a newline.
 * Disabled while useChat status !== 'ready' or while conversation is loading.
 */
export function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [text, setText] = useState('')

  const canSend = !!text.trim() && !disabled

  function submit() {
    if (!canSend) return
    onSend(text.trim())
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    submit()
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex items-end gap-2 border-t border-[#e0e2e8] bg-white px-4 py-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your documents or schedule…"
        rows={1}
        disabled={disabled}
        aria-label="Message"
        className="flex-1 resize-none rounded-xl bg-[#fafbfc] px-3 py-2 font-body text-sm text-[#1c1c1e] placeholder:text-[#8a8f9c] ring-1 ring-[#e0e2e8] focus:outline-none focus:ring-2 focus:ring-[#5b76fe] disabled:opacity-60"
        style={{ maxHeight: 120 }}
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5b76fe] text-white transition hover:bg-[#2a41b6] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </form>
  )
}
