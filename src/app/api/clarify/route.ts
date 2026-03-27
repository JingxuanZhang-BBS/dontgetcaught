import { NextResponse } from 'next/server'
import { claude } from '@/lib/claude'

export async function POST(request: Request) {
  try {
    const { prompt, clarificationsSoFar } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const prevAnswered =
      clarificationsSoFar && clarificationsSoFar.length > 0
        ? clarificationsSoFar
            .map((c: { question: string; answer: string }) => c.question + ' -> ' + c.answer)
            .join('\n')
        : 'None'

    const system = `You are a writing assistant. Read the user prompt and decide if there is ONE genuine ambiguity that would meaningfully change the output.

Examples that need clarification:
- "Write about the big world war" -> ask: World War I or World War II?
- "Write about the president's new policy" -> ask: which country's president?
- "Write about the recent election" -> ask: which country's election?
- "Write a review of the new Batman movie" -> ask: which Batman film?
- "Write about immigration" -> ask: specific country or global?
- "Write about the company's performance" -> ask: which company?
- "Write about the war" -> ask: which conflict?
- "Write about Apple's product" -> ask: which product specifically?

Do NOT ask about word count, tone, text type, or citations. Those are handled separately.
Do NOT ask more than one question. Pick the single most important ambiguity.
If the prompt is sufficiently clear, return needsClarification false.

Previous clarifications already given:
${prevAnswered}

Return ONLY valid JSON:
{"needsClarification": true, "question": "Your question here?"}
or
{"needsClarification": false}`

    const raw = await claude(system, 'Prompt: ' + prompt)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ needsClarification: false })
  }
}
