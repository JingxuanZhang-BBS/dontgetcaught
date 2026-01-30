import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsing'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request parameters
    const body = await request.json()
    const { sample_id } = body

    if (!sample_id) {
      return NextResponse.json(
        { error: 'sample_id is required' },
        { status: 400 }
      )
    }

    // Step 1: Get sample record from database
    const { data: sample, error: fetchError } = await supabase
      .from('style_samples')
      .select('*')
      .eq('id', sample_id)
      .eq('user_id', user.id) // Verify ownership
      .single()

    if (fetchError || !sample) {
      return NextResponse.json(
        { error: 'Sample not found or access denied' },
        { status: 404 }
      )
    }

    // If no storage_path, it's pasted text - skip parsing
    if (!sample.storage_path) {
      return NextResponse.json({
        success: true,
        message: 'Sample is pasted text, no parsing needed',
      })
    }

    // Step 2: Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('style-samples')
      .download(sample.storage_path)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: `Failed to download file: ${downloadError?.message}`,
        })
        .eq('id', sample_id)

      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      )
    }

    // Step 3: Convert to Buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 4: Parse the file
    const parseResult = await parseFile(
      buffer,
      sample.source_type as 'docx' | 'pdf'
    )

    if (!parseResult.success) {
      // Parsing failed - update status to error
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: parseResult.error || 'Parsing failed',
        })
        .eq('id', sample_id)

      return NextResponse.json(
        { error: parseResult.error || 'Parsing failed' },
        { status: 500 }
      )
    }

    // Step 5: Update database with parsed content
    // Keep status as 'uploaded' (will change to 'indexed' after Step 5 vector embedding)
    const { error: updateError } = await supabase
      .from('style_samples')
      .update({
        raw_text: parseResult.rawText,
        cleaned_text: parseResult.cleanedText,
        word_count_en: parseResult.wordCount || 0,
        error_message: null,
      })
      .eq('id', sample_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update database' },
        { status: 500 }
      )
    }

    // Step 6: Return success result
    return NextResponse.json({
      success: true,
      sample_id,
      word_count: parseResult.wordCount,
      message: 'File parsed successfully',
    })
  } catch (error) {
    console.error('Process sample API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
