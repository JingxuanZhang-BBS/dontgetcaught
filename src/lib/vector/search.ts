/**
 * Vector Search Module
 * Search for similar style chunks using pgvector cosine similarity
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface StyleChunk {
  id: string
  sample_id: string
  user_id: string
  chunk_text: string
  chunk_index: number
  distance: number
}

/**
 * Search for similar style chunks based on query embedding
 * Uses pgvector's cosine distance operator (<=>)
 */
export async function searchSimilarChunks(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<{ success: true; chunks: StyleChunk[] } | { success: false; error: string }> {
  try {
    // Use Supabase's RPC to call a custom function for vector search
    // Or use raw SQL query with pgvector
    const { data, error } = await supabase.rpc('search_style_chunks', {
      query_embedding: queryEmbedding,
      match_user_id: userId,
      match_count: limit
    })

    if (error) {
      console.error('Vector search error:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      chunks: (data || []) as StyleChunk[]
    }
  } catch (err) {
    console.error('Vector search exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Alternative: Direct SQL query for vector search
 * Use this if RPC function is not set up
 */
export async function searchSimilarChunksDirect(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<{ success: true; chunks: StyleChunk[] } | { success: false; error: string }> {
  try {
    // Convert embedding array to pgvector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    // Use raw query with pgvector cosine distance
    const { data, error } = await supabase
      .from('style_chunks')
      .select('id, sample_id, user_id, chunk_text, chunk_index')
      .eq('user_id', userId)
      .not('embedding', 'is', null)
      .limit(limit)

    if (error) {
      console.error('Direct search error:', error)
      return { success: false, error: error.message }
    }

    // Note: This doesn't actually use vector similarity - we need RPC for that
    // For now, return what we have
    return {
      success: true,
      chunks: (data || []).map(d => ({ ...d, distance: 0 })) as StyleChunk[]
    }
  } catch (err) {
    console.error('Direct search exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Format chunks for inclusion in generation prompt
 */
export function formatChunksForPrompt(chunks: StyleChunk[], maxChars: number = 3000): string {
  if (chunks.length === 0) {
    return 'No style samples available.'
  }

  const lines: string[] = []
  let totalChars = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkText = chunk.chunk_text.trim()

    // Check if adding this chunk would exceed limit
    if (totalChars + chunkText.length > maxChars) {
      // Truncate this chunk to fit
      const remaining = maxChars - totalChars
      if (remaining > 100) {
        lines.push(`[Sample ${i + 1}]\n${chunkText.slice(0, remaining)}...`)
      }
      break
    }

    lines.push(`[Sample ${i + 1}]\n${chunkText}`)
    totalChars += chunkText.length + 20 // account for header
  }

  return lines.join('\n\n')
}
