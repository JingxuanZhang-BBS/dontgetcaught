import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Sample ID is required' },
        { status: 400 }
      )
    }

    // First, get the sample to check ownership and get storage path
    const { data: sample, error: fetchError } = await supabase
      .from('style_samples')
      .select('user_id, storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !sample) {
      return NextResponse.json(
        { error: 'Sample not found' },
        { status: 404 }
      )
    }

    // Verify ownership (should be handled by RLS, but double-check)
    if (sample.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this sample' },
        { status: 403 }
      )
    }

    // Delete from storage if there's a storage path
    if (sample.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('style-samples')
        .remove([sample.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with DB deletion even if storage deletion fails
      }
    }

    // Delete from database (RLS will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from('style_samples')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database deletion error:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete sample: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sample deleted successfully',
    })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
