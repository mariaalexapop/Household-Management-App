'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

const MODULE_CARDS = [
  {
    letter: 'H',
    name: 'Tasks',
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
    problem: 'Whose turn is it to take out the bins?',
    handles: 'Recurring chores rotate fairly, nudge the right person on the right day.',
  },
  {
    letter: 'K',
    name: 'Kids',
    lightClass: 'bg-module-kids-light',
    darkClass: 'text-module-kids-dark',
    problem: 'Two parents, two calendars, one missed swim lesson.',
    handles: "One timeline per child — who's picking up, where, with what kit.",
  },
  {
    letter: 'C',
    name: 'Car',
    lightClass: 'bg-module-car-light',
    darkClass: 'text-module-car-dark',
    problem: 'MOT lapsed because the reminder went to an old email.',
    handles: 'Pulls MOT & tax from DVLA, tracks service history, warns 60 days out.',
  },
  {
    letter: 'I',
    name: 'Insurance',
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
    problem: 'Your home insurance just renewed 47% higher.',
    handles: 'Upload the PDF — Kinship extracts cover, excess, and key renewal steps.',
  },
  {
    letter: 'E',
    name: 'Electronics',
    lightClass: 'bg-module-elec-light',
    darkClass: 'text-module-elec-dark',
    problem: 'Washing machine broke at month 13 — receipt long gone.',
    handles: 'Snap the receipt, Kinship logs the warranty and pings before cover ends.',
  },
  {
    letter: 'C',
    name: 'Calendar',
    lightClass: 'bg-pink-100',
    darkClass: 'text-pink-700',
    problem: 'Chores and kids live in different apps.',
    handles: 'Every module flows into one colour-coded shared week.',
  },
]

const CARDS_PER_PAGE = 3

export function ModuleCarousel() {
  const totalPages = Math.ceil(MODULE_CARDS.length / CARDS_PER_PAGE)
  const [page, setPage] = useState(0)

  return (
    <div>
      {/* Carousel viewport */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {/* Render pages */}
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
            <div
              key={pageIdx}
              className="grid w-full flex-shrink-0 grid-cols-3 gap-5"
            >
              {MODULE_CARDS.slice(
                pageIdx * CARDS_PER_PAGE,
                pageIdx * CARDS_PER_PAGE + CARDS_PER_PAGE
              ).map((card) => (
                <div
                  key={card.name}
                  className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-kinship-outline-variant/50"
                >
                  {/* Letter chip + name */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.lightClass} ${card.darkClass} font-display text-sm font-bold`}
                    >
                      {card.letter}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                      {card.name}
                    </h3>
                  </div>

                  {/* Quoted problem */}
                  <p className="mt-5 flex-1 font-display text-base font-semibold leading-snug text-kinship-on-surface">
                    &ldquo;{card.problem}&rdquo;
                  </p>

                  {/* Kinship handles it */}
                  <div className={`mt-5 rounded-xl ${card.lightClass} p-4`}>
                    <p className={`flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-wider ${card.darkClass}`}>
                      <Sparkles className="h-3 w-3" />
                      Kinship handles it
                    </p>
                    <p className={`mt-1.5 font-body text-sm leading-relaxed ${card.darkClass}`}>
                      {card.handles}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dot pagination */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-2 rounded-full transition-all ${
              i === page
                ? 'w-6 bg-kinship-primary'
                : 'w-2 bg-kinship-on-surface-variant/30 hover:bg-kinship-on-surface-variant/50'
            }`}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
