'use client'

import { useState, useEffect } from 'react'
import { getCredits, MAX_CREDITS } from '@/lib/credits'

export default function CreditsDisplay() {
  const [credits, setCredits] = useState(MAX_CREDITS)

  useEffect(() => {
    setCredits(getCredits())
    const handler = () => setCredits(getCredits())
    window.addEventListener('credits-updated', handler)
    return () => window.removeEventListener('credits-updated', handler)
  }, [])

  const pct = Math.max(0, Math.min(100, (credits / MAX_CREDITS) * 100))
  const barColor =
    credits > 20 ? 'rgba(255,255,255,0.65)'
    : credits > 8 ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 min-w-[110px]">
      {/* Count row */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="text-xs font-semibold text-white/65">
          {credits} <span className="text-white/25 font-normal">/ {MAX_CREDITS}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-[3px] rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}
