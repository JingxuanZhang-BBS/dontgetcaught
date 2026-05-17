import { claude } from '@/lib/claude'

export const HARMFUL_PROMPT_MESSAGE =
  "We can't help with this request. DontGetCaught is for academic and creative writing — not content that could cause real harm."

export async function askClaudeIsHarmful(prompt: string): Promise<boolean> {
  if (!prompt || typeof prompt !== 'string') return false
  try {
    const system = `Is this user text asking you to help produce something that promotes hate toward people or groups, serious violence against people, sexual content involving minors, or similar severe harm?

Answer harmful=false for normal essays, news analysis, history, or neutral educational questions (e.g. the origin or linguistics of a sensitive word).

Reply with ONLY valid JSON, nothing else: {"harmful":true} or {"harmful":false}`

    const raw = await claude(system, prompt.slice(0, 2000), false, 256)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return parsed.harmful === true
  } catch {
    return false
  }
}
