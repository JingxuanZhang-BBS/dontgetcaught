/**
 * Lexical Fingerprint Analysis
 * Analyzes vocabulary patterns, word choices, and lexical characteristics
 */

// Common English stop words to exclude from frequency analysis
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'he', 'she', 'they',
  'we', 'you', 'i', 'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his',
  'their', 'our', 'mine', 'yours', 'hers', 'theirs', 'ours', 'what', 'which',
  'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'just', 'don', 'now', 've', 'll', 're', 'd', 'm'
])

// Synonym clusters for preference analysis
const SYNONYM_CLUSTERS: Record<string, string[]> = {
  'intensity_very': ['very', 'really', 'extremely', 'incredibly', 'super', 'so'],
  'intensity_kind': ['kind of', 'kinda', 'sort of', 'sorta', 'somewhat'],
  'causation': ['because', 'cuz', 'cause', 'since', 'as'],
  'contrast': ['but', 'however', 'although', 'though', 'yet'],
  'addition': ['also', 'additionally', 'moreover', 'furthermore', 'plus'],
  'certainty': ['definitely', 'certainly', 'surely', 'absolutely', 'totally'],
  'uncertainty': ['maybe', 'perhaps', 'possibly', 'probably', 'might'],
}

// Common contractions
const CONTRACTIONS = [
  "i'm", "i've", "i'll", "i'd",
  "you're", "you've", "you'll", "you'd",
  "he's", "he'll", "he'd",
  "she's", "she'll", "she'd",
  "it's", "it'll",
  "we're", "we've", "we'll", "we'd",
  "they're", "they've", "they'll", "they'd",
  "that's", "that'll", "that'd",
  "who's", "who'll", "who'd",
  "what's", "what'll", "what'd",
  "where's", "where'll", "where'd",
  "when's", "when'll",
  "why's", "why'll",
  "how's", "how'll",
  "there's", "there'll", "there'd",
  "here's",
  "let's",
  "can't", "couldn't", "won't", "wouldn't", "shouldn't", "mustn't",
  "isn't", "aren't", "wasn't", "weren't",
  "hasn't", "haven't", "hadn't",
  "doesn't", "don't", "didn't",
  "ain't", "gonna", "wanna", "gotta", "kinda", "sorta", "dunno"
]

// Slang and informal words
const INFORMAL_WORDS = [
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'yeah', 'yep', 'nope',
  'ok', 'okay', 'cool', 'awesome', 'stuff', 'things', 'like', 'basically',
  'literally', 'actually', 'honestly', 'seriously', 'totally', 'definitely',
  'pretty', 'super', 'really', 'legit', 'tbh', 'ngl', 'imo', 'imho', 'btw',
  'lol', 'omg', 'wtf', 'idk', 'fyi'
]

export interface LexicalMetrics {
  top_unigrams: Array<{ word: string; freq: number }>
  top_bigrams: Array<{ phrase: string; freq: number }>
  top_trigrams: Array<{ phrase: string; freq: number }>
  synonym_preferences: Record<string, Record<string, number>>
  contractions_rate: number
  contractions_list: Array<{ word: string; count: number }>
  informal_words_rate: number
  vocab_richness: {
    ttr: number      // Type-Token Ratio
    mtld: number     // Measure of Textual Lexical Diversity
    unique_words: number
    total_words: number
  }
  spelling_style: 'american' | 'british' | 'mixed'
  avg_word_length: number
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s''-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
}

/**
 * Extract n-grams from tokens
 */
function extractNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = []
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '))
  }
  return ngrams
}

/**
 * Count frequency of items and return sorted by frequency
 */
function countFrequency(items: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const item of items) {
    freq.set(item, (freq.get(item) || 0) + 1)
  }
  return freq
}

/**
 * Get top N items by frequency
 */
function getTopN(
  freq: Map<string, number>,
  n: number,
  total: number,
  filter?: (key: string) => boolean
): Array<{ word?: string; phrase?: string; freq: number }> {
  let entries = Array.from(freq.entries())

  if (filter) {
    entries = entries.filter(([key]) => filter(key))
  }

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({
      word: key,
      phrase: key,
      freq: count / total
    }))
}

/**
 * Calculate Type-Token Ratio (simple vocabulary diversity measure)
 */
function calculateTTR(tokens: string[]): number {
  if (tokens.length === 0) return 0
  const uniqueTypes = new Set(tokens).size
  return uniqueTypes / tokens.length
}

/**
 * Calculate MTLD (Measure of Textual Lexical Diversity)
 * More stable than TTR for varying text lengths
 */
function calculateMTLD(tokens: string[]): number {
  if (tokens.length < 10) return 0

  const TTR_THRESHOLD = 0.72

  function mtldForward(words: string[]): number {
    let factors = 0
    let currentTTR = 1.0
    let start = 0

    for (let i = 0; i < words.length; i++) {
      const segment = words.slice(start, i + 1)
      const types = new Set(segment).size
      currentTTR = types / segment.length

      if (currentTTR <= TTR_THRESHOLD) {
        factors += 1
        start = i + 1
        currentTTR = 1.0
      }
    }

    // Add partial factor for remaining segment
    if (start < words.length) {
      const remaining = words.slice(start)
      if (remaining.length > 0) {
        const partialFactor = (1.0 - currentTTR) / (1.0 - TTR_THRESHOLD)
        factors += partialFactor
      }
    }

    return factors > 0 ? words.length / factors : words.length
  }

  // Calculate forward and backward, return average
  const forward = mtldForward(tokens)
  const backward = mtldForward([...tokens].reverse())

  return (forward + backward) / 2
}

/**
 * Detect spelling style (American vs British)
 */
function detectSpellingStyle(text: string): 'american' | 'british' | 'mixed' {
  const americanPatterns = [
    /\bcolor\b/gi, /\bfavor\b/gi, /\bhonor\b/gi, /\blabor\b/gi,
    /\borganize\b/gi, /\brealize\b/gi, /\banalyze\b/gi,
    /\bcenter\b/gi, /\btheater\b/gi, /\bdefense\b/gi
  ]

  const britishPatterns = [
    /\bcolour\b/gi, /\bfavour\b/gi, /\bhonour\b/gi, /\blabour\b/gi,
    /\borganise\b/gi, /\brealise\b/gi, /\banalyse\b/gi,
    /\bcentre\b/gi, /\btheatre\b/gi, /\bdefence\b/gi
  ]

  let americanCount = 0
  let britishCount = 0

  for (const pattern of americanPatterns) {
    const matches = text.match(pattern)
    if (matches) americanCount += matches.length
  }

  for (const pattern of britishPatterns) {
    const matches = text.match(pattern)
    if (matches) britishCount += matches.length
  }

  if (americanCount === 0 && britishCount === 0) return 'american' // default
  if (americanCount > 0 && britishCount === 0) return 'american'
  if (britishCount > 0 && americanCount === 0) return 'british'
  return 'mixed'
}

/**
 * Analyze synonym preferences
 */
function analyzeSynonymPreferences(
  text: string
): Record<string, Record<string, number>> {
  const textLower = text.toLowerCase()
  const preferences: Record<string, Record<string, number>> = {}

  for (const [cluster, synonyms] of Object.entries(SYNONYM_CLUSTERS)) {
    const counts: Record<string, number> = {}
    let total = 0

    for (const syn of synonyms) {
      // Count occurrences (word boundary aware for multi-word phrases)
      const regex = new RegExp(`\\b${syn.replace(/\s+/g, '\\s+')}\\b`, 'gi')
      const matches = textLower.match(regex)
      const count = matches ? matches.length : 0
      counts[syn] = count
      total += count
    }

    // Convert to percentages
    if (total > 0) {
      const percentages: Record<string, number> = {}
      for (const [syn, count] of Object.entries(counts)) {
        if (count > 0) {
          percentages[syn] = count / total
        }
      }
      if (Object.keys(percentages).length > 0) {
        preferences[cluster] = percentages
      }
    }
  }

  return preferences
}

/**
 * Count contractions usage
 */
function countContractions(text: string): {
  rate: number
  list: Array<{ word: string; count: number }>
} {
  const textLower = text.toLowerCase()
  const tokens = tokenize(text)
  const totalWords = tokens.length

  if (totalWords === 0) return { rate: 0, list: [] }

  const counts: Array<{ word: string; count: number }> = []
  let totalContractions = 0

  for (const contraction of CONTRACTIONS) {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi')
    const matches = textLower.match(regex)
    const count = matches ? matches.length : 0
    if (count > 0) {
      counts.push({ word: contraction, count })
      totalContractions += count
    }
  }

  return {
    rate: totalContractions / totalWords,
    list: counts.sort((a, b) => b.count - a.count)
  }
}

/**
 * Count informal words usage
 */
function countInformalWords(text: string): number {
  const textLower = text.toLowerCase()
  const tokens = tokenize(text)
  const totalWords = tokens.length

  if (totalWords === 0) return 0

  let count = 0
  for (const word of INFORMAL_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = textLower.match(regex)
    if (matches) count += matches.length
  }

  return count / totalWords
}

/**
 * Calculate average word length
 */
function calculateAvgWordLength(tokens: string[]): number {
  if (tokens.length === 0) return 0
  const totalLength = tokens.reduce((sum, w) => sum + w.length, 0)
  return totalLength / tokens.length
}

/**
 * Main function: Analyze lexical characteristics of text
 */
export function analyzeLexical(text: string): LexicalMetrics {
  const tokens = tokenize(text)
  const totalWords = tokens.length

  // Filter out stop words for frequency analysis
  const contentTokens = tokens.filter(t => !STOP_WORDS.has(t) && t.length > 1)

  // Calculate n-gram frequencies
  const unigramFreq = countFrequency(contentTokens)
  const bigramFreq = countFrequency(extractNgrams(tokens, 2))
  const trigramFreq = countFrequency(extractNgrams(tokens, 3))

  // Get top items
  const topUnigrams = getTopN(unigramFreq, 100, totalWords)
    .map(item => ({ word: item.word!, freq: item.freq }))

  const topBigrams = getTopN(bigramFreq, 50, totalWords - 1)
    .map(item => ({ phrase: item.phrase!, freq: item.freq }))

  const topTrigrams = getTopN(trigramFreq, 30, totalWords - 2)
    .map(item => ({ phrase: item.phrase!, freq: item.freq }))

  // Analyze contractions
  const contractionData = countContractions(text)

  // Calculate vocabulary richness
  const uniqueWords = new Set(tokens).size

  return {
    top_unigrams: topUnigrams,
    top_bigrams: topBigrams,
    top_trigrams: topTrigrams,
    synonym_preferences: analyzeSynonymPreferences(text),
    contractions_rate: contractionData.rate,
    contractions_list: contractionData.list,
    informal_words_rate: countInformalWords(text),
    vocab_richness: {
      ttr: calculateTTR(tokens),
      mtld: calculateMTLD(tokens),
      unique_words: uniqueWords,
      total_words: totalWords
    },
    spelling_style: detectSpellingStyle(text),
    avg_word_length: calculateAvgWordLength(tokens)
  }
}

/**
 * Merge lexical metrics from multiple text samples
 */
export function mergeLexicalMetrics(
  metricsList: LexicalMetrics[]
): LexicalMetrics {
  if (metricsList.length === 0) {
    return analyzeLexical('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  // Aggregate unigrams
  const unigramMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const item of m.top_unigrams) {
      unigramMap.set(item.word, (unigramMap.get(item.word) || 0) + item.freq)
    }
  }

  // Aggregate bigrams
  const bigramMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const item of m.top_bigrams) {
      bigramMap.set(item.phrase, (bigramMap.get(item.phrase) || 0) + item.freq)
    }
  }

  // Aggregate trigrams
  const trigramMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const item of m.top_trigrams) {
      trigramMap.set(item.phrase, (trigramMap.get(item.phrase) || 0) + item.freq)
    }
  }

  // Average numeric values
  const avgContractionsRate = metricsList.reduce((s, m) => s + m.contractions_rate, 0) / metricsList.length
  const avgInformalRate = metricsList.reduce((s, m) => s + m.informal_words_rate, 0) / metricsList.length
  const avgTTR = metricsList.reduce((s, m) => s + m.vocab_richness.ttr, 0) / metricsList.length
  const avgMTLD = metricsList.reduce((s, m) => s + m.vocab_richness.mtld, 0) / metricsList.length
  const totalUniqueWords = metricsList.reduce((s, m) => s + m.vocab_richness.unique_words, 0)
  const totalWords = metricsList.reduce((s, m) => s + m.vocab_richness.total_words, 0)
  const avgWordLength = metricsList.reduce((s, m) => s + m.avg_word_length, 0) / metricsList.length

  // Merge contractions list
  const contractionsMap = new Map<string, number>()
  for (const m of metricsList) {
    for (const item of m.contractions_list) {
      contractionsMap.set(item.word, (contractionsMap.get(item.word) || 0) + item.count)
    }
  }

  // Merge synonym preferences
  const mergedSynonyms: Record<string, Record<string, number>> = {}
  for (const m of metricsList) {
    for (const [cluster, prefs] of Object.entries(m.synonym_preferences)) {
      if (!mergedSynonyms[cluster]) {
        mergedSynonyms[cluster] = {}
      }
      for (const [word, pref] of Object.entries(prefs)) {
        mergedSynonyms[cluster][word] = (mergedSynonyms[cluster][word] || 0) + pref
      }
    }
  }
  // Normalize
  for (const cluster of Object.keys(mergedSynonyms)) {
    const total = Object.values(mergedSynonyms[cluster]).reduce((s, v) => s + v, 0)
    if (total > 0) {
      for (const word of Object.keys(mergedSynonyms[cluster])) {
        mergedSynonyms[cluster][word] /= total
      }
    }
  }

  // Determine spelling style by majority
  const styleCounts = { american: 0, british: 0, mixed: 0 }
  for (const m of metricsList) {
    styleCounts[m.spelling_style]++
  }
  const spellingStyle = styleCounts.american >= styleCounts.british ?
    (styleCounts.american >= styleCounts.mixed ? 'american' : 'mixed') :
    (styleCounts.british >= styleCounts.mixed ? 'british' : 'mixed')

  return {
    top_unigrams: Array.from(unigramMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([word, freq]) => ({ word, freq: freq / metricsList.length })),
    top_bigrams: Array.from(bigramMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([phrase, freq]) => ({ phrase, freq: freq / metricsList.length })),
    top_trigrams: Array.from(trigramMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([phrase, freq]) => ({ phrase, freq: freq / metricsList.length })),
    synonym_preferences: mergedSynonyms,
    contractions_rate: avgContractionsRate,
    contractions_list: Array.from(contractionsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count })),
    informal_words_rate: avgInformalRate,
    vocab_richness: {
      ttr: avgTTR,
      mtld: avgMTLD,
      unique_words: totalUniqueWords,
      total_words: totalWords
    },
    spelling_style: spellingStyle,
    avg_word_length: avgWordLength
  }
}
