import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { detectLanguage } from '@/lib/language/detector'
import { generateEmbedding, searchSimilarChunks } from '@/lib/vector'
import { buildStyleProfile } from '@/lib/style'
import {
  buildRevisionPrompt,
  generateText,
  estimateCost,
} from '@/lib/generation'

const TOP_K_CHUNKS = 5

/**
 * POST /api/revise
 * Revise a previously generated text based on user instructions
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
    const { taskId, revisionInstruction } = body

    if (!taskId || !revisionInstruction) {
      return NextResponse.json(
        { error: 'Task ID and revision instruction are required' },
        { status: 400 }
      )
    }

    // Check language of revision instruction
    const langResult = detectLanguage(revisionInstruction)
    if (langResult.language === 'non_en') {
      return NextResponse.json(
        {
          error: 'Please provide revision instructions in English.',
          code: 'NON_ENGLISH_INPUT',
        },
        { status: 400 }
      )
    }

    if (langResult.language === 'mixed') {
      return NextResponse.json(
        {
          error: 'Your revision instructions contain mixed languages. Please use English only.',
          code: 'MIXED_LANGUAGE_INPUT',
        },
        { status: 400 }
      )
    }

    if (langResult.language === 'unknown') {
      return NextResponse.json(
        {
          error: 'Unable to verify the language of your instructions. Please provide clear English text.',
          code: 'UNKNOWN_LANGUAGE_INPUT',
        },
        { status: 400 }
      )
    }

    // Fetch the task (verify ownership)
    const { data: task, error: taskError } = await supabase
      .from('writing_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get the latest version
    const { data: latestVersion, error: versionError } = await supabase
      .from('task_versions')
      .select('*')
      .eq('task_id', taskId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json(
        { error: 'No existing version found for this task' },
        { status: 404 }
      )
    }

    // Fetch user's style samples for profile
    const { data: samples } = await supabase
      .from('style_samples')
      .select('id, cleaned_text, word_count_en')
      .eq('user_id', user.id)
      .eq('status', 'indexed')
      .not('cleaned_text', 'is', null)

    const texts = (samples || [])
      .filter((s) => s.cleaned_text && s.cleaned_text.trim().length > 0)
      .map((s) => s.cleaned_text as string)

    const styleProfile = buildStyleProfile(texts)

    // Generate embedding for revision context search
    const queryText = `${task.title} ${revisionInstruction}`
    let styleChunks: { id: string; sample_id: string; user_id: string; chunk_text: string; chunk_index: number; distance: number }[] = []

    try {
      const queryEmbedding = await generateEmbedding(queryText)
      const searchResult = await searchSimilarChunks(
        supabase,
        user.id,
        queryEmbedding,
        TOP_K_CHUNKS
      )
      if (searchResult.success) {
        styleChunks = searchResult.chunks
      }
    } catch (err) {
      console.error('Vector search failed for revision, continuing without chunks:', err)
    }

    // Build the revision prompt
    const revisionPrompt = buildRevisionPrompt(styleProfile, styleChunks, {
      previousText: latestVersion.generated_text,
      revisionInstruction,
      title: task.title,
      taskType: (task.task_type || 'general') as 'personal_narrative' | 'argumentative' | 'general',
      versionNumber: latestVersion.version_number,
    })

    // Generate revised text
    const generationResult = await generateText(revisionPrompt)

    if (!generationResult.success) {
      return NextResponse.json(
        {
          error: generationResult.error || 'Revision failed. Please try again.',
          code: generationResult.code,
        },
        { status: 500 }
      )
    }

    // Save new version
    const newVersionNumber = latestVersion.version_number + 1
    const { data: newVersion, error: saveError } = await supabase
      .from('task_versions')
      .insert({
        task_id: taskId,
        version_number: newVersionNumber,
        generated_text: generationResult.text,
        revision_instruction: revisionInstruction,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving revision version:', saveError)
    }

    // Update task's updated_at
    await supabase
      .from('writing_tasks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', taskId)

    const cost = estimateCost(generationResult.usage)

    return NextResponse.json({
      success: true,
      task_id: taskId,
      version_id: newVersion?.id,
      version_number: newVersionNumber,
      generated_text: generationResult.text,
      revision_instruction: revisionInstruction,
      usage: {
        prompt_tokens: generationResult.usage.prompt_tokens,
        completion_tokens: generationResult.usage.completion_tokens,
        total_tokens: generationResult.usage.total_tokens,
        estimated_cost: cost,
      },
    })
  } catch (error) {
    console.error('Revise API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
