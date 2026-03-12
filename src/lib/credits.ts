// ── Client-side credits system (localStorage) ────────────────────────────────
// Replace with real backend once credits/payments are implemented.

export const MAX_CREDITS = 50
const STORAGE_KEY = 'dgc_credits'

export function getCredits(): number {
  if (typeof window === 'undefined') return MAX_CREDITS
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) {
    localStorage.setItem(STORAGE_KEY, String(MAX_CREDITS))
    return MAX_CREDITS
  }
  return Math.max(0, parseInt(stored, 10) || 0)
}

export function deductCredits(amount: number): number {
  const current = getCredits()
  const next = Math.max(0, current - amount)
  localStorage.setItem(STORAGE_KEY, String(next))
  window.dispatchEvent(new Event('credits-updated'))
  return next
}

/** Credits cost by word count */
export function creditCost(wordCount: number): number {
  if (wordCount <= 250)  return 1
  if (wordCount <= 700)  return 2
  if (wordCount <= 1000) return 3
  if (wordCount <= 1500) return 4
  if (wordCount <= 2000) return 5
  return Math.ceil(wordCount / 400)
}
