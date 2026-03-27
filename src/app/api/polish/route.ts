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

    const system = `You are a strict final editor reviewing a ${typeConfig.name} assembled from foreign-language sources translated into English.

FIX:
- Any named individual the reader has not met — cut or rewrite without the name
- Any phrase referencing a website's own tools or database — rewrite without it
- Numbered footnote markers like [1] [2] — delete them
- Sentences that only make sense in the original source context
- Phrases like "as we mentioned", "as noted above", "here is word for word"
- Tonal shifts away from the expected ${typeConfig.name} voice
- Any bolded text — remove it
- Any incomplete ending — write a proper conclusion appropriate to the text type
- Any passive construction hiding who is doing what — rewrite to make the agent clear
- Any technical jargon inappropriate for this text type — translate to plain language
- Any statistic missing essential context — add minimal context
- Any two consecutive contradictory statistics — explain or cut one
- ${citationNote}

Do NOT over-smooth translated passages. Preserve the slightly foreign rhythm.
Do NOT change the structure. Do NOT add new claims.
Output the full polished piece only. No preamble.`

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
