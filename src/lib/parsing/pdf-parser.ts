// pdf-parse 2.x exports PDFParse class (CommonJS)
/* eslint-disable */
const { PDFParse } = require('pdf-parse')
/* eslint-enable */

/**
 * Parse a .pdf file and extract all text content
 * @param buffer - The file buffer
 * @returns The extracted plain text
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No text content found in PDF (might be a scanned image)')
    }

    return result.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error(
      `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
