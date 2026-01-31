/**
 * Style Profile Analyzer
 * Aggregates all 6 metrics modules into a comprehensive writing style profile
 * This profile is used to guide LLM generation to match the user's style
 */

import {
  analyzeLexical, mergeLexicalMetrics, LexicalMetrics,
  analyzeSyntax, mergeSyntaxMetrics, SyntaxMetrics,
  analyzePatterns, mergePatternMetrics, PatternMetrics,
  analyzeErrors, mergeErrorMetrics, ErrorMetrics,
  analyzeVoice, mergeVoiceMetrics, VoiceMetrics,
  analyzeDiscourse, mergeDiscourseMetrics, DiscourseMetrics
} from './metrics'

/**
 * Complete Style Profile - aggregation of all 6 metrics categories
 */
export interface StyleProfile {
  // Metadata
  created_at: string
  sample_count: number
  total_words: number
  is_ready: boolean  // true if sufficient data (2000+ words)

  // 6 Major Metrics Categories
  lexical: LexicalMetrics
  syntax: SyntaxMetrics
  patterns: PatternMetrics
  errors: ErrorMetrics
  voice: VoiceMetrics
  discourse: DiscourseMetrics

  // High-level summary for quick reference and LLM prompting
  summary: StyleSummary
}

/**
 * High-level summary derived from all metrics
 * Used for concise LLM system prompts
 */
export interface StyleSummary {
  // Writing complexity
  complexity_level: 'simple' | 'moderate' | 'complex'
  avg_sentence_length: number
  vocabulary_richness: number  // MTLD score

  // Tone and formality
  formality: 'formal' | 'semi-formal' | 'casual' | 'very_casual'
  confidence: 'uncertain' | 'balanced' | 'confident'
  emotional_tone: 'positive' | 'neutral' | 'negative'

  // Personal style markers
  uses_contractions: boolean
  uses_first_person: boolean
  uses_questions: boolean
  uses_exclamations: boolean

  // Error profile (crucial for human-like output)
  error_tendency: 'clean' | 'occasional' | 'frequent'
  suggested_imperfections: string[]

  // Signature elements
  favorite_transitions: string[]
  signature_openers: string[]
  signature_closers: string[]

  // Text generation guidance
  generation_hints: string[]
}

/**
 * Minimum word count for a "ready" profile
 */
const MIN_WORDS_FOR_READY = 2000

/**
 * Analyze a single text sample and return all metrics
 */
export function analyzeText(text: string): {
  lexical: LexicalMetrics
  syntax: SyntaxMetrics
  patterns: PatternMetrics
  errors: ErrorMetrics
  voice: VoiceMetrics
  discourse: DiscourseMetrics
  word_count: number
} {
  const word_count = text.trim().split(/\s+/).filter(w => w.length > 0).length

  return {
    lexical: analyzeLexical(text),
    syntax: analyzeSyntax(text),
    patterns: analyzePatterns(text),
    errors: analyzeErrors(text),
    voice: analyzeVoice(text),
    discourse: analyzeDiscourse(text),
    word_count
  }
}

/**
 * Generate high-level summary from aggregated metrics
 */
function generateSummary(
  lexical: LexicalMetrics,
  syntax: SyntaxMetrics,
  patterns: PatternMetrics,
  errors: ErrorMetrics,
  voice: VoiceMetrics,
  discourse: DiscourseMetrics
): StyleSummary {
  // Complexity level based on sentence length and vocabulary
  const avgSentenceLength = syntax.sentence_length.avg_words
  let complexityLevel: 'simple' | 'moderate' | 'complex' = 'moderate'
  if (avgSentenceLength < 12 && lexical.vocab_richness.mtld < 50) {
    complexityLevel = 'simple'
  } else if (avgSentenceLength > 20 || lexical.vocab_richness.mtld > 80) {
    complexityLevel = 'complex'
  }

  // Error tendency
  const errorRate = errors.error_signature.overall_error_rate
  let errorTendency: 'clean' | 'occasional' | 'frequent' = 'occasional'
  if (errorRate < 2) errorTendency = 'clean'
  else if (errorRate > 10) errorTendency = 'frequent'

  // Suggested imperfections for generation
  const suggestedImperfections: string[] = []
  if (errors.error_signature.suggested_error_injection.typos) {
    suggestedImperfections.push('occasional typos')
  }
  if (errors.error_signature.suggested_error_injection.missing_apostrophes) {
    suggestedImperfections.push('missing apostrophes in contractions')
  }
  if (errors.error_signature.suggested_error_injection.informal_spellings) {
    suggestedImperfections.push('informal spellings (gonna, wanna)')
  }
  if (errors.error_signature.suggested_error_injection.comma_issues) {
    suggestedImperfections.push('occasional comma splices')
  }
  if (errors.tense_consistency.consistency_score < 0.7) {
    suggestedImperfections.push('minor tense shifts')
  }

  // Favorite transitions (top 5)
  const favoriteTransitions = discourse.transitions.top_transitions
    .slice(0, 5)
    .map(t => t.phrase)

  // Signature openers and closers
  const signatureOpeners = patterns.signature_openers
    .slice(0, 5)
    .map(o => o.phrase)
  const signatureClosers = patterns.signature_closers
    .slice(0, 5)
    .map(c => c.phrase)

  // Generation hints for LLM
  const generationHints: string[] = []

  // Sentence length guidance
  if (syntax.sentence_length.distribution.short > 0.5) {
    generationHints.push('Use predominantly short sentences (under 10 words)')
  } else if (syntax.sentence_length.distribution.long > 0.3) {
    generationHints.push('Include longer, complex sentences (25+ words)')
  }

  // First person usage
  if (voice.self_mention.total_rate > 40) {
    generationHints.push('Use first person frequently ("I", "my")')
  } else if (voice.self_mention.total_rate < 10) {
    generationHints.push('Minimize first person pronouns')
  }

  // Questions and exclamations
  if (syntax.question_rate > 0.1) {
    generationHints.push('Include rhetorical questions')
  }
  if (syntax.exclamation_rate > 0.05) {
    generationHints.push('Use exclamation marks for emphasis')
  }

  // Hedging vs boosting
  if (voice.hedge_boost_ratio < 0.5) {
    generationHints.push('Use hedging language ("maybe", "perhaps", "I think")')
  } else if (voice.hedge_boost_ratio > 2) {
    generationHints.push('Use confident, assertive language ("definitely", "clearly")')
  }

  // Contractions
  if (lexical.contractions_rate > 20) {
    generationHints.push('Use contractions freely (don\'t, can\'t, it\'s)')
  } else if (lexical.contractions_rate < 5) {
    generationHints.push('Avoid contractions, use full forms')
  }

  // Informal markers
  if (voice.filler_word_rate > 10) {
    generationHints.push('Include filler words (well, so, like, basically)')
  }

  // Paragraph structure
  if (discourse.paragraph_structure.enumeration_usage > 5) {
    generationHints.push('Use enumeration (first, second, third)')
  }

  return {
    complexity_level: complexityLevel,
    avg_sentence_length: avgSentenceLength,
    vocabulary_richness: lexical.vocab_richness.mtld,

    formality: voice.voice_signature.register,
    confidence: voice.voice_signature.confidence_level,
    emotional_tone: voice.voice_signature.emotional_tone,

    uses_contractions: lexical.contractions_rate > 10,
    uses_first_person: voice.self_mention.total_rate > 20,
    uses_questions: syntax.question_rate > 0.05,
    uses_exclamations: syntax.exclamation_rate > 0.02,

    error_tendency: errorTendency,
    suggested_imperfections: suggestedImperfections,

    favorite_transitions: favoriteTransitions,
    signature_openers: signatureOpeners,
    signature_closers: signatureClosers,

    generation_hints: generationHints
  }
}

/**
 * Build a complete style profile from multiple text samples
 */
export function buildStyleProfile(samples: string[]): StyleProfile {
  if (samples.length === 0) {
    // Return empty profile
    const emptyMetrics = analyzeText('')
    return {
      created_at: new Date().toISOString(),
      sample_count: 0,
      total_words: 0,
      is_ready: false,
      lexical: emptyMetrics.lexical,
      syntax: emptyMetrics.syntax,
      patterns: emptyMetrics.patterns,
      errors: emptyMetrics.errors,
      voice: emptyMetrics.voice,
      discourse: emptyMetrics.discourse,
      summary: generateSummary(
        emptyMetrics.lexical,
        emptyMetrics.syntax,
        emptyMetrics.patterns,
        emptyMetrics.errors,
        emptyMetrics.voice,
        emptyMetrics.discourse
      )
    }
  }

  // Analyze each sample
  const analyses = samples.map(analyzeText)

  // Calculate total words
  const totalWords = analyses.reduce((sum, a) => sum + a.word_count, 0)

  // Merge metrics from all samples
  const mergedLexical = mergeLexicalMetrics(analyses.map(a => a.lexical))
  const mergedSyntax = mergeSyntaxMetrics(analyses.map(a => a.syntax))
  const mergedPatterns = mergePatternMetrics(analyses.map(a => a.patterns))
  const mergedErrors = mergeErrorMetrics(analyses.map(a => a.errors))
  const mergedVoice = mergeVoiceMetrics(analyses.map(a => a.voice))
  const mergedDiscourse = mergeDiscourseMetrics(analyses.map(a => a.discourse))

  // Generate summary
  const summary = generateSummary(
    mergedLexical,
    mergedSyntax,
    mergedPatterns,
    mergedErrors,
    mergedVoice,
    mergedDiscourse
  )

  return {
    created_at: new Date().toISOString(),
    sample_count: samples.length,
    total_words: totalWords,
    is_ready: totalWords >= MIN_WORDS_FOR_READY,
    lexical: mergedLexical,
    syntax: mergedSyntax,
    patterns: mergedPatterns,
    errors: mergedErrors,
    voice: mergedVoice,
    discourse: mergedDiscourse,
    summary
  }
}

/**
 * Generate a concise style description for LLM system prompts
 * This is what gets passed to the LLM when generating text
 */
export function generateStylePrompt(profile: StyleProfile): string {
  const s = profile.summary

  const lines: string[] = [
    '## Writing Style Profile',
    '',
    `**Complexity**: ${s.complexity_level} (avg ${Math.round(s.avg_sentence_length)} words/sentence)`,
    `**Formality**: ${s.formality}`,
    `**Tone**: ${s.emotional_tone}, ${s.confidence}`,
    ''
  ]

  // Personal style markers
  const markers: string[] = []
  if (s.uses_contractions) markers.push('uses contractions')
  if (s.uses_first_person) markers.push('uses first person')
  if (s.uses_questions) markers.push('asks rhetorical questions')
  if (s.uses_exclamations) markers.push('uses exclamations')

  if (markers.length > 0) {
    lines.push(`**Style markers**: ${markers.join(', ')}`)
  }

  // Signature phrases
  if (s.signature_openers.length > 0) {
    lines.push(`**Common openers**: "${s.signature_openers.slice(0, 3).join('", "')}"`)
  }

  if (s.favorite_transitions.length > 0) {
    lines.push(`**Favorite transitions**: "${s.favorite_transitions.slice(0, 3).join('", "')}"`)
  }

  // Error/imperfection guidance (crucial for human-like output)
  lines.push('')
  lines.push('## Natural Imperfections (IMPORTANT)')
  lines.push(`**Error tendency**: ${s.error_tendency}`)

  if (s.suggested_imperfections.length > 0) {
    lines.push('**Include naturally**:')
    for (const imp of s.suggested_imperfections) {
      lines.push(`- ${imp}`)
    }
  }

  // Generation hints
  if (s.generation_hints.length > 0) {
    lines.push('')
    lines.push('## Generation Guidelines')
    for (const hint of s.generation_hints) {
      lines.push(`- ${hint}`)
    }
  }

  return lines.join('\n')
}

/**
 * Convert profile to JSON for database storage
 */
export function profileToJSON(profile: StyleProfile): string {
  return JSON.stringify(profile)
}

/**
 * Parse profile from JSON (database retrieval)
 */
export function profileFromJSON(json: string): StyleProfile {
  return JSON.parse(json) as StyleProfile
}
