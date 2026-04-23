import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { CLAUDE_MODEL } from '@/lib/claude'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

function anthropicHeaders(extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_KEY || '',
    'anthropic-version': ANTHROPIC_VERSION,
    ...extra,
  }
}

async function callAnthropic(body: object, extraHeaders?: Record<string, string>) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: anthropicHeaders(extraHeaders),
    body: JSON.stringify(body),
  })
  const data = await res.json() as { content?: Array<{ type: string; text: string }> }
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type
    let text = ''

    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value

    } else if (mime === 'text/plain') {
      text = buffer.toString('utf-8')

    } else if (mime.startsWith('image/')) {
      const extracted = await callAnthropic({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mime, data: buffer.toString('base64') } },
            { type: 'text', text: 'Extract all the text from this image exactly as written. If there is no legible text, respond with only the word NOTEXT. Output only the extracted text, nothing else.' },
          ],
        }],
      })
      if (extracted === 'NOTEXT' || extracted.toUpperCase().includes('NOTEXT')) {
        return NextResponse.json({ error: 'No legible text found in this image.' }, { status: 400 })
      }
      text = extracted

    } else if (mime === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse')
      const parsed = new PDFParse({ data: buffer })
      const result = await parsed.getText()
      text = (result as any).text ?? String(result)

    } else {
      text = buffer.toString('utf-8')
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Could not extract text: ' + String(err) },
      { status: 500 }
    )
  }
}
