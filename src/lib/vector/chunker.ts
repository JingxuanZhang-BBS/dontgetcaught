/**
 * Text chunker for splitting documents into semantic chunks
 * Chunks are sized for optimal embedding (300-500 words)
 */

export interface TextChunk {
  text: string
  index: number
  wordCount: number
}

/**
 * Configuration for text chunking
 */
interface ChunkConfig {
  targetWords: number // Target words per chunk
  minWords: number // Minimum words for a chunk
  maxWords: number // Maximum words per chunk
}

const DEFAULT_CONFIG: ChunkConfig = {
  targetWords: 400,
  minWords: 200,
  maxWords: 600,
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/) // Split on double newlines
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

/**
 * Chunk text into semantic units suitable for embedding
 * Tries to preserve paragraph boundaries when possible
 *
 * @param text - The cleaned text to chunk
 * @param config - Optional chunking configuration
 * @returns Array of text chunks with metadata
 */
export function chunkText(
  text: string,
  config: Partial<ChunkConfig> = {}
): TextChunk[] {
  const { targetWords, minWords, maxWords } = { ...DEFAULT_CONFIG, ...config }

  const paragraphs = splitIntoParagraphs(text)
  const chunks: TextChunk[] = []

  let currentChunk: string[] = []
  let currentWordCount = 0

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph)

    // If this single paragraph exceeds max, we need to split it
    if (paragraphWords > maxWords) {
      // First, flush any accumulated content
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join('\n\n'),
          index: chunks.length,
          wordCount: currentWordCount,
        })
        currentChunk = []
        currentWordCount = 0
      }

      // Split long paragraph by sentences
      const sentences = splitIntoSentences(paragraph)
      let sentenceChunk: string[] = []
      let sentenceWordCount = 0

      for (const sentence of sentences) {
        const sentenceWords = countWords(sentence)

        if (sentenceWordCount + sentenceWords > maxWords && sentenceChunk.length > 0) {
          // Flush sentence chunk
          chunks.push({
            text: sentenceChunk.join(' '),
            index: chunks.length,
            wordCount: sentenceWordCount,
          })
          sentenceChunk = []
          sentenceWordCount = 0
        }

        sentenceChunk.push(sentence)
        sentenceWordCount += sentenceWords
      }

      // Flush remaining sentences
      if (sentenceChunk.length > 0) {
        chunks.push({
          text: sentenceChunk.join(' '),
          index: chunks.length,
          wordCount: sentenceWordCount,
        })
      }

      continue
    }

    // Check if adding this paragraph would exceed target
    if (currentWordCount + paragraphWords > targetWords && currentChunk.length > 0) {
      // Only flush if we have minimum words
      if (currentWordCount >= minWords) {
        chunks.push({
          text: currentChunk.join('\n\n'),
          index: chunks.length,
          wordCount: currentWordCount,
        })
        currentChunk = []
        currentWordCount = 0
      }
    }

    currentChunk.push(paragraph)
    currentWordCount += paragraphWords
  }

  // Flush remaining content
  if (currentChunk.length > 0) {
    // If remaining chunk is too small, try to merge with previous
    if (currentWordCount < minWords && chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1]
      // Only merge if combined wouldn't exceed max
      if (lastChunk.wordCount + currentWordCount <= maxWords) {
        chunks[chunks.length - 1] = {
          text: lastChunk.text + '\n\n' + currentChunk.join('\n\n'),
          index: lastChunk.index,
          wordCount: lastChunk.wordCount + currentWordCount,
        }
      } else {
        // Just add as small final chunk
        chunks.push({
          text: currentChunk.join('\n\n'),
          index: chunks.length,
          wordCount: currentWordCount,
        })
      }
    } else {
      chunks.push({
        text: currentChunk.join('\n\n'),
        index: chunks.length,
        wordCount: currentWordCount,
      })
    }
  }

  return chunks
}

/**
 * Split text into sentences (basic implementation)
 */
function splitIntoSentences(text: string): string[] {
  // Match sentence endings: . ! ? followed by space or end
  // Avoid splitting on abbreviations like Mr. Dr. etc.
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/)
  return sentences.filter((s) => s.trim().length > 0)
}

/**
 * Get total word count from chunks
 */
export function getTotalWords(chunks: TextChunk[]): number {
  return chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)
}
