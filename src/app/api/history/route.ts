import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { prompt, draft, score, word_count, text_type, writing_mode } = await request.json()
    if (!prompt || !draft) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { error } = await supabase.from('generation_history').insert({
      user_id: user.id,
      prompt,
      draft,
      score: score ?? null,
      word_count: word_count ?? null,
      text_type: text_type ?? null,
      writing_mode: writing_mode ?? null,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
