import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function AiPinnedCard() {
  return (
    <div className="hidden md:flex rounded-2xl bg-kinship-primary/10 ring-miro overflow-hidden p-4 flex-col gap-3">
      <div className="flex items-center gap-2 text-kinship-primary">
        <Sparkles className="h-4 w-4" />
        <span className="font-display text-[13px] font-semibold">Ask Kinship</span>
      </div>

      <p className="font-body text-sm text-kinship-on-surface leading-relaxed">
        Need help planning your week, sorting out a renewal, or figuring out what&apos;s due next? Ask Kinship anything about your household.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Link
          href="/chat"
          className="rounded-full bg-kinship-primary px-4 py-1.5 font-body text-[12px] font-medium text-white hover:bg-kinship-primary/90 transition-colors"
        >
          Start a conversation
        </Link>
      </div>
    </div>
  )
}
