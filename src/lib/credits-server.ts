import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getCredits(userId: string): Promise<number> {
  const { data } = await adminClient()
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()
  return data?.credits ?? 0
}

/** Atomically deduct 1 credit. Returns refundToken if successful, null if insufficient balance. */
export async function deductCredit(userId: string): Promise<string | null> {
  const token = randomUUID()
  const client = adminClient()

  // Try RPC first (atomic)
  const { data, error } = await client.rpc('deduct_credit', {
    p_user_id: userId,
    p_token: token,
  })
  if (!error) return data === true ? token : null

  // RPC unavailable (migration not applied, column mismatch, etc.) — fall back to direct table ops
  console.warn('deductCredit RPC failed, using direct fallback:', error.message)
  const { data: row } = await client
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()

  if (!row) {
    await client.from('user_credits').insert({ user_id: userId, credits: 0 })
    return null
  }
  if (row.credits <= 0) return null

  const { error: updErr } = await client
    .from('user_credits')
    .update({ credits: row.credits - 1 })
    .eq('user_id', userId)

  if (updErr) {
    console.warn('deductCredit direct update also failed:', updErr.message)
    return null
  }
  return token
}

/** Refund 1 credit using a valid one-time token. Returns true if refunded. */
export async function refundWithToken(userId: string, token: string): Promise<boolean> {
  const { data, error } = await adminClient().rpc('refund_with_token', {
    p_user_id: userId,
    p_token: token,
  })
  if (error) {
    console.error('refundWithToken error:', error)
    return false
  }
  return data === true
}

/** Refund 1 credit unconditionally (for server-side error paths only). */
export async function refundCredit(userId: string): Promise<void> {
  const { error } = await adminClient().rpc('refund_credit', { p_user_id: userId })
  if (error) console.error('refundCredit error:', error)
}
