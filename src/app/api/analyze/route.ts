import { NextResponse } from 'next/server'
import { claude } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { prompt, textType } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const system = `You are an analyst for dontgetcaught, a product that usually writes by finding human articles in foreign languages, translating them to English, and stitching them together — then checking with GPTZero for "human-like" score.

Your job: (1) detect if the user is asking for something we CANNOT do because it is not written text, (2) otherwise estimate how well that sourcing pipeline will work, with a HONEST numeric score.

NON-TEXT (critical):
- Set "nonTextDeliverable": true if the user is asking YOU to produce primarily a non-text artifact: a drawing, painting, sculpture, live dance, filmed choreography, recorded song performance, etc. — things this text-only tool cannot output.
- Set "nonTextDeliverable": false if they want written work: an essay, reflection, story, script, poem, speech text, op-ed, etc. (even if the assignment ALSO mentions turning in art separately — if they want help with the written reflection or essay, false.)

estimatedHumanPct = your honest estimate of the FINAL human-score % our foreign-sourcing pipeline can achieve on THIS prompt (NOT always 45–55 — use the full range):
- research_based topics: typically 78–92
- semi_personal: typically 45–74
- highly_personal: typically 18–48
- impossible for sourcing: typically 5–22

IMPORTANT: Literary analysis, creative assignments, and long rubrics about reflection are usually "highly_personal" or "impossible" unless the student asks for research on a general topic buried in the rubric.

Return ONLY valid JSON:
{
  "estimatedHumanPct": <integer 5–95>,
  "category": "research_based" | "semi_personal" | "highly_personal" | "impossible",
  "nonTextDeliverable": <true or false>,
  "reasoning": "<one short sentence>"
}`

    const raw = await claude(
      system,
      'Analyze this prompt for a ' + (textType || 'essay') + ':\n\n' + prompt
    )
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
