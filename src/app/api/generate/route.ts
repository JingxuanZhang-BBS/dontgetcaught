import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { detectLanguage } from '@/lib/language/detector'
import { generateEmbedding, searchSimilarChunks } from '@/lib/vector'
import { buildStyleProfile } from '@/lib/style'
import {
  buildGenerationPrompt,
  generateText,
  estimateCost,
  type TaskInput
} from '@/lib/generation'

const TOP_K_CHUNKS = 5

/**
 * POST /api/generate
 * Generate text matching the user's writing style
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

    // Parse JSON body
    const body = await request.json()
    const { title, requirements, taskType } = body

    // Validate required fields
    if (!title || !requirements) {
      return NextResponse.json(
        { error: 'Title and requirements are required' },
        { status: 400 }
      )
    }

    // Validate task type
    const validTaskTypes = ['personal_narrative', 'argumentative', 'general']
    if (taskType && !validTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      )
    }

    // Check language of input (must be English)
    const combinedInput = `${title} ${requirements}`
    const langResult = detectLanguage(combinedInput)

    if (langResult.language === 'non_en') {
      return NextResponse.json(
        {
          error: 'Please provide your task in English. Non-English content is not supported.',
          code: 'NON_ENGLISH_INPUT'
        },
        { status: 400 }
      )
    }

    if (langResult.language === 'mixed') {
      return NextResponse.json(
        {
          error: 'Your input contains mixed languages. Please use English only.',
          code: 'MIXED_LANGUAGE_INPUT'
        },
        { status: 400 }
      )
    }

    // Fetch user's indexed samples for style profile
    const { data: samples, error: samplesError } = await supabase
      .from('style_samples')
      .select('id, cleaned_text, word_count_en')
      .eq('user_id', user.id)
      .eq('status', 'indexed')
      .not('cleaned_text', 'is', null)

    if (samplesError) {
      console.error('Error fetching samples:', samplesError)
      return NextResponse.json(
        { error: 'Failed to fetch style samples' },
        { status: 500 }
      )
    }

    // Check if user has enough samples
    const totalWords = (samples || []).reduce(
      (sum, s) => sum + (s.word_count_en || 0),
      0
    )

    if (totalWords < 500) {
      return NextResponse.json(
        {
          error: 'Not enough writing samples. Please upload at least 500 words of your writing.',
          code: 'INSUFFICIENT_SAMPLES',
          current_words: totalWords,
          required_words: 500
        },
        { status: 400 }
      )
    }

    // Build style profile
    const texts = (samples || [])
      .filter(s => s.cleaned_text && s.cleaned_text.trim().length > 0)
      .map(s => s.cleaned_text as string)

    const styleProfile = buildStyleProfile(texts)

    // Generate embedding for the task to search for similar chunks
    const queryText = `${title} ${requirements}`
    let queryEmbedding: number[]

    try {
      queryEmbedding = await generateEmbedding(queryText)
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError)
      return NextResponse.json(
        { error: 'Failed to process your request. Please try again.' },
        { status: 500 }
      )
    }

    // Search for similar style chunks
    const searchResult = await searchSimilarChunks(
      supabase,
      user.id,
      queryEmbedding,
      TOP_K_CHUNKS
    )

    if (!searchResult.success) {
      console.error('Vector search failed:', searchResult.error)
      // Continue without chunks - style profile alone can guide generation
    }

    const styleChunks = searchResult.success ? searchResult.chunks : []

    // Build the generation prompt
    const taskInput: TaskInput = {
      title,
      requirements,
      taskType: (taskType || 'general') as 'personal_narrative' | 'argumentative' | 'general'
    }

    const prompt = buildGenerationPrompt(styleProfile, styleChunks, taskInput)

    // Generate text
    const generationResult = await generateText(prompt)

    if (!generationResult.success) {
      console.error('Generation failed:', generationResult.error)
      return NextResponse.json(
        {
          error: generationResult.error || 'Text generation failed. Please try again.',
          code: generationResult.code
        },
        { status: 500 }
      )
    }

    // Save task to database
    const { data: taskData, error: taskError } = await supabase
      .from('writing_tasks')
      .insert({
        user_id: user.id,
        task_language: 'en',
        title,
        prompt_text: requirements,
        task_type: taskType || 'general'
      })
      .select()
      .single()

    if (taskError) {
      console.error('Error saving task:', taskError)
      // Don't fail the request - we have the generated text
    }

    // Save version to database
    let versionId: string | undefined
    if (taskData) {
      const { data: versionData, error: versionError } = await supabase
        .from('task_versions')
        .insert({
          task_id: taskData.id,
          version_number: 1,
          generated_text: generationResult.text,
          revision_instruction: null
        })
        .select()
        .single()

      if (versionError) {
        console.error('Error saving version:', versionError)
      } else {
        versionId = versionData?.id
      }
    }

    // Calculate cost
    const cost = estimateCost(generationResult.usage)

    return NextResponse.json({
      success: true,
      task_id: taskData?.id,
      version_id: versionId,
      generated_text: generationResult.text,
      usage: {
        prompt_tokens: generationResult.usage.prompt_tokens,
        completion_tokens: generationResult.usage.completion_tokens,
        total_tokens: generationResult.usage.total_tokens,
        estimated_cost: cost
      }
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
