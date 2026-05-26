import { format } from 'date-fns'
import type { ModuleKey } from '@/stores/onboarding'

const DOT_COLOURS: Record<ModuleKey, string> = {
  chores: '#187574',
  kids: '#e05252',
  car: '#c67d2a',
  insurance: '#6a55d9',
  electronics: '#3f9b3f',
}

export interface TimelineItem {
  id: string
  title: string
  date: Date
  module: ModuleKey
}

interface ComingUpTimelineProps {
  items: TimelineItem[]
}

export function ComingUpTimeline({ items }: ComingUpTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl ring-miro overflow-hidden">
        <div className="px-3.5 py-2.5">
          <h2 className="font-display text-[13px] font-semibold text-kinship-on-surface">Coming up</h2>
        </div>
        <div className="px-3.5 pb-3">
          <p className="font-body text-sm text-kinship-on-surface-variant">Nothing scheduled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl ring-miro overflow-hidden">
      <div className="px-3.5 py-2.5">
        <h2 className="font-display text-[13px] font-semibold text-kinship-on-surface">Coming up</h2>
      </div>
      <ul className="flex flex-col px-3.5 pb-3">
        {items.map((item) => (
          <li key={`${item.module}-${item.id}`} className="flex items-center gap-2.5 py-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: DOT_COLOURS[item.module] }}
            />
            <span className="font-body text-sm text-kinship-on-surface truncate flex-1">
              {item.title}
            </span>
            <span className="font-body text-[11px] text-kinship-on-surface-variant shrink-0">
              {format(new Date(item.date), 'EEE d MMM')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
