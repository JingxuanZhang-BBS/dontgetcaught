import { parseDocx } from './docx-parser'
import { parsePdf } from './pdf-parser'
import { cleanText, countEnglishWords } from './text-cleaner'

/**
 * Result of parsing a file
 */
export interface ParseResult {
  success: boolean
  rawText?: string
  cleanedText?: string
  wordCount?: number
  error?: string
}

/**
 * Unified file parsing function
 * @param buffer - The file buffer
 * @param fileType - The file type ('docx' or 'pdf')
 * @returns ParseResult object
 */
export async function parseFile(
  buffer: Buffer,
  fileType: 'docx' | 'pdf'
): Promise<ParseResult> {
  try {
    // Step 1: Parse based on file type
    let rawText: string

    if (fileType === 'docx') {
      rawText = await parseDocx(buffer)
    } else if (fileType === 'pdf') {
      rawText = await parsePdf(buffer)
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }

    // Step 2: Clean the text
    const cleanedText = cleanText(rawText)

    // Step 3: Count words
    const wordCount = countEnglishWords(cleanedText)

    // Step 4: Return success result
    return {
      success: true,
      rawText,
      cleanedText,
      wordCount,
    }
  } catch (error) {
    console.error('File parsing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    }
  }
}

// Re-export utilities for other modules
export { cleanText, countEnglishWords }
