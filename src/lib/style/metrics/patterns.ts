/**
 * Idiosyncratic Patterns Library
 * Extracts signature phrases, expressions, and rhetorical patterns
 * This is crucial for making generated text "sound like" the user
 */

// Common rhetorical frames/templates to detect
const RHETORICAL_FRAMES = [
  // Contrast patterns
  'not only * but also',
  'on one hand * on the other hand',
  'while * at the same time',
  // Emphasis patterns
  'the point is',
  'the thing is',
  'the fact is',
  'the truth is',
  'the problem is',
  'what i mean is',
  'what i\'m saying is',
  // Conditional patterns
  'if * then',
  'even if',
  'only if',
  // Listing patterns
  'first * second * third',
  'firstly * secondly * thirdly',
  // Conclusion patterns
  'all in all',
  'in short',
  'in conclusion',
  'to sum up',
  'to summarize',
  'long story short',
  'bottom line',
  // Reasoning patterns
  'the reason is',
  'this is because',
  'that\'s why',
  'that is why'
]

// Common sentence opener patterns to track
const OPENER_PATTERNS = [
  // Conversational
  'honestly,', 'honestly', 'to be honest,', 'tbh,', 'tbh',
  'actually,', 'actually', 'well,', 'well',
  'basically,', 'basically', 'essentially,', 'essentially',
  'look,', 'look', 'see,', 'see',
  'okay,', 'okay so', 'ok,', 'ok so',
  'so,', 'so', 'anyway,', 'anyway', 'anyways,', 'anyways',
  // Opinion markers
  'i think', 'i believe', 'i feel', 'i mean', 'i guess',
  'in my opinion,', 'imo,', 'personally,', 'personally',
  'to me,', 'for me,',
  // Hedging
  'maybe', 'perhaps', 'probably', 'possibly',
  'i\'m not sure but', 'i might be wrong but',
  // Emphasis
  'seriously,', 'seriously', 'literally,', 'literally',
  'obviously,', 'obviously', 'clearly,', 'clearly',
  'definitely,', 'definitely', 'certainly,', 'certainly',
  // Transition
  'however,', 'however', 'but', 'and', 'so',
  'therefore,', 'therefore', 'thus,', 'thus',
  'moreover,', 'moreover', 'furthermore,', 'furthermore',
  'meanwhile,', 'meanwhile',
  // Casual transitions
  'like,', 'like', 'you know,', 'you know',
  'i mean,', 'i mean',
  // Framing
  'the thing is,', 'the thing is', 'the point is,', 'the point is',
  'to be fair,', 'to be fair', 'in fact,', 'in fact',
  'in general,', 'in general', 'generally,', 'generally',
  'for example,', 'for instance,'
]

// Common sentence closer patterns
const CLOSER_PATTERNS = [
  // Casual endings
  'so yeah.', 'so yeah', 'so yea.', 'so yea',
  'you know.', 'you know?', 'you know',
  'i guess.', 'i guess', 'i think.', 'i think',
  'or something.', 'or something', 'or whatever.', 'or whatever',
  'and stuff.', 'and stuff', 'and things.', 'and things',
  // Conclusive
  'that\'s it.', 'that\'s it', 'that\'s all.', 'that\'s all',
  'in short.', 'in short', 'overall.', 'overall',
  'basically.', 'basically', 'essentially.', 'essentially',
  // Trailing off
  '...', '..', '. . .',
  // Emphatic
  'period.', 'period', 'full stop.', 'full stop',
  'seriously.', 'seriously', 'honestly.', 'honestly',
  // Questions as closers
  'right?', 'right', 'isn\'t it?', 'don\'t you think?',
  'make sense?', 'does that make sense?',
  // Hedging closers
  'i suppose.', 'i suppose', 'i think.', 'i think',
  'maybe.', 'maybe', 'perhaps.', 'perhaps',
  // Informal
  'lol.', 'lol', 'haha.', 'haha', 'lmao.', 'lmao'
]

export interface PatternMetrics {
  signature_openers: Array<{ phrase: string; count: number; rate: number }>
  signature_closers: Array<{ phrase: string; count: number; rate: number }>
  signature_ngrams: Array<{ phrase: string; count: number; rate: number }>
  rhetorical_frames: Array<{ pattern: string; count: number }>
  punctuation_patterns: {
    ellipsis_rate: number      // Use of ...
    dash_rate: number          // Use of - or --
    parenthetical_rate: number // Use of ()
    colon_rate: number         // Use of :
    semicolon_rate: number     // Use of ;
    exclamation_rate: number   // Use of !
    question_rate: number      // Use of ?
    comma_density: number      // Commas per sentence
  }
  ending_punctuation: {
    period: number
    exclamation: number
    question: number
    ellipsis: number
  }
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  let processedText = text
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Ms\./g, 'Ms')
    .replace(/Dr\./g, 'Dr')
    .replace(/Prof\./g, 'Prof')
    .replace(/vs\./g, 'vs')
    .replace(/etc\./g, 'etc')
    .replace(/e\.g\./g, 'eg')
    .replace(/i\.e\./g, 'ie')

  const sentences = processedText
    .split(/(?<=[.!?…])\s+(?=[A-Z])|(?<=[.!?…])$/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences
}

/**
 * Extract signature openers (how user starts sentences)
 */
function extractOpeners(sentences: string[]): Array<{ phrase: string; count: number; rate: number }> {
  if (sentences.length === 0) return []

  const openerCounts = new Map<string, number>()

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()

    for (const opener of OPENER_PATTERNS) {
      const openerLower = opener.toLowerCase()
      if (lowerSentence.startsWith(openerLower + ' ') ||
          lowerSentence.startsWith(openerLower) && lowerSentence.length === openerLower.length) {
        openerCounts.set(opener, (openerCounts.get(opener) || 0) + 1)
        break // Only count first matching opener
      }
    }
  }

  return Array.from(openerCounts.entries())
    .map(([phrase, count]) => ({
      phrase,
      count,
      rate: count / sentences.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

/**
 * Extract signature closers (how user ends sentences)
 */
function extractClosers(sentences: string[]): Array<{ phrase: string; count: number; rate: number }> {
  if (sentences.length === 0) return []

  const closerCounts = new Map<string, number>()

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()

    for (const closer of CLOSER_PATTERNS) {
      const closerLower = closer.toLowerCase()
      if (lowerSentence.endsWith(closerLower) ||
          lowerSentence.endsWith(closerLower.replace(/\.$/, ''))) {
        closerCounts.set(closer, (closerCounts.get(closer) || 0) + 1)
        break // Only count first matching closer
      }
    }
  }

  return Array.from(closerCounts.entries())
    .map(([phrase, count]) => ({
      phrase,
      count,
      rate: count / sentences.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

/**
 * Extract signature n-grams (distinctive phrases)
 */
function extractSignatureNgrams(text: string): Array<{ phrase: string; count: number; rate: number }> {
  const words = text.toLowerCase()
    .replace(/[^\w\s''-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)

  const totalWords = words.length
  if (totalWords < 3) return []

  // Extract 3-grams and 4-grams
  const ngramCounts = new Map<string, number>()

  // 3-grams
  for (let i = 0; i <= words.length - 3; i++) {
    const ngram = words.slice(i, i + 3).join(' ')
    ngramCounts.set(ngram, (ngramCounts.get(ngram) || 0) + 1)
  }

  // 4-grams
  for (let i = 0; i <= words.length - 4; i++) {
    const ngram = words.slice(i, i + 4).join(' ')
    ngramCounts.set(ngram, (ngramCounts.get(ngram) || 0) + 1)
  }

  // Filter to only keep n-grams that appear at least twice
  // and are potentially distinctive (not just common phrases)
  const commonPhrases = new Set([
    'i don\'t know', 'i don\'t think', 'a lot of', 'one of the',
    'some of the', 'most of the', 'all of the', 'part of the',
    'in the middle', 'at the end', 'at the same', 'the same time',
    'of the world', 'in the world', 'of the day', 'at the time'
  ])

  return Array.from(ngramCounts.entries())
    .filter(([phrase, count]) => count >= 2 && !commonPhrases.has(phrase))
    .map(([phrase, count]) => ({
      phrase,
      count,
      rate: count / (totalWords / 3)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
}

/**
 * Detect rhetorical frames/templates
 */
function detectRhetoricalFrames(text: string): Array<{ pattern: string; count: number }> {
  const lowerText = text.toLowerCase()
  const results: Array<{ pattern: string; count: number }> = []

  for (const frame of RHETORICAL_FRAMES) {
    // Convert pattern with wildcards to regex
    const regexPattern = frame
      .replace(/\*/g, '.+?')
      .replace(/\s+/g, '\\s+')
    const regex = new RegExp(regexPattern, 'gi')
    const matches = lowerText.match(regex)
    const count = matches ? matches.length : 0

    if (count > 0) {
      results.push({ pattern: frame, count })
    }
  }

  return results.sort((a, b) => b.count - a.count)
}

/**
 * Analyze punctuation patterns
 */
function analyzePunctuationPatterns(text: string, sentences: string[]): PatternMetrics['punctuation_patterns'] {
  const totalChars = text.length
  const totalSentences = sentences.length || 1

  // Count various punctuation marks
  const ellipsisCount = (text.match(/\.{3}|…/g) || []).length
  const dashCount = (text.match(/[-–—]/g) || []).length
  const parentheticalCount = (text.match(/\([^)]*\)/g) || []).length
  const colonCount = (text.match(/:/g) || []).length
  const semicolonCount = (text.match(/;/g) || []).length
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  const commaCount = (text.match(/,/g) || []).length

  return {
    ellipsis_rate: ellipsisCount / totalSentences,
    dash_rate: dashCount / totalSentences,
    parenthetical_rate: parentheticalCount / totalSentences,
    colon_rate: colonCount / totalSentences,
    semicolon_rate: semicolonCount / totalSentences,
    exclamation_rate: exclamationCount / totalSentences,
    question_rate: questionCount / totalSentences,
    comma_density: commaCount / totalSentences
  }
}

/**
 * Analyze sentence ending punctuation distribution
 */
function analyzeEndingPunctuation(sentences: string[]): PatternMetrics['ending_punctuation'] {
  if (sentences.length === 0) {
    return { period: 0, exclamation: 0, question: 0, ellipsis: 0 }
  }

  let periodCount = 0
  let exclamationCount = 0
  let questionCount = 0
  let ellipsisCount = 0

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.endsWith('...') || trimmed.endsWith('…')) {
      ellipsisCount++
    } else if (trimmed.endsWith('!')) {
      exclamationCount++
    } else if (trimmed.endsWith('?')) {
      questionCount++
    } else if (trimmed.endsWith('.')) {
      periodCount++
    }
  }

  const total = sentences.length
  return {
    period: periodCount / total,
    exclamation: exclamationCount / total,
    question: questionCount / total,
    ellipsis: ellipsisCount / total
  }
}

/**
 * Main function: Analyze idiosyncratic patterns in text
 */
export function analyzePatterns(text: string): PatternMetrics {
  const sentences = splitIntoSentences(text)

  return {
    signature_openers: extractOpeners(sentences),
    signature_closers: extractClosers(sentences),
    signature_ngrams: extractSignatureNgrams(text),
    rhetorical_frames: detectRhetoricalFrames(text),
    punctuation_patterns: analyzePunctuationPatterns(text, sentences),
    ending_punctuation: analyzeEndingPunctuation(sentences)
  }
}

/**
 * Merge pattern metrics from multiple text samples
 */
export function mergePatternMetrics(metricsList: PatternMetrics[]): PatternMetrics {
  if (metricsList.length === 0) {
    return analyzePatterns('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  const n = metricsList.length

  // Merge openers
  const openerMap = new Map<string, { count: number; rate: number }>()
  for (const m of metricsList) {
    for (const opener of m.signature_openers) {
      const existing = openerMap.get(opener.phrase) || { count: 0, rate: 0 }
      openerMap.set(opener.phrase, {
        count: existing.count + opener.count,
        rate: existing.rate + opener.rate
      })
    }
  }

  // Merge closers
  const closerMap = new Map<string, { count: number; rate: number }>()
  for (const m of metricsList) {
    for (const closer of m.signature_closers) {
      const existing = closerMap.get(closer.phrase) || { count: 0, rate: 0 }
      closerMap.set(closer.phrase, {
        count: existing.count + closer.count,
        rate: existing.rate + closer.rate
      })
    }
  }

  // Merge n-grams
  const ngramMap = new Map<string, { count: number; rate: number }>()
  for (const m of metricsList) {
    for (const ngram of m.signature_ngrams) {
      const existing = ngramMap.get(ngram.phrase) || { count: 0, rate: 0 }
      ngramMap.set(ngram.phrase, {
        count: existing.count + ngram.count,
        rate: existing.rate + ngram.rate
      })
    }
  }

  // Merge rhetorical frames
  const frameMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const frame of m.rhetorical_frames) {
      frameMap.set(frame.pattern, (frameMap.get(frame.pattern) || 0) + frame.count)
    }
  }

  // Average punctuation patterns
  const avgPunctuation = {
    ellipsis_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.ellipsis_rate, 0) / n,
    dash_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.dash_rate, 0) / n,
    parenthetical_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.parenthetical_rate, 0) / n,
    colon_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.colon_rate, 0) / n,
    semicolon_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.semicolon_rate, 0) / n,
    exclamation_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.exclamation_rate, 0) / n,
    question_rate: metricsList.reduce((s, m) => s + m.punctuation_patterns.question_rate, 0) / n,
    comma_density: metricsList.reduce((s, m) => s + m.punctuation_patterns.comma_density, 0) / n
  }

  // Average ending punctuation
  const avgEnding = {
    period: metricsList.reduce((s, m) => s + m.ending_punctuation.period, 0) / n,
    exclamation: metricsList.reduce((s, m) => s + m.ending_punctuation.exclamation, 0) / n,
    question: metricsList.reduce((s, m) => s + m.ending_punctuation.question, 0) / n,
    ellipsis: metricsList.reduce((s, m) => s + m.ending_punctuation.ellipsis, 0) / n
  }

  return {
    signature_openers: Array.from(openerMap.entries())
      .map(([phrase, data]) => ({ phrase, count: data.count, rate: data.rate / n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    signature_closers: Array.from(closerMap.entries())
      .map(([phrase, data]) => ({ phrase, count: data.count, rate: data.rate / n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    signature_ngrams: Array.from(ngramMap.entries())
      .map(([phrase, data]) => ({ phrase, count: data.count, rate: data.rate / n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30),
    rhetorical_frames: Array.from(frameMap.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count),
    punctuation_patterns: avgPunctuation,
    ending_punctuation: avgEnding
  }
}
