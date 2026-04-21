import { claude } from '@/lib/claude'

const PARA_ENGLISH_SYSTEM = `If the text below is already in English, return it word-for-word, unchanged. If it is in any other language, translate it into English. Output only the result — no explanation, no commentary, nothing else.`

const FULL_DOC_ENGLISH_SYSTEM = `The text between ===DOCUMENT START=== and ===DOCUMENT END=== may contain sentences in languages other than English. Go through it sentence by sentence. For each sentence: if it is in English, copy it exactly. If it is in any other language, translate it into English. Output the corrected document only — no explanation, no markers.`

export function looksLikeMetaRefusal(text: string): boolean {
  if (!text || typeof text !== 'string') return true
  const head = text.slice(0, 1200).toLowerCase()
  const signals = [
    /i apologize/,
    /you're absolutely right/,
    /haven't (actually )?shared/,
    /please (go ahead and )?(share|paste|provide)/,
    /feel free to (share|paste|send)/,
    /you haven't (actually )?(given|provided|shared)/,
    /could you (please )?(share|provide|paste)/,
    /what (specific )?text (would you|do you want)/,
    /i (don't|do not) have (the |any )?(document|text)/,
    /translation task, but you/,
    /let me know (what|if)/,
    /i don't see any (document|text)/,
    /no actual (document|essay|text) (has been |)/,
    /you've given me (detailed )?instructions/,
    /please share the (text|document)/,
    /however, no actual/,
  ]
  return signals.some(re => re.test(head))
}

function enforceOutputPlausible(input: string, output: string): boolean {
  if (!output || !String(output).trim()) return false
  if (looksLikeMetaRefusal(output)) return false
  const inL = input.length
  const outL = output.length
  if (inL > 600 && outL < inL * 0.3) return false
  if (inL > 2000 && outL < 400) return false
  return true
}

export async function enforceEnglishDraft(draft: string): Promise<string> {
  if (!draft || !draft.trim()) return draft

  const paragraphs = draft.split(/\n\n+/)
  const fixedParagraphs = await Promise.all(
    paragraphs.map(async para => {
      if (para.trim().length < 12) return para
      try {
        const raw = await claude(PARA_ENGLISH_SYSTEM, para, false, 8192)
        const out = raw.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
        if (enforceOutputPlausible(para, out)) return out
        return para
      } catch {
        return para
      }
    })
  )
  let out = fixedParagraphs.join('\n\n')

  const maxWhole = 45000
  if (out.length <= maxWhole) {
    try {
      const wrapped = '===DOCUMENT START===\n' + out + '\n===DOCUMENT END==='
      const wholeRaw = await claude(FULL_DOC_ENGLISH_SYSTEM, wrapped, false, 16384)
      const whole = wholeRaw.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
      if (enforceOutputPlausible(out, whole)) out = whole
    } catch {
      // keep paragraph-stage output
    }
  } else {
    const parts = out.split(/\n\n+/)
    const chunks: string[] = []
    let buf: string[] = []
    let len = 0
    for (const p of parts) {
      if (len + p.length > 12000 && buf.length) {
        chunks.push(buf.join('\n\n'))
        buf = [p]
        len = p.length
      } else {
        buf.push(p)
        len += p.length + 2
      }
    }
    if (buf.length) chunks.push(buf.join('\n\n'))

    const merged = await Promise.all(
      chunks.map(async chunk => {
        if (chunk.trim().length < 20) return chunk
        try {
          const wrapped = '===DOCUMENT START===\n' + chunk + '\n===DOCUMENT END==='
          const wRaw = await claude(FULL_DOC_ENGLISH_SYSTEM, wrapped, false, 16384)
          const w = wRaw.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim()
          if (enforceOutputPlausible(chunk, w)) return w
          return chunk
        } catch {
          return chunk
        }
      })
    )
    out = merged.join('\n\n')
  }

  return out
}
