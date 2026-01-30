import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { chunkText } from '@/lib/vector/chunker'
import { generateEmbeddings } from '@/lib/vector/embeddings'

/**
 * Process a style sample: chunk text and generate embeddings
 * POST /api/process-sample
 * Body: { sampleId: string }
 */
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
    const { sampleId } = body

    if (!sampleId) {
      return NextResponse.json(
        { error: 'Sample ID is required' },
        { status: 400 }
      )
    }

    // Fetch the sample
    const { data: sample, error: fetchError } = await supabase
      .from('style_samples')
      .select('*')
      .eq('id', sampleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !sample) {
      return NextResponse.json(
        { error: 'Sample not found' },
        { status: 404 }
      )
    }

    // Check if sample is ready for processing
    if (sample.status !== 'uploaded' || sample.detected_language !== 'en') {
      return NextResponse.json(
        { error: 'Sample is not ready for processing (must be uploaded English content)' },
        { status: 400 }
      )
    }

    // Check if already indexed
    const { count: existingChunks } = await supabase
      .from('style_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('sample_id', sampleId)

    if (existingChunks && existingChunks > 0) {
      return NextResponse.json(
        { error: 'Sample has already been indexed' },
        { status: 400 }
      )
    }

    // Update status to parsing
    await supabase
      .from('style_samples')
      .update({ status: 'parsing' })
      .eq('id', sampleId)

    // Get the cleaned text
    const text = sample.cleaned_text || sample.raw_text

    if (!text) {
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: 'No text content found in sample',
        })
        .eq('id', sampleId)

      return NextResponse.json(
        { error: 'No text content found in sample' },
        { status: 400 }
      )
    }

    // Chunk the text
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: 'Could not create chunks from text',
        })
        .eq('id', sampleId)

      return NextResponse.json(
        { error: 'Could not create chunks from text' },
        { status: 400 }
      )
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.text)

    let embeddings
    try {
      embeddings = await generateEmbeddings(chunkTexts)
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError)
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: 'Failed to generate embeddings',
        })
        .eq('id', sampleId)

      return NextResponse.json(
        { error: 'Failed to generate embeddings' },
        { status: 500 }
      )
    }

    // Insert chunks into database
    const chunkInserts = embeddings.map((emb) => ({
      sample_id: sampleId,
      user_id: user.id,
      chunk_text: emb.text,
      chunk_index: emb.index,
      embedding: JSON.stringify(emb.embedding), // pgvector accepts array as JSON
    }))

    const { error: insertError } = await supabase
      .from('style_chunks')
      .insert(chunkInserts)

    if (insertError) {
      console.error('Chunk insert error:', insertError)
      await supabase
        .from('style_samples')
        .update({
          status: 'error',
          error_message: 'Failed to store embeddings',
        })
        .eq('id', sampleId)

      return NextResponse.json(
        { error: `Failed to store embeddings: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Update sample status to indexed
    await supabase
      .from('style_samples')
      .update({ status: 'indexed' })
      .eq('id', sampleId)

    return NextResponse.json({
      success: true,
      message: 'Sample indexed successfully',
      chunks: chunks.length,
      totalWords: chunks.reduce((sum, c) => sum + c.wordCount, 0),
    })
  } catch (error) {
    console.error('Process sample error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
