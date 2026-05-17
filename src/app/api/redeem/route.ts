import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code?.trim()) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data, error } = await adminClient().rpc('redeem_gift_code', {
    p_user_id: user.id,
    p_code: code.trim().toUpperCase(),
  })

  if (error) {
    console.error('redeem_gift_code error:', error)
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }

  if (!data.success) {
    const msg =
      data.error === 'invalid_code'     ? 'Invalid code. Check and try again.' :
      data.error === 'already_redeemed' ? 'You\'ve already redeemed this code.' :
                                          'Redemption failed.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ success: true, creditsAdded: data.credits_added })
}
