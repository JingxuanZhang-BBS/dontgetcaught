import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/tasks
 * List all writing tasks for the current user with their versions
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch tasks with versions
    const { data: tasks, error } = await supabase
      .from('writing_tasks')
      .select(`
        id, title, task_type, prompt_text, created_at,
        task_versions (id, version_number, generated_text, revision_instruction, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Sort versions within each task
    const sortedTasks = (tasks || []).map((task) => ({
      ...task,
      task_versions: (task.task_versions || []).sort(
        (a: { version_number: number }, b: { version_number: number }) =>
          a.version_number - b.version_number
      ),
    }))

    return NextResponse.json({ tasks: sortedTasks })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
