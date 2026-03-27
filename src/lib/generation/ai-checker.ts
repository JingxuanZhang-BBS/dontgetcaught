/**
 * AI Pattern Checker
 * Programmatically scans generated text for detectable AI writing patterns
 * Used as a post-generation filter to trigger rewrites
 */

import { generateText } from './generator'

// Maximum number of rewrite passes
export const MAX_REWRITE_PASSES = 2

// Words that AI detection tools flag with high confidence
const BANNED_WORDS = [
  // Original high-confidence AI words
  'additionally', 'crucial', 'delve', 'emphasize', 'emphasizing',
  'enhance', 'enhanced', 'enhancing', 'foster', 'fostering', 'fostered',
  'garner', 'garnered', 'interplay', 'intricate', 'intricacies',
  'landscape', 'pivotal', 'showcase', 'showcasing', 'showcased',
  'tapestry', 'testament', 'underscore', 'underscoring', 'underscored',
  'vibrant', 'comprehensive', 'innovative', 'leverage', 'leveraging',
  'streamline', 'realm', 'cornerstone', 'multifaceted', 'encompass',
  'encompassing', 'holistic', 'paradigm', 'moreover', 'furthermore',
  'groundbreaking', 'breathtaking', 'game-changing', 'nestled',
  'renowned', 'palpable', 'invigorating', 'unparalleled', 'hallowed',
  'profound', 'profoundly', 'remarkable', 'remarkably', 'indelible',
  'burgeoning', 'transformative', 'spearheading', 'cutting-edge',
  'myriad', 'plethora', 'resonate', 'resonating', 'resonated',
  'navigate', 'navigating', 'navigated', 'embark', 'embarking',
  'harness', 'harnessing', 'harnessed', 'cultivate', 'cultivating',
  'endeavor', 'endeavors', 'aligns', 'aligning',
  // Flowery/literary AI words found in real detection tests
  'quaint', 'demeanor', 'effortless', 'inexplicable', 'unspoken',
  'velvety', 'amidst', 'whilst', 'unveiled', 'unveil', 'unveiling',
  'beckoned', 'beckoning', 'mingled', 'mingling', 'lingered', 'lingering',
  'entwined', 'intertwined', 'unfolded', 'unfolding',
  'patrons', 'peculiar', 'compelled', 'commenced',
  'orchestration', 'orchestrations', 'akin',
  'juxtaposition', 'dichotomy', 'enigmatic', 'ephemeral',
  'serendipitous', 'serendipity', 'tangible', 'intangible',
  'undeniable', 'undeniably', 'unmistakable', 'unmistakably',
  'poignant', 'poignancy', 'bittersweet',
  'whimsical', 'ethereal', 'transcend', 'transcending',
]

// Phrases that are strong AI signals
const BANNED_PHRASES = [
  // Original banned phrases
  'it is important to note',
  'it is worth mentioning',
  'it is worth noting',
  'in today\'s world',
  'in today\'s society',
  'in the world of',
  'in the realm of',
  'the future looks bright',
  'exciting times',
  'serves as a',
  'stands as a',
  'plays a vital role',
  'plays a crucial role',
  'plays a key role',
  'key turning point',
  'pivotal moment',
  'vital role',
  'crucial role',
  'at its core',
  'at the end of the day',
  'in order to',
  'a testament to',
  'deeply rooted',
  'rich tapestry',
  'ever-evolving',
  'evolving landscape',
  'set the stage',
  'setting the stage',
  'shaping the future',
  'paving the way',
  'the power of',
  'experts argue',
  'experts believe',
  'industry reports suggest',
  'observers have noted',
  'it goes without saying',
  'needless to say',
  'first and foremost',
  // Scene-setting AI clichés (detected in real test)
  'casting a soft',
  'casting a warm',
  'casting a golden',
  'amber glow',
  'golden glow',
  'soft glow',
  'warm glow',
  'aroma of freshly',
  'the aroma of',
  'a sense of calm',
  'sense of calm',
  'gentle simplicity',
  'quiet confidence',
  'effortless grace',
  // Romantic/literary AI clichés
  'written in the stars',
  'written in stars',
  'fate could script',
  'only fate could',
  'chapter in my life',
  'chapter of my life',
  'an unexpected chapter',
  'threads in a',
  'weaving together',
  'woven together',
  'spoke directly to',
  'spoke to parts of me',
  'went beyond words',
  'beyond mere',
  'beyond words',
  // Vague AI-style emotional language
  'for reasons beyond',
  'became apparent',
  'it became clear',
  'unbeknownst to',
  'little did i know',
  'i couldn\'t help but',
  'something shifted',
  'everything changed',
]

// Structural patterns detected via regex
const STRUCTURAL_PATTERNS = [
  {
    name: 'not_only_but_also',
    pattern: /not only\b.*?\bbut also\b/gi,
    description: '"Not only X, but also Y" construction'
  },
  {
    name: 'ing_phrase_tacked',
    pattern: /,\s*(highlighting|underscoring|reflecting|showcasing|ensuring|contributing to|fostering|emphasizing|demonstrating|illustrating|signaling|indicating|creating|forming|weaving|casting|revealing)\b/gi,
    description: 'Superficial -ing phrase tacked onto sentence'
  },
  {
    name: 'from_to_false_range',
    pattern: /from\s+\w+\s+to\s+\w+,\s*from\s+\w+\s+to\s+\w+/gi,
    description: '"From X to Y, from A to B" false range'
  },
  {
    name: 'curly_quotes',
    pattern: /[\u201C\u201D\u2018\u2019]/g,
    description: 'Curly quotation marks (AI artifact)'
  },
  {
    name: 'triple_parallel',
    pattern: /\b\w+\s+in\s+(her|his|their|its)\s+\w+[,;]\s*\w+\s+in\s+(her|his|their|its)\s+\w+[,;]?\s*(and\s+)?\w+\s+in\s+(her|his|their|its)\s+\w+/gi,
    description: 'AI triple-parallel structure (X in her Y, Z in her A, B in her C)'
  },
  {
    name: 'there_was_triple',
    pattern: /there was\b[^.]*,\s*[^.]*,\s*(and\s+)?[^.]*\bthat\b/gi,
    description: 'AI "There was X, Y, and Z that..." pattern'
  },
  {
    name: 'sensory_scene_opening',
    pattern: /^(the\s+(sun|air|wind|room|sky|light|morning|evening)\s+(had|was|cast|hung|filled|wrapped|bathed))/gim,
    description: 'AI sensory scene-setting opening'
  },
]

/**
 * Check if sentence lengths are too uniform (AI signal).
 * Human writing has high variance; AI tends toward medium-length uniformity.
 * Returns a score penalty (0 = good variance, higher = too uniform)
 */
function checkSentenceLengthVariance(text: string): { penalty: number; description: string } | null {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  if (sentences.length < 5) return null

  const lengths = sentences.map(s => s.trim().split(/\s+/).length)
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length
  const stdDev = Math.sqrt(variance)
  const coeffOfVariation = stdDev / avg

  // Very short sentences (< 3 words) and very long (> 35 words) both count
  const veryShort = lengths.filter(l => l <= 5).length
  const veryLong = lengths.filter(l => l >= 30).length
  const hasExtremes = veryShort >= 2 && veryLong >= 1

  // Coefficient of variation < 0.3 means very uniform sentence lengths — AI signal
  // Human writing typically has CoV > 0.4
  if (coeffOfVariation < 0.3 && !hasExtremes) {
    return {
      penalty: 6,
      description: `Sentence lengths are too uniform (CoV=${coeffOfVariation.toFixed(2)}). Mix very short sentences (3-6 words) with longer ones (25+ words).`
    }
  }

  if (coeffOfVariation < 0.35 && !hasExtremes) {
    return {
      penalty: 3,
      description: `Sentence lengths need more variation (CoV=${coeffOfVariation.toFixed(2)}). Add some very short or very long sentences.`
    }
  }

  return null
}

export interface AICheckResult {
  passed: boolean
  score: number // 0 = clean, higher = more AI-like
  bannedWordsFound: string[]
  bannedPhrasesFound: string[]
  structuralIssues: string[]
  cleanupInstructions: string
}

/**
 * Scan text for AI writing patterns
 * Returns a check result with specific issues found
 */
export function checkForAIPatterns(text: string): AICheckResult {
  const lowerText = text.toLowerCase()
  const bannedWordsFound: string[] = []
  const bannedPhrasesFound: string[] = []
  const structuralIssues: string[] = []

  // Check banned words
  for (const word of BANNED_WORDS) {
    // Match whole words only
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(lowerText)) {
      bannedWordsFound.push(word)
    }
  }

  // Check banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      bannedPhrasesFound.push(phrase)
    }
  }

  // Check structural patterns
  for (const sp of STRUCTURAL_PATTERNS) {
    if (sp.pattern.test(text)) {
      structuralIssues.push(sp.description)
    }
    // Reset regex lastIndex
    sp.pattern.lastIndex = 0
  }

  // Check sentence length variance
  const varianceResult = checkSentenceLengthVariance(text)
  let variancePenalty = 0
  if (varianceResult) {
    structuralIssues.push(varianceResult.description)
    variancePenalty = varianceResult.penalty
  }

  // Calculate score
  const score = bannedWordsFound.length * 3 + bannedPhrasesFound.length * 5 + structuralIssues.length * 4 + variancePenalty

  // Build cleanup instructions for the rewrite pass
  let cleanupInstructions = ''
  if (bannedWordsFound.length > 0 || bannedPhrasesFound.length > 0 || structuralIssues.length > 0) {
    const parts: string[] = []

    if (bannedWordsFound.length > 0) {
      parts.push(`Replace these AI-flagged words with simpler alternatives: ${bannedWordsFound.map(w => `"${w}"`).join(', ')}. Use everyday words instead.`)
    }

    if (bannedPhrasesFound.length > 0) {
      parts.push(`Remove or rewrite these AI phrases: ${bannedPhrasesFound.map(p => `"${p}"`).join(', ')}. Replace with natural, direct language.`)
    }

    if (structuralIssues.length > 0) {
      parts.push(`Fix these structural issues: ${structuralIssues.join('; ')}. Use simpler sentence constructions.`)
    }

    parts.push('Keep the same meaning and length. Keep the same voice and style. Just fix the flagged patterns.')

    cleanupInstructions = parts.join('\n')
  }

  return {
    passed: score === 0,
    score,
    bannedWordsFound,
    bannedPhrasesFound,
    structuralIssues,
    cleanupInstructions,
  }
}

// Threshold: if score > this, trigger a rewrite
export const AI_CHECK_THRESHOLD = 0

/**
 * Run a cleanup rewrite pass on text that failed the AI pattern check.
 * Uses a focused, short prompt that tells GPT-4o exactly which words/phrases to replace.
 */
export async function runCleanupPass(
  text: string,
  checkResult: AICheckResult
): Promise<{ text: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } } | null> {
  if (checkResult.passed) return null

  const hasVarianceIssue = checkResult.structuralIssues.some(s => s.includes('Sentence lengths'))

  const systemMessage = `You are a text editor fixing specific flagged problems. Do NOT rewrite the whole text. Fix ONLY the flagged items below.

Rules:
- Replace flagged words with plain, common alternatives (e.g. "important" instead of "crucial", "shows" instead of "showcases", "also" instead of "moreover")
- Replace flowery/literary words with simple ones (e.g. "strange" instead of "peculiar", "mixed" instead of "mingled", "connected" instead of "entwined")
- Do NOT add new AI-sounding words. Use the simplest word that fits.${hasVarianceIssue ? `
- ALSO FIX sentence length uniformity: break 2-3 medium sentences into short punchy ones (under 6 words). Combine 1-2 sentences into a longer flowing one. The variation must feel natural.` : ''}
- Replace scene-setting clichés with direct statements (e.g. instead of "casting a soft amber glow" just say "getting dark" or cut the description entirely)
- Output the full corrected text and nothing else — no commentary`

  const userMessage = `${checkResult.cleanupInstructions}

Here is the text to fix:

${text}`

  const result = await generateText({
    systemMessage,
    userMessage,
  })

  if (!result.success) {
    console.error('Cleanup pass failed:', result.error)
    return null
  }

  return {
    text: result.text,
    usage: result.usage,
  }
}

/**
 * Generate text and automatically rewrite if AI patterns are detected.
 * Returns the final text after up to MAX_REWRITE_PASSES cleanup attempts.
 */
export async function generateWithCleanup(
  prompt: { systemMessage: string; userMessage: string }
): Promise<{
  success: true
  text: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  rewritePasses: number
  finalCheck: AICheckResult
} | {
  success: false
  error: string
  code?: string
}> {
  // Initial generation
  const initialResult = await generateText(prompt)

  if (!initialResult.success) {
    return initialResult
  }

  let currentText = initialResult.text
  let totalUsage = { ...initialResult.usage }
  let rewritePasses = 0

  // Check and rewrite loop
  for (let i = 0; i < MAX_REWRITE_PASSES; i++) {
    const check = checkForAIPatterns(currentText)

    if (check.passed) {
      return {
        success: true,
        text: currentText,
        usage: totalUsage,
        rewritePasses,
        finalCheck: check,
      }
    }

    console.log(`AI check failed (pass ${i + 1}): score=${check.score}, words=[${check.bannedWordsFound.join(', ')}], phrases=[${check.bannedPhrasesFound.join(', ')}]`)

    // Run cleanup
    const cleanupResult = await runCleanupPass(currentText, check)

    if (!cleanupResult) {
      // Cleanup failed — return what we have
      return {
        success: true,
        text: currentText,
        usage: totalUsage,
        rewritePasses,
        finalCheck: check,
      }
    }

    currentText = cleanupResult.text
    totalUsage = {
      prompt_tokens: totalUsage.prompt_tokens + cleanupResult.usage.prompt_tokens,
      completion_tokens: totalUsage.completion_tokens + cleanupResult.usage.completion_tokens,
      total_tokens: totalUsage.total_tokens + cleanupResult.usage.total_tokens,
    }
    rewritePasses++
  }

  // Final check after all passes
  const finalCheck = checkForAIPatterns(currentText)

  if (!finalCheck.passed) {
    console.log(`AI check still not clean after ${rewritePasses} passes: score=${finalCheck.score}, remaining=[${finalCheck.bannedWordsFound.join(', ')}]`)
  }

  return {
    success: true,
    text: currentText,
    usage: totalUsage,
    rewritePasses,
    finalCheck,
  }
}
