import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refundWithToken } from '@/lib/credits-server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { refundToken } = await request.json()
    if (!refundToken) return NextResponse.json({ error: 'Missing refund token' }, { status: 400 })

    const refunded = await refundWithToken(user.id, refundToken)
    if (!refunded) {
      return NextResponse.json({ error: 'Invalid or expired refund token' }, { status: 400 })
    }

    return NextResponse.json({ refunded: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
