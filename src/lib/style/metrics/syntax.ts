/**
 * Syntactic Signature Analysis
 * Analyzes sentence structure, complexity, and organizational patterns
 */

// Clause markers (subordinating conjunctions and relative pronouns)
const CLAUSE_MARKERS = [
  'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'while',
  'although', 'though', 'because', 'since', 'if', 'unless', 'until',
  'after', 'before', 'as', 'whether', 'whereas', 'whenever', 'wherever'
]

// Coordinating connectors
const CONNECTORS = [
  'and', 'but', 'or', 'so', 'yet', 'for', 'nor',
  'however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
  'meanwhile', 'otherwise', 'consequently', 'thus', 'hence',
  'besides', 'instead', 'likewise', 'similarly', 'accordingly'
]

// Common sentence starters
const SENTENCE_STARTERS = [
  // Informal starters (important for style matching)
  'but', 'and', 'so', 'or', 'well',
  // Opinion/stance markers
  'i think', 'i believe', 'i feel', 'i mean', 'i guess',
  'honestly', 'basically', 'actually', 'obviously', 'clearly',
  'personally', 'frankly', 'seriously', 'literally',
  // Hedging starters
  'maybe', 'perhaps', 'probably', 'possibly',
  // Transition starters
  'however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
  'meanwhile', 'otherwise', 'consequently', 'thus', 'hence',
  'first', 'second', 'third', 'finally', 'lastly',
  'in fact', 'in general', 'in conclusion', 'in summary',
  'for example', 'for instance', 'in other words',
  'on the other hand', 'at the same time', 'as a result',
  // Casual/conversational
  'like', 'ok so', 'okay so', 'anyway', 'anyways',
  'to be fair', 'to be honest', 'the thing is', 'the point is',
  'look', 'see', 'you know', 'i know'
]

export interface SyntaxMetrics {
  sentence_length: {
    distribution: { short: number; medium: number; long: number }
    avg_words: number
    median_words: number
    std_dev: number
  }
  clause_density: number  // avg clause markers per sentence
  connector_density: number  // avg connectors per sentence
  starter_phrases: Array<{ phrase: string; rate: number; position: 'start' | 'any' }>
  paragraph_length: {
    avg_sentences: number
    avg_words: number
    p50_words: number
    p90_words: number
  }
  question_rate: number  // percentage of sentences that are questions
  exclamation_rate: number  // percentage with exclamation marks
  sentence_type_distribution: {
    declarative: number
    interrogative: number
    exclamatory: number
    imperative: number
  }
}

/**
 * Split text into sentences (basic implementation)
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations to avoid false splits
  let processedText = text
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Ms\./g, 'Ms')
    .replace(/Dr\./g, 'Dr')
    .replace(/Prof\./g, 'Prof')
    .replace(/Jr\./g, 'Jr')
    .replace(/Sr\./g, 'Sr')
    .replace(/vs\./g, 'vs')
    .replace(/etc\./g, 'etc')
    .replace(/e\.g\./g, 'eg')
    .replace(/i\.e\./g, 'ie')

  // Split on sentence boundaries
  const sentences = processedText
    .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const squareDiffs = values.map(v => Math.pow(v - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Analyze sentence length distribution
 */
function analyzeSentenceLength(sentences: string[]): SyntaxMetrics['sentence_length'] {
  if (sentences.length === 0) {
    return {
      distribution: { short: 0, medium: 0, long: 0 },
      avg_words: 0,
      median_words: 0,
      std_dev: 0
    }
  }

  const lengths = sentences.map(countWords)
  const total = sentences.length

  // Short: < 10 words, Medium: 10-25 words, Long: > 25 words
  const shortCount = lengths.filter(l => l < 10).length
  const mediumCount = lengths.filter(l => l >= 10 && l <= 25).length
  const longCount = lengths.filter(l => l > 25).length

  const avgWords = lengths.reduce((s, l) => s + l, 0) / total
  const sortedLengths = [...lengths].sort((a, b) => a - b)
  const medianWords = sortedLengths[Math.floor(total / 2)]

  return {
    distribution: {
      short: shortCount / total,
      medium: mediumCount / total,
      long: longCount / total
    },
    avg_words: avgWords,
    median_words: medianWords,
    std_dev: calculateStdDev(lengths)
  }
}

/**
 * Calculate clause density (clause markers per sentence)
 */
function calculateClauseDensity(sentences: string[]): number {
  if (sentences.length === 0) return 0

  let totalMarkers = 0
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().split(/\s+/)
    for (const marker of CLAUSE_MARKERS) {
      totalMarkers += words.filter(w => w === marker).length
    }
  }

  return totalMarkers / sentences.length
}

/**
 * Calculate connector density (connectors per sentence)
 */
function calculateConnectorDensity(sentences: string[]): number {
  if (sentences.length === 0) return 0

  let totalConnectors = 0
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().split(/\s+/)
    for (const connector of CONNECTORS) {
      totalConnectors += words.filter(w => w === connector).length
    }
  }

  return totalConnectors / sentences.length
}

/**
 * Analyze sentence starter patterns
 */
function analyzeStarterPhrases(sentences: string[]): Array<{ phrase: string; rate: number; position: 'start' | 'any' }> {
  if (sentences.length === 0) return []

  const starterCounts = new Map<string, number>()

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()

    for (const starter of SENTENCE_STARTERS) {
      // Check if sentence starts with this phrase
      if (lowerSentence.startsWith(starter + ' ') ||
          lowerSentence.startsWith(starter + ',') ||
          lowerSentence === starter) {
        starterCounts.set(starter, (starterCounts.get(starter) || 0) + 1)
      }
    }
  }

  return Array.from(starterCounts.entries())
    .map(([phrase, count]) => ({
      phrase,
      rate: count / sentences.length,
      position: 'start' as const
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 20)
}

/**
 * Analyze paragraph structure
 */
function analyzeParagraphLength(paragraphs: string[]): SyntaxMetrics['paragraph_length'] {
  if (paragraphs.length === 0) {
    return { avg_sentences: 0, avg_words: 0, p50_words: 0, p90_words: 0 }
  }

  const sentenceCounts: number[] = []
  const wordCounts: number[] = []

  for (const para of paragraphs) {
    const sentences = splitIntoSentences(para)
    sentenceCounts.push(sentences.length)
    wordCounts.push(countWords(para))
  }

  return {
    avg_sentences: sentenceCounts.reduce((s, c) => s + c, 0) / paragraphs.length,
    avg_words: wordCounts.reduce((s, c) => s + c, 0) / paragraphs.length,
    p50_words: percentile(wordCounts, 50),
    p90_words: percentile(wordCounts, 90)
  }
}

/**
 * Detect sentence types
 */
function detectSentenceType(sentence: string): 'declarative' | 'interrogative' | 'exclamatory' | 'imperative' {
  const trimmed = sentence.trim()

  if (trimmed.endsWith('?')) {
    return 'interrogative'
  }

  if (trimmed.endsWith('!')) {
    return 'exclamatory'
  }

  // Simple heuristic for imperatives: starts with verb
  const imperativeStarters = [
    'do', 'don\'t', 'please', 'let', 'make', 'take', 'give', 'go', 'come',
    'try', 'keep', 'remember', 'consider', 'think', 'look', 'see', 'listen',
    'be', 'have', 'get', 'put', 'stop', 'start', 'begin', 'end', 'finish'
  ]

  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')
  if (imperativeStarters.includes(firstWord)) {
    return 'imperative'
  }

  return 'declarative'
}

/**
 * Main function: Analyze syntactic characteristics of text
 */
export function analyzeSyntax(text: string): SyntaxMetrics {
  const sentences = splitIntoSentences(text)
  const paragraphs = splitIntoParagraphs(text)

  // Sentence type analysis
  const typeDistribution = { declarative: 0, interrogative: 0, exclamatory: 0, imperative: 0 }
  for (const sentence of sentences) {
    const type = detectSentenceType(sentence)
    typeDistribution[type]++
  }

  // Normalize to percentages
  const total = sentences.length || 1
  for (const type of Object.keys(typeDistribution) as Array<keyof typeof typeDistribution>) {
    typeDistribution[type] /= total
  }

  return {
    sentence_length: analyzeSentenceLength(sentences),
    clause_density: calculateClauseDensity(sentences),
    connector_density: calculateConnectorDensity(sentences),
    starter_phrases: analyzeStarterPhrases(sentences),
    paragraph_length: analyzeParagraphLength(paragraphs),
    question_rate: typeDistribution.interrogative,
    exclamation_rate: typeDistribution.exclamatory,
    sentence_type_distribution: typeDistribution
  }
}

/**
 * Merge syntax metrics from multiple text samples
 */
export function mergeSyntaxMetrics(metricsList: SyntaxMetrics[]): SyntaxMetrics {
  if (metricsList.length === 0) {
    return analyzeSyntax('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  const n = metricsList.length

  // Average sentence length metrics
  const avgSentenceLength = {
    distribution: {
      short: metricsList.reduce((s, m) => s + m.sentence_length.distribution.short, 0) / n,
      medium: metricsList.reduce((s, m) => s + m.sentence_length.distribution.medium, 0) / n,
      long: metricsList.reduce((s, m) => s + m.sentence_length.distribution.long, 0) / n
    },
    avg_words: metricsList.reduce((s, m) => s + m.sentence_length.avg_words, 0) / n,
    median_words: metricsList.reduce((s, m) => s + m.sentence_length.median_words, 0) / n,
    std_dev: metricsList.reduce((s, m) => s + m.sentence_length.std_dev, 0) / n
  }

  // Average paragraph length metrics
  const avgParagraphLength = {
    avg_sentences: metricsList.reduce((s, m) => s + m.paragraph_length.avg_sentences, 0) / n,
    avg_words: metricsList.reduce((s, m) => s + m.paragraph_length.avg_words, 0) / n,
    p50_words: metricsList.reduce((s, m) => s + m.paragraph_length.p50_words, 0) / n,
    p90_words: metricsList.reduce((s, m) => s + m.paragraph_length.p90_words, 0) / n
  }

  // Merge starter phrases
  const starterMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const starter of m.starter_phrases) {
      starterMap.set(starter.phrase, (starterMap.get(starter.phrase) || 0) + starter.rate)
    }
  }

  const mergedStarters = Array.from(starterMap.entries())
    .map(([phrase, rate]) => ({ phrase, rate: rate / n, position: 'start' as const }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 20)

  // Average sentence type distribution
  const avgTypeDistribution = {
    declarative: metricsList.reduce((s, m) => s + m.sentence_type_distribution.declarative, 0) / n,
    interrogative: metricsList.reduce((s, m) => s + m.sentence_type_distribution.interrogative, 0) / n,
    exclamatory: metricsList.reduce((s, m) => s + m.sentence_type_distribution.exclamatory, 0) / n,
    imperative: metricsList.reduce((s, m) => s + m.sentence_type_distribution.imperative, 0) / n
  }

  return {
    sentence_length: avgSentenceLength,
    clause_density: metricsList.reduce((s, m) => s + m.clause_density, 0) / n,
    connector_density: metricsList.reduce((s, m) => s + m.connector_density, 0) / n,
    starter_phrases: mergedStarters,
    paragraph_length: avgParagraphLength,
    question_rate: metricsList.reduce((s, m) => s + m.question_rate, 0) / n,
    exclamation_rate: metricsList.reduce((s, m) => s + m.exclamation_rate, 0) / n,
    sentence_type_distribution: avgTypeDistribution
  }
}
