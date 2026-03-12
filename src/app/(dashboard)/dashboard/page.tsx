'use client'

import { useState, useRef, useEffect } from 'react'

const WRITING_TYPES = [
  { value: 'essay', label: 'Essay' },
  { value: 'research_paper', label: 'Research Paper' },
  { value: 'email', label: 'Email' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'creative', label: 'Creative Writing' },
  { value: 'other', label: 'Other' },
]

const WORD_COUNTS = [
  { value: 250, label: '250 words', credits: 1 },
  { value: 500, label: '500 words', credits: 2 },
  { value: 700, label: '700 words', credits: 2 },
  { value: 1000, label: '1,000 words', credits: 3 },
  { value: 1500, label: '1,500 words', credits: 4 },
  { value: 2000, label: '2,000 words', credits: 5 },
]

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState('')
  const [writingType, setWritingType] = useState('essay')
  const [wordCount, setWordCount] = useState(700)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Pre-fill prompt from landing page if present
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_prompt')
    if (pending) {
      setPrompt(pending)
      sessionStorage.removeItem('pending_prompt')
    }
  }, [])

  const selectedWordCount = WORD_COUNTS.find(w => w.value === wordCount)!

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const name = f.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Only PDF or DOCX files are supported.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }
    setFile(f)
    setError('')
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    if (!prompt.trim() && !file) {
      setError('Please enter a prompt or upload a file.')
      return
    }
    setError('')
    setLoading(true)
    setOutput('')

    try {
      const formData = new FormData()
      formData.append('prompt', prompt.trim())
      formData.append('writingType', writingType)
      formData.append('wordCount', String(wordCount))
      if (file) formData.append('file', file)

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setOutput(data.generated_text)

      // Scroll to output
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dontgetcaught-${writingType}-${wordCount}w.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-slate-700 mb-1">What do you need to write?</h1>
          <p className="text-sm text-slate-400">Describe your topic, paste assignment instructions, or upload a rubric.</p>
        </div>

        {/* Input card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm shadow-slate-200/50 p-6 mb-4">

          {/* Prompt textarea */}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Write about Jaylen Brunson's rookie season, focusing on his scoring ability and leadership..."
            rows={5}
            className="w-full text-sm text-slate-700 placeholder-slate-300 bg-transparent outline-none resize-none leading-relaxed"
          />

          {/* Divider */}
          <div className="border-t border-slate-100 my-4" />

          {/* File upload row */}
          <div className="flex items-center gap-3 mb-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="max-w-[160px] truncate">{file.name}</span>
                <button onClick={handleRemoveFile} className="ml-1 text-slate-400 hover:text-slate-600 transition">✕</button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach assignment / rubric
              </button>
            )}
          </div>

          {/* Writing type + word count + button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Writing type */}
            <select
              value={writingType}
              onChange={e => setWritingType(e.target.value)}
              className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-slate-300 transition cursor-pointer"
            >
              {WRITING_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {/* Word count */}
            <select
              value={wordCount}
              onChange={e => setWordCount(Number(e.target.value))}
              className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-slate-300 transition cursor-pointer"
            >
              {WORD_COUNTS.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium transition shadow-sm disabled:cursor-not-allowed"
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
                  <span className="text-xs text-white/60">· {selectedWordCount.credits} cr</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div ref={outputRef} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm shadow-slate-200/50 p-6">
            {/* Output header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Output</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-800 transition"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-800 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {/* Generated text */}
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
