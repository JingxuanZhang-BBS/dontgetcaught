import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { CLAUDE_MODEL, anthropicApiKey } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB — matches next.config bodySizeLimit

function anthropicHeaders(extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': anthropicApiKey(),
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
  // Without this check an API failure fell through as an empty content array and
  // the user got a silent "" back instead of an error.
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('extract: Anthropic API error', res.status, detail.slice(0, 500))
    throw new Error('Text extraction service is unavailable right now.')
  }
  const data = await res.json() as { content?: Array<{ type: string; text: string }> }
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}

export async function POST(request: Request) {
  try {
    // This endpoint bills the Anthropic key for image OCR and PDF extraction —
    // it must never be reachable anonymously.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimited = await checkRateLimit(user.id, 'extract')
    if (rateLimited) return rateLimited

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Please upload a file under 10MB.' },
        { status: 413 }
      )
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
      // Base64 PDF input is GA — the old `pdfs-2024-09-25` beta header is no longer needed.
      text = await callAnthropic({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') },
            },
            { type: 'text', text: 'Extract all the text from this PDF exactly as written. Output only the extracted text, nothing else.' },
          ],
        }],
      })

    } else {
      text = buffer.toString('utf-8')
    }

    const cleaned = text.trim()
    if (!cleaned) {
      return NextResponse.json(
        { error: 'No readable text found in that file.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ text: cleaned })
  } catch (err: unknown) {
    console.error('extract error:', err)
    const message = err instanceof Error ? err.message : 'Could not extract text from that file.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
