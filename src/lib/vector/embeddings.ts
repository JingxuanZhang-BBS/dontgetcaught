import OpenAI from 'openai'

/**
 * OpenAI Embeddings module
 * Uses text-embedding-ada-002 (1536 dimensions)
 */

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI()
  }
  return openaiClient
}

/**
 * Embedding model configuration
 */
const EMBEDDING_MODEL = 'text-embedding-ada-002'
const EMBEDDING_DIMENSIONS = 1536

/**
 * Result of embedding operation
 */
export interface EmbeddingResult {
  text: string
  embedding: number[]
  index: number
}

/**
 * Generate embedding for a single text
 *
 * @param text - The text to embed
 * @returns The embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0].embedding
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 *
 * @param texts - Array of texts to embed
 * @returns Array of EmbeddingResult with text, embedding, and index
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return []
  }

  // OpenAI allows batching up to ~8000 tokens per request
  // For safety, we'll batch in groups of 20 chunks
  const BATCH_SIZE = 20
  const results: EmbeddingResult[] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    })

    // Map responses back to texts with their indices
    for (let j = 0; j < response.data.length; j++) {
      results.push({
        text: batch[j],
        embedding: response.data[j].embedding,
        index: i + j,
      })
    }
  }

  return results
}

/**
 * Get the embedding model name
 */
export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL
}

/**
 * Get the embedding dimensions
 */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS
}
