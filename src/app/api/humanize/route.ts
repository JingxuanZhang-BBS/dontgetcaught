export const maxDuration = 300

import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { enforceEnglishDraft } from '@/lib/enforce-english'
import { checkRateLimit } from '@/lib/rate-limit'
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

    const rateLimited = await checkRateLimit(user.id, 'humanize')
    if (rateLimited) return rateLimited

    const {
      draft,
      flaggedSentences,
      textType,
      citations,
      writingMode,
      wordCount: wordCountBody,
      prompt: lengthPrompt,
      wordCountIncludesSources: wcIncludesBody,
    } = await request.json()

    if (!draft || !flaggedSentences?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const wordCountTarget = resolveWordCountTarget(null, wordCountBody)
    const includeSourcesInCount = resolveWordCountIncludesSources(lengthPrompt ?? '', wcIncludesBody === true)
    const measuredWords = countWordsForLengthTarget(draft, includeSourcesInCount)

    const lengthNote = wordCountTarget
      ? (includeSourcesInCount
        ? `\n\nLENGTH (mandatory): After edits, total words (main body + entire SOURCES block) must stay between ${Math.max(50, wordCountTarget - WORD_COUNT_TOLERANCE)} and ${wordCountTarget + WORD_COUNT_TOLERANCE} inclusive. About ${measuredWords} words now by that rule. In-text citations always count. Do not delete SOURCES lines to shorten — adjust the body.`
        : `\n\nLENGTH (mandatory): After edits, count ONLY the main body (before SOURCES); do NOT count the SOURCES section. In-text citations in the body DO count. Body must stay between ${Math.max(50, wordCountTarget - WORD_COUNT_TOLERANCE)} and ${wordCountTarget + WORD_COUNT_TOLERANCE} words inclusive. Body is about ${measuredWords} words now.`)
      : ''

    const bestEffort = writingMode === 'best_effort'
    const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped
    const citationNote = citations
      ? 'Preserve all existing in-text citations.'
      : 'Do not add any in-text citations.'

    const systemResearch = `You are a humanization editor. You receive a full draft and a list of AI-flagged sentences. For each flagged sentence, follow this exact process:

STEP 1 — SEARCH FOR A REPLACEMENT FIRST:
Search the web in foreign languages (choose the language most likely to have good human-written content on this specific topic) for a human-written source that covers the same claim or fact as the flagged sentence. Try to find 1-3 consecutive sentences from a real human author that express the same idea.

If you find a good source:
- Extract the relevant sentences verbatim from the foreign language source
- Translate them literally into English, preserving the original sentence structure and rhythm
- Use this translation as the replacement for the flagged sentence
- The replacement must cover the same factual ground — do not change the underlying claim

If you cannot find a good foreign language source after searching:
- Rewrite the flagged sentence to break its AI-like symmetry and structure
- Add natural human messiness — interruptions, abrupt stops, incomplete thoughts, tangents
- Keep the same fact but present it differently
- Example: "His training combines explosive power with endurance work, speed work with agility exercises" becomes "The training is built around explosions. Short violent sprints. Then agility. Then strength — in that order, every time."

RULES FOR ALL REPLACEMENTS:
- Do NOT change any underlying facts or statistics
- Do NOT bold anything
- Do NOT use m-dashes
- Avoid symmetrical list structures ("X with Y, A with B")
- Vary sentence length dramatically in replacements
- ${citationNote}

After replacing all flagged sentences, return the COMPLETE rewritten draft with replacements inserted in the correct positions.
No preamble. Just the full piece.${lengthNote}`

    const systemBestEffort = `You revise a personal or analytical draft to read less AI-like. You receive the full draft and sentences that scored as AI-like.

For each flagged sentence: rewrite it in a more natural, human voice — varied rhythm, occasional fragments, no symmetrical lists. Keep every fact and quote accurate. Do NOT refuse. Do NOT ask for documents. Do NOT use web search.

${citationNote}

Return the COMPLETE draft with those sentences revised. No preamble.${lengthNote}`

    const system = bestEffort ? systemBestEffort : systemResearch

    const flaggedList = flaggedSentences
      .slice(0, 8)
      .map((s: string, i: number) => i + 1 + '. ' + s)
      .join('\n')

    let humanized = await claude(
      system,
      `Text type: ${typeConfig.name}\n\nFlagged sentences to replace:\n${flaggedList}\n\nFull draft:\n${draft}`,
      !bestEffort
    )
    humanized = humanized.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim()

    if (!bestEffort) {
      humanized = await enforceEnglishDraft(humanized)
    }

    if (wordCountTarget) {
      humanized = await reviseWordCountBand(humanized, wordCountTarget, includeSourcesInCount)
    }

    return NextResponse.json({ humanized })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Humanize error: ' + String(err) },
      { status: 500 }
    )
  }
}
