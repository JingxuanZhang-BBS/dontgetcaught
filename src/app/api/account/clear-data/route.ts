import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/account/clear-data
 * Delete all user data: samples, chunks, profiles, tasks, versions
 */
export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete in order respecting foreign keys:
    // 1. writing_tasks (cascade deletes task_versions)
    const { error: tasksError } = await supabase
      .from('writing_tasks')
      .delete()
      .eq('user_id', user.id)

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError)
    }

    // 2. style_chunks
    const { error: chunksError } = await supabase
      .from('style_chunks')
      .delete()
      .eq('user_id', user.id)

    if (chunksError) {
      console.error('Error deleting chunks:', chunksError)
    }

    // 3. style_samples (also delete storage files)
    const { data: samples } = await supabase
      .from('style_samples')
      .select('storage_path')
      .eq('user_id', user.id)

    // Delete storage files
    if (samples && samples.length > 0) {
      const paths = samples
        .filter((s) => s.storage_path)
        .map((s) => s.storage_path as string)

      if (paths.length > 0) {
        await supabase.storage.from('style-samples').remove(paths)
      }
    }

    const { error: samplesError } = await supabase
      .from('style_samples')
      .delete()
      .eq('user_id', user.id)

    if (samplesError) {
      console.error('Error deleting samples:', samplesError)
    }

    // 4. style_profiles
    const { error: profileError } = await supabase
      .from('style_profiles')
      .delete()
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'All data has been cleared',
    })
  } catch (error) {
    console.error('Clear data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
