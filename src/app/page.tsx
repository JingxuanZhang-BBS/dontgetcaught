'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DM_Sans } from 'next/font/google'
import BorderGlow from '@/components/BorderGlow'
import TextType from '@/components/TextType'
import FuzzyText from '@/components/FuzzyText'

const Prism = dynamic(() => import('@/components/Prism'), { ssr: false })
const DotGrid = dynamic(() => import('@/components/DotGrid'), { ssr: false })


const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const SUGGESTIONS = [
  'Write a 700-word essay on climate change...',
  'Draft a cover letter for a software engineering role...',
  'Summarize my research paper on behavioral economics...',
  'Rewrite this paragraph to sound more like me...',
]

export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt]           = useState('')
  const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0])
  const [introPhase, setIntroPhase]   = useState<'typing1' | 'pause' | 'typing2' | 'done'>('typing1')
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Dev panel
  const [showPanel, setShowPanel] = useState(false)

  // DotGrid controls
  const [dotSize, setDotSize]                 = useState(5)
  const [dotGap, setDotGap]                   = useState(15)
  const [dotProximity, setDotProximity]       = useState(120)
  const [dotShockR, setDotShockR]             = useState(250)
  const [dotShockS, setDotShockS]             = useState(5)
  const [dotResistance, setDotResistance]     = useState(750)
  const [dotReturnDur, setDotReturnDur]       = useState(1.5)

  // Placeholder cycling
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SUGGESTIONS.length
      setPlaceholder(SUGGESTIONS[i])
    }, 3500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight
      const y = window.scrollY
      setOverlayOpacity(Math.max(0, 1 - y / (vh * 0.8)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase('pause'), 5500)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (introPhase !== 'pause') return
    const t = setTimeout(() => setIntroPhase('typing2'), 1200)
    return () => clearTimeout(t)
  }, [introPhase])

  useEffect(() => {
    if (introPhase !== 'typing2') return
    const t = setTimeout(() => setIntroPhase('done'), 5500)
    return () => clearTimeout(t)
  }, [introPhase])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
    if (isDevMode) {
      if (prompt.trim()) sessionStorage.setItem('pending_prompt', prompt.trim())
      window.location.href = '/demo.html'
    } else {
      if (prompt.trim()) sessionStorage.setItem('pending_prompt', prompt.trim())
      router.push('/signup')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const Slider = ({ label, val, setter, min, max, step }: {
    label: string; val: number; setter: (v: number) => void; min: number; max: number; step: number
  }) => (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[10px] text-white/40 font-mono">{label}</span>
        <span className="text-[10px] text-white/60 font-mono">{val.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => setter(parseFloat(e.target.value))}
        className="w-full h-[3px] accent-green-400 cursor-pointer"
      />
    </div>
  )

  return (
    <div className={`${dmSans.className} text-white`} style={{ background: '#050505' }}>

      {/* ── Fixed backgrounds: Prism (base) + DotGrid (interactive overlay) ── */}
      <div className="fixed inset-0 z-0">
        <Prism
          animationType="rotate" transparent
          glow={1} noise={0} scale={3.6} hueShift={0}
          colorFrequency={1} timeScale={0.5} bloom={1}
          height={3.5} baseWidth={5.5}
        />
      </div>
      <div className="fixed inset-0 z-[1]">
        <DotGrid
          dotSize={dotSize} gap={dotGap} proximity={dotProximity}
          shockRadius={dotShockR} shockStrength={dotShockS}
          resistance={dotResistance} returnDuration={dotReturnDur}
          baseColor="#271E37" activeColor="#5227FF" style={undefined}
        />
      </div>

      {/* ── Black overlay ── */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{ background: '#050505', opacity: overlayOpacity, transition: 'opacity 0.05s linear' }}
      />

      {/* ── Dev panel ── */}
      <button
        onClick={() => setShowPanel(v => !v)}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono text-white/50 hover:text-white/90 transition border border-white/10 hover:border-white/25"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}
      >
        dotgrid
      </button>

      {showPanel && (
        <div
          className="fixed bottom-14 right-4 z-[9999] w-[280px] rounded-xl border border-white/10 p-4 flex flex-col gap-2.5 max-h-[80vh] overflow-y-auto"
          style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}
        >
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">DotGrid Controls</span>
          <Slider label="Dot Size"       val={dotSize}        setter={setDotSize}        min={2}   max={20}   step={1}   />
          <Slider label="Gap"            val={dotGap}         setter={setDotGap}         min={4}   max={60}   step={1}   />
          <Slider label="Proximity"      val={dotProximity}   setter={setDotProximity}   min={30}  max={400}  step={5}   />
          <Slider label="Shock Radius"   val={dotShockR}      setter={setDotShockR}      min={50}  max={600}  step={10}  />
          <Slider label="Shock Strength" val={dotShockS}      setter={setDotShockS}      min={1}   max={30}   step={0.5} />
          <Slider label="Resistance"     val={dotResistance}  setter={setDotResistance}  min={100} max={2000} step={50}  />
          <Slider label="Return Dur"     val={dotReturnDur}   setter={setDotReturnDur}   min={0.1} max={5}    step={0.1} />
        </div>
      )}

      {/* ═══ SECTION 1 — Intro typing ═══ */}
      <section className="h-screen flex flex-col items-center justify-center px-6 relative z-10">
        <div className="max-w-4xl w-full text-center">
          {(introPhase === 'typing1' || introPhase === 'pause') && (
            <div className="transition-opacity duration-700" style={{ opacity: introPhase === 'pause' ? 0 : 1 }}>
              <TextType
                text={["Tired of your AI-written essays always getting flagged?"]}
                className="text-3xl md:text-[42px] font-medium tracking-[-0.02em] leading-snug text-white/90"
                typingSpeed={80} showCursor cursorCharacter="_" cursorBlinkDuration={0.6} loop={false}
              />
            </div>
          )}
          {(introPhase === 'typing2' || introPhase === 'done') && (
            <TextType
              text={["We generate writing that sounds like you — not a machine."]}
              className="text-2xl md:text-[36px] font-normal tracking-[-0.01em] leading-snug text-white/80"
              typingSpeed={70} showCursor cursorCharacter="_" cursorBlinkDuration={0.6} loop={false}
            />
          )}
        </div>
        {introPhase === 'done' && (
          <div className="absolute bottom-10 animate-bounce">
            <svg className="w-6 h-6 text-white/25" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </section>

      {/* ═══ SECTION 2 — Hero ═══ */}
      <section className="min-h-screen relative z-10 flex flex-col">

        {/* Header */}
        <header className="shrink-0">
          <nav className="mx-auto max-w-7xl px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-semibold tracking-tight text-white">DontGetCaught</span>
              <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-full border border-white/20 text-white/50">beta</span>
            </div>
            <button
              onClick={() => {
                const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
                if (isDevMode) { document.cookie = 'dev_logged_in=true; path=/; max-age=86400'; router.push('/dashboard') }
                else router.push('/signup')
              }}
              className="px-5 py-2 text-sm font-medium text-black bg-white hover:bg-white/90 transition rounded-full"
            >Try now</button>
          </nav>
        </header>

        {/* Hero content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="mt-20 mb-8 flex justify-center">
            <FuzzyText
              fontSize="clamp(64px, 12vw, 140px)"
              fontWeight={900}
              color="#ffffff"
              baseIntensity={0}
              hoverIntensity={0.45}
              enableHover
              fuzzRange={30}
              direction="horizontal"
            >
              DontGetCaught
            </FuzzyText>
          </div>

          <p className="text-lg md:text-xl text-white/60 text-center max-w-2xl leading-relaxed font-normal mb-14">
            AI-powered writing that reads like yours — undetectable, natural, and tailored to your voice.
          </p>
        </div>

        {/* Input box */}
        <div className="shrink-0 w-full flex flex-col items-center px-4 pb-10">
          <BorderGlow
            edgeSensitivity={25} glowColor="260 70 70" backgroundColor="rgba(18, 18, 26, 0.75)"
            borderRadius={32} glowRadius={50} glowIntensity={0.8} coneSpread={30} animated={false}
            colors={['#7c4dff', '#a855f7', '#6366f1']} fillOpacity={0.3} className="w-full max-w-3xl"
          >
            <form onSubmit={handleSubmit} style={{ backdropFilter: 'blur(24px)' }}>
              <textarea
                ref={textareaRef} value={prompt} onChange={handleChange} onKeyDown={handleKeyDown}
                placeholder={placeholder} rows={2}
                className="w-full bg-transparent text-white/90 text-[15px] placeholder-white/25 outline-none resize-none leading-relaxed px-6 pt-6 pb-3"
                style={{ minHeight: '80px', maxHeight: '200px' }}
              />
              <div className="flex items-center justify-between px-5 pb-5 pt-1">
                <span className="text-[11px] text-white/20 font-medium">Enter to generate · Shift+Enter for new line</span>
                <button type="submit" disabled={!prompt.trim()} aria-label="Generate"
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{ background: prompt.trim() ? '#ffffff' : 'transparent', border: prompt.trim() ? 'none' : '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg className="w-[18px] h-[18px]" fill="none"
                    stroke={prompt.trim() ? '#000' : 'rgba(255,255,255,0.3)'} strokeWidth="2.2" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>
          </BorderGlow>

          <p className="mt-3 text-xs text-white/20 font-medium">
            <button
              onClick={() => {
                const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
                if (isDevMode) { document.cookie = 'dev_logged_in=true; path=/; max-age=86400'; router.push('/dashboard') }
                else router.push('/signup')
              }}
              className="text-white/40 underline underline-offset-2 hover:text-white/65 transition"
            >Create an account</button>
            {' '}to save your generations
          </p>
        </div>
      </section>
    </div>
  )
}
