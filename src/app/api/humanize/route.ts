import { NextResponse } from 'next/server'
import { claude, TEXT_TYPES } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { draft, flaggedSentences, textType, citations } = await request.json()
    if (!draft || !flaggedSentences?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const typeConfig = TEXT_TYPES[textType] || TEXT_TYPES.oped
    const citationNote = citations
      ? 'Preserve all existing in-text citations.'
      : 'Do not add any in-text citations.'

    const system = `You are a humanization editor. Rewrite ONLY the connective tissue — the short bridging sentences between translated blocks. Do not touch the translated source passages.

RULES:
- Sharp, slightly impatient human expert voice
- Vary sentence length dramatically
- Use contractions. Use abrupt stops. Add brief tangents or second-guessing.
- NO m-dashes. NO symmetry patterns. NO colons.
- BANNED: delve, elevate, underscore, testament, navigate, foster, tapestry, unlock, robust, inherently
- ${citationNote}
- Do NOT bold anything. Do NOT change any translated factual content or statistics.

Return the COMPLETE rewritten draft. No preamble. Just the full piece.`

    const flaggedList = flaggedSentences
      .slice(0, 8)
      .map((s: string, i: number) => i + 1 + '. ' + s)
      .join('\n')

    const humanized = await claude(
      system,
      `Text type: ${typeConfig.name}\n\nFlagged sentences:\n${flaggedList}\n\nFull draft:\n${draft}`
    )

    return NextResponse.json({
      humanized: humanized.replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim(),
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Humanize error: ' + String(err) },
      { status: 500 }
    )
  }
}
