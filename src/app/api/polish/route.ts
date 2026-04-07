import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { text, textType, citations } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

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
- DUPLICATE SENTENCES: If two sentences within a few lines of each other say the same thing in different words — delete the weaker one entirely. Do not rewrite either. Just cut one. Example: "Income inequality describes the uneven distribution of income across society. Income inequality is the extent to which income is distributed unevenly among a population." — delete one of these.
- DUPLICATE STATISTICS: If the same statistic or fact appears twice in the text — delete the second instance entirely.
- ${citationNote}

DO NOT touch anything else. Do not rephrase. Do not restructure. Do not improve flow. Do not smooth translations.
The goal is to change as few words as possible while fixing only the above issues.
Output the full piece. No preamble.`

    const polished = await claude(
      system,
      'Polish this ' + typeConfig.name + ':\n\n' + text
    )

    return NextResponse.json({
      polished: polished.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim(),
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Polish error: ' + String(err) },
      { status: 500 }
    )
  }
}
