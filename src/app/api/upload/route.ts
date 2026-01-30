import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsing'
import { detectLanguage } from '@/lib/language/detector'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf', // .pdf
]

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

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      )
    }

    const uploadResults = []
    const errors = []

    for (const file of files) {
      try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: Invalid file type. Only .docx and .pdf are allowed.`)
          continue
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: File too large. Maximum 10MB allowed.`)
          continue
        }

        // Generate unique storage path: user_id/timestamp_filename
        const timestamp = Date.now()
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${user.id}/${timestamp}_${sanitizedFilename}`

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('style-samples')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (storageError) {
          console.error('Storage upload error:', storageError)
          errors.push(`${file.name}: Upload failed - ${storageError.message}`)
          continue
        }

        // Determine source type
        const sourceType = file.type.includes('pdf') ? 'pdf' : 'docx'

        // Create database record
        const { data: dbData, error: dbError } = await supabase
          .from('style_samples')
          .insert({
            user_id: user.id,
            filename: file.name,
            source_type: sourceType,
            storage_path: storagePath,
            status: 'uploaded',
            detected_language: 'unknown',
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database insert error:', dbError)
          // Try to clean up storage if DB insert fails
          await supabase.storage.from('style-samples').remove([storagePath])
          errors.push(`${file.name}: Database error - ${dbError.message}`)
          continue
        }

        // Parse the file to extract text and word count
        let wordCount = 0
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const parseResult = await parseFile(buffer, sourceType)

          if (parseResult.success && parseResult.cleanedText) {
            // Detect language
            const langResult = detectLanguage(parseResult.cleanedText)

            // Determine status based on language
            let status: string = 'uploaded'
            let errorMessage: string | null = null

            if (langResult.language === 'en') {
              status = 'uploaded' // Ready for next step (vectorization)
            } else if (langResult.language === 'non_en') {
              status = 'lang_failed'
              errorMessage = langResult.message
            } else if (langResult.language === 'mixed') {
              status = 'lang_failed'
              errorMessage = langResult.message
            } else {
              // unknown - still allow but mark as unknown
              status = 'uploaded'
            }

            // Update database with parsed content and language info
            await supabase
              .from('style_samples')
              .update({
                raw_text: parseResult.rawText,
                cleaned_text: parseResult.cleanedText,
                word_count_en: langResult.language === 'en' ? (parseResult.wordCount || 0) : 0,
                detected_language: langResult.language,
                status,
                error_message: errorMessage,
              })
              .eq('id', dbData.id)

            wordCount = langResult.language === 'en' ? (parseResult.wordCount || 0) : 0
          } else if (!parseResult.success) {
            // Parsing failed - mark as error
            await supabase
              .from('style_samples')
              .update({
                status: 'error',
                error_message: parseResult.error || 'Parsing failed',
              })
              .eq('id', dbData.id)
          }
        } catch (parseErr) {
          console.error(`Error parsing file ${file.name}:`, parseErr)
          // Continue even if parsing fails - file is still uploaded
          await supabase
            .from('style_samples')
            .update({
              status: 'error',
              error_message: 'Failed to parse file content',
            })
            .eq('id', dbData.id)
        }

        uploadResults.push({
          filename: file.name,
          id: dbData.id,
          status: 'success',
          word_count: wordCount,
        })
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err)
        errors.push(`${file.name}: Unexpected error occurred`)
      }
    }

    return NextResponse.json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message:
        uploadResults.length > 0
          ? `Successfully uploaded ${uploadResults.length} file(s)`
          : 'No files were uploaded',
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
