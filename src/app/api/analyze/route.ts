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

This means the system performs BEST when:
- The topic is widely covered by human journalists, academics, bloggers, researchers
- Content exists in multiple languages (not just English)
- The writing does not require personal experiences or private information
- The content does not depend on a specific document the user has not provided

The system performs POORLY when:
- The prompt requires personal experiences, memories, or private information only the user has
- The prompt requires analysis of a specific document, poem, or text that has not been provided
- The topic is so niche or personal that no online sources exist
- The prompt is primarily creative/fictional with no factual basis to research

Analyze the prompt and return ONLY a JSON object with this exact structure:
{
  "estimatedHumanPct": <number between 5 and 98>,
  "category": "research_based" | "semi_personal" | "highly_personal" | "impossible",
  "reasoning": "<one sentence explaining why>"
}

Categories:
- "research_based": Topic is well-covered online, system will perform at 85%+. Examples: science topics, history, current events, culture, academic subjects, opinion pieces on known topics.
- "semi_personal": Topic has some personal element but general themes exist online. System will get 65-84%. Examples: personal essay on a universal theme like resilience or family, reflective writing on a common experience.
- "highly_personal": Topic depends heavily on specific personal information or an unknown document. System will get 30-64%. Examples: "write about how my grandmother's death changed me", "analyze this poem my teacher wrote".
- "impossible": Topic is almost entirely personal/private with nothing to research. System will get under 30%. Examples: analysis of a private document not provided, purely fictional story with no factual basis, writing that requires information only the user holds.

Return ONLY the JSON. No preamble, no explanation.`

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
