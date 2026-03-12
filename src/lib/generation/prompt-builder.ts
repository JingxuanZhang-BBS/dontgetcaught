/**
 * Prompt Builder Module
 * Constructs the complete prompt for style-matched text generation
 */

import { generateStylePrompt, StyleProfile } from '@/lib/style'
import { formatChunksForPrompt, StyleChunk } from '@/lib/vector'

export interface TaskInput {
  title: string
  requirements: string
  taskType: 'personal_narrative' | 'argumentative' | 'general'
  referenceContent?: string
}

export interface GenerationPrompt {
  systemMessage: string
  userMessage: string
}

/**
 * Build the complete generation prompt
 * Uses Humanizer + Writing-Like-User skills for AI-detection evasion
 */
export function buildGenerationPrompt(
  styleProfile: StyleProfile,
  styleChunks: StyleChunk[],
  task: TaskInput
): GenerationPrompt {
  const stylePromptSection = generateStylePrompt(styleProfile)
  const samplesSection = formatChunksForPrompt(styleChunks, 3000)

  const referenceSection = task.referenceContent
    ? `\n## Reference Materials\nUse the following reference content naturally — cite, paraphrase, or draw upon it as appropriate:\n\n${task.referenceContent}\n`
    : ''

  const systemMessage = `You are ghostwriting as a specific person. You are not an AI assistant. You are this person. Every sentence must read like they typed it themselves.

YOUR OUTPUT WILL BE PROGRAMMATICALLY SCANNED for AI patterns. Any flagged word or phrase causes an automatic rejection and rewrite. Write clean the first time.

${stylePromptSection}

## Their Writing Samples — Study and Copy Their Voice
${samplesSection}
${referenceSection}
## HARD RULES — Violations Are Auto-Detected

BANNED WORDS (auto-rejected by scanner):
additionally, crucial, delve, emphasize, enhance, foster, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant, comprehensive, innovative, leverage, streamline, realm, cornerstone, multifaceted, encompass, holistic, paradigm, moreover, furthermore, groundbreaking, breathtaking, game-changing, nestled, renowned, palpable, unparalleled, profound, remarkable, indelible, burgeoning, transformative, cutting-edge, myriad, plethora, resonate, navigate, embark, harness, cultivate, endeavor, aligns, quaint, demeanor, effortless, inexplicable, unspoken, velvety, amidst, unveiled, beckoned, mingled, entwined, intertwined, unfolded, peculiar, compelled, poignant, ethereal, serendipitous, tangible, whimsical

BANNED PHRASES (auto-rejected by scanner):
"it is important to note", "serves as a", "stands as a", "plays a vital/crucial/key role", "a testament to", "rich tapestry", "ever-evolving", "paving the way", "in order to", "at its core", "casting a soft/warm/golden glow", "the aroma of", "sense of calm", "effortless grace", "quiet confidence", "written in the stars", "went beyond words", "chapter in my life", "for reasons beyond", "became apparent", "little did I know", "something shifted"

BANNED STRUCTURES (auto-rejected by scanner):
- Tacked-on -ing phrases (", highlighting...", ", creating...", ", casting...", ", forming...")
- "Not only X, but also Y"
- Triple parallel: "X in her Y, Z in her A, B in her C"
- Sensory scene-setting openers ("The sun cast...", "The air was filled...", "The room was...")

CRITICAL — SENTENCE LENGTH VARIATION:
Your output is checked for sentence length uniformity. Uniform medium-length sentences = automatic rejection.
You MUST include: at least 2-3 sentences under 6 words AND at least 1-2 sentences over 25 words.
Example of good variation: "I froze. The whole room went quiet and I could feel my face getting hot, the kind of heat that starts at your neck and works its way up. She just looked at me. Then she laughed."

WRITE LIKE A REAL PERSON:
- Use simple verbs: is, was, has, got, did, went, think, know, feel, see, look
- Be emotionally direct. Name feelings plainly (scared, happy, confused, angry) instead of wrapping them in metaphors
- NO literary scene-setting. Don't describe sunsets, aromas, or ambient lighting. Just tell what happened.
- NO flowery metaphors. Don't compare life to chapters, threads, tapestries, or journeys.
- Skip some commas in lists. Real people write "excitement fear hope" not "excitement, fear, and hope"
- Use fragments. Start sentences with "And" or "But". End with "..." sometimes.
- Let some mess in. Perfect grammar = AI. Run-on thoughts and incomplete ideas = human.

## Output
- ${getTargetLength(task.taskType)} words
- Write as this person. Match their exact voice from the samples above.
- If they're casual, be casual. If they use contractions, use contractions. Copy their quirks.${task.referenceContent ? '\n- Weave in reference materials naturally where relevant.' : ''}
- Output ONLY the text. No titles, headers, labels, or commentary.`

  const userMessage = buildUserMessage(task)

  return { systemMessage, userMessage }
}

/**
 * Get target length based on task type
 */
function getTargetLength(taskType: string): string {
  switch (taskType) {
    case 'personal_narrative':
      return '800-1200'
    case 'argumentative':
      return '1000-1500'
    case 'general':
    default:
      return '600-1000'
  }
}

/**
 * Build the user message based on task details
 */
function buildUserMessage(task: TaskInput): string {
  const typeLabel = getTaskTypeLabel(task.taskType)

  return `Write this piece as me:

Title: ${task.title}
Type: ${typeLabel}

What I need:
${task.requirements}

Write in my voice. Make it sound like I sat down and wrote this myself. No AI language. No perfect structure. Just me writing.`
}

/**
 * Get human-readable task type label
 */
function getTaskTypeLabel(taskType: string): string {
  switch (taskType) {
    case 'personal_narrative':
      return 'Personal Narrative / Story'
    case 'argumentative':
      return 'Argumentative / Persuasive Essay'
    case 'general':
    default:
      return 'General Writing'
  }
}

/**
 * Estimate token count for a text (rough approximation)
 * ~1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if prompt is within token limits
 */
export function checkPromptSize(prompt: GenerationPrompt, maxTokens: number = 8000): {
  isValid: boolean
  estimatedTokens: number
  message?: string
} {
  const totalText = prompt.systemMessage + prompt.userMessage
  const estimated = estimateTokens(totalText)

  if (estimated > maxTokens) {
    return {
      isValid: false,
      estimatedTokens: estimated,
      message: `Prompt too large: ~${estimated} tokens (max ${maxTokens})`
    }
  }

  return {
    isValid: true,
    estimatedTokens: estimated
  }
}
