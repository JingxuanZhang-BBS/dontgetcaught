import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_WORDS = 10000

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, filename } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    const wordCount = countWords(text)

    if (wordCount > MAX_WORDS) {
      return NextResponse.json(
        { error: `Text exceeds maximum ${MAX_WORDS} words. Current: ${wordCount} words.` },
        { status: 400 }
      )
    }

    if (wordCount === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      )
    }

    // Create database record for pasted text
    const { data: dbData, error: dbError } = await supabase
      .from('style_samples')
      .insert({
        user_id: user.id,
        filename: filename || `Pasted Text ${new Date().toLocaleString()}`,
        source_type: 'paste',
        storage_path: null, // No storage path for pasted text
        raw_text: text,
        status: 'uploaded',
        detected_language: 'unknown',
        word_count_en: wordCount, // Temporarily set as English word count (will be updated after language detection)
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sample: {
        id: dbData.id,
        filename: dbData.filename,
        word_count: wordCount,
      },
      message: 'Text pasted successfully',
    })
  } catch (error) {
    console.error('Paste API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
