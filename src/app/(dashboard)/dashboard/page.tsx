'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: number
  role: 'ai' | 'user' | 'warning'
  content: string
  // Chips question
  chips?: { question: string; options: string[]; chipClass?: string }
  chipsSelected?: string
  // Freetext question
  freetext?: { question: string; placeholder: string }
  freetextValue?: string
  freetextSubmitted?: boolean
  // Progress log
  isProgress?: boolean
  progressLines?: { text: string; color: string }[]
  // Result
  isResult?: boolean
  score?: number
  // Back/undo support
  canGoBack?: boolean
  // Callbacks (stored in ref map, not in state)
}

const TEXT_TYPES: Record<string, string> = {
  'Article': 'article', 'Blog Post': 'blog', 'Opinion Editorial': 'oped',
  'Essay': 'essay', 'Review': 'review', 'Report': 'report', 'Speech': 'speech',
}
const TYPE_NAMES: Record<string, string> = {
  article: 'Article', blog: 'Blog Post', oped: 'Op-Ed',
  essay: 'Essay', review: 'Review', report: 'Report', speech: 'Speech',
}
const TONES = ['Persuasive', 'Neutral', 'Optimistic', 'Critical', 'Urgent', 'Reflective', 'Humorous', 'Empathetic']
const TARGET = 85

let nextId = 1

// ── Infer from prompt ────────────────────────────────────────────────────────

function inferFromPrompt(prompt: string) {
  const p = prompt.toLowerCase()
  let textType: string | null = null, tone: string | null = null, citations: boolean | null = null, wordCount: number | null = null
  if (/\b(article|news|explainer)\b/.test(p)) textType = 'article'
  else if (/\b(blog|blog post)\b/.test(p)) textType = 'blog'
  else if (/\b(op-ed|oped|opinion|editorial|persuasive|argue)\b/.test(p)) textType = 'oped'
  else if (/\b(essay)\b/.test(p)) textType = 'essay'
  else if (/\b(review|evaluate|assess)\b/.test(p)) textType = 'review'
  else if (/\b(report|findings|analysis)\b/.test(p)) textType = 'report'
  else if (/\b(speech|address|talk|audience)\b/.test(p)) textType = 'speech'
  if (/\b(persuasive|convince|argue)\b/.test(p)) tone = 'Persuasive'
  else if (/\b(neutral|objective|balanced)\b/.test(p)) tone = 'Neutral'
  else if (/\b(optimistic|positive|hopeful)\b/.test(p)) tone = 'Optimistic'
  else if (/\b(critical|critique)\b/.test(p)) tone = 'Critical'
  else if (/\b(urgent|emergency|crisis)\b/.test(p)) tone = 'Urgent'
  else if (/\b(reflective|personal|memoir)\b/.test(p)) tone = 'Reflective'
  else if (/\b(humorous|funny|humor|witty)\b/.test(p)) tone = 'Humorous'
  else if (/\b(empathetic|compassionate|emotional)\b/.test(p)) tone = 'Empathetic'
  if (/\b(no citations?|without citations?|don't cite)\b/.test(p)) citations = false
  else if (/\b(with citations?|cite|references?)\b/.test(p)) citations = true
  const m = p.match(/\b(\d+)\s*words?\b/)
  if (m) wordCount = parseInt(m[1])
  return { textType, tone, citations, wordCount }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [locked, setLocked] = useState(false)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadedName, setUploadedName] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Working text for copy
  const workingTextRef = useRef('')
  const warningGivenRef = useRef(false)

  // Back/undo history tracking
  const historyRef = useRef<{ aiMsgId: number; userMsgId: number; rollback: () => void }[]>([])
  const generationStartedRef = useRef(false)
  const lastUserMsgIdRef = useRef(0)

  // State machine (mutable ref for async flow)
  const stateRef = useRef({
    prompt: '',
    clarifications: [] as { question: string; answer: string }[],
    textType: null as string | null,
    tone: null as string | null,
    citations: null as boolean | null,
    wordCount: null as number | null,
  })

  // Callback registry (keyed by message id)
  const callbacksRef = useRef<Record<number, (val: string) => void>>({})

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, 50)
  }, [])

  useEffect(() => { scrollBottom() }, [messages, scrollBottom])

  // ── Message helpers ────────────────────────────────────────────────────

  function addMsg(msg: Omit<ChatMsg, 'id'>): number {
    const id = nextId++
    setMessages(prev => [...prev, { ...msg, id }])
    return id
  }

  function removeMsg(id: number) {
    setMessages(prev => prev.filter(m => m.id !== id))
    delete callbacksRef.current[id]
  }

  function updateMsg(id: number, patch: Partial<ChatMsg>) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }

  function addProgressLine(id: number, text: string, color: string) {
    setMessages(prev => prev.map(m => {
      if (m.id === id) return { ...m, progressLines: [...(m.progressLines || []), { text, color }] }
      return m
    }))
    scrollBottom()
  }

  // ── API fetch ──────────────────────────────────────────────────────────

  async function apiFetch(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch('/api' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || endpoint + ' failed')
    return data
  }

  // ── Greeting ───────────────────────────────────────────────────────────

  useEffect(() => {
    setTimeout(() => {
      addMsg({ role: 'ai', content: "Hey — what do you want to write? Give me a prompt or upload a document, and I'll handle the rest." })
    }, 300)
    const pending = sessionStorage.getItem('pending_prompt')
    if (pending) { sessionStorage.removeItem('pending_prompt'); setInput(pending) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── File upload ────────────────────────────────────────────────────────

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadedText(data.text)
      setUploadedName(file.name)
    } catch (err) {
      addMsg({ role: 'ai', content: 'Could not read that file: ' + (err instanceof Error ? err.message : String(err)) + '. Try a .txt file instead.' })
    }
  }

  // ── Send ───────────────────────────────────────────────────────────────

  function handleSend() {
    if (locked) return
    const raw = input.trim()
    if (!raw && !uploadedText) return

    const prompt = uploadedText
      ? 'Document content:\n' + uploadedText + '\n\n' + (raw ? 'Additional instructions: ' + raw : '')
      : raw

    setInput('')
    setUploadedText('')
    setUploadedName('')
    if (fileRef.current) fileRef.current.value = ''

    // User message — with undo to restart conversation
    const promptMsgId = addMsg({ role: 'user', content: raw || '📎 ' + uploadedName, canGoBack: true })
    lastUserMsgIdRef.current = promptMsgId
    historyRef.current.push({
      aiMsgId: 0,
      userMsgId: promptMsgId,
      rollback: () => { resetState(); setLocked(false) },
    })
    setLocked(true)

    const inferred = inferFromPrompt(prompt)
    stateRef.current = {
      prompt,
      clarifications: [],
      textType: inferred.textType,
      tone: inferred.tone,
      citations: inferred.citations,
      wordCount: inferred.wordCount,
    }
    warningGivenRef.current = false

    checkClarifications()
  }

  // ── Go back / undo ────────────────────────────────────────────────────

  function goBack(userMsgId: number) {
    if (generationStartedRef.current) return
    const idx = historyRef.current.findIndex(h => h.userMsgId === userMsgId)
    if (idx === -1) return
    // Capture pending question IDs BEFORE rollbacks clear callbacksRef
    const pendingIds = Object.keys(callbacksRef.current).map(Number)
    for (const pid of pendingIds) removeMsg(pid)
    // Remove this entry and all subsequent entries (cascade rollback)
    const toRemove = historyRef.current.splice(idx)
    for (const entry of toRemove) {
      entry.rollback()
      if (entry.aiMsgId) removeMsg(entry.aiMsgId)
      removeMsg(entry.userMsgId)
    }
    // If we undid the initial prompt, just go back to greeting state
    if (historyRef.current.length === 0) return
    // Otherwise re-trigger the flow from where we rolled back to
    askMissing()
  }

  // ── Clarification flow ─────────────────────────────────────────────────

  async function checkClarifications() {
    const typingId = addMsg({ role: 'ai', content: '...' })

    try {
      const data = await apiFetch('/clarify', {
        prompt: stateRef.current.prompt,
        clarificationsSoFar: stateRef.current.clarifications,
      })
      removeMsg(typingId)

      if (data.needsClarification && data.question) {
        const qId = addMsg({
          role: 'ai', content: '',
          freetext: { question: data.question, placeholder: 'Type your answer...' },
        })
        callbacksRef.current[qId] = (answer: string) => {
          const userMsgId = lastUserMsgIdRef.current
          historyRef.current.push({
            aiMsgId: qId,
            userMsgId,
            rollback: () => { stateRef.current.clarifications.pop() },
          })
          stateRef.current.clarifications.push({ question: data.question, answer })
          checkClarifications()
        }
        return
      }
    } catch {
      removeMsg(typingId)
    }

    askMissing()
  }

  // ── Ask missing fields (chips) ─────────────────────────────────────────

  function askMissing() {
    const s = stateRef.current

    if (!s.textType) {
      setTimeout(() => {
        const id = addMsg({
          role: 'ai', content: '',
          chips: { question: 'What type of text do you want?', options: Object.keys(TEXT_TYPES) },
        })
        callbacksRef.current[id] = (opt: string) => {
          const userMsgId = lastUserMsgIdRef.current
          historyRef.current.push({
            aiMsgId: id, userMsgId,
            rollback: () => { stateRef.current.textType = null },
          })
          stateRef.current.textType = TEXT_TYPES[opt]
          askMissing()
        }
      }, 400)
      return
    }

    if (!s.tone) {
      setTimeout(() => {
        const id = addMsg({
          role: 'ai', content: '',
          chips: { question: 'What tone should the text have?', options: TONES },
        })
        callbacksRef.current[id] = (opt: string) => {
          const userMsgId = lastUserMsgIdRef.current
          historyRef.current.push({
            aiMsgId: id, userMsgId,
            rollback: () => { stateRef.current.tone = null },
          })
          stateRef.current.tone = opt
          askMissing()
        }
      }, 400)
      return
    }

    if (s.citations === null) {
      setTimeout(() => {
        const id = addMsg({
          role: 'ai', content: '',
          chips: { question: 'Do you want in-text citations?', options: ['Yes', 'No'] },
        })
        callbacksRef.current[id] = (opt: string) => {
          const userMsgId = lastUserMsgIdRef.current
          historyRef.current.push({
            aiMsgId: id, userMsgId,
            rollback: () => { stateRef.current.citations = null },
          })
          stateRef.current.citations = opt === 'Yes'
          askMissing()
        }
      }, 400)
      return
    }

    if (s.wordCount === null) {
      setTimeout(() => {
        const id = addMsg({
          role: 'ai', content: '',
          freetext: { question: 'Around how many words should your text be? (150–4000)', placeholder: 'e.g. 500' },
        })
        callbacksRef.current[id] = (val: string) => {
          const n = parseInt(val.replace(/[^0-9]/g, ''))
          if (!n || n < 150) {
            updateMsg(id, { freetextSubmitted: false, freetextValue: '' })
            addMsg({ role: 'ai', content: 'Minimum word count is 150. Please enter a higher number.' })
            return
          }
          if (n > 4000) {
            updateMsg(id, { freetextSubmitted: false, freetextValue: '' })
            addMsg({ role: 'ai', content: 'Maximum word count is 4000. Please enter a smaller number.' })
            return
          }
          const userMsgId = lastUserMsgIdRef.current
          historyRef.current.push({
            aiMsgId: id, userMsgId,
            rollback: () => { stateRef.current.wordCount = null },
          })
          stateRef.current.wordCount = n
          analyzeAndProceed()
        }
      }, 400)
      return
    }

    analyzeAndProceed()
  }

  // ── Analyze prompt ─────────────────────────────────────────────────────

  async function analyzeAndProceed() {
    const typingId = addMsg({ role: 'ai', content: '...' })

    try {
      const analysis = await apiFetch('/analyze', {
        prompt: stateRef.current.prompt,
        textType: stateRef.current.textType,
      })
      removeMsg(typingId)

      if (analysis.category === 'research_based') {
        generate()
        return
      }

      // Show warning
      warningGivenRef.current = true
      const pct = analysis.estimatedHumanPct
      const msg = `Unfortunately, given the way dontgetcaught works, this type of prompt will likely generate a result that shows as ${100 - pct}% AI-generated. Our algorithm works best with research-based topics such as journalism, academic subjects, current events, science, history, culture, and more! Do you still wish to proceed?`

      const wId = addMsg({
        role: 'warning', content: msg,
        chips: { question: '', options: ['Yes, proceed', 'No, cancel'], chipClass: 'warn' },
      })
      callbacksRef.current[wId] = (opt: string) => {
        if (opt.startsWith('Yes')) {
          generate()
        } else {
          addMsg({ role: 'ai', content: 'No problem — feel free to try a different prompt.' })
          resetState()
          setLocked(false)
        }
      }
    } catch {
      removeMsg(typingId)
      generate()
    }
  }

  // ── Generate ───────────────────────────────────────────────────────────

  async function generate() {
    generationStartedRef.current = true
    const s = stateRef.current
    let fullPrompt = s.prompt
    if (s.clarifications.length > 0) {
      fullPrompt += '\n\nClarifications from user:\n' + s.clarifications.map(c => c.question + ' → ' + c.answer).join('\n')
    }
    fullPrompt += '\n\nText type: ' + TYPE_NAMES[s.textType!] + '\nTone: ' + s.tone + '\nWord count: ' + s.wordCount + ' words'

    const colors: Record<string, string> = {
      step: '#7eb8f7', info: '#888', warn: '#f0a500', success: '#2ecc71', error: '#e74c3c',
    }

    const progressId = addMsg({
      role: 'ai', content: '', isProgress: true, progressLines: [],
    })

    function plog(text: string, type = 'info') {
      addProgressLine(progressId, text, colors[type] || '#888')
    }

    workingTextRef.current = ''
    let finalScore = 0

    try {
      plog('Phase 1 — searching foreign language sources...', 'step')
      const { draft } = await apiFetch('/generate', {
        prompt: fullPrompt, citations: s.citations, textType: s.textType,
      })
      workingTextRef.current = draft
      plog('Draft assembled.', 'success')

      for (let round = 1; round <= 3; round++) {
        plog('── Round ' + round + ' GPTZero scan...', 'step')
        const scan = await apiFetch('/scan', { text: workingTextRef.current })
        const humanPct = Math.round((1 - scan.overallAiProb) * 100)
        finalScore = humanPct
        const flagged = scan.sentences.filter((s: { aiProb: number }) => s.aiProb * 100 >= 60)
        plog('Score: ' + humanPct + '% human — ' + flagged.length + ' flagged', humanPct >= TARGET ? 'success' : 'warn')
        if (humanPct >= TARGET) { plog('✓ Reached ' + humanPct + '% — moving to polish.', 'success'); break }
        if (!flagged.length) { plog('No sentences above threshold.', 'warn'); break }
        if (round === 3) { plog('Max rounds. Moving to polish.', 'warn'); break }
        plog('Humanizing connective tissue...', 'step')
        const { humanized } = await apiFetch('/humanize', {
          draft: workingTextRef.current,
          flaggedSentences: flagged.map((s: { text: string }) => s.text),
          textType: s.textType, citations: s.citations,
        })
        workingTextRef.current = humanized
        plog('Rewritten. Re-scanning...', 'info')
      }

      plog('Phase 3 — polishing...', 'step')
      const { polished } = await apiFetch('/polish', {
        text: workingTextRef.current, textType: s.textType, citations: s.citations,
      })
      workingTextRef.current = polished
      plog('Polish complete.', 'success')

      plog('Phase 4 — final scan...', 'step')
      const finalScan = await apiFetch('/scan', { text: workingTextRef.current })
      finalScore = Math.round((1 - finalScan.overallAiProb) * 100)
      plog('✓ Final score: ' + finalScore + '% human. Done!', 'success')

      // Result message
      addMsg({ role: 'ai', content: workingTextRef.current, isResult: true, score: finalScore })

      // Refund message if below threshold and no warning was given
      if (!warningGivenRef.current && finalScore < TARGET) {
        addMsg({
          role: 'ai',
          content: '✓ Your credits have been refunded. This prompt produced a result below our 85% human threshold. We only charge for results that meet our standard.',
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      plog('Error: ' + msg, 'error')
      addMsg({ role: 'ai', content: 'Something went wrong: ' + msg + '. Please try again.' })
    } finally {
      resetState()
      setLocked(false)
    }
  }

  function resetState() {
    stateRef.current = {
      prompt: '', clarifications: [],
      textType: null, tone: null, citations: null, wordCount: null,
    }
    callbacksRef.current = {}
    historyRef.current = []
    generationStartedRef.current = false
  }

  // ── Rewrite ────────────────────────────────────────────────────────────

  function doRewrite() {
    resetState()
    setLocked(false)
    addMsg({ role: 'ai', content: "Sure — what would you like to write? Give me a new prompt or tweak the details." })
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── Copy ───────────────────────────────────────────────────────────────

  const [copiedId, setCopiedId] = useState<number | null>(null)

  function doCopy(id: number) {
    navigator.clipboard.writeText(workingTextRef.current)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: '#0c0c0c', color: '#e0dbd0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 720, padding: '2rem 1rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ paddingBottom: '1.2rem', marginBottom: '1.2rem', borderBottom: '1px solid #1e1e1e', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 400, fontSize: '1.4rem', color: '#f0ebe0', letterSpacing: '.03em' }}>dontgetcaught</h1>
          <p style={{ fontSize: '.72rem', color: '#444', fontFamily: 'monospace', marginTop: '.3rem' }}>
            foreign sources → translated → gptzero verified → 85%+ human
          </p>
        </div>

        {/* Chat */}
        <div ref={chatRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem', overflowY: 'auto' }}>
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              callbacks={callbacksRef.current}
              addUserMsg={(text: string) => {
                const uid = addMsg({ role: 'user', content: text, canGoBack: true })
                lastUserMsgIdRef.current = uid
                return uid
              }}
              updateMsg={updateMsg}
              doCopy={doCopy}
              doRewrite={doRewrite}
              copiedId={copiedId}
              scrollBottom={scrollBottom}
              goBack={goBack}
              generationStartedRef={generationStartedRef}
            />
          ))}
        </div>

        {/* Input area */}
        <div style={{ position: 'sticky', bottom: 0, background: '#0c0c0c', padding: '1rem 0 .5rem', borderTop: '1px solid #1a1a1a', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="What do you want to write? Be as specific or brief as you like..."
                rows={2}
                disabled={locked}
                style={{
                  width: '100%', background: '#111', border: '1px solid #2a2a2a', color: '#e0dbd0',
                  padding: '.75rem 1rem', borderRadius: 8, fontSize: '.9rem', lineHeight: 1.5,
                  fontFamily: "'Georgia', serif", resize: 'none', minHeight: 52, maxHeight: 160,
                  outline: 'none', opacity: locked ? 0.35 : 1, cursor: locked ? 'not-allowed' : 'text',
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={locked}
              style={{
                padding: '.75rem 1.2rem', background: '#1e3a2f', border: '1px solid #2ecc71',
                color: '#2ecc71', borderRadius: 8, cursor: locked ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace', fontSize: '.82rem', whiteSpace: 'nowrap',
                opacity: locked ? 0.4 : 1, flexShrink: 0,
              }}
            >
              SEND
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.4rem' }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={locked}
              style={{
                padding: '.3rem .7rem', border: '1px solid #2a2a2a', borderRadius: 4,
                fontFamily: 'monospace', fontSize: '.7rem', color: '#555', cursor: 'pointer', background: 'transparent',
              }}
            >
              📎 Upload doc
            </button>
            {uploadedName && <span style={{ fontSize: '.7rem', fontFamily: 'monospace', color: '#2ecc71' }}>📎 {uploadedName}</span>}
            <input ref={fileRef} type="file" accept=".txt,.docx" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg, callbacks, addUserMsg, updateMsg, doCopy, doRewrite, copiedId, scrollBottom, goBack, generationStartedRef,
}: {
  msg: ChatMsg
  callbacks: Record<number, (val: string) => void>
  addUserMsg: (text: string) => number
  updateMsg: (id: number, patch: Partial<ChatMsg>) => void
  doCopy: (id: number) => void
  doRewrite: () => void
  copiedId: number | null
  scrollBottom: () => void
  goBack: (userMsgId: number) => void
  generationStartedRef: React.RefObject<boolean>
}) {
  const ftRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (msg.freetext && !msg.freetextSubmitted && ftRef.current) ftRef.current.focus()
  }, [msg.freetext, msg.freetextSubmitted])

  // Typing dots
  if (msg.content === '...' && !msg.isProgress) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '85%', alignSelf: 'flex-start' }}>
        <div style={{ padding: '.75rem 1rem', borderRadius: '4px 12px 12px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', gap: 4, padding: '.5rem 0', alignItems: 'center' }}>
            {[0, 150, 300].map(d => (
              <span key={d} style={{ width: 6, height: 6, background: '#444', borderRadius: '50%', animation: 'bounce .8s infinite', animationDelay: d + 'ms' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // User message
  if (msg.role === 'user') {
    const showUndo = msg.canGoBack && !generationStartedRef.current
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}>
        <div style={{
          padding: '.75rem 1rem', borderRadius: '12px 4px 12px 12px',
          background: '#1e3a2f', border: '1px solid #2ecc71', color: '#c8f0dc',
          fontFamily: 'monospace', fontSize: '.82rem', lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
        {showUndo && (
          <button
            onClick={() => goBack(msg.id)}
            style={{
              background: 'rgba(231,76,60,.08)', border: '1px solid rgba(231,76,60,.25)', borderRadius: 12,
              color: '#e74c3c', fontFamily: 'monospace', fontSize: '.72rem', cursor: 'pointer',
              padding: '.3rem .8rem', marginTop: '.1rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,.18)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,.08)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,.25)' }}
          >
            ↩ undo
          </button>
        )}
      </div>
    )
  }

  // Warning message
  if (msg.role === 'warning') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '85%', alignSelf: 'flex-start' }}>
        <div style={{ padding: '.75rem 1rem', borderRadius: '4px 12px 12px 12px', background: '#1a1200', border: '1px solid #f0a500', lineHeight: 1.6, fontSize: '.9rem' }}>
          <div style={{ color: '#f0a500', fontSize: '.8rem', fontFamily: 'monospace', marginBottom: '.4rem' }}>⚠ Heads up</div>
          <div style={{ marginBottom: '.8rem' }}>{msg.content}</div>
          {msg.chips && !msg.chipsSelected && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.5rem' }}>
              {msg.chips.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    updateMsg(msg.id, { chipsSelected: opt })
                    addUserMsg(opt)
                    callbacks[msg.id]?.(opt)
                  }}
                  style={{
                    padding: '.45rem .9rem', borderRadius: 20, fontSize: '.78rem', fontFamily: 'monospace',
                    cursor: 'pointer', background: 'transparent', whiteSpace: 'nowrap',
                    border: '1px solid ' + (opt.startsWith('Yes') ? '#f0a500' : '#c0392b'),
                    color: opt.startsWith('Yes') ? '#f0a500' : '#e74c3c',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {msg.chipsSelected && (
            <div style={{ fontSize: '.7rem', fontFamily: 'monospace', color: '#555', marginTop: '.4rem' }}>✓ {msg.chipsSelected}</div>
          )}
        </div>
      </div>
    )
  }

  // Progress message
  if (msg.isProgress) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '85%', alignSelf: 'flex-start' }}>
        <div style={{ padding: '.75rem 1rem', borderRadius: '4px 12px 12px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', lineHeight: 1.6, fontSize: '.9rem' }}>
          <div style={{ marginBottom: '.5rem', color: '#7eb8f7', fontFamily: 'monospace', fontSize: '.78rem' }}>Generating your piece...</div>
          <div style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8,
            padding: '.8rem 1rem', fontFamily: 'monospace', fontSize: '.75rem',
            lineHeight: 1.8, maxHeight: 200, overflowY: 'auto',
          }}>
            {(msg.progressLines || []).map((line, i) => (
              <div key={i} style={{ color: line.color, marginBottom: 1 }}>{line.text}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Result message
  if (msg.isResult) {
    const score = msg.score || 0
    const scoreClass = score >= 90 ? 'green' : score >= 80 ? 'yellow' : 'red'
    const scoreStyles: Record<string, React.CSSProperties> = {
      green: { background: 'rgba(46,204,113,.12)', border: '1px solid rgba(46,204,113,.3)', color: '#2ecc71' },
      yellow: { background: 'rgba(240,165,0,.1)', border: '1px solid rgba(240,165,0,.3)', color: '#f0a500' },
      red: { background: 'rgba(192,57,43,.1)', border: '1px solid rgba(192,57,43,.3)', color: '#e74c3c' },
    }
    const paragraphs = msg.content.split(/\n\n+/)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '100%', width: '100%', alignSelf: 'flex-start' }}>
        <div style={{ padding: '.75rem 1rem', borderRadius: '4px 12px 12px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', lineHeight: 1.6, fontSize: '.9rem', maxWidth: '100%' }}>
          <div style={{ fontSize: '.72rem', fontFamily: 'monospace', color: '#555', marginBottom: '.8rem' }}>
            Here is your finished piece{' '}
            <span style={{ display: 'inline-block', padding: '.2rem .6rem', borderRadius: 10, fontFamily: 'monospace', fontSize: '.72rem', marginLeft: '.5rem', ...scoreStyles[scoreClass] }}>
              {score}% human
            </span>
          </div>
          <div style={{
            background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: '1.2rem 1.4rem', fontSize: '.92rem', lineHeight: 1.85,
            whiteSpace: 'pre-wrap', fontFamily: "'Georgia', serif", color: '#d8d4cc',
          }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: '1rem' }}>{p}</p>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.8rem' }}>
            <button onClick={doRewrite} style={{ padding: '.55rem 1.2rem', borderRadius: 6, fontFamily: 'monospace', fontSize: '.78rem', cursor: 'pointer', letterSpacing: '.04em', background: 'transparent', border: '1px solid #555', color: '#888' }}>
              ↺ Rewrite
            </button>
            <button onClick={() => doCopy(msg.id)} style={{ padding: '.55rem 1.2rem', borderRadius: 6, fontFamily: 'monospace', fontSize: '.78rem', cursor: 'pointer', letterSpacing: '.04em', background: copiedId === msg.id ? 'rgba(46,204,113,.15)' : 'transparent', border: '1px solid #2ecc71', color: '#2ecc71' }}>
              {copiedId === msg.id ? '✓ Copied' : '⎘ Copy'}
            </button>
            <button style={{ padding: '.55rem 1.2rem', borderRadius: 6, fontFamily: 'monospace', fontSize: '.78rem', letterSpacing: '.04em', background: 'transparent', border: '1px solid #333', color: '#444', cursor: 'not-allowed' }}>
              ⬇ Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  // AI message (default — with optional chips or freetext)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxWidth: '85%', alignSelf: 'flex-start' }}>
      <div style={{ padding: '.75rem 1rem', borderRadius: '4px 12px 12px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e0dbd0', lineHeight: 1.6, fontSize: '.9rem' }}>
        {/* Plain text content */}
        {msg.content && <div>{msg.content}</div>}

        {/* Chips question */}
        {msg.chips && (
          <>
            {msg.chips.question && <div style={{ marginBottom: '.5rem', color: '#c8c4bc' }}>{msg.chips.question}</div>}
            {!msg.chipsSelected ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.5rem' }}>
                {msg.chips.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      updateMsg(msg.id, { chipsSelected: opt })
                      addUserMsg(opt)
                      callbacks[msg.id]?.(opt)
                    }}
                    style={{
                      padding: '.45rem .9rem', border: '1px solid #333', borderRadius: 20,
                      fontSize: '.78rem', fontFamily: 'monospace', cursor: 'pointer',
                      color: '#888', background: 'transparent', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2ecc71'; e.currentTarget.style.color = '#2ecc71' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '.7rem', fontFamily: 'monospace', color: '#555', marginTop: '.4rem' }}>✓ {msg.chipsSelected}</div>
            )}
          </>
        )}

        {/* Freetext question */}
        {msg.freetext && (
          <>
            <div style={{ marginBottom: '.5rem', color: '#c8c4bc' }}>{msg.freetext.question}</div>
            {!msg.freetextSubmitted ? (
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                <input
                  ref={ftRef}
                  type="text"
                  defaultValue=""
                  placeholder={msg.freetext.placeholder}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (!val) return
                      updateMsg(msg.id, { freetextSubmitted: true, freetextValue: val })
                      addUserMsg(val)
                      callbacks[msg.id]?.(val)
                      scrollBottom()
                    }
                  }}
                  style={{
                    flex: 1, background: '#111', border: '1px solid #2a2a2a', color: '#e0dbd0',
                    padding: '.5rem .8rem', borderRadius: 8, fontSize: '.85rem',
                    fontFamily: 'monospace', outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    const val = ftRef.current?.value.trim()
                    if (!val) return
                    updateMsg(msg.id, { freetextSubmitted: true, freetextValue: val })
                    addUserMsg(val)
                    callbacks[msg.id]?.(val)
                    scrollBottom()
                  }}
                  style={{
                    padding: '.5rem .9rem', background: '#1e3a2f', border: '1px solid #2ecc71',
                    color: '#2ecc71', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'monospace', fontSize: '.78rem',
                  }}
                >
                  OK
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '.7rem', fontFamily: 'monospace', color: '#555', marginTop: '.4rem' }}>✓ {msg.freetextValue}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
