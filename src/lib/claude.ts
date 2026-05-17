import axios from 'axios'

const ANTHROPIC = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_KEY || '',
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-beta': 'prompt-caching-2024-07-31',
  }
}

export async function claude(
  systemText: string,
  userMessage: string,
  useWebSearch = false,
  maxTokens = 4000
): Promise<string> {
  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: systemText, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userMessage }],
  }

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  // Retry on 429 (rate limit) and 529 (overloaded) with exponential backoff
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.post(ANTHROPIC, body, {
        headers: headers(),
        timeout: 120000,
      })
      return (res.data.content || [])
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('\n')
        .trim()
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 429 || err.response?.status === 502 || err.response?.status === 529) &&
        attempt < MAX_RETRIES
      ) {
        const wait = (attempt + 1) * 5000 // 5s, 10s, 15s
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      if (axios.isAxiosError(err) && err.response) {
        console.error('Anthropic API error', err.response.status, JSON.stringify(err.response.data))
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export const TEXT_TYPES: Record<
  string,
  { name: string; format: string; searchGuidance: string }
> = {
  article: {
    name: 'Article',
    format: `FORMAT: 1. Headline 2. Introduction — hook, introduce topic 3. Body paragraphs — one point each, facts and examples 4. Conclusion — summarize, leave reader thinking. TONE: formal or semi-formal, clear, organized.`,
    searchGuidance:
      'factual reporting, expert opinions, and statistics that inform a general audience',
  },
  blog: {
    name: 'Blog Post',
    format: `FORMAT: 1. Catchy title 2. Opening hook — personal, engaging 3. Introduction 4. Main body — ideas, tips, anecdotes 5. Conclusion — final thought or question. TONE: informal, friendly, personal. Use "I" and "you".`,
    searchGuidance:
      'personal stories, practical tips, and conversational takes',
  },
  oped: {
    name: 'Op-Ed',
    format: `FORMAT: 1. Headline 2. Introduction — hook, state issue, present opinion 3. Argument 1 with evidence 4. Argument 2 with evidence 5. Counterargument addressed 6. Conclusion — reinforce opinion, strong ending. TONE: confident, persuasive, assertive.`,
    searchGuidance:
      'evidence, statistics, and expert opinions that support a persuasive argument, plus one counterargument',
  },
  speech: {
    name: 'Speech',
    format: `FORMAT: 1. Greeting and opening — grab attention 2. Introduction — topic and purpose 3. Main points — 2 to 3 key ideas with examples 4. Conclusion — memorable final line. TONE: written to be heard. Short sentences, repetition, emotional appeal, direct audience address.`,
    searchGuidance:
      'powerful quotes, emotional stories, and compelling facts that resonate when spoken aloud',
  },
  essay: {
    name: 'Essay',
    format: `FORMAT: 1. Introduction — topic, clear thesis 2. Body paragraph 1 — point, evidence, explanation 3. Body paragraph 2 4. Body paragraph 3 5. Conclusion — summarize, restate thesis freshly. TONE: formal and academic. Analytical, precise vocabulary.`,
    searchGuidance:
      'academic evidence and logical arguments for a structured analytical essay',
  },
  review: {
    name: 'Review',
    format: `FORMAT: 1. Title 2. Introduction — what is reviewed, brief context 3. Description 4. Evaluation — strengths and weaknesses 5. Conclusion — final judgment and recommendation. TONE: semi-formal, lively, balanced.`,
    searchGuidance:
      'detailed descriptions, critic opinions, and evaluative takes',
  },
  report: {
    name: 'Report',
    format: `FORMAT: 1. Title 2. Introduction — purpose 3. Background and context 4. Findings 5. Analysis 6. Recommendations if needed 7. Conclusion. TONE: formal, objective, neutral. Use plain text subheadings.`,
    searchGuidance:
      'data, research findings, official statistics, and expert analysis',
  },
}
