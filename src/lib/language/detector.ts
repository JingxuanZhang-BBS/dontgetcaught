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

/**
 * Detect the language of the given text
 * @param text - The text to analyze
 * @returns LanguageDetectionResult with language, confidence, and message
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  // Handle empty or very short text
  if (!text || text.trim().length < 50) {
    return {
      language: 'unknown',
      confidence: 0,
      detectedLang: 'und',
      message: LANGUAGE_MESSAGES.unknown,
    }
  }

  // Use franc to detect the primary language
  const detectedLang = franc(text)

  // If franc can't determine the language
  if (detectedLang === 'und') {
    return {
      language: 'unknown',
      confidence: 0,
      detectedLang: 'und',
      message: LANGUAGE_MESSAGES.unknown,
    }
  }

  // Calculate English ratio by analyzing character patterns
  const englishRatio = calculateEnglishRatio(text)

  // Determine the result based on detected language and English ratio
  let language: LanguageResult
  let confidence: number

  if (detectedLang === 'eng') {
    // Franc detected English
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
    // Franc detected non-English
    if (englishRatio >= 0.9) {
      // Override: mostly English characters despite franc's detection
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
 * @param text - The text to analyze
 * @returns Ratio from 0 to 1
 */
function calculateEnglishRatio(text: string): number {
  // Remove whitespace for calculation
  const cleanText = text.replace(/\s+/g, '')

  if (cleanText.length === 0) {
    return 0
  }

  // Count characters that are typically English
  // Includes: letters, numbers, common punctuation
  const englishPattern = /[a-zA-Z0-9.,!?;:'"()\-–—]/g
  const englishMatches = cleanText.match(englishPattern) || []

  return englishMatches.length / cleanText.length
}

/**
 * Check if the text is acceptable for processing (English or mostly English)
 * @param text - The text to check
 * @returns true if the text should be processed
 */
export function isAcceptableLanguage(text: string): boolean {
  const result = detectLanguage(text)
  return result.language === 'en'
}
