'use client'

import { Plus } from 'lucide-react'

interface FloatingAddButtonProps {
  onClick: () => void
  label: string
  className?: string
  style?: React.CSSProperties
}

export function FloatingAddButton({ onClick, label, className = 'bg-kinship-primary', style }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={style}
      className={`fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 md:hidden ${className}`}
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
