import mammoth from 'mammoth'

/**
 * Parse a .docx file and extract all text content
 * @param buffer - The file buffer
 * @returns The extracted plain text
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file')
    }

    // Log any warnings (optional, for debugging)
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }

    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error(
      `Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
