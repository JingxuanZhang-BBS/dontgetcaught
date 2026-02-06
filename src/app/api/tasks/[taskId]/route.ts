import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/tasks/[taskId]
 * Delete a writing task and all its versions
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient()
    const { taskId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership before deleting
    const { data: task, error: findError } = await supabase
      .from('writing_tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (findError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task (cascade deletes versions)
    const { error: deleteError } = await supabase
      .from('writing_tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
