import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateDocx, generateFilename } from '@/lib/export'

/**
 * POST /api/export
 * Export a task version as .docx file
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, versionNumber } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Fetch the task (verify ownership)
    const { data: task, error: taskError } = await supabase
      .from('writing_tasks')
      .select('id, title, user_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Fetch the requested version (or latest)
    let versionQuery = supabase
      .from('task_versions')
      .select('id, version_number, generated_text, exported_count')
      .eq('task_id', taskId)

    if (versionNumber) {
      versionQuery = versionQuery.eq('version_number', versionNumber)
    } else {
      versionQuery = versionQuery.order('version_number', { ascending: false }).limit(1)
    }

    const { data: version, error: versionError } = await versionQuery.single()

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Generate the .docx
    const buffer = await generateDocx({
      title: task.title,
      text: version.generated_text,
      versionNumber: version.version_number,
    })

    // Increment exported_count
    await supabase
      .from('task_versions')
      .update({ exported_count: (version.exported_count || 0) + 1 })
      .eq('id', version.id)

    // Return as downloadable file
    const filename = generateFilename(task.title, version.version_number)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
