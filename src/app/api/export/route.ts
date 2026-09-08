import { NextResponse } from 'next/server'
import { Document, Paragraph, TextRun, Packer } from 'docx'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const paragraphs = (text as string)
      .split(/\n\n+/)
      .filter(Boolean)
      .map(p => new Paragraph({
        children: [new TextRun({ text: p.trim(), size: 24, font: 'Times New Roman' })],
        spacing: { after: 200 },
      }))

    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] })
    const buffer = await Packer.toBuffer(doc)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="dontgetcaught.docx"',
      },
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Export failed: ' + String(err) }, { status: 500 })
  }
}
