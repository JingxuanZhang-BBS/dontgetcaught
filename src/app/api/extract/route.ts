import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type
    let text = ''

    if (
      mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      text = buffer.toString('utf-8')
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Could not extract text: ' + String(err) },
      { status: 500 }
    )
  }
}
