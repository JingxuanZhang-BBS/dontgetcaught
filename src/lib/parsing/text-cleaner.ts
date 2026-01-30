/**
 * Text cleaning utilities for extracted document content
 * These functions are used to clean text extracted from .docx and .pdf files
 */

/**
 * Clean extracted text by removing common artifacts
 * @param text - Raw text extracted from document
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  let cleaned = text

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Remove page numbers (common patterns)
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '')
  cleaned = cleaned.replace(/\bPage\s+\d+\s*(of\s+\d+)?\b/gi, '')

  // Remove excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // Trim each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // Remove empty lines at start/end
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Count English words in text
 * @param text - The text to count words in
 * @returns Number of English words
 */
export function countEnglishWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  // Split by whitespace and filter valid words
  const words = text.trim().split(/\s+/)

  // Count words that contain at least one letter (to filter out pure numbers/punctuation)
  const englishWords = words.filter((word) => {
    // Must have at least one letter
    return /[a-zA-Z]/.test(word) && word.length > 0
  })

  return englishWords.length
}
