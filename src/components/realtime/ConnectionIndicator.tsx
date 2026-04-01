'use client'

import { useRealtime } from '@/components/realtime/RealtimeProvider'

/**
 * ConnectionIndicator — renders a fixed-position banner when the realtime
 * connection is not 'connected'. Disappears automatically once connection
 * is restored.
 */
export function ConnectionIndicator() {
  const { status } = useRealtime()

  if (status === 'connected') {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
    >
      {/* Spinner */}
      <svg
        className="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Reconnecting...
    </div>
  )
}
