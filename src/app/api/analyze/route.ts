import { NextResponse } from 'next/server'
import { claude } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { askClaudeIsHarmful, HARMFUL_PROMPT_MESSAGE } from '@/lib/harm-check'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt, textType, analyzeMode } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    if (await askClaudeIsHarmful(prompt)) {
      return NextResponse.json({ error: 'HARMFUL_PROMPT', message: HARMFUL_PROMPT_MESSAGE }, { status: 400 })
    }

    const humanizeMode = analyzeMode === 'humanize'

    const system = `You are an analyst for dontgetcaught, a product that usually writes by finding human articles in foreign languages, translating them to English, and stitching them together — then checking with GPTZero for "human-like" score.

Your job: (1) detect if the user is asking for something we CANNOT do because it is not written text, (2) otherwise estimate how well that sourcing pipeline will work, with a HONEST numeric score.
${humanizeMode ? `

HUMANIZE MODE (critical): The user pasted EXISTING prose they want "humanized". The pipeline will try to replace paragraphs by searching the web for human-written foreign-language passages about the same facts/claims, then translating and stitching. Judge whether REAL human sources likely exist online for MOST of this content.
- Obscure one-off topics (e.g. close analysis of a poem only their teacher wrote, a 1975 county-court brief from a small town, private family stories with no public record): "impossible" or "highly_personal" with estimatedHumanPct very low (often 8–28).
- Public topics (climate, major laws, famous books, news events): can still be "research_based" or "semi_personal" if the pasted text is mostly about those.
- "nonTextDeliverable" is almost always false here (they already provided text). True only if the pasted content is clearly not a writing task (e.g. empty, or only asking for a non-text deliverable).
` : ''}

NON-TEXT (critical):
- Set "nonTextDeliverable": true if the user is asking YOU to produce primarily a non-text artifact: a drawing, painting, sculpture, live dance, filmed choreography, recorded song performance, etc. — things this text-only tool cannot output.
- Set "nonTextDeliverable": false if they want written work: an essay, reflection, story, script, poem, speech text, op-ed, etc. (even if the assignment ALSO mentions turning in art separately — if they want help with the written reflection or essay, false.)
- If they only say "I want to make a drawing" and the deliverable is the drawing itself, true. If they want the 3-page reflection about their art, false.

estimatedHumanPct = your honest estimate of the FINAL human-score % our foreign-sourcing pipeline can achieve on THIS prompt (NOT always 45–55 — use the full range):
- research_based topics (well-covered online: news, science, history, policy, etc.): typically 78–92
- semi_personal (mix of universal theme + some research): typically 45–74
- highly_personal (literary close reading, course reflection on a specific work, memoir of private events): typically 18–48
- impossible for sourcing (pure private memory, no web content exists: "my bike crash at 6 and my dad"): typically 5–22 — use LOW numbers here; do not inflate

Categories:
- "research_based": foreign sourcing will work well; public topic with lots of sources.
- "semi_personal": partial fit.
- "highly_personal": mostly must be written from scratch; sourcing helps little (lit analysis, creative course prompts, etc.).
- "impossible": essentially no researchable public content (intimate memoir only the user knows).

IMPORTANT: Literary analysis, creative "reimagine this media" assignments, and long assignment handouts about reflection/creative process are usually "highly_personal" or "impossible" for our pipeline unless the student is clearly asking for research on a general topic buried in the rubric.

Return ONLY valid JSON:
{
  "estimatedHumanPct": <integer 5–95>,
  "category": "research_based" | "semi_personal" | "highly_personal" | "impossible",
  "nonTextDeliverable": <true or false>,
  "reasoning": "<one short sentence>"
}`

    const userLead = humanizeMode
      ? 'Analyze this pasted TEXT for humanization (essay-style). Consider whether web-sourced human replacements exist for it:\n\n'
      : 'Analyze this prompt for a ' + (textType || 'essay') + ':\n\n'

    const raw = await claude(system, userLead + prompt)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (typeof parsed.nonTextDeliverable !== 'boolean') parsed.nonTextDeliverable = false
    if (typeof parsed.estimatedHumanPct !== 'number') parsed.estimatedHumanPct = 50
    parsed.estimatedHumanPct = Math.max(5, Math.min(95, Math.round(parsed.estimatedHumanPct)))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      estimatedHumanPct: 85,
      category: 'research_based',
      nonTextDeliverable: false,
      reasoning: 'Could not analyze — proceeding normally.',
    })
  }
}
