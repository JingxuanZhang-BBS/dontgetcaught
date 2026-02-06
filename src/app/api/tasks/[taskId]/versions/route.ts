import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/tasks/[taskId]/versions
 * Fetch all versions for a specific task
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient()
    const { taskId } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task ownership
    const { data: task, error: taskError } = await supabase
      .from('writing_tasks')
      .select('id, title, task_type')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Fetch all versions ordered by version number
    const { data: versions, error: versionsError } = await supabase
      .from('task_versions')
      .select('id, version_number, generated_text, revision_instruction, created_at')
      .eq('task_id', taskId)
      .order('version_number', { ascending: true })

    if (versionsError) {
      console.error('Error fetching versions:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task,
      versions: versions || [],
      total_versions: versions?.length || 0,
    })
  } catch (error) {
    console.error('Versions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
