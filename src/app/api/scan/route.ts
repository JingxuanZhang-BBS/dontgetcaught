import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text } = await request.json()
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const response = await axios.post(
      'https://api.gptzero.me/v2/predict/text',
      { document: text },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.GPTZERO_KEY || '',
        },
      }
    )

    const doc = response.data.documents?.[0]
    if (!doc) {
      return NextResponse.json(
        { error: 'No document in GPTZero response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      overallAiProb: doc.completely_generated_prob ?? 0,
      sentences: (doc.sentences || []).map(
        (s: { sentence: string; generated_prob: number }) => ({
          text: s.sentence,
          aiProb: s.generated_prob ?? 0,
        })
      ),
    })
  } catch (err: unknown) {
    const message =
      axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err)
    return NextResponse.json(
      { error: 'GPTZero error: ' + message },
      { status: 500 }
    )
  }
}
