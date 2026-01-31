/**
 * Style Metrics Module Index
 * Exports all style analysis functions and types
 */

// Lexical analysis
export { analyzeLexical, mergeLexicalMetrics } from './lexical'
export type { LexicalMetrics } from './lexical'

// Syntactic analysis
export { analyzeSyntax, mergeSyntaxMetrics } from './syntax'
export type { SyntaxMetrics } from './syntax'

// Pattern extraction
export { analyzePatterns, mergePatternMetrics } from './patterns'
export type { PatternMetrics } from './patterns'

// Error profile
export { analyzeErrors, mergeErrorMetrics } from './errors'
export type { ErrorMetrics } from './errors'

// Voice and pragmatics
export { analyzeVoice, mergeVoiceMetrics } from './voice'
export type { VoiceMetrics } from './voice'

// Discourse and cohesion
export { analyzeDiscourse, mergeDiscourseMetrics } from './discourse'
export type { DiscourseMetrics } from './discourse'
