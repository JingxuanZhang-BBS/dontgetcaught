'use client'

import { useState, useRef, useEffect } from 'react'
import { getCredits, deductCredits, creditCost } from '@/lib/credits'

const WRITING_TYPES = [
  { value: 'essay',         label: 'Essay' },
  { value: 'research_paper', label: 'Research Paper' },
  { value: 'email',         label: 'Email' },
  { value: 'cover_letter',  label: 'Cover Letter' },
  { value: 'blog_post',     label: 'Blog Post' },
  { value: 'creative',      label: 'Creative Writing' },
  { value: 'other',         label: 'Other' },
]

const WORD_PRESETS = [250, 500, 700, 1000, 1500, 2000]

export default function WorkspacePage() {
  const [prompt, setPrompt]           = useState('')
  const [writingType, setWritingType] = useState('essay')
  const [wordCount, setWordCount]     = useState(700)
  const [customMode, setCustomMode]   = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [loading, setLoading]         = useState(false)
  const [output, setOutput]           = useState('')
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)
  const [credits, setCredits]         = useState(50)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const outputRef    = useRef<HTMLDivElement>(null)
  const customRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCredits(getCredits())
    const pending = sessionStorage.getItem('pending_prompt')
    if (pending) { setPrompt(pending); sessionStorage.removeItem('pending_prompt') }
    const handler = () => setCredits(getCredits())
    window.addEventListener('credits-updated', handler)
    return () => window.removeEventListener('credits-updated', handler)
  }, [])

  // Resolve effective word count
  const effectiveWordCount = customMode
    ? (parseInt(customInput, 10) || 0)
    : wordCount
  const cost = creditCost(effectiveWordCount)
  const canGenerate = effectiveWordCount >= 50 && effectiveWordCount <= 5000

  const handleWordCountSelect = (val: number | 'custom') => {
    if (val === 'custom') {
      setCustomMode(true)
      setCustomInput(String(wordCount))
      setTimeout(() => customRef.current?.focus(), 50)
    } else {
      setCustomMode(false)
      setWordCount(val)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const name = f.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Only PDF or DOCX files are supported.')
      return
    }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return }
    setFile(f)
    setError('')
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    if (!prompt.trim() && !file) { setError('Please enter a prompt or upload a file.'); return }
    if (!canGenerate) { setError('Word count must be between 50 and 5,000.'); return }
    if (credits < cost) { setError(`Not enough credits. You need ${cost} but have ${credits}.`); return }

    setError('')
    setLoading(true)
    setOutput('')

    try {
      const formData = new FormData()
      formData.append('prompt', prompt.trim())
      formData.append('writingType', writingType)
      formData.append('wordCount', String(effectiveWordCount))
      if (file) formData.append('file', file)

      const res  = await fetch('/api/generate', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return }

      setOutput(data.generated_text)
      deductCredits(cost)
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `dontgetcaught-${writingType}-${effectiveWordCount}w.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white mb-1">What do you need to write?</h1>
          <p className="text-sm text-white/50">Describe your topic, paste assignment instructions, or upload a rubric.</p>
        </div>

        {/* Input card */}
        <div className="rounded-2xl border border-white/[0.12] p-6 mb-4" style={{ background: 'rgba(28,28,28,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>

          {/* Prompt textarea */}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Write about Jaylen Brunson's rookie season, focusing on his scoring ability and leadership..."
            rows={5}
            className="w-full text-sm text-white placeholder-white/30 bg-transparent outline-none resize-none leading-relaxed"
          />

          <div className="border-t border-white/[0.06] my-4" />

          {/* File upload */}
          <div className="flex items-center gap-3 mb-5">
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-white/50 bg-white/[0.04]">
                <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="max-w-[160px] truncate">{file.name}</span>
                <button onClick={handleRemoveFile} className="ml-1 text-white/30 hover:text-white/60 transition">✕</button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 text-xs text-white/40 hover:border-white/35 hover:text-white/60 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach assignment / rubric
              </button>
            )}
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Writing type */}
            <select
              value={writingType}
              onChange={e => setWritingType(e.target.value)}
              className="text-sm text-white/60 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 outline-none hover:border-white/20 transition cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              {WRITING_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Word count — presets + custom toggle */}
            {customMode ? (
              <div className="flex items-center gap-1 bg-white/[0.05] border border-white/15 rounded-lg px-3 py-2">
                <input
                  ref={customRef}
                  type="number"
                  min={50}
                  max={5000}
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-20 text-sm text-white/80 bg-transparent outline-none placeholder-white/25"
                  style={{ colorScheme: 'dark' }}
                />
                <span className="text-xs text-white/30">words</span>
                <button
                  onClick={() => setCustomMode(false)}
                  className="ml-2 text-white/25 hover:text-white/55 transition text-xs"
                >✕</button>
              </div>
            ) : (
              <select
                value={wordCount}
                onChange={e => {
                  const v = e.target.value
                  if (v === 'custom') { handleWordCountSelect('custom') }
                  else { handleWordCountSelect(Number(v)) }
                }}
                className="text-sm text-white/60 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 outline-none hover:border-white/20 transition cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                {WORD_PRESETS.map(n => (
                  <option key={n} value={n}>{n.toLocaleString()} words</option>
                ))}
                <option value="custom">Custom...</option>
              </select>
            )}

            <div className="flex-1" />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !canGenerate || credits < cost}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-black text-sm font-semibold transition shadow-sm disabled:cursor-not-allowed disabled:opacity-30 bg-white hover:bg-white/90"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <span className="text-xs text-black/40 font-normal">· {cost} cr</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/20 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)' }}>
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div ref={outputRef} className="rounded-2xl border border-white/[0.12] p-6" style={{ background: 'rgba(28,28,28,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-white/25 uppercase tracking-wider">Output</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:border-white/20 hover:text-white/70 transition"
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:border-white/20 hover:text-white/70 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
