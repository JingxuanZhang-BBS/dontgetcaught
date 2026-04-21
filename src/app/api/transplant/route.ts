import { NextRequest, NextResponse } from 'next/server'
import { claude } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, granularity, citations } = await request.json()
  if (!text) return Response.json({ error: 'Missing text' }, { status: 400 })

  const citationRule = citations
    ? 'Add a short in-text citation (Source Name, Year) after each replaced block. Include a SOURCES section at the end.'
    : 'Do NOT include in-text citations. Include a SOURCES section at the end with all URLs used.'

  const unit =
    granularity === 'sentence'
      ? 'sentence by sentence (group 2-3 very short sentences into one chunk)'
      : 'paragraph by paragraph'

  const system = `You are a Research Curator replacing AI-generated text with human-written content sourced from foreign language articles. Work ${unit}.

For EACH unit:
1. Identify the specific claim, fact, or argument it makes
2. Note any details that MUST be preserved exactly: place names, country names, person names, organizations, statistics, numbers. If the original says "Congo" keep "Congo". If it cites 47%, find a source citing 47% or preserve that figure.
3. Search for a human-written foreign language source (choose the language most likely to have rich coverage of this exact point)
4. Extract 1-4 consecutive sentences that convey the same point
5. Translate literally into English, preserving the source's rhythm
6. Use this as the replacement

RULES:
- 100% English output — translate everything before including it
- Preserve the argument direction — if the original argues X, the replacement argues X
- Preserve the overall structure and order of points
- Do NOT mention sources, foreign languages, or your process anywhere in the output
- Do NOT bold text or use markdown headers

OUTPUT LANGUAGE — NON-NEGOTIABLE: Every word of the output must be in English. If you find yourself writing in Spanish, French, German, or any other language, stop and translate it immediately.

${citationRule}
Output: the complete rewritten text followed by SOURCES. Nothing else.`

  try {
    let draft = await claude(system, text, true)
    draft = draft.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()

    // Language enforcement pass
    const paraLangSystem = `Go through the text below sentence by sentence. For each sentence: if it is in English, copy it exactly as written. If it is in any other language, translate that sentence into English. Output must be 100% English. Output only the result, no explanation.`
    const paragraphs = draft.split(/\n\n+/)
    const fixed = await Promise.all(
      paragraphs.map(async p => {
        if (p.trim().length < 15) return p
        try {
          return (await claude(paraLangSystem, p))
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*\*/g, '')
            .trim()
        } catch {
          return p
        }
      })
    )
    draft = fixed.join('\n\n')

    return Response.json({ draft })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: 'Transplant error: ' + msg }, { status: 500 })
  }
}
