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
 * Generate a rich style description for LLM system prompts
 * Converts raw metrics into behavioral writing instructions
 */
export function generateStylePrompt(profile: StyleProfile): string {
  const s = profile.summary
  const p = profile.patterns
  const v = profile.voice
  const syn = profile.syntax
  const lex = profile.lexical
  const disc = profile.discourse
  const err = profile.errors

  const lines: string[] = []

  // --- Section 1: Writing Identity ---
  lines.push('## This Writer\'s Identity')

  const registerMap: Record<string, string> = {
    'formal': 'writes formally and precisely',
    'semi-formal': 'writes in a polished but approachable tone',
    'casual': 'writes casually and conversationally',
    'very_casual': 'writes very informally, almost like texting'
  }
  const confidenceMap: Record<string, string> = {
    'uncertain': 'tends to hedge and qualify statements',
    'balanced': 'balances confidence with appropriate hedging',
    'confident': 'states things directly and assertively'
  }
  const toneMap: Record<string, string> = {
    'positive': 'generally upbeat and enthusiastic',
    'neutral': 'measured and even-toned',
    'negative': 'critical and skeptical'
  }

  lines.push(`This person ${registerMap[s.formality] || 'writes naturally'}. They ${confidenceMap[s.confidence] || 'write with balanced confidence'} and are ${toneMap[s.emotional_tone] || 'even-toned'}.`)

  if (v.self_mention.total_rate > 30) {
    lines.push('They write from a strong first-person perspective — lots of "I", "my", "me".')
  } else if (v.self_mention.total_rate > 15) {
    lines.push('They use first person moderately.')
  } else {
    lines.push('They rarely use first person. The writing tends to be impersonal.')
  }

  // --- Section 2: Structural Signatures ---
  lines.push('')
  lines.push('## How They Structure Text')

  const shortPct = Math.round(syn.sentence_length.distribution.short * 100)
  const medPct = Math.round(syn.sentence_length.distribution.medium * 100)
  const longPct = Math.round(syn.sentence_length.distribution.long * 100)
  lines.push(`Sentence rhythm: ${shortPct}% short (under 10 words), ${medPct}% medium, ${longPct}% long (25+ words). Average sentence is ${Math.round(syn.sentence_length.avg_words)} words.`)

  if (shortPct > 40 && longPct > 15) {
    lines.push('They deliberately mix short punchy sentences with longer complex ones. Replicate this variation.')
  } else if (shortPct > 50) {
    lines.push('They favor short, clipped sentences. Keep most sentences under 15 words.')
  } else if (longPct > 35) {
    lines.push('They write in longer, flowing sentences. Don\'t chop things up artificially.')
  }

  lines.push(`Paragraphs average ${Math.round(syn.paragraph_length.avg_sentences)} sentences and ${Math.round(syn.paragraph_length.avg_words)} words.`)

  if (s.signature_openers.length > 0) {
    lines.push(`They often start sentences with: ${s.signature_openers.slice(0, 5).map(o => `"${o}"`).join(', ')}. Use these naturally.`)
  }

  if (s.signature_closers.length > 0) {
    lines.push(`They tend to end thoughts with phrases like: ${s.signature_closers.slice(0, 4).map(c => `"${c}"`).join(', ')}.`)
  }

  const punctNotes: string[] = []
  if (p.punctuation_patterns.dash_rate > 0.1) punctNotes.push('uses dashes frequently for asides')
  else if (p.punctuation_patterns.dash_rate < 0.02) punctNotes.push('rarely uses dashes')
  if (p.punctuation_patterns.parenthetical_rate > 0.08) punctNotes.push('uses parenthetical asides')
  if (p.punctuation_patterns.semicolon_rate > 0.03) punctNotes.push('uses semicolons')
  if (p.punctuation_patterns.ellipsis_rate > 0.03) punctNotes.push('uses ellipses (...)')
  if (p.punctuation_patterns.comma_density > 2.5) punctNotes.push('heavy comma usage')
  else if (p.punctuation_patterns.comma_density < 1.0) punctNotes.push('minimal comma usage')

  if (punctNotes.length > 0) {
    lines.push(`Punctuation habits: ${punctNotes.join('; ')}.`)
  }

  if (syn.question_rate > 0.1) {
    lines.push('They ask questions in their writing — use rhetorical questions naturally.')
  }
  if (syn.exclamation_rate > 0.05) {
    lines.push('They use exclamation marks for emphasis.')
  }

  // --- Section 3: Voice and Tone ---
  lines.push('')
  lines.push('## Their Voice')

  if (v.hedging.rate_per_1000 > 15 && v.hedging.top_hedges.length > 0) {
    const topHedges = v.hedging.top_hedges.slice(0, 4).map(h => `"${h.word}"`).join(', ')
    lines.push(`They hedge with words like ${topHedges}. Include this uncertainty naturally.`)
  }
  if (v.boosting.rate_per_1000 > 10 && v.boosting.top_boosters.length > 0) {
    const topBoosters = v.boosting.top_boosters.slice(0, 4).map(b => `"${b.word}"`).join(', ')
    lines.push(`They use confidence boosters like ${topBoosters}.`)
  }

  if (lex.contractions_rate > 20) {
    const topContractions = lex.contractions_list.slice(0, 5).map(c => `"${c.word}"`).join(', ')
    lines.push(`They use contractions freely: ${topContractions}. Always use contractions where natural.`)
  } else if (lex.contractions_rate < 5) {
    lines.push('They avoid contractions. Write out "do not", "cannot", "it is" in full.')
  }

  if (v.filler_word_rate > 8) {
    lines.push('They use filler words (well, so, like, basically) — include some naturally.')
  }

  if (v.engagement.reader_address_rate > 10) {
    lines.push('They address the reader directly ("you", "your"). Do this too.')
  }

  // --- Section 4: Word Choice ---
  lines.push('')
  lines.push('## Their Word Choice')

  if (s.favorite_transitions.length > 0) {
    lines.push(`Favorite transitions: ${s.favorite_transitions.slice(0, 6).map(t => `"${t}"`).join(', ')}. Use THESE, not generic ones like "Furthermore" or "Additionally".`)
  }

  if (lex.vocab_richness.mtld > 80) {
    lines.push('They have a rich vocabulary. Use varied, precise word choices.')
  } else if (lex.vocab_richness.mtld < 40) {
    lines.push('They use simple, straightforward vocabulary. Don\'t reach for fancy words.')
  }

  if (lex.spelling_style === 'british') {
    lines.push('They use British English spelling (colour, organise, favourite).')
  } else if (lex.spelling_style === 'american') {
    lines.push('They use American English spelling (color, organize, favorite).')
  }

  if (p.signature_ngrams.length > 0) {
    const topNgrams = p.signature_ngrams.slice(0, 5).map(n => `"${n.phrase}"`).join(', ')
    lines.push(`Distinctive phrases they reuse: ${topNgrams}.`)
  }

  // --- Section 5: Natural Imperfections ---
  lines.push('')
  lines.push('## Their Natural Imperfections')
  lines.push('Real human writing has imperfections. This writer\'s patterns:')

  if (s.error_tendency === 'clean') {
    lines.push('They write cleanly with few errors. Don\'t inject artificial mistakes.')
  } else {
    if (err.error_signature.suggested_error_injection.typos && err.typo_rate > 2) {
      lines.push(`They make occasional typos (about ${Math.round(err.typo_rate)} per 1000 words). Let a couple slip through naturally.`)
    }
    if (err.error_signature.suggested_error_injection.missing_apostrophes) {
      lines.push('They sometimes skip apostrophes in contractions (dont, cant, wont).')
    }
    if (err.error_signature.suggested_error_injection.informal_spellings) {
      lines.push('They use informal spellings sometimes (gonna, wanna, kinda).')
    }
    if (err.error_signature.suggested_error_injection.comma_issues) {
      lines.push('They occasionally use comma splices — two independent clauses joined by just a comma.')
    }
    if (err.tense_consistency.consistency_score < 0.7) {
      lines.push('They shift tenses sometimes. Don\'t force perfect tense consistency.')
    }
  }

  if (err.capitalization.lowercase_i_count > 0 && err.capitalization.error_rate > 3) {
    lines.push('They sometimes use lowercase "i" instead of "I".')
  }

  // --- Section 6: Discourse Organization ---
  lines.push('')
  lines.push('## How They Organize Ideas')

  const orgStyle = disc.discourse_signature.organization_style
  if (orgStyle === 'highly_structured') {
    lines.push('They organize ideas in a clear, structured way with logical progression.')
  } else if (orgStyle === 'loosely_structured') {
    lines.push('Their writing flows loosely, more stream-of-consciousness. Don\'t impose rigid structure.')
  } else {
    lines.push('They use moderate structure — organized but not rigid.')
  }

  const argStyle = disc.discourse_signature.argumentation_style
  if (argStyle === 'contrastive') {
    lines.push('They often argue by contrast — presenting opposing views then their position.')
  } else if (argStyle === 'causal') {
    lines.push('They reason through cause and effect.')
  } else if (argStyle === 'additive') {
    lines.push('They build arguments by accumulation — adding point upon point.')
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
