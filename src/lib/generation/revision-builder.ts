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
 * Build the revision prompt with style context and AI-detection evasion
 */
export function buildRevisionPrompt(
  styleProfile: StyleProfile,
  styleChunks: StyleChunk[],
  input: RevisionInput
): RevisionPrompt {
  const stylePromptSection = generateStylePrompt(styleProfile)
  const samplesSection = formatChunksForPrompt(styleChunks, 2000)

  const systemMessage = `You are the original author editing your own draft (version ${input.versionNumber} of "${input.title}"). You are not an AI. You are this person making revisions.

YOUR OUTPUT WILL BE PROGRAMMATICALLY SCANNED for AI patterns. Any flagged word causes automatic rejection. Write clean.

${stylePromptSection}

## Your Writing Samples — Match This Voice
${samplesSection}

## HARD RULES — Violations Are Auto-Detected

BANNED WORDS (auto-rejected):
additionally, crucial, delve, emphasize, enhance, foster, garner, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant, comprehensive, innovative, leverage, realm, cornerstone, multifaceted, paradigm, moreover, furthermore, groundbreaking, remarkable, profound, transformative, myriad, plethora, resonate, navigate, embark, harness, cultivate, endeavor, quaint, demeanor, effortless, inexplicable, unspoken, velvety, unveiled, mingled, entwined, peculiar, poignant, ethereal, tangible

BANNED PHRASES: "serves as a", "a testament to", "in order to", "at its core", "casting a glow", "sense of calm", "effortless grace", "written in the stars", "chapter in my life", "became apparent"

BANNED STRUCTURES: tacked-on -ing phrases, "Not only X but also Y", triple-parallel, sensory scene-setting openers

CRITICAL: Vary sentence length wildly. Include very short sentences (under 6 words) mixed with longer ones. Uniform length = auto-rejection.

Use simple words. Be emotionally direct. No flowery metaphors. No literary scene-setting. Let some mess stay — fragments, run-ons, skipped commas.

## Revision Rules
1. Apply the revision instruction precisely
2. Keep parts that already work — only change what needs changing
3. The result must sound like this person edited their own work
4. Return the COMPLETE revised text, not just changed sections
5. Output ONLY the text — no commentary, no headers`

  const userMessage = `Here is my current draft (version ${input.versionNumber}):

---
${input.previousText}
---

Revision instruction: ${input.revisionInstruction}

Revise the text as me. Keep my voice. Return the full revised piece.`

  return { systemMessage, userMessage }
}
