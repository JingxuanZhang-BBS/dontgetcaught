import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 })

    const { data: credits } = await supabase
      .from('user_credits')
      .select('credits, tos_accepted_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      credits: credits?.credits ?? 0,
      createdAt: user.created_at,
      tosAcceptedAt: credits?.tos_accepted_at ?? null,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
