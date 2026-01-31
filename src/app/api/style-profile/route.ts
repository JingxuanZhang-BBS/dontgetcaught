import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildStyleProfile, generateStylePrompt, StyleProfile } from '@/lib/style'

/**
 * GET /api/style-profile
 * Build and return the user's style profile based on their indexed samples
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's indexed samples (only samples with successful English detection)
    const { data: samples, error: samplesError } = await supabase
      .from('style_samples')
      .select('id, cleaned_text, word_count_en')
      .eq('user_id', user.id)
      .eq('status', 'indexed')
      .not('cleaned_text', 'is', null)

    if (samplesError) {
      console.error('Error fetching samples:', samplesError)
      return NextResponse.json(
        { error: 'Failed to fetch samples' },
        { status: 500 }
      )
    }

    // Extract cleaned texts
    const texts = (samples || [])
      .filter(s => s.cleaned_text && s.cleaned_text.trim().length > 0)
      .map(s => s.cleaned_text as string)

    // Build the style profile
    const profile = buildStyleProfile(texts)

    // Generate the LLM prompt version
    const stylePrompt = generateStylePrompt(profile)

    // Calculate total words
    const totalWords = (samples || []).reduce(
      (sum, s) => sum + (s.word_count_en || 0),
      0
    )

    return NextResponse.json({
      success: true,
      profile,
      stylePrompt,
      stats: {
        sample_count: texts.length,
        total_words: totalWords,
        is_ready: profile.is_ready,
        recommended_words: 2000,
        words_needed: Math.max(0, 2000 - totalWords),
      },
    })
  } catch (error) {
    console.error('Style profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/style-profile
 * Save/update the user's style profile to the database
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's indexed samples
    const { data: samples, error: samplesError } = await supabase
      .from('style_samples')
      .select('id, cleaned_text, word_count_en')
      .eq('user_id', user.id)
      .eq('status', 'indexed')
      .not('cleaned_text', 'is', null)

    if (samplesError) {
      console.error('Error fetching samples:', samplesError)
      return NextResponse.json(
        { error: 'Failed to fetch samples' },
        { status: 500 }
      )
    }

    // Extract cleaned texts
    const texts = (samples || [])
      .filter(s => s.cleaned_text && s.cleaned_text.trim().length > 0)
      .map(s => s.cleaned_text as string)

    // Build the style profile
    const profile = buildStyleProfile(texts)

    // Calculate total words
    const totalWords = (samples || []).reduce(
      (sum, s) => sum + (s.word_count_en || 0),
      0
    )

    // Upsert to style_profiles table
    const { error: upsertError } = await supabase
      .from('style_profiles')
      .upsert({
        user_id: user.id,
        language: 'en',
        metrics_json: profile as unknown as Record<string, unknown>,
        is_ready: profile.is_ready,
        total_english_words: totalWords,
        recommended_threshold_words: 2000,
        last_updated: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Error saving style profile:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Style profile saved successfully',
      is_ready: profile.is_ready,
      total_words: totalWords,
    })
  } catch (error) {
    console.error('Style profile save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
