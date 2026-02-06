import { franc } from 'franc'

/**
 * Language detection result type
 * - 'en': English content (>90% English)
 * - 'non_en': Non-English content (<50% English)
 * - 'mixed': Mixed language content (50-90% English)
 * - 'unknown': Unable to determine (text too short)
 */
export type LanguageResult = 'en' | 'non_en' | 'mixed' | 'unknown'

/**
 * Detailed language detection result
 */
export interface LanguageDetectionResult {
  language: LanguageResult
  confidence: number
  detectedLang: string
  message: string
}

/**
 * Error messages for different language detection results
 */
const LANGUAGE_MESSAGES = {
  en: 'English content detected. Ready for processing.',
  non_en:
    'This document appears to be in a non-English language. Please upload English writing samples only, as our style analysis system is optimized exclusively for English text.',
  mixed:
    'This document contains a mix of English and non-English content. For optimal style analysis results, we recommend removing non-English sections (such as translations, foreign quotes, or bilingual content) before uploading.',
  unknown:
    'Unable to determine the language of this content. Please ensure your document contains sufficient text (at least 100 words) for accurate language detection.',
}

// ─── Layer 1: Non-Latin script detection ───
// CJK, Hiragana, Katakana, Korean, Cyrillic, Arabic, Hebrew, Devanagari,
// Thai, Georgian, Armenian, Bengali, Tamil, Telugu, Kannada, Malayalam
// eslint-disable-next-line no-misleading-character-class
const NON_LATIN_PATTERN =
  /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u1100-\u11FF\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0900-\u097F\u0E00-\u0E7F\u10A0-\u10FF\u0530-\u058F\u0980-\u09FF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g

// ─── Layer 2: Latin diacritical characters ───
// Accented chars used in Spanish, French, Portuguese, German, Italian, etc.
// Ranges: À-Ö Ø-ö ø-ÿ (Latin-1 Supplement) + Ā-ſ (Latin Extended-A) + ¿ ¡
// eslint-disable-next-line no-misleading-character-class
const LATIN_DIACRITICS_PATTERN =
  /[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F\u00BF\u00A1]/g

// ─── Layer 3: Common non-English words ───
// Conservative list: words that are NEVER standard English words.
// Covers Spanish, French, Portuguese, German, Italian.
const NON_ENGLISH_WORD_SET = new Set([
  // Spanish
  'hola', 'gracias', 'buenos', 'buenas', 'también', 'tambien', 'siempre',
  'ahora', 'aquí', 'aqui', 'señor', 'señora', 'nosotros', 'ustedes',
  'entonces', 'después', 'despues', 'todavía', 'todavia', 'necesito',
  'quiero', 'puedo', 'tengo', 'pero', 'donde', 'cuando', 'porque',
  'cambia', 'mejora', 'reescribe', 'añade', 'elimina',
  // French
  'bonjour', 'bonsoir', 'merci', 'beaucoup', 'toujours', 'maintenant',
  'pourquoi', 'voilà', 'voila', 'salut', 'oui', 'nous', 'vous', 'avec',
  'mais', 'améliore', 'ajoute', 'supprime',
  // Portuguese
  'obrigado', 'obrigada', 'também', 'tambem', 'depois', 'então', 'entao',
  'muito', 'melhore', 'corrija', 'reescreva', 'adicione', 'remova',
  // German
  'danke', 'bitte', 'warum', 'jetzt', 'vielleicht', 'nein', 'guten',
  'nicht', 'machen', 'aber', 'oder', 'wenn', 'weil', 'noch', 'sehr',
  'ändere', 'verbessere', 'kürze', 'erweitere', 'entferne',
  // Italian
  'ciao', 'grazie', 'buongiorno', 'buonasera', 'arrivederci', 'anche',
  'adesso', 'allora', 'migliora', 'correggi', 'riscrivi', 'aggiungi',
  'rimuovi',
])

function countNonLatinChars(text: string): number {
  const matches = text.match(NON_LATIN_PATTERN)
  return matches ? matches.length : 0
}

function countLatinDiacritics(text: string): number {
  const matches = text.match(LATIN_DIACRITICS_PATTERN)
  return matches ? matches.length : 0
}

function containsNonEnglishWords(text: string): boolean {
  const cleaned = text.toLowerCase().replace(/[.,!?;:'"()\-–—¿¡«»]/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length > 0)
  return words.some(w => NON_ENGLISH_WORD_SET.has(w))
}

/**
 * Detect the language of the given text
 * Uses a multi-layer approach:
 *  1. Non-Latin scripts (CJK, Cyrillic, Arabic, etc.)
 *  2. Spanish-only punctuation (¿ ¡)
 *  3. Latin diacritics (é, ñ, ü, ß, ç, etc.)
 *  4. Common non-English word list
 *  5. franc library analysis
 *  6. English character ratio fallback
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      language: 'unknown',
      confidence: 0,
      detectedLang: 'und',
      message: LANGUAGE_MESSAGES.unknown,
    }
  }

  const trimmed = text.trim()
  const cleanText = trimmed.replace(/\s+/g, '')

  // ── Layer 1: Non-Latin scripts ──
  const nonLatinCount = countNonLatinChars(trimmed)
  if (nonLatinCount > 0) {
    const nonLatinRatio = nonLatinCount / cleanText.length

    if (nonLatinRatio > 0.3) {
      return {
        language: 'non_en',
        confidence: nonLatinRatio,
        detectedLang: 'non_latin',
        message: LANGUAGE_MESSAGES.non_en,
      }
    }

    if (nonLatinRatio > 0.05) {
      return {
        language: 'mixed',
        confidence: 1 - nonLatinRatio,
        detectedLang: 'mixed_script',
        message: LANGUAGE_MESSAGES.mixed,
      }
    }
  }

  // ── Layer 2: Spanish-only punctuation ──
  if (/[¿¡]/.test(trimmed)) {
    return {
      language: 'non_en',
      confidence: 0.95,
      detectedLang: 'spa',
      message: LANGUAGE_MESSAGES.non_en,
    }
  }

  // ── Layer 3: Latin diacritics + word list combined ──
  const diacriticsCount = countLatinDiacritics(trimmed)
  const hasNonEnglishWords = containsNonEnglishWords(trimmed)

  // Diacritics + non-English words → strong signal
  if (diacriticsCount >= 1 && hasNonEnglishWords) {
    return {
      language: 'non_en',
      confidence: 0.9,
      detectedLang: 'latin_diacritics',
      message: LANGUAGE_MESSAGES.non_en,
    }
  }

  // 3+ diacritics alone → very likely non-English
  if (diacriticsCount >= 3) {
    return {
      language: 'non_en',
      confidence: 0.85,
      detectedLang: 'latin_diacritics',
      message: LANGUAGE_MESSAGES.non_en,
    }
  }

  // 2 diacritics → likely non-English (English rarely has 2 accented chars)
  if (diacriticsCount >= 2) {
    return {
      language: 'mixed',
      confidence: 0.7,
      detectedLang: 'latin_diacritics',
      message: LANGUAGE_MESSAGES.mixed,
    }
  }

  // ── Layer 4: Non-English words alone (no diacritics) ──
  if (hasNonEnglishWords) {
    return {
      language: 'non_en',
      confidence: 0.8,
      detectedLang: 'word_match',
      message: LANGUAGE_MESSAGES.non_en,
    }
  }

  // ── Layer 5: Short text handling ──
  if (trimmed.length < 50) {
    const englishRatio = calculateEnglishRatio(trimmed)

    // High English char ratio + passed all previous layers (no diacritics,
    // no non-English words, no special scripts) → trust it as English.
    // franc is unreliable for short text and often misdetects English as
    // Dutch/German/etc., so we prioritize character ratio here.
    if (englishRatio >= 0.8) {
      return {
        language: 'en',
        confidence: englishRatio,
        detectedLang: 'eng',
        message: LANGUAGE_MESSAGES.en,
      }
    }

    // Low English ratio: use franc as tiebreaker
    const shortDetect = franc(trimmed)
    if (shortDetect !== 'und' && shortDetect !== 'eng') {
      return {
        language: 'non_en',
        confidence: 0.6,
        detectedLang: shortDetect,
        message: LANGUAGE_MESSAGES.non_en,
      }
    }

    // 1 diacritic with ambiguous result → mixed
    if (diacriticsCount === 1) {
      return {
        language: 'mixed',
        confidence: 0.5,
        detectedLang: 'latin_diacritics',
        message: LANGUAGE_MESSAGES.mixed,
      }
    }

    return {
      language: 'unknown',
      confidence: 0,
      detectedLang: 'und',
      message: LANGUAGE_MESSAGES.unknown,
    }
  }

  // ── Layer 6: Full franc analysis for longer text ──
  const detectedLang = franc(text)

  if (detectedLang === 'und') {
    return {
      language: 'unknown',
      confidence: 0,
      detectedLang: 'und',
      message: LANGUAGE_MESSAGES.unknown,
    }
  }

  const englishRatio = calculateEnglishRatio(text)

  let language: LanguageResult
  let confidence: number

  if (detectedLang === 'eng') {
    if (englishRatio >= 0.9) {
      language = 'en'
      confidence = englishRatio
    } else if (englishRatio >= 0.5) {
      language = 'mixed'
      confidence = englishRatio
    } else {
      language = 'non_en'
      confidence = 1 - englishRatio
    }
  } else {
    if (englishRatio >= 0.9) {
      language = 'en'
      confidence = englishRatio
    } else if (englishRatio >= 0.5) {
      language = 'mixed'
      confidence = englishRatio
    } else {
      language = 'non_en'
      confidence = 1 - englishRatio
    }
  }

  return {
    language,
    confidence,
    detectedLang,
    message: LANGUAGE_MESSAGES[language],
  }
}

/**
 * Calculate the ratio of English characters in the text
 * English characters include: a-z, A-Z, common punctuation, numbers
 */
function calculateEnglishRatio(text: string): number {
  const cleanText = text.replace(/\s+/g, '')

  if (cleanText.length === 0) {
    return 0
  }

  const englishPattern = /[a-zA-Z0-9.,!?;:'"()\-–—]/g
  const englishMatches = cleanText.match(englishPattern) || []

  return englishMatches.length / cleanText.length
}

/**
 * Check if the text is acceptable for processing (English or mostly English)
 */
export function isAcceptableLanguage(text: string): boolean {
  const result = detectLanguage(text)
  return result.language === 'en'
}
