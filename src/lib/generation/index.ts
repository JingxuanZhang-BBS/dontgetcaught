/**
 * Generation Module
 * Text generation with style matching + revision support
 */

export {
  buildGenerationPrompt,
  estimateTokens,
  checkPromptSize,
  type TaskInput,
  type GenerationPrompt,
} from './prompt-builder'

export {
  generateText,
  estimateCost,
  formatCost,
  GENERATION_CONFIG,
  type GenerationResult,
  type GenerationError,
} from './generator'

export {
  buildRevisionPrompt,
  type RevisionInput,
  type RevisionPrompt,
} from './revision-builder'

export {
  checkForAIPatterns,
  generateWithCleanup,
  runCleanupPass,
  AI_CHECK_THRESHOLD,
  MAX_REWRITE_PASSES,
  type AICheckResult,
} from './ai-checker'
