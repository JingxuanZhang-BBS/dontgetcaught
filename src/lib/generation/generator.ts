/**
 * Text Generator Module
 * Calls OpenAI GPT-4o to generate style-matched text
 */

import OpenAI from 'openai'
import { GenerationPrompt } from './prompt-builder'

// Generation configuration
export const GENERATION_CONFIG = {
  model: 'gpt-4o' as const,
  temperature: 0.85,
  max_tokens: 4000,
  top_p: 1,
  frequency_penalty: 0.1,  // Slight penalty to avoid repetition
  presence_penalty: 0.1,   // Slight penalty to encourage variety
}

// Lazy initialization for OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI()
  }
  return openaiClient
}

export interface GenerationResult {
  success: true
  text: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GenerationError {
  success: false
  error: string
  code?: string
}

/**
 * Generate text using OpenAI GPT-4o
 */
export async function generateText(
  prompt: GenerationPrompt
): Promise<GenerationResult | GenerationError> {
  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: GENERATION_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: prompt.systemMessage
        },
        {
          role: 'user',
          content: prompt.userMessage
        }
      ],
      temperature: GENERATION_CONFIG.temperature,
      max_tokens: GENERATION_CONFIG.max_tokens,
      top_p: GENERATION_CONFIG.top_p,
      frequency_penalty: GENERATION_CONFIG.frequency_penalty,
      presence_penalty: GENERATION_CONFIG.presence_penalty,
    })

    const generatedText = response.choices[0]?.message?.content

    if (!generatedText) {
      return {
        success: false,
        error: 'No text generated',
        code: 'EMPTY_RESPONSE'
      }
    }

    return {
      success: true,
      text: generatedText,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    }
  } catch (err) {
    console.error('Generation error:', err)

    if (err instanceof OpenAI.APIError) {
      return {
        success: false,
        error: err.message,
        code: err.code || 'API_ERROR'
      }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      code: 'UNKNOWN_ERROR'
    }
  }
}

/**
 * Calculate estimated cost for a generation
 * Prices as of 2024 (may change)
 * GPT-4o: $2.50/1M input, $10/1M output
 */
export function estimateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 2.50
  const outputCost = (usage.completion_tokens / 1_000_000) * 10.00
  return inputCost + outputCost
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(3)}¢`
  }
  return `$${cost.toFixed(4)}`
}
