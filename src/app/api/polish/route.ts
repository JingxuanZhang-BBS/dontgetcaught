export const maxDuration = 120

import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { enforceEnglishDraft } from '@/lib/enforce-english'
import {
  resolveWordCountTarget,
  resolveWordCountIncludesSources,
  reviseWordCountBand,
  countWordsForLengthTarget,
  WORD_COUNT_TOLERANCE,
} from '@/lib/word-count'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      text,
      textType,
      citations,
      writingMode,
      wordCount: wordCountBody,
      prompt: lengthPrompt,
      wordCountIncludesSources: wcIncludesBody,
    } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const wordCountTarget = resolveWordCountTarget(null, wordCountBody)
    const includeSourcesInCount = resolveWordCountIncludesSources(lengthPrompt ?? '', wcIncludesBody === true)
    const polishMeasured = countWordsForLengthTarget(text, includeSourcesInCount)

    const lengthPolish = wordCountTarget
      ? (includeSourcesInCount
        ? `\n\nWORD COUNT EXCEPTION (length only): Target ${wordCountTarget} words counting body + full SOURCES block. Band: ${Math.max(50, wordCountTarget - WORD_COUNT_TOLERANCE)}–${wordCountTarget + WORD_COUNT_TOLERANCE}. About ${polishMeasured} words now by that rule. In-text citations count. If outside the band, adjust mainly the body; do not strip SOURCES entries to hit the count.`
        : `\n\nWORD COUNT EXCEPTION (length only): Target ${wordCountTarget} words in the main body only — do NOT count the SOURCES block. In-text citations in the body DO count. Band: ${Math.max(50, wordCountTarget - WORD_COUNT_TOLERANCE)}–${wordCountTarget + WORD_COUNT_TOLERANCE}. Body (countable) is about ${polishMeasured} words now. If outside the band, add or remove the smallest amount of body text needed. If already inside the band, do not change length on purpose.`)
      : ''

    const bestEffort = writingMode === 'best_effort'
    const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped
    const citationNote = citations
      ? 'Keep all existing in-text citations exactly as they are.'
      : 'Remove any in-text citations from the body. Keep the SOURCES section at the end intact.'

    const system = `You are a minimal final editor. The text has already passed AI detection at a high score. Your job is purely cosmetic — fix only the things listed below. Do NOT rewrite sentences. Do NOT improve phrasing. Do NOT smooth anything out. Every word you change risks lowering the human score.

ONLY fix these specific things:
- Named individuals the reader has not met (e.g. "Sam") — delete the name or replace with a pronoun
- Phrases referencing a website database or tool (e.g. "in our database") — cut those words only
- Numbered footnote markers like [1] [2] [3] — delete them
- Phrases like "as we mentioned", "as noted above", "here is word for word" — cut them
- Any bolded text — remove the bold formatting only, keep the words
- An incomplete ending with no conclusion — add ONE closing sentence only
- DUPLICATE SENTENCES: If two sentences within a few lines of each other say the same thing in different words — delete the weaker one entirely. Do not rewrite either. Just cut one.
- DUPLICATE STATISTICS: If the same statistic or fact appears twice in the text — delete the second instance entirely.
- ${citationNote}
${lengthPolish}

DO NOT touch anything else. Do not rephrase. Do not restructure. Do not improve flow. Do not smooth translations.
The goal is to change as few words as possible while fixing only the above issues.
Output the full piece. No preamble.`

    let polished = await claude(system, 'Polish this ' + typeConfig.name + ':\n\n' + text)
    polished = polished.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim()

    if (!bestEffort) {
      polished = await enforceEnglishDraft(polished)
    }

    if (wordCountTarget) {
      polished = await reviseWordCountBand(polished, wordCountTarget, includeSourcesInCount)
    }

    return NextResponse.json({ polished })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Polish error: ' + String(err) },
      { status: 500 }
    )
  }
}
