import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const errors: string[] = []

    const { error: tasksError } = await supabase
      .from('writing_tasks').delete().eq('user_id', user.id)
    if (tasksError) errors.push('tasks: ' + tasksError.message)

    const { error: chunksError } = await supabase
      .from('style_chunks').delete().eq('user_id', user.id)
    if (chunksError) errors.push('chunks: ' + chunksError.message)

    const { data: samples } = await supabase
      .from('style_samples').select('storage_path').eq('user_id', user.id)

    if (samples && samples.length > 0) {
      const paths = samples.filter(s => s.storage_path).map(s => s.storage_path as string)
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('style-samples').remove(paths)
        if (storageError) errors.push('storage: ' + storageError.message)
      }
    }

    const { error: samplesError } = await supabase
      .from('style_samples').delete().eq('user_id', user.id)
    if (samplesError) errors.push('samples: ' + samplesError.message)

    const { error: profileError } = await supabase
      .from('style_profiles').delete().eq('user_id', user.id)
    if (profileError) errors.push('profile: ' + profileError.message)

    if (errors.length > 0) {
      console.error('Clear data partial failure:', errors)
      return NextResponse.json(
        { error: 'Some data could not be deleted. Please try again or contact support.', details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'All data has been cleared' })
  } catch (error) {
    console.error('Clear data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
