'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import TextPressure from '@/components/TextPressure'

export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      // Save prompt so the workspace can pre-fill it after auth
      sessionStorage.setItem('pending_prompt', prompt.trim())
    }
    router.push('/signup')
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(160deg, #e8eaf0 0%, #e0e4ec 30%, #dbd8e8 65%, #d4d9e4 100%)' }}>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-7xl px-6 py-5 flex justify-between items-center">
          <div className="text-xs font-medium tracking-widest uppercase text-slate-500/70">
            DontGetCaught.AI
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600/80 hover:text-slate-800 transition rounded-full border border-slate-300/60 hover:border-slate-400/60 bg-white/30 backdrop-blur-sm"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition rounded-full shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative h-screen flex flex-col items-center">
        {/* Nav spacer */}
        <div className="shrink-0 h-14" />

        {/* ── Title — UNTOUCHED ── */}
        <div className="w-full" style={{ height: '55vh' }}>
          <TextPressure
            text="Dontgetcaught"
            textColor="#2b0f3a"
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

        {/* ── Tagline + Input ── */}
        <div className="flex-1 flex flex-col items-center justify-end gap-5 pb-14 px-4 w-full">
          <p className="text-sm md:text-base text-slate-500 tracking-wide text-center">
            Generate natural, human-sounding writing from any prompt or assignment.
          </p>

          {/* Prompt input */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl flex items-center gap-0 bg-white/80 backdrop-blur-md rounded-full border border-slate-200/80 shadow-sm shadow-slate-300/30 hover:shadow-md hover:shadow-slate-300/40 transition-shadow overflow-hidden"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Start chatting right now..."
              className="flex-1 px-6 py-4 text-sm text-slate-700 bg-transparent outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              className="mr-2 flex items-center justify-center w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-800 transition text-white shrink-0"
              aria-label="Submit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <p className="text-xs text-slate-400">
            <Link href="/signup" className="underline underline-offset-2 hover:text-slate-600 transition">
              Create a free account
            </Link>
            {' '}to get started
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 text-center">
        <p className="text-xs text-slate-400/60 tracking-wider">
          &copy; 2026 DontGetCaught.AI
        </p>
      </footer>
    </div>
  )
}
