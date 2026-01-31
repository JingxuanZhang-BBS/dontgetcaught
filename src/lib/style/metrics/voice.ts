/**
 * Voice & Pragmatics Analysis
 * Analyzes tone, stance, attitude, and communicative style
 * Captures the "personality" of writing
 */

// Hedging markers (uncertainty, softening)
const HEDGING_WORDS = [
  'maybe', 'perhaps', 'possibly', 'probably', 'might', 'could', 'may',
  'somewhat', 'rather', 'fairly', 'quite', 'sort of', 'kind of',
  'in a way', 'to some extent', 'more or less', 'in some ways',
  'apparently', 'seemingly', 'arguably', 'supposedly', 'allegedly',
  'suggest', 'suggests', 'seem', 'seems', 'appear', 'appears',
  'tend', 'tends', 'likely', 'unlikely', 'possible', 'impossible',
  'generally', 'usually', 'often', 'sometimes', 'occasionally',
  'i think', 'i believe', 'i guess', 'i suppose', 'i feel',
  'in my opinion', 'it seems', 'it appears', 'it looks like'
]

// Boosting markers (certainty, emphasis)
const BOOSTING_WORDS = [
  'definitely', 'certainly', 'absolutely', 'clearly', 'obviously',
  'undoubtedly', 'surely', 'of course', 'no doubt', 'without doubt',
  'completely', 'totally', 'entirely', 'fully', 'utterly',
  'always', 'never', 'every', 'none', 'all', 'nothing',
  'must', 'have to', 'need to', 'essential', 'critical',
  'exactly', 'precisely', 'literally', 'truly', 'really',
  'indeed', 'in fact', 'actually', 'honestly', 'frankly',
  'i know', 'i am sure', 'i am certain', 'i firmly believe'
]

// Self-mention patterns (first person usage)
const SELF_MENTION_PATTERNS = {
  first_singular: /\b(i|me|my|mine|myself)\b/gi,
  first_plural: /\b(we|us|our|ours|ourselves)\b/gi,
  // "I think", "I believe" type patterns (already in hedging but specifically self-referential)
  opinion_markers: /\b(i think|i believe|i feel|i guess|i suppose|in my view|in my opinion|to me|for me)\b/gi
}

// Engagement markers (reader/audience awareness)
const ENGAGEMENT_MARKERS = [
  // Direct address
  'you', 'your', 'yourself', "you're", "you've", "you'd", "you'll",
  // Inclusive we
  "let's", 'we all', 'we can', 'we should', 'together',
  // Questions to reader
  'right?', 'you know?', 'don\'t you think', 'wouldn\'t you',
  // Directives
  'consider', 'note', 'notice', 'remember', 'imagine', 'think about',
  'look at', 'see', 'observe', 'take a moment'
]

// Attitude markers (emotional stance)
const ATTITUDE_MARKERS = {
  positive: [
    'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
    'brilliant', 'beautiful', 'perfect', 'love', 'enjoy', 'appreciate',
    'admire', 'fortunate', 'lucky', 'glad', 'happy', 'pleased', 'excited',
    'interesting', 'fascinating', 'remarkable', 'impressive', 'incredible',
    'best', 'better', 'improve', 'success', 'achievement', 'progress'
  ],
  negative: [
    'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrating',
    'annoying', 'problematic', 'difficult', 'hard', 'hate', 'dislike',
    'unfortunately', 'sadly', 'regrettably', 'worry', 'concern', 'fear',
    'worst', 'worse', 'fail', 'failure', 'mistake', 'error', 'problem',
    'issue', 'challenge', 'struggle', 'trouble', 'crisis'
  ],
  surprise: [
    'surprisingly', 'unexpectedly', 'remarkably', 'strangely', 'oddly',
    'interestingly', 'curious', 'curiously', 'funny enough', 'weird',
    'shocking', 'astonishing', 'amazing', 'unbelievable'
  ]
}

// Formality markers
const FORMALITY_MARKERS = {
  formal: [
    'therefore', 'however', 'moreover', 'furthermore', 'nevertheless',
    'consequently', 'thus', 'hence', 'accordingly', 'subsequently',
    'regarding', 'concerning', 'with respect to', 'in regard to',
    'it should be noted', 'it is important to note', 'it is worth noting',
    'one might argue', 'one could say', 'it can be seen',
    'the aforementioned', 'the latter', 'the former', 'hitherto',
    'whereas', 'whilst', 'notwithstanding', 'inasmuch', 'insofar'
  ],
  informal: [
    'anyway', 'anyways', 'basically', 'like', 'you know', 'i mean',
    'pretty', 'really', 'super', 'kinda', 'sorta', 'gonna', 'wanna',
    'gotta', 'lemme', 'gimme', 'yeah', 'yep', 'nope', 'okay', 'ok',
    'stuff', 'things', 'lot', 'lots', 'bunch', 'tons',
    'cool', 'awesome', 'sweet', 'nice', 'great', 'huge',
    'totally', 'literally', 'honestly', 'seriously', 'actually',
    'btw', 'tbh', 'imo', 'imho', 'lol', 'omg', 'idk'
  ]
}

// Contraction patterns (informal indicator)
const CONTRACTION_PATTERN = /\b(\w+)'(s|t|re|ve|ll|d|m)\b/gi

// Filler words/discourse markers
const FILLER_WORDS = [
  'well', 'so', 'now', 'then', 'like', 'just', 'actually', 'basically',
  'honestly', 'literally', 'obviously', 'clearly', 'essentially',
  'i mean', 'you know', 'you see', 'you know what', 'let me tell you',
  'the thing is', 'here\'s the thing', 'the point is', 'the fact is'
]

export interface VoiceMetrics {
  hedging: {
    rate_per_1000: number
    top_hedges: Array<{ word: string; count: number }>
  }

  boosting: {
    rate_per_1000: number
    top_boosters: Array<{ word: string; count: number }>
  }

  hedge_boost_ratio: number  // < 1 = more hedging, > 1 = more boosting

  self_mention: {
    first_singular_rate: number  // per 1000 words
    first_plural_rate: number
    opinion_marker_rate: number
    total_rate: number
  }

  engagement: {
    reader_address_rate: number  // "you" usage per 1000 words
    question_rate: number  // rhetorical questions
    directive_rate: number
  }

  attitude: {
    positive_rate: number
    negative_rate: number
    surprise_rate: number
    sentiment_balance: number  // -1 to 1 (negative to positive)
  }

  formality: {
    formal_marker_rate: number
    informal_marker_rate: number
    contraction_rate: number
    formality_score: number  // 0-1 (informal to formal)
  }

  filler_word_rate: number

  // Overall voice signature
  voice_signature: {
    confidence_level: 'uncertain' | 'balanced' | 'confident'
    self_focus: 'high' | 'medium' | 'low'
    audience_awareness: 'high' | 'medium' | 'low'
    emotional_tone: 'positive' | 'neutral' | 'negative'
    register: 'formal' | 'semi-formal' | 'casual' | 'very_casual'
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Count pattern occurrences and return rate per 1000 words
 */
function countPatternRate(text: string, patterns: string[], wordCount: number): {
  rate: number;
  top: Array<{ word: string; count: number }>
} {
  if (wordCount === 0) return { rate: 0, top: [] }

  const lowerText = text.toLowerCase()
  const counts: { [word: string]: number } = {}
  let total = 0

  for (const pattern of patterns) {
    // Create regex for whole word/phrase matching
    const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = lowerText.match(regex) || []
    if (matches.length > 0) {
      counts[pattern] = matches.length
      total += matches.length
    }
  }

  const top = Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    rate: (total / wordCount) * 1000,
    top
  }
}

/**
 * Analyze hedging usage
 */
function analyzeHedging(text: string, wordCount: number): VoiceMetrics['hedging'] {
  const result = countPatternRate(text, HEDGING_WORDS, wordCount)
  return {
    rate_per_1000: result.rate,
    top_hedges: result.top
  }
}

/**
 * Analyze boosting usage
 */
function analyzeBoosting(text: string, wordCount: number): VoiceMetrics['boosting'] {
  const result = countPatternRate(text, BOOSTING_WORDS, wordCount)
  return {
    rate_per_1000: result.rate,
    top_boosters: result.top
  }
}

/**
 * Analyze self-mention patterns
 */
function analyzeSelfMention(text: string, wordCount: number): VoiceMetrics['self_mention'] {
  if (wordCount === 0) {
    return { first_singular_rate: 0, first_plural_rate: 0, opinion_marker_rate: 0, total_rate: 0 }
  }

  const singularMatches = (text.match(SELF_MENTION_PATTERNS.first_singular) || []).length
  const pluralMatches = (text.match(SELF_MENTION_PATTERNS.first_plural) || []).length
  const opinionMatches = (text.match(SELF_MENTION_PATTERNS.opinion_markers) || []).length

  return {
    first_singular_rate: (singularMatches / wordCount) * 1000,
    first_plural_rate: (pluralMatches / wordCount) * 1000,
    opinion_marker_rate: (opinionMatches / wordCount) * 1000,
    total_rate: ((singularMatches + pluralMatches) / wordCount) * 1000
  }
}

/**
 * Analyze engagement markers
 */
function analyzeEngagement(text: string, wordCount: number): VoiceMetrics['engagement'] {
  if (wordCount === 0) {
    return { reader_address_rate: 0, question_rate: 0, directive_rate: 0 }
  }

  const lowerText = text.toLowerCase()

  // Count "you" variants
  const youMatches = (lowerText.match(/\b(you|your|yourself|you're|you've|you'd|you'll)\b/g) || []).length

  // Count questions
  const questions = (text.match(/\?/g) || []).length

  // Count directive verbs at sentence start
  const directives = ['consider', 'note', 'notice', 'remember', 'imagine', 'think about', 'look at', 'see', 'observe']
  let directiveCount = 0
  for (const directive of directives) {
    const regex = new RegExp(`[.!?]\\s+${directive}\\b`, 'gi')
    directiveCount += (text.match(regex) || []).length
  }

  return {
    reader_address_rate: (youMatches / wordCount) * 1000,
    question_rate: (questions / (text.split(/[.!?]+/).length || 1)) * 100,
    directive_rate: (directiveCount / wordCount) * 1000
  }
}

/**
 * Analyze attitude markers
 */
function analyzeAttitude(text: string, wordCount: number): VoiceMetrics['attitude'] {
  if (wordCount === 0) {
    return { positive_rate: 0, negative_rate: 0, surprise_rate: 0, sentiment_balance: 0 }
  }

  const positiveResult = countPatternRate(text, ATTITUDE_MARKERS.positive, wordCount)
  const negativeResult = countPatternRate(text, ATTITUDE_MARKERS.negative, wordCount)
  const surpriseResult = countPatternRate(text, ATTITUDE_MARKERS.surprise, wordCount)

  // Calculate sentiment balance (-1 to 1)
  const totalSentiment = positiveResult.rate + negativeResult.rate
  let sentimentBalance = 0
  if (totalSentiment > 0) {
    sentimentBalance = (positiveResult.rate - negativeResult.rate) / totalSentiment
  }

  return {
    positive_rate: positiveResult.rate,
    negative_rate: negativeResult.rate,
    surprise_rate: surpriseResult.rate,
    sentiment_balance: sentimentBalance
  }
}

/**
 * Analyze formality level
 */
function analyzeFormality(text: string, wordCount: number): VoiceMetrics['formality'] {
  if (wordCount === 0) {
    return { formal_marker_rate: 0, informal_marker_rate: 0, contraction_rate: 0, formality_score: 0.5 }
  }

  const formalResult = countPatternRate(text, FORMALITY_MARKERS.formal, wordCount)
  const informalResult = countPatternRate(text, FORMALITY_MARKERS.informal, wordCount)

  // Count contractions
  const contractions = (text.match(CONTRACTION_PATTERN) || []).length
  const contractionRate = (contractions / wordCount) * 1000

  // Calculate formality score (0 = very informal, 1 = very formal)
  // More formal markers = higher score, more informal/contractions = lower score
  const formalScore = formalResult.rate
  const informalScore = informalResult.rate + contractionRate * 0.5

  let formalityScore = 0.5
  if (formalScore + informalScore > 0) {
    formalityScore = formalScore / (formalScore + informalScore)
  }

  return {
    formal_marker_rate: formalResult.rate,
    informal_marker_rate: informalResult.rate,
    contraction_rate: contractionRate,
    formality_score: formalityScore
  }
}

/**
 * Generate overall voice signature
 */
function generateVoiceSignature(
  hedging: VoiceMetrics['hedging'],
  boosting: VoiceMetrics['boosting'],
  selfMention: VoiceMetrics['self_mention'],
  engagement: VoiceMetrics['engagement'],
  attitude: VoiceMetrics['attitude'],
  formality: VoiceMetrics['formality']
): VoiceMetrics['voice_signature'] {
  // Confidence level
  const hedgeBoostRatio = boosting.rate_per_1000 / (hedging.rate_per_1000 || 0.1)
  let confidenceLevel: 'uncertain' | 'balanced' | 'confident' = 'balanced'
  if (hedgeBoostRatio < 0.5) confidenceLevel = 'uncertain'
  else if (hedgeBoostRatio > 2) confidenceLevel = 'confident'

  // Self-focus
  let selfFocus: 'high' | 'medium' | 'low' = 'medium'
  if (selfMention.total_rate > 50) selfFocus = 'high'
  else if (selfMention.total_rate < 20) selfFocus = 'low'

  // Audience awareness
  let audienceAwareness: 'high' | 'medium' | 'low' = 'medium'
  if (engagement.reader_address_rate > 30 || engagement.question_rate > 20) {
    audienceAwareness = 'high'
  } else if (engagement.reader_address_rate < 10 && engagement.question_rate < 5) {
    audienceAwareness = 'low'
  }

  // Emotional tone
  let emotionalTone: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (attitude.sentiment_balance > 0.3) emotionalTone = 'positive'
  else if (attitude.sentiment_balance < -0.3) emotionalTone = 'negative'

  // Register
  let register: 'formal' | 'semi-formal' | 'casual' | 'very_casual' = 'semi-formal'
  if (formality.formality_score > 0.7) register = 'formal'
  else if (formality.formality_score > 0.4) register = 'semi-formal'
  else if (formality.formality_score > 0.2) register = 'casual'
  else register = 'very_casual'

  return {
    confidence_level: confidenceLevel,
    self_focus: selfFocus,
    audience_awareness: audienceAwareness,
    emotional_tone: emotionalTone,
    register
  }
}

/**
 * Main function: Analyze voice and pragmatics of text
 */
export function analyzeVoice(text: string): VoiceMetrics {
  const wordCount = countWords(text)

  const hedging = analyzeHedging(text, wordCount)
  const boosting = analyzeBoosting(text, wordCount)
  const selfMention = analyzeSelfMention(text, wordCount)
  const engagement = analyzeEngagement(text, wordCount)
  const attitude = analyzeAttitude(text, wordCount)
  const formality = analyzeFormality(text, wordCount)

  // Filler word rate
  const fillerResult = countPatternRate(text, FILLER_WORDS, wordCount)

  // Hedge/boost ratio
  const hedgeBoostRatio = boosting.rate_per_1000 / (hedging.rate_per_1000 || 0.1)

  return {
    hedging,
    boosting,
    hedge_boost_ratio: hedgeBoostRatio,
    self_mention: selfMention,
    engagement,
    attitude,
    formality,
    filler_word_rate: fillerResult.rate,
    voice_signature: generateVoiceSignature(hedging, boosting, selfMention, engagement, attitude, formality)
  }
}

/**
 * Merge voice metrics from multiple text samples
 */
export function mergeVoiceMetrics(metricsList: VoiceMetrics[]): VoiceMetrics {
  if (metricsList.length === 0) {
    return analyzeVoice('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  const n = metricsList.length

  // Merge hedging
  const avgHedging: VoiceMetrics['hedging'] = {
    rate_per_1000: metricsList.reduce((s, m) => s + m.hedging.rate_per_1000, 0) / n,
    top_hedges: mergeTopItems(metricsList.map(m => m.hedging.top_hedges))
  }

  // Merge boosting
  const avgBoosting: VoiceMetrics['boosting'] = {
    rate_per_1000: metricsList.reduce((s, m) => s + m.boosting.rate_per_1000, 0) / n,
    top_boosters: mergeTopItems(metricsList.map(m => m.boosting.top_boosters))
  }

  // Merge self mention
  const avgSelfMention: VoiceMetrics['self_mention'] = {
    first_singular_rate: metricsList.reduce((s, m) => s + m.self_mention.first_singular_rate, 0) / n,
    first_plural_rate: metricsList.reduce((s, m) => s + m.self_mention.first_plural_rate, 0) / n,
    opinion_marker_rate: metricsList.reduce((s, m) => s + m.self_mention.opinion_marker_rate, 0) / n,
    total_rate: metricsList.reduce((s, m) => s + m.self_mention.total_rate, 0) / n
  }

  // Merge engagement
  const avgEngagement: VoiceMetrics['engagement'] = {
    reader_address_rate: metricsList.reduce((s, m) => s + m.engagement.reader_address_rate, 0) / n,
    question_rate: metricsList.reduce((s, m) => s + m.engagement.question_rate, 0) / n,
    directive_rate: metricsList.reduce((s, m) => s + m.engagement.directive_rate, 0) / n
  }

  // Merge attitude
  const avgAttitude: VoiceMetrics['attitude'] = {
    positive_rate: metricsList.reduce((s, m) => s + m.attitude.positive_rate, 0) / n,
    negative_rate: metricsList.reduce((s, m) => s + m.attitude.negative_rate, 0) / n,
    surprise_rate: metricsList.reduce((s, m) => s + m.attitude.surprise_rate, 0) / n,
    sentiment_balance: metricsList.reduce((s, m) => s + m.attitude.sentiment_balance, 0) / n
  }

  // Merge formality
  const avgFormality: VoiceMetrics['formality'] = {
    formal_marker_rate: metricsList.reduce((s, m) => s + m.formality.formal_marker_rate, 0) / n,
    informal_marker_rate: metricsList.reduce((s, m) => s + m.formality.informal_marker_rate, 0) / n,
    contraction_rate: metricsList.reduce((s, m) => s + m.formality.contraction_rate, 0) / n,
    formality_score: metricsList.reduce((s, m) => s + m.formality.formality_score, 0) / n
  }

  const avgFillerRate = metricsList.reduce((s, m) => s + m.filler_word_rate, 0) / n
  const avgHedgeBoostRatio = metricsList.reduce((s, m) => s + m.hedge_boost_ratio, 0) / n

  return {
    hedging: avgHedging,
    boosting: avgBoosting,
    hedge_boost_ratio: avgHedgeBoostRatio,
    self_mention: avgSelfMention,
    engagement: avgEngagement,
    attitude: avgAttitude,
    formality: avgFormality,
    filler_word_rate: avgFillerRate,
    voice_signature: generateVoiceSignature(avgHedging, avgBoosting, avgSelfMention, avgEngagement, avgAttitude, avgFormality)
  }
}

/**
 * Helper: Merge top items from multiple lists
 */
function mergeTopItems(lists: Array<Array<{ word: string; count: number }>>): Array<{ word: string; count: number }> {
  const merged: { [word: string]: number } = {}

  for (const list of lists) {
    for (const item of list) {
      merged[item.word] = (merged[item.word] || 0) + item.count
    }
  }

  return Object.entries(merged)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
