/**
 * Style Analysis Module
 * Main entry point for style profile analysis
 */

// Re-export from analyzer
export {
  buildStyleProfile,
  analyzeText,
  generateStylePrompt,
  profileToJSON,
  profileFromJSON
} from './analyzer'

export type { StyleProfile, StyleSummary } from './analyzer'

// Re-export individual metrics types for reference
export type {
  LexicalMetrics,
  SyntaxMetrics,
  PatternMetrics,
  ErrorMetrics,
  VoiceMetrics,
  DiscourseMetrics
} from './metrics'
