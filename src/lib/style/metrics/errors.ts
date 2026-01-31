/**
 * Error Profile Analysis
 * The most crucial module for avoiding AI detection
 * Captures natural human imperfections: typos, grammar errors, inconsistencies
 */

// Common typo patterns (character swaps, missing letters, etc.)
const COMMON_TYPO_PATTERNS = [
  // Double letters
  { pattern: /\b(\w*?)([a-z])\2{2,}(\w*)\b/gi, type: 'triple_letter' },
  // Common letter swaps
  { pattern: /\bteh\b/gi, type: 'swap_the' },
  { pattern: /\btaht\b/gi, type: 'swap_that' },
  { pattern: /\bwith\b/gi, type: 'normal' }, // baseline, not an error
  { pattern: /\bwiht\b/gi, type: 'swap_with' },
  { pattern: /\bform\b/gi, type: 'normal' }, // could be typo for "from" but also valid word
  { pattern: /\bfomr\b/gi, type: 'swap_from' },
  { pattern: /\bfreind\b/gi, type: 'swap_friend' },
  { pattern: /\brecieve\b/gi, type: 'ie_swap' },
  { pattern: /\bbeleive\b/gi, type: 'ie_swap' },
  { pattern: /\bwierd\b/gi, type: 'ie_swap' },
  { pattern: /\bthier\b/gi, type: 'ie_swap' },
  { pattern: /\bneice\b/gi, type: 'ie_swap' },
  // Missing letters
  { pattern: /\bcoud\b/gi, type: 'missing_l' },
  { pattern: /\bwoud\b/gi, type: 'missing_l' },
  { pattern: /\bshoud\b/gi, type: 'missing_l' },
  { pattern: /\bdoesnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bdont\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bwont\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bcant\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bisnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\barent\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bwerent\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bwasnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bhasnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bhavent\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bhadnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bwouldnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bcouldnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\bshouldnt\b/gi, type: 'missing_apostrophe' },
  { pattern: /\blets\b/gi, type: 'missing_apostrophe' }, // ambiguous: could be valid plural
  { pattern: /\bits\b/gi, type: 'ambiguous' }, // could be "it's" or valid "its"
  // Extra letters
  { pattern: /\buntill\b/gi, type: 'extra_l' },
  { pattern: /\boccured\b/gi, type: 'missing_r' },
  { pattern: /\boccurred\b/gi, type: 'normal' }, // correct spelling
  // Common misspellings
  { pattern: /\balot\b/gi, type: 'missing_space' },
  { pattern: /\binfact\b/gi, type: 'missing_space' },
  { pattern: /\bnevertheless\b/gi, type: 'normal' },
  { pattern: /\bnoone\b/gi, type: 'missing_space' },
  { pattern: /\bsometime\b/gi, type: 'ambiguous' }, // could be valid
  { pattern: /\beverytime\b/gi, type: 'missing_space' },
  { pattern: /\banymore\b/gi, type: 'normal' }, // valid compound
  { pattern: /\balright\b/gi, type: 'informal_spelling' },
  { pattern: /\bgonna\b/gi, type: 'informal_spelling' },
  { pattern: /\bwanna\b/gi, type: 'informal_spelling' },
  { pattern: /\bgotta\b/gi, type: 'informal_spelling' },
  { pattern: /\bkinda\b/gi, type: 'informal_spelling' },
  { pattern: /\bsorta\b/gi, type: 'informal_spelling' },
  { pattern: /\bdunno\b/gi, type: 'informal_spelling' },
  { pattern: /\blemme\b/gi, type: 'informal_spelling' },
  { pattern: /\bgimme\b/gi, type: 'informal_spelling' },
]

// Article error patterns (a/an/the issues)
const ARTICLE_PATTERNS = {
  // "a" before vowel sound (should be "an")
  a_before_vowel: /\ba\s+(?:a|e|i|o|u|hour|honest|honor|heir)\w*/gi,
  // "an" before consonant sound (should be "a")
  an_before_consonant: /\ban\s+(?:b|c|d|f|g|j|k|l|m|n|p|q|r|s|t|v|w|x|y|z|uni|one|eu)\w*/gi,
  // Missing article patterns (heuristic - noun phrases without articles)
  // This is complex and prone to false positives, so we'll be conservative
}

// Comma splice detection (two independent clauses joined by comma without conjunction)
const COMMA_SPLICE_PATTERNS = [
  // Pattern: clause, pronoun + verb
  /,\s*(I|you|he|she|it|we|they)\s+(am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|must|might|may)\b/gi,
  // Pattern: clause, noun/proper + verb
  /,\s*([A-Z][a-z]+)\s+(is|are|was|were|has|had|does|did|will|would|can|could|should|must)\b/g,
]

// Tense markers for consistency analysis
const TENSE_MARKERS = {
  past: {
    verbs: /\b(was|were|had|did|went|came|saw|got|made|said|knew|thought|took|gave|found|told|asked|used|tried|called|seemed|felt|became|left|put|meant|kept|let|began|helped|showed|heard|played|moved|lived|believed|brought|happened|wrote|sat|stood|lost|paid|met|included|continued|set|learned|changed|led|understood|watched|followed|stopped|created|spoke|read|allowed|added|spent|grew|opened|walked|won|offered|remembered|considered|appeared|bought|waited|served|died|sent|expected|built|stayed|fell|cut|reached|killed|remained|suggested|raised|passed|sold|required|reported|decided|pulled)\b/gi,
    patterns: /\b(yesterday|last\s+(week|month|year|time|night)|ago|\d+\s+years?\s+ago|in\s+\d{4}|back\s+then|at\s+that\s+time|previously|formerly|once\s+upon)\b/gi
  },
  present: {
    verbs: /\b(is|are|am|have|has|do|does|go|goes|come|comes|see|sees|get|gets|make|makes|say|says|know|knows|think|thinks|take|takes|give|gives|find|finds|tell|tells|ask|asks|use|uses|try|tries|call|calls|seem|seems|feel|feels|become|becomes|leave|leaves|put|puts|mean|means|keep|keeps|let|lets|begin|begins|help|helps|show|shows|hear|hears|play|plays|move|moves|live|lives|believe|believes|bring|brings|happen|happens|write|writes|sit|sits|stand|stands|lose|loses|pay|pays|meet|meets|include|includes|continue|continues|set|sets|learn|learns|change|changes|lead|leads|understand|understands|watch|watches|follow|follows|stop|stops|create|creates|speak|speaks|read|reads|allow|allows|add|adds|spend|spends|grow|grows|open|opens|walk|walks|win|wins|offer|offers|remember|remembers|consider|considers|appear|appears|buy|buys|wait|waits|serve|serves|die|dies|send|sends|expect|expects|build|builds|stay|stays|fall|falls|cut|cuts|reach|reaches|kill|kills|remain|remains|suggest|suggests|raise|raises|pass|passes|sell|sells|require|requires|report|reports|decide|decides|pull|pulls)\b/gi,
    patterns: /\b(now|today|currently|at\s+the\s+moment|these\s+days|nowadays|presently|right\s+now|at\s+present)\b/gi
  },
  future: {
    verbs: /\b(will|shall|'ll|going\s+to)\b/gi,
    patterns: /\b(tomorrow|next\s+(week|month|year|time)|soon|in\s+the\s+future|later|eventually)\b/gi
  }
}

// Capitalization error patterns
const CAPITALIZATION_PATTERNS = {
  // Sentence start without capital (after . ! ?)
  missing_capital: /[.!?]\s+[a-z]/g,
  // Lowercase "I" standalone
  lowercase_i: /\s+i\s+/g,
  // Random capitals mid-sentence
  random_capital: /\s[a-z]+[A-Z][a-z]+\s/g,
  // All caps words (shouting)
  all_caps: /\b[A-Z]{4,}\b/g,
}

export interface ErrorMetrics {
  typo_rate: number  // typos per 1000 words
  typo_types: { [type: string]: number }  // breakdown by typo type

  article_errors: {
    total: number
    a_an_confusion: number
    rate_per_1000: number
  }

  comma_splice_rate: number  // per 1000 words
  comma_splice_examples: string[]  // sample problematic phrases

  tense_consistency: {
    primary_tense: 'past' | 'present' | 'future' | 'mixed'
    tense_distribution: { past: number; present: number; future: number }
    shift_count: number  // number of tense shifts
    consistency_score: number  // 0-1, higher = more consistent
  }

  capitalization: {
    error_rate: number  // errors per 1000 words
    missing_sentence_capitals: number
    lowercase_i_count: number
    all_caps_rate: number  // shouting words per 1000
  }

  // Aggregated error signature for generation guidance
  error_signature: {
    overall_error_rate: number  // total errors per 1000 words
    formality_level: 'formal' | 'casual' | 'very_casual'  // based on error types
    suggested_error_injection: {
      typos: boolean
      missing_apostrophes: boolean
      informal_spellings: boolean
      comma_issues: boolean
    }
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Detect typos and categorize them
 */
function analyzeTypos(text: string): { rate: number; types: { [type: string]: number } } {
  const wordCount = countWords(text)
  if (wordCount === 0) return { rate: 0, types: {} }

  const types: { [type: string]: number } = {}
  let totalTypos = 0

  for (const typoPattern of COMMON_TYPO_PATTERNS) {
    if (typoPattern.type === 'normal' || typoPattern.type === 'ambiguous') continue

    const matches = text.match(typoPattern.pattern) || []
    if (matches.length > 0) {
      types[typoPattern.type] = (types[typoPattern.type] || 0) + matches.length
      totalTypos += matches.length
    }
  }

  return {
    rate: (totalTypos / wordCount) * 1000,
    types
  }
}

/**
 * Analyze article usage errors
 */
function analyzeArticleErrors(text: string): ErrorMetrics['article_errors'] {
  const wordCount = countWords(text)
  if (wordCount === 0) return { total: 0, a_an_confusion: 0, rate_per_1000: 0 }

  let aAnConfusion = 0

  // Count "a" before vowel sound errors
  const aBeforeVowel = text.match(ARTICLE_PATTERNS.a_before_vowel) || []
  aAnConfusion += aBeforeVowel.length

  // Count "an" before consonant sound errors
  const anBeforeConsonant = text.match(ARTICLE_PATTERNS.an_before_consonant) || []
  aAnConfusion += anBeforeConsonant.length

  return {
    total: aAnConfusion,
    a_an_confusion: aAnConfusion,
    rate_per_1000: (aAnConfusion / wordCount) * 1000
  }
}

/**
 * Detect comma splices
 */
function analyzeCommaSplices(text: string): { rate: number; examples: string[] } {
  const wordCount = countWords(text)
  if (wordCount === 0) return { rate: 0, examples: [] }

  const examples: string[] = []
  let totalSplices = 0

  for (const pattern of COMMA_SPLICE_PATTERNS) {
    const matches = text.match(pattern) || []
    totalSplices += matches.length

    // Store first few examples
    for (const match of matches.slice(0, 3)) {
      if (examples.length < 5) {
        // Get surrounding context
        const index = text.indexOf(match)
        const start = Math.max(0, index - 20)
        const end = Math.min(text.length, index + match.length + 20)
        examples.push('...' + text.slice(start, end).trim() + '...')
      }
    }
  }

  return {
    rate: (totalSplices / wordCount) * 1000,
    examples
  }
}

/**
 * Analyze tense consistency
 */
function analyzeTenseConsistency(text: string): ErrorMetrics['tense_consistency'] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) {
    return {
      primary_tense: 'mixed',
      tense_distribution: { past: 0, present: 0, future: 0 },
      shift_count: 0,
      consistency_score: 1
    }
  }

  const tenseCounts = { past: 0, present: 0, future: 0 }
  const sentenceTenses: Array<'past' | 'present' | 'future' | null> = []

  for (const sentence of sentences) {
    // Count tense markers in each sentence
    const pastMatches = (sentence.match(TENSE_MARKERS.past.verbs) || []).length +
                       (sentence.match(TENSE_MARKERS.past.patterns) || []).length
    const presentMatches = (sentence.match(TENSE_MARKERS.present.verbs) || []).length +
                          (sentence.match(TENSE_MARKERS.present.patterns) || []).length
    const futureMatches = (sentence.match(TENSE_MARKERS.future.verbs) || []).length +
                         (sentence.match(TENSE_MARKERS.future.patterns) || []).length

    // Determine dominant tense for this sentence
    let dominantTense: 'past' | 'present' | 'future' | null = null
    const maxCount = Math.max(pastMatches, presentMatches, futureMatches)

    if (maxCount > 0) {
      if (pastMatches === maxCount) dominantTense = 'past'
      else if (presentMatches === maxCount) dominantTense = 'present'
      else dominantTense = 'future'
    }

    sentenceTenses.push(dominantTense)

    if (dominantTense) {
      tenseCounts[dominantTense]++
    }
  }

  // Calculate tense distribution
  const totalTensed = tenseCounts.past + tenseCounts.present + tenseCounts.future
  const distribution = {
    past: totalTensed > 0 ? tenseCounts.past / totalTensed : 0,
    present: totalTensed > 0 ? tenseCounts.present / totalTensed : 0,
    future: totalTensed > 0 ? tenseCounts.future / totalTensed : 0
  }

  // Determine primary tense
  let primaryTense: 'past' | 'present' | 'future' | 'mixed' = 'mixed'
  if (distribution.past > 0.6) primaryTense = 'past'
  else if (distribution.present > 0.6) primaryTense = 'present'
  else if (distribution.future > 0.6) primaryTense = 'future'

  // Count tense shifts (consecutive sentences with different tenses)
  let shiftCount = 0
  let prevTense: 'past' | 'present' | 'future' | null = null
  for (const tense of sentenceTenses) {
    if (tense && prevTense && tense !== prevTense) {
      shiftCount++
    }
    if (tense) prevTense = tense
  }

  // Calculate consistency score
  const maxDistribution = Math.max(distribution.past, distribution.present, distribution.future)
  const consistencyScore = maxDistribution * (1 - shiftCount / Math.max(sentences.length, 1) * 0.5)

  return {
    primary_tense: primaryTense,
    tense_distribution: distribution,
    shift_count: shiftCount,
    consistency_score: Math.max(0, Math.min(1, consistencyScore))
  }
}

/**
 * Analyze capitalization patterns
 */
function analyzeCapitalization(text: string): ErrorMetrics['capitalization'] {
  const wordCount = countWords(text)
  if (wordCount === 0) {
    return {
      error_rate: 0,
      missing_sentence_capitals: 0,
      lowercase_i_count: 0,
      all_caps_rate: 0
    }
  }

  // Missing sentence-start capitals
  const missingCapitals = (text.match(CAPITALIZATION_PATTERNS.missing_capital) || []).length

  // Lowercase "I" standalone
  const lowercaseI = (text.match(CAPITALIZATION_PATTERNS.lowercase_i) || []).length

  // All caps words (excluding common acronyms)
  const allCapsMatches = text.match(CAPITALIZATION_PATTERNS.all_caps) || []
  const commonAcronyms = ['USA', 'UK', 'FBI', 'CIA', 'NASA', 'NATO', 'AIDS', 'ASAP', 'FAQ', 'HTML', 'HTTP', 'API', 'CEO', 'CFO', 'CTO']
  const allCapsCount = allCapsMatches.filter(m => !commonAcronyms.includes(m)).length

  const totalErrors = missingCapitals + lowercaseI

  return {
    error_rate: (totalErrors / wordCount) * 1000,
    missing_sentence_capitals: missingCapitals,
    lowercase_i_count: lowercaseI,
    all_caps_rate: (allCapsCount / wordCount) * 1000
  }
}

/**
 * Generate error signature for generation guidance
 */
function generateErrorSignature(
  typoRate: number,
  typoTypes: { [type: string]: number },
  articleRate: number,
  commaSpliceRate: number,
  capErrorRate: number
): ErrorMetrics['error_signature'] {
  const overallErrorRate = typoRate + articleRate + commaSpliceRate + capErrorRate

  // Determine formality based on error types
  const informalCount = (typoTypes['informal_spelling'] || 0) +
                       (typoTypes['missing_apostrophe'] || 0)

  let formalityLevel: 'formal' | 'casual' | 'very_casual' = 'formal'
  if (informalCount > 5 || overallErrorRate > 20) {
    formalityLevel = 'very_casual'
  } else if (informalCount > 2 || overallErrorRate > 10) {
    formalityLevel = 'casual'
  }

  return {
    overall_error_rate: overallErrorRate,
    formality_level: formalityLevel,
    suggested_error_injection: {
      typos: typoRate > 0.5,
      missing_apostrophes: (typoTypes['missing_apostrophe'] || 0) > 0,
      informal_spellings: (typoTypes['informal_spelling'] || 0) > 0,
      comma_issues: commaSpliceRate > 0.3
    }
  }
}

/**
 * Main function: Analyze error profile of text
 */
export function analyzeErrors(text: string): ErrorMetrics {
  const typoAnalysis = analyzeTypos(text)
  const articleErrors = analyzeArticleErrors(text)
  const commaSplices = analyzeCommaSplices(text)
  const tenseConsistency = analyzeTenseConsistency(text)
  const capitalization = analyzeCapitalization(text)

  const errorSignature = generateErrorSignature(
    typoAnalysis.rate,
    typoAnalysis.types,
    articleErrors.rate_per_1000,
    commaSplices.rate,
    capitalization.error_rate
  )

  return {
    typo_rate: typoAnalysis.rate,
    typo_types: typoAnalysis.types,
    article_errors: articleErrors,
    comma_splice_rate: commaSplices.rate,
    comma_splice_examples: commaSplices.examples,
    tense_consistency: tenseConsistency,
    capitalization,
    error_signature: errorSignature
  }
}

/**
 * Merge error metrics from multiple text samples
 */
export function mergeErrorMetrics(metricsList: ErrorMetrics[]): ErrorMetrics {
  if (metricsList.length === 0) {
    return analyzeErrors('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  const n = metricsList.length

  // Average typo rate and merge types
  const avgTypoRate = metricsList.reduce((s, m) => s + m.typo_rate, 0) / n
  const mergedTypoTypes: { [type: string]: number } = {}
  for (const m of metricsList) {
    for (const [type, count] of Object.entries(m.typo_types)) {
      mergedTypoTypes[type] = (mergedTypoTypes[type] || 0) + count
    }
  }

  // Average article errors
  const avgArticleErrors = {
    total: Math.round(metricsList.reduce((s, m) => s + m.article_errors.total, 0) / n),
    a_an_confusion: Math.round(metricsList.reduce((s, m) => s + m.article_errors.a_an_confusion, 0) / n),
    rate_per_1000: metricsList.reduce((s, m) => s + m.article_errors.rate_per_1000, 0) / n
  }

  // Average comma splice rate and collect examples
  const avgCommaSpliceRate = metricsList.reduce((s, m) => s + m.comma_splice_rate, 0) / n
  const allExamples = metricsList.flatMap(m => m.comma_splice_examples).slice(0, 5)

  // Merge tense consistency
  const avgTenseDistribution = {
    past: metricsList.reduce((s, m) => s + m.tense_consistency.tense_distribution.past, 0) / n,
    present: metricsList.reduce((s, m) => s + m.tense_consistency.tense_distribution.present, 0) / n,
    future: metricsList.reduce((s, m) => s + m.tense_consistency.tense_distribution.future, 0) / n
  }

  let primaryTense: 'past' | 'present' | 'future' | 'mixed' = 'mixed'
  if (avgTenseDistribution.past > 0.6) primaryTense = 'past'
  else if (avgTenseDistribution.present > 0.6) primaryTense = 'present'
  else if (avgTenseDistribution.future > 0.6) primaryTense = 'future'

  const avgShiftCount = Math.round(metricsList.reduce((s, m) => s + m.tense_consistency.shift_count, 0) / n)
  const avgConsistencyScore = metricsList.reduce((s, m) => s + m.tense_consistency.consistency_score, 0) / n

  // Merge capitalization
  const avgCapitalization = {
    error_rate: metricsList.reduce((s, m) => s + m.capitalization.error_rate, 0) / n,
    missing_sentence_capitals: Math.round(metricsList.reduce((s, m) => s + m.capitalization.missing_sentence_capitals, 0) / n),
    lowercase_i_count: Math.round(metricsList.reduce((s, m) => s + m.capitalization.lowercase_i_count, 0) / n),
    all_caps_rate: metricsList.reduce((s, m) => s + m.capitalization.all_caps_rate, 0) / n
  }

  // Regenerate error signature
  const errorSignature = generateErrorSignature(
    avgTypoRate,
    mergedTypoTypes,
    avgArticleErrors.rate_per_1000,
    avgCommaSpliceRate,
    avgCapitalization.error_rate
  )

  return {
    typo_rate: avgTypoRate,
    typo_types: mergedTypoTypes,
    article_errors: avgArticleErrors,
    comma_splice_rate: avgCommaSpliceRate,
    comma_splice_examples: allExamples,
    tense_consistency: {
      primary_tense: primaryTense,
      tense_distribution: avgTenseDistribution,
      shift_count: avgShiftCount,
      consistency_score: avgConsistencyScore
    },
    capitalization: avgCapitalization,
    error_signature: errorSignature
  }
}
