// pdf-parse is a CommonJS module, needs dynamic require
/* eslint-disable */
const pdfParse = require('pdf-parse')
/* eslint-enable */

/**
 * Parse a .pdf file and extract all text content
 * @param buffer - The file buffer
 * @returns The extracted plain text
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer)

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF (might be a scanned image)')
    }

    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error(
      `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
