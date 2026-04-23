import { NextRequest } from 'next/server'
import { claude } from '@/lib/claude'

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()
  if (!prompt) return Response.json({ error: 'Missing prompt' }, { status: 400 })

  const system = `You generate interesting, surprising fun facts for a loading screen. The user is writing about a topic and needs something engaging to read while they wait.

Read their topic and generate 6 fun facts. The facts should be:
- Genuinely interesting or surprising — the kind of thing that makes someone say "I didn't know that"
- Loosely related to the topic (directly about it, or about a person/place/thing mentioned in it)
- Short — 1-2 sentences each, easy to read in 20 seconds
- Varied — don't repeat the same type of fact
- Do NOT mention AI, AI detection, language models, or how any writing tool works internally

Format: return ONLY a JSON array of 6 strings. No keys, no object, just the array.
["Fact one here.", "Fact two here.", ...]

No preamble. No explanation. Just the array.`

  try {
    const raw = await claude(system, 'Topic: ' + prompt)
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return Response.json({ facts: parsed })
  } catch {
    return Response.json({
      facts: [
        'The average person reads 200–250 words per minute.',
        'Oxford University is older than the Aztec Empire.',
        'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.',
        'Most AI detectors look for low perplexity — predictable word choices.',
        'Human writing tends to have more variation in sentence length than AI writing.',
        'The word "deadline" originally referred to a line in a prison — crossing it meant guards could shoot.',
      ],
    })
  }
}
