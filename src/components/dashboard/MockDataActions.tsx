'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles, Trash2 } from 'lucide-react'
import { generateMockData, clearMockData } from '@/app/actions/mock-data'

export function GenerateMockDataButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateMockData()
      if (result.success) {
        toast.success(result.data?.summary ?? 'Mock data created')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to generate mock data')
      }
    })
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-kinship-primary px-4 py-2.5 font-body text-sm font-medium text-kinship-on-primary shadow-sm transition hover:bg-kinship-primary/90 disabled:opacity-50"
    >
      <Sparkles className="h-4 w-4" />
      {pending ? 'Generating...' : 'Try with sample data'}
    </button>
  )
}

export function ClearMockDataButton() {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  function handleClear() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    startTransition(async () => {
      const result = await clearMockData()
      if (result.success) {
        toast.success('Sample data cleared')
        setConfirming(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to clear mock data')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClear}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-body text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? 'Clearing...' : confirming ? 'Confirm clear' : 'Clear sample data'}
      </button>
      {confirming && !pending && (
        <button
          onClick={() => setConfirming(false)}
          className="font-body text-xs text-kinship-on-surface-variant hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
