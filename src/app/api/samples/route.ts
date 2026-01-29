import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's samples, ordered by creation date (newest first)
    const { data: samples, error } = await supabase
      .from('style_samples')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching samples:', error)
      return NextResponse.json(
        { error: 'Failed to fetch samples' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      samples: samples || [],
      count: samples?.length || 0,
    })
  } catch (error) {
    console.error('Samples API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
