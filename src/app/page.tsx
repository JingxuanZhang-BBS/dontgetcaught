'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import TextPressure from '@/components/TextPressure'
import GridDevTools from '@/components/GridDevTools'

const SUGGESTIONS = [
  'Write a 700-word essay on climate change...',
  'Draft a cover letter for a software engineering role...',
  'Summarize my research paper on behavioral economics...',
  "Write 500 words on Jaylen Brunson's rookie season...",
]

export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt]         = useState('')
  const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SUGGESTIONS.length
      setPlaceholder(SUGGESTIONS[i])
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (prompt.trim()) sessionStorage.setItem('pending_prompt', prompt.trim())
    router.push('/signup')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-white flex flex-col" style={{ background: '#0d0d0d' }}>

      {/* ── Grid background — with dev tools ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GridDevTools defaults={{
          linesColor: '#2c2c2c',
          scanColor: '#ffffff',
          scanOpacity: 0.38,
          gridScale: 0.09,
          lineThickness: 1.2,
          bloomIntensity: 0.55,
          chromaticAberration: 0.0025,
          noiseIntensity: 0.009,
          scanDuration: 3.5,
          scanDelay: 2.5,
        }} />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-7xl px-6 py-5 flex justify-between items-center">
          <div className="text-xs font-medium tracking-[0.25em] uppercase text-white/40">
            DontGetCaught.AI
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white/55 hover:text-white transition rounded-lg border border-white/12 hover:border-white/25"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-white/90 transition rounded-lg shadow-lg shadow-white/5"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center">
        <div className="shrink-0 h-14" />

        {/* TextPressure — white on black, dominant */}
        <div className="w-full" style={{ height: '52vh' }}>
          <TextPressure
            text="Dontgetcaught"
            textColor="#ffffff"
            fontFamily="Compressa VF"
            fontUrl="https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2"
            width
            weight
            italic
            flex
            alpha={false}
            stroke={false}
            scale={false}
            minFontSize={36}
          />
        </div>

        {/* ── Input area ── */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-10 px-4 w-full max-w-3xl mx-auto gap-5">

          <p className="text-base text-white/70 tracking-wide text-center whitespace-nowrap">
            Generate natural, human-sounding writing from any prompt or assignment.
          </p>

          {/* ChatGPT-style input */}
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-2xl border border-white/20 bg-[#181818] hover:border-white/30 focus-within:border-white/40 transition-colors shadow-2xl shadow-black/80"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.8)' }}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full bg-transparent text-white/85 text-sm placeholder-white/28 outline-none resize-none leading-relaxed px-5 pt-4 pb-2"
              style={{ minHeight: '52px', maxHeight: '160px' }}
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span className="text-[11px] text-white/22">
                Enter to generate · Shift+Enter for new line
              </span>
              <button
                type="submit"
                disabled={!prompt.trim()}
                aria-label="Generate"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                style={{
                  background: prompt.trim() ? '#ffffff' : 'transparent',
                  border: prompt.trim() ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke={prompt.trim() ? '#000' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </form>

          <p className="text-xs text-white/28">
            <Link href="/signup" className="text-white/50 underline underline-offset-2 hover:text-white/80 transition">
              Create an account
            </Link>
            {' '}to save your generations
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-[11px] text-white/15 tracking-wider">
          &copy; 2026 DontGetCaught.AI
        </p>
      </footer>
    </div>
  )
}
