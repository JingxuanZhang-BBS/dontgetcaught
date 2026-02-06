/**
 * DOCX Exporter Module
 * Converts generated text to Word document format
 */

import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  HeadingLevel,
  AlignmentType,
} from 'docx'

export interface ExportOptions {
  title: string
  text: string
  versionNumber?: number
}

/**
 * Generate a .docx Buffer from text content
 */
export async function generateDocx(options: ExportOptions): Promise<Buffer> {
  const { title, text, versionNumber } = options

  // Split text into paragraphs
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  // Build document sections
  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  )

  // Version info (subtle)
  if (versionNumber && versionNumber > 1) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Version ${versionNumber}`,
            italics: true,
            size: 20, // 10pt
            color: '888888',
          }),
        ],
        spacing: { after: 300 },
      })
    )
  }

  // Body paragraphs
  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: para,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 200, line: 360 }, // 1.5x line spacing
        alignment: AlignmentType.LEFT,
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}

/**
 * Generate a safe filename for export
 */
export function generateFilename(title: string, versionNumber?: number): string {
  const safeName = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50)

  const versionSuffix = versionNumber ? `_v${versionNumber}` : ''
  return `${safeName}${versionSuffix}.docx`
}
