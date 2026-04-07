import { NextResponse } from 'next/server'
import { claude } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { prompt, textType } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const system = `You are an AI writing quality analyst. Your job is to estimate how well an AI writing system can complete a given prompt by finding real human-written sources online.

The system works by:
1. Searching for human-written content in foreign languages on the topic
2. Translating those passages literally into English
3. Stitching them together with minimal AI connective tissue

CRITICAL RULE: Judge based on the UNDERLYING TOPIC, not the document format or framing.
- An assignment brief asking students to research climate change = research_based (the topic is climate change)
- A school task asking for a report on migration = research_based (the topic is migration)
- A template or brief that asks for research on any well-known topic = research_based
- Only flag as personal/impossible if the actual content required is personal memories, private information, or analysis of an unprovided document

The system performs BEST when the underlying topic is:
- Widely covered by human journalists, academics, bloggers, researchers
- A known global issue, historical event, scientific subject, cultural topic, or current event
- Something that exists in multiple languages online

The system performs POORLY when the actual content required is:
- Personal experiences, memories, or private information only the user has
- Analysis of a specific private document, poem, or text not provided
- Purely fictional/creative with no factual basis to research

Categories:
- "research_based": Underlying topic is well-covered online in multiple languages by journalists, academics, bloggers. System will perform at 85%+. Examples: climate change, migration, poverty, conflict, history, science, culture, global issues, current events, any assignment asking for research on known real-world topics.
- "semi_personal": Topic has personal elements but general themes are researchable. System will get 65-84%. Examples: personal essay on universal themes like resilience or family, opinion pieces where the argument can be sourced even if the voice is personal.
- "highly_personal": Content requires specific personal information OR is a close literary/textual analysis of a specific known work. System will get 30-64%. Examples: "write about how my grandmother's death changed me", literary analysis of a specific poem or novel (e.g. Ozymandias, Hamlet, To Kill a Mockingbird), analysis of a specific piece of art or music, any task where the content must come from deep reading of one specific text rather than broad research.
- "impossible": Almost entirely personal/private with no researchable component. System will get under 30%. Examples: analysis of a private unprovided document, purely fictional story with no factual basis, writing that requires information only the user holds.

IMPORTANT: Literary analysis assignments (poetry analysis, novel analysis, close reading tasks) should ALWAYS be classified as "highly_personal" even if the text being analyzed is famous and well-known. The reason: our system sources from foreign language articles and translates them. This works for factual research topics but NOT for literary analysis, where the content must come from close reading of specific lines and structural features of one text. Foreign language articles about Ozymandias will not produce good literary analysis.

Return ONLY a JSON object:
{
  "estimatedHumanPct": <number between 5 and 98>,
  "category": "research_based" | "semi_personal" | "highly_personal" | "impossible",
  "reasoning": "<one sentence explaining why>"
}

No preamble, no explanation.`

    const raw = await claude(
      system,
      'Analyze this prompt for a ' + (textType || 'essay') + ':\n\n' + prompt
    )
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      estimatedHumanPct: 85,
      category: 'research_based',
      reasoning: 'Could not analyze — proceeding normally.',
    })
  }
}
