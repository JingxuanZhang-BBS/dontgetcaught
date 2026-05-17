import { claude } from '@/lib/claude'

export const WORD_COUNT_TOLERANCE = 100

export function splitBodyAndSources(text: string): { body: string; sources: string } {
  if (!text) return { body: '', sources: '' }
  const lines = text.split('\n')
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^#*\s*sources\b/i.test(lines[i].trim())) { idx = i; break }
  }
  if (idx === -1) return { body: text.trim(), sources: '' }
  return {
    body: lines.slice(0, idx).join('\n').trim(),
    sources: lines.slice(idx).join('\n').trim(),
  }
}

export function countWords(s: string): number {
  if (!s || !String(s).trim()) return 0
  return s.trim().split(/\s+/).filter(Boolean).length
}

export function countWordsForLengthTarget(fullDraft: string, includeSourcesInCount: boolean): number {
  if (!fullDraft || !String(fullDraft).trim()) return 0
  if (includeSourcesInCount) return countWords(fullDraft.trim())
  const { body } = splitBodyAndSources(fullDraft)
  return countWords(body)
}

export function extractWordCountTargetFromPrompt(prompt: string): number | null {
  if (!prompt || typeof prompt !== 'string') return null
  const m = prompt.match(/\bWord count:\s*(\d{2,5})\s*words?\b/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (!Number.isFinite(n) || n < 50) return null
  return Math.min(50000, n)
}

export function resolveWordCountTarget(prompt: string | null, wordCountBody?: number | string): number | null {
  if (typeof wordCountBody === 'number' && Number.isFinite(wordCountBody) && wordCountBody >= 50) {
    return Math.min(50000, Math.round(wordCountBody))
  }
  if (typeof wordCountBody === 'string' && /^\s*\d{2,5}\s*$/.test(wordCountBody)) {
    const n = parseInt(wordCountBody.trim(), 10)
    if (n >= 50) return Math.min(50000, n)
  }
  return extractWordCountTargetFromPrompt(prompt || '')
}

export function extractWordCountIncludesSourcesFromPrompt(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false
  const lower = prompt.toLowerCase()
  const positives = [
    /word count[^.\n]{0,180}?(include|includes|count|counting)[^.\n]{0,120}?\b(sources?|bibliography|works cited|reference list)\b/,
    /\b(sources?|bibliography|works cited|reference list)\b[^.\n]{0,140}?\b(in|toward|towards|within|against)\b[^.\n]{0,80}?\b(word count|word limit)\b/,
    /\b(include|count)\b[^.\n]{0,100}?\b(sources?\s*section|bibliography|works cited)\b[^.\n]{0,100}?\b(word count|word limit)\b/,
    /\bcount\b[^.\n]{0,50}?\b(sources?\s*section|bibliography|works cited)\b[^.\n]{0,80}?\b(toward|in)\b[^.\n]{0,40}?\b(words?|limit)\b/,
  ]
  return positives.some(re => re.test(lower))
}

export function resolveWordCountIncludesSources(prompt: string, bodyFlag?: boolean): boolean {
  if (bodyFlag === true) return true
  return extractWordCountIncludesSourcesFromPrompt(prompt || '')
}

export function wordCountBandLine(target: number, includeSourcesInCount: boolean): string {
  const lo = Math.max(50, target - WORD_COUNT_TOLERANCE)
  const hi = target + WORD_COUNT_TOLERANCE
  const citeLine = ' In-text / parenthetical citations in the body always count toward the limit.'
  if (includeSourcesInCount) {
    return `WORD COUNT — CRITICAL: About ${target} words total, and the user asked for the SOURCES / bibliography section to count toward that total.${citeLine} Full output (body + SOURCES) must be between ${lo} and ${hi} words. Prefer adjusting body length; keep every SOURCES line complete.`
  }
  return `WORD COUNT — CRITICAL: About ${target} words.${citeLine} The SOURCES / bibliography / reference list at the end does NOT count toward the limit unless the user explicitly said it should — measure only the main body (everything before the SOURCES heading). That body must be between ${lo} and ${hi} words. After translation into English, adjust the body until it fits this band.`
}

export async function reviseWordCountBand(
  fullDraft: string,
  target: number,
  includeSourcesInCount: boolean
): Promise<string> {
  if (!fullDraft || !target) return fullDraft
  const { body, sources } = splitBodyAndSources(fullDraft)
  const bodyText = body || fullDraft.trim()
  if (!bodyText) return fullDraft

  const w = countWordsForLengthTarget(fullDraft, includeSourcesInCount)
  const lo = Math.max(50, target - WORD_COUNT_TOLERANCE)
  const hi = target + WORD_COUNT_TOLERANCE
  if (w >= lo && w <= hi) return fullDraft

  const scopeRules = includeSourcesInCount
    ? `LENGTH RULE: Count every word in the main body PLUS the entire SOURCES / bibliography block toward the limit. Target band: ${lo}–${hi} words (center ${target}). The draft is about ${w} words by that rule. Prefer expanding or trimming the main body only — do not remove or shorten individual SOURCES entries to game the count; keep the list complete and accurate. In-text citations in the body always count.`
    : `LENGTH RULE: Count ONLY the main body — all text before the SOURCES / bibliography heading. Do NOT count the SOURCES section toward the limit. In-text citations such as (Author, Year) in the body DO count. Target band for the body: ${lo}–${hi} words (center ${target}). The countable body is about ${w} words. If a SOURCES block exists, leave it unchanged.`

  const system = `You are revising an English draft for length only. The text is already translated; do not add foreign language.

${scopeRules}
- Preserve meaning, facts, statistics, names, and in-text citations. Do not invent facts.
- Add short sentences, merge redundancy, or trim filler — smallest effective change to enter the word band.
- Same tone and voice. No bold, no markdown # headers.

Output ONLY the full document: body then SOURCES (if provided). No commentary.`

  try {
    const userDoc = sources
      ? '===BODY===\n' + bodyText + '\n===SOURCES (keep entries complete)===\n' + sources
      : bodyText
    const out = await claude(system, userDoc, false, 16384)
    const cleaned = out.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
    if (!cleaned || cleaned.length < bodyText.length * 0.2) return fullDraft
    return cleaned
  } catch (err) {
    console.error('reviseWordCountBand:', String(err))
    return fullDraft
  }
}
