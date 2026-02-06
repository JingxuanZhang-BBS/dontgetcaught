/**
 * Revision Prompt Builder Module
 * Constructs prompts for revising previously generated text
 */

import { generateStylePrompt, StyleProfile } from '@/lib/style'
import { formatChunksForPrompt, StyleChunk } from '@/lib/vector'

export interface RevisionInput {
  previousText: string
  revisionInstruction: string
  title: string
  taskType: 'personal_narrative' | 'argumentative' | 'general'
  versionNumber: number
}

export interface RevisionPrompt {
  systemMessage: string
  userMessage: string
}

/**
 * Build the revision prompt with style context
 */
export function buildRevisionPrompt(
  styleProfile: StyleProfile,
  styleChunks: StyleChunk[],
  input: RevisionInput
): RevisionPrompt {
  const stylePromptSection = generateStylePrompt(styleProfile)
  const samplesSection = formatChunksForPrompt(styleChunks, 2000)

  const systemMessage = `You are a writing assistant that revises text while maintaining the user's personal writing style. You are revising version ${input.versionNumber} of a piece titled "${input.title}".

${stylePromptSection}

## Style Reference Samples
${samplesSection}

## Critical Rules for Revision
1. FOLLOW THE INSTRUCTION: Apply the user's revision instruction precisely
2. MAINTAIN STYLE: The revised text must still sound like the user wrote it
3. PRESERVE STRENGTHS: Keep parts of the text that are already good unless the instruction asks to change them
4. NATURAL OUTPUT: The result should read naturally, not like a patched document
5. COMPLETE TEXT: Return the full revised text, not just the changed parts
6. IMPERFECTIONS: Preserve the user's natural writing imperfections`

  const userMessage = `Here is the current text (version ${input.versionNumber}):

---
${input.previousText}
---

Please revise the above text according to this instruction:
${input.revisionInstruction}

Return the complete revised text.`

  return { systemMessage, userMessage }
}
