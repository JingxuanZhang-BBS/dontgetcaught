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
}

export interface GenerationPrompt {
  systemMessage: string
  userMessage: string
}

/**
 * Build the complete generation prompt
 */
export function buildGenerationPrompt(
  styleProfile: StyleProfile,
  styleChunks: StyleChunk[],
  task: TaskInput
): GenerationPrompt {
  // Get the style prompt from Step 6's analyzer
  const stylePromptSection = generateStylePrompt(styleProfile)

  // Format style sample chunks
  const samplesSection = formatChunksForPrompt(styleChunks, 3000)

  // Build system message
  const systemMessage = `You are a writing assistant that mimics the user's personal writing style. Your goal is to generate text that sounds authentically like the user wrote it.

${stylePromptSection}

## Style Reference Samples
The following are excerpts from the user's actual writing. Study their word choices, sentence structures, and overall voice:

${samplesSection}

## Critical Rules
1. MATCH THE STYLE: Your output must feel like the user's writing, not generic AI text
2. PRESERVE IMPERFECTIONS: Include the natural imperfections described above (if any)
3. MAINTAIN READABILITY: Never sacrifice clarity for authenticity
4. NO OVER-POLISHING: Avoid overly formal or perfect grammar if the user's style is casual
5. VOICE CONSISTENCY: Maintain consistent voice throughout the piece
6. LENGTH: Write a complete, well-developed response (aim for ${getTargetLength(task.taskType)} words unless otherwise specified)`

  // Build user message based on task type
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

  return `Please write the following piece in my personal writing style:

**Title**: ${task.title}

**Type**: ${typeLabel}

**Requirements/Description**:
${task.requirements}

Remember to write in MY voice, using my typical sentence structures, word choices, and natural patterns. The result should sound like I wrote it myself.`
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
