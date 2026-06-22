import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text } = await request.json()
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

    // No Claude call — regex-only cleanup to preserve humanization score
    const polished = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove bold
      .replace(/\[\d+\]/g, '')           // remove footnote markers [1] [2]
      .trim()

    return NextResponse.json({ polished })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Polish error: ' + String(err) }, { status: 500 })
  }
}
