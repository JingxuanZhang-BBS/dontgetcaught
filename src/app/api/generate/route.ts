import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsing'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const VALID_WRITING_TYPES = [
  'essay', 'research_paper', 'email', 'cover_letter', 'blog_post', 'creative', 'other'
]

const VALID_WORD_COUNTS = [250, 500, 700, 1000, 1500, 2000]

/**
 * POST /api/generate
 *
 * Body (FormData):
 *   prompt       - string   - user's topic / instructions
 *   writingType  - string   - e.g. "essay"
 *   wordCount    - number   - e.g. 700
 *   file         - File?    - optional PDF or DOCX assignment/rubric
 */
export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse FormData ────────────────────────────────────────────────────
    const formData = await request.formData()
    const prompt      = (formData.get('prompt') as string || '').trim()
    const writingType = (formData.get('writingType') as string || 'essay').trim()
    const wordCount   = Number(formData.get('wordCount') || 700)
    const file        = formData.get('file') as File | null

    // ── Validate ──────────────────────────────────────────────────────────
    if (!prompt && !file) {
      return NextResponse.json(
        { error: 'Please provide a prompt or upload a file.' },
        { status: 400 }
      )
    }

    if (!VALID_WRITING_TYPES.includes(writingType)) {
      return NextResponse.json({ error: 'Invalid writing type.' }, { status: 400 })
    }

    if (!VALID_WORD_COUNTS.includes(wordCount)) {
      return NextResponse.json({ error: 'Invalid word count.' }, { status: 400 })
    }

    // ── Parse file (if provided) ──────────────────────────────────────────
    let fileContent = ''
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File must be under 5MB.' },
          { status: 400 }
        )
      }

      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
        return NextResponse.json(
          { error: 'Only PDF and DOCX files are supported.' },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileType: 'docx' | 'pdf' = fileName.endsWith('.pdf') ? 'pdf' : 'docx'
      const parseResult = await parseFile(buffer, fileType)

      if (parseResult.success && parseResult.cleanedText) {
        fileContent = parseResult.cleanedText.slice(0, 8000) // cap at 8k chars
      }
    }

    // ── Build user message for AI ─────────────────────────────────────────
    // userMessage will be passed to Gemini once integrated (suppress unused warning via void)
    void buildUserMessage({ prompt, writingType, wordCount, fileContent })

    // ──────────────────────────────────────────────────────────────────────
    // TODO: Replace this section with Gemini Flash API call
    //
    // The final implementation will:
    // 1. Call Gemini Flash with a hidden system prompt (humanization instructions)
    //    that makes output undetectable by AI detectors
    // 2. Pass `userMessage` as the user turn
    // 3. Return the generated text
    //
    // Example structure:
    //   const response = await geminiClient.generateContent({
    //     systemInstruction: HIDDEN_SYSTEM_PROMPT,  // never exposed to frontend
    //     contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    //   })
    //   const generatedText = response.candidates[0].content.parts[0].text
    //
    // For now, returning a placeholder so the frontend UI is testable:
    // ──────────────────────────────────────────────────────────────────────
    const generatedText = buildPlaceholder(writingType, wordCount, prompt)

    return NextResponse.json({
      success: true,
      generated_text: generatedText,
    })

  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUserMessage({
  prompt,
  writingType,
  wordCount,
  fileContent,
}: {
  prompt: string
  writingType: string
  wordCount: number
  fileContent: string
}) {
  const parts: string[] = []

  if (fileContent) {
    parts.push(`[Assignment / Rubric]\n${fileContent}`)
  }

  if (prompt) {
    parts.push(`[User Instructions]\n${prompt}`)
  }

  parts.push(`[Task]\nWrite a ${writingType.replace('_', ' ')} of approximately ${wordCount} words based on the above.`)

  return parts.join('\n\n')
}

function buildPlaceholder(writingType: string, wordCount: number, prompt: string) {
  return `[Placeholder — Gemini Flash integration pending]

Writing type: ${writingType}
Target word count: ${wordCount}
Topic: ${prompt || '(from uploaded file)'}

Once the Gemini Flash API is connected with the hidden humanization system prompt,
this placeholder will be replaced with the actual generated text.`
}
