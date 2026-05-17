import { NextResponse } from 'next/server'
import { claude } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { askClaudeIsHarmful, HARMFUL_PROMPT_MESSAGE } from '@/lib/harm-check'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt, clarificationsSoFar } = await request.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    if (await askClaudeIsHarmful(prompt)) {
      return NextResponse.json({ error: 'HARMFUL_PROMPT', message: HARMFUL_PROMPT_MESSAGE }, { status: 400 })
    }

    const prevAnswered =
      clarificationsSoFar && clarificationsSoFar.length > 0
        ? clarificationsSoFar
            .map((c: { question: string; answer: string }) => c.question + ' -> ' + c.answer)
            .join('\n')
        : 'None'

    // Use web search only if prompt suggests a recent/current event
    const needsWebSearch = /\b(recent|latest|current|new|today|2024|2025|2026|now|ongoing|just|this year|this week)\b/i.test(prompt)

    const system = `You are a sharp, intelligent writing assistant. Your job is to read the user's prompt and any previous answers, think carefully about what they actually mean, and decide if one more clarifying question is needed.

You have TWO reasons to ask a question:

REASON 1 — TOPIC AMBIGUITY: The prompt refers to something unclear.
Examples:
- "Write about the world war" -> ask which world war
- "Write about the president's policy" -> ask which country
- "Write about the war" -> ask which conflict
- "Write about the company" -> ask which company
- After user says "neither, I meant the israel-palestine war" -> now ask something specific about THAT topic, like "Are you focusing on the humanitarian crisis, the military conflict, the political negotiations, or the historical roots of the conflict?"

REASON 2 — TOO VAGUE TO SOURCE WELL: The prompt is broad enough that a more specific angle will produce better human-written sources and a lower AI score.
Examples:
- "Why is Ronaldo so good?" -> ask which aspect: athleticism, career, mentality, or technique
- "Write about climate change" -> ask which angle: science, politics, economics, or human stories
- "Write about social media" -> ask which angle: mental health, politics, business, or youth culture
- "Write about the israel-palestine war" -> ask which angle: humanitarian impact, military conflict, political negotiations, or historical roots

CRITICAL RULES:
- After a user corrects you or gives an unexpected answer, always check if a follow-up is now needed about the NEW topic they revealed. Do not just accept and move on if the new topic is still vague.
- "all" or "everything" = valid answer, move on
- "none of those, I meant X" = update your understanding AND ask a follow-up about X if X is still vague
- Do NOT ask about word count, tone, text type, or citations
- Ask ONE question maximum per round
- Stop asking when the topic is specific enough to find targeted sources
- If the prompt appears to be a school assignment brief or rubric with multiple possible topics listed, ask the user: which topic and which specific country or community do you want to focus on? This is the most important question for an assignment brief.
- If the user has already specified a topic and location from an assignment brief, do not ask again — proceed.

Previous clarifications:
${prevAnswered}

Return ONLY valid JSON:
{"needsClarification": true, "question": "Your question here?"}
or
{"needsClarification": false}`

    const userMsg =
      'Prompt: ' +
      prompt +
      (clarificationsSoFar && clarificationsSoFar.length > 0
        ? '\nPrevious Q&A:\n' +
          clarificationsSoFar
            .map((c: { question: string; answer: string }) => 'Q: ' + c.question + '\nA: ' + c.answer)
            .join('\n')
        : '')

    const raw = await claude(system, userMsg, needsWebSearch)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ needsClarification: false })
  }
}
