import { SupabaseClient } from '@supabase/supabase-js'
import { chunkText } from './chunker'
import { generateEmbeddings } from './embeddings'

/**
 * Index a sample: chunk text and generate embeddings
 * This is a helper function used by both upload and paste APIs
 *
 * @param supabase - Supabase client
 * @param sampleId - The sample ID to index
 * @param userId - The user ID
 * @param text - The cleaned text to index
 * @returns Result object with success status
 */
export async function indexSample(
  supabase: SupabaseClient,
  sampleId: string,
  userId: string,
  text: string
): Promise<{ success: boolean; error?: string; chunks?: number }> {
  try {
    // Chunk the text
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      return { success: false, error: 'Could not create chunks from text' }
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.text)
    const embeddings = await generateEmbeddings(chunkTexts)

    // Insert chunks into database
    const chunkInserts = embeddings.map((emb) => ({
      sample_id: sampleId,
      user_id: userId,
      chunk_text: emb.text,
      chunk_index: emb.index,
      embedding: JSON.stringify(emb.embedding), // pgvector accepts array as JSON
    }))

    const { error: insertError } = await supabase
      .from('style_chunks')
      .insert(chunkInserts)

    if (insertError) {
      console.error('Chunk insert error:', insertError)
      return { success: false, error: `Failed to store embeddings: ${insertError.message}` }
    }

    // Update sample status to indexed
    await supabase
      .from('style_samples')
      .update({ status: 'indexed' })
      .eq('id', sampleId)

    return { success: true, chunks: chunks.length }
  } catch (error) {
    console.error('Indexing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during indexing',
    }
  }
}
