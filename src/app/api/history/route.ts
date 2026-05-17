import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('generation_history')
      .select('id, prompt, draft, score, word_count, text_type, writing_mode, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ history: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      prompt, draft, score, word_count, text_type, writing_mode,
      // analytics fields
      initial_score, humanize_rounds, pipeline_duration_ms,
      citations, word_count_target,
    } = await request.json()

    if (!prompt || !draft) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // User-facing history (trimmed to 10 per user by trigger)
    const { error } = await supabase.from('generation_history').insert({
      user_id: user.id,
      prompt,
      draft,
      score:        score        ?? null,
      word_count:   word_count   ?? null,
      text_type:    text_type    ?? null,
      writing_mode: writing_mode ?? null,
    })
    if (error) throw error

    // Permanent analytics (never trimmed, service role)
    await adminClient().from('generation_analytics').insert({
      user_id:              user.id,
      prompt_preview:       String(prompt).slice(0, 300),
      text_type:            text_type            ?? null,
      writing_mode:         writing_mode         ?? null,
      citations:            citations             ?? null,
      word_count_target:    word_count_target     ?? null,
      word_count_actual:    word_count            ?? null,
      initial_score:        initial_score         ?? null,
      final_score:          score                 ?? null,
      humanize_rounds:      humanize_rounds       ?? null,
      pipeline_duration_ms: pipeline_duration_ms  ?? null,
      completed:            true,
    }).then(({ error: aErr }) => {
      if (aErr) console.error('analytics insert error:', aErr.message)
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
