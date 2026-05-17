import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  generate:  { max: 10, windowMinutes: 60 },
  scan:      { max: 60, windowMinutes: 60 },
  humanize:  { max: 40, windowMinutes: 60 },
  polish:    { max: 40, windowMinutes: 60 },
  clarify:   { max: 30, windowMinutes: 60 },
  default:   { max: 60, windowMinutes: 60 },
}

/**
 * Check rate limit for a user+endpoint. Returns a 429 Response if limited,
 * or null if the request is allowed.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<NextResponse | null> {
  const limit = LIMITS[endpoint] ?? LIMITS.default

  const { data, error } = await adminClient().rpc('check_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: limit.max,
    p_window_minutes: limit.windowMinutes,
  })

  if (error) {
    console.error('rate limit check error:', error)
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Service temporarily unavailable. Please try again shortly.' },
      { status: 429 }
    )
  }

  if (data === false) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: `Too many requests. You can make up to ${limit.max} requests per hour on this endpoint.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.windowMinutes * 60) },
      }
    )
  }

  return null
}
