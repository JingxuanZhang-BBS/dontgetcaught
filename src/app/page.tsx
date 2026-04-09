'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DM_Sans } from 'next/font/google'
import BorderGlow from '@/components/BorderGlow'
import TextType from '@/components/TextType'
import FuzzyText from '@/components/FuzzyText'
import CurvedLoop from '@/components/CurvedLoop'
import CardSwap from '@/components/CardSwap'
import LogoLoop from '@/components/LogoLoop'
import {
  SiAnthropic, SiNextdotjs, SiTypescript, SiVercel,
  SiSupabase, SiReact, SiGithub, SiGooglegemini,
} from 'react-icons/si'

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

// ── Logo items for tech stack loop ──────────────────────────────────────
const C = 'rgba(255,255,255,0.65)'
const logoNode = (icon: React.ReactNode, label: string) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
    {icon}{label}
  </span>
)
const textLogo = (label: string, acronym: string) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C, letterSpacing: '-0.01em' }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C, background: 'rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 6px', letterSpacing: '0.04em' }}>{acronym}</span>
    {label}
  </span>
)

const LOGO_ITEMS = [
  { key: 'claude',    node: logoNode(<SiAnthropic size={18} />, 'Claude') },
  { key: 'gemini',    node: logoNode(<SiGooglegemini size={18} />, 'Gemini') },
  { key: 'gptzero',   node: logoNode(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={C} strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" fill={C}/>
      </svg>, 'GPTZero') },
  { key: 'zerogpt',   node: textLogo('ZeroGPT', 'Z') },
  { key: 'turnitin',  node: textLogo('Turnitin', 'TN') },
  { key: 'quillbot',  node: textLogo('Quillbot', 'QB') },
  { key: 'github',    node: logoNode(<SiGithub size={18} />, 'GitHub') },
  { key: 'vscode',    node: textLogo('VS Code', 'VS') },
  { key: 'nextjs',    node: logoNode(<SiNextdotjs size={18} />, 'Next.js') },
  { key: 'typescript',node: logoNode(<SiTypescript size={18} />, 'TypeScript') },
  { key: 'supabase',  node: logoNode(<SiSupabase size={18} />, 'Supabase') },
  { key: 'vercel',    node: logoNode(<SiVercel size={18} />, 'Vercel') },
  { key: 'react',     node: logoNode(<SiReact size={18} />, 'React') },
]

// ── How It Works step data ────────────────────────────────────────────────
const STEPS = [
  {
    num: '01', title: 'Draft', tag: 'Generation',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    body: 'Your prompt is analyzed for type, tone, and intent. A first draft is generated under precise constraints designed to minimize detectable AI patterns from the start.',
  },
  {
    num: '02', title: 'Scan', tag: 'Detection',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
        <path strokeLinecap="round" d="M8 11h6M11 8v6"/>
      </svg>
    ),
    body: 'The draft runs through GPTZero sentence by sentence. Each segment receives an AI-probability score; anything above threshold is flagged for targeted rewriting.',
  },
  {
    num: '03', title: 'Humanize', tag: 'Rewriting',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    body: 'Flagged segments are individually rewritten to shift detection patterns while preserving meaning, argument, and flow. This loop runs up to three rounds until the score clears 85%.',
  },
  {
    num: '04', title: 'Polish', tag: 'Quality check',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    body: 'A final pass reviews the full piece for cohesion — smoothing transitions, tightening logic, and confirming the human score before the result is delivered.',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [prompt, setPrompt]           = useState('')
  const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0])
  const [introPhase, setIntroPhase]   = useState<'typing1' | 'pause' | 'typing2' | 'done'>('typing1')
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // DotGrid fixed params
  const dotSize = 3
  const dotGap = 15
  const dotProximity = 120
  const dotShockR = 250
  const dotShockS = 5
  const dotResistance = 750
  const dotReturnDur = 1.5

  // Placeholder cycling
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SUGGESTIONS.length
      setPlaceholder(SUGGESTIONS[i])
    }, 3500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const target = sessionStorage.getItem('scroll_to')
    if (target) {
      sessionStorage.removeItem('scroll_to')
      setTimeout(() => {
        const el = document.getElementById(target)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 600)
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

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

  return (
    <div className={`${dmSans.className} text-white`} style={{ background: '#050505', overflowX: 'hidden', maxWidth: '100vw' }}>

      {/* ── Fixed backgrounds ── */}
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


      {/* ═══ SECTION 1 — Intro typing ═══ */}
      <section id="home" className="h-screen flex flex-col items-center justify-center px-6 relative z-10">
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
              onClick={handleSubmit}
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
            <button onClick={handleSubmit} className="text-white/40 underline underline-offset-2 hover:text-white/65 transition">
              Create an account
            </button>
            {' '}to save your generations
          </p>
        </div>
        {/* Fade hero bottom → dark — matches sections below */}
        <div
          className="absolute bottom-0 inset-x-0 pointer-events-none"
          style={{ height: 180, background: 'linear-gradient(to bottom, transparent 0%, #08080f 100%)', zIndex: 0 }}
        />
      </section>

      {/* ═══ Straight marquee strip ═══ */}
      <div className="relative z-10 overflow-hidden" style={{ background: '#08080f' }}>
        <CurvedLoop
          marqueeText="Writes Like You, Not a Machine ✦ Real Humanizer ✦ 85%+ Human Score ✦ Your Voice, Perfected ✦ Zero Detection ✦ "
          speed={2}
          curveAmount={0}
          direction="left"
          fontSize="1.35rem"
          className="text-white/50"
        />
      </div>

      {/* ═══ SECTION 4 — How It Works ═══ */}
      <section
        id="how-it-works"
        className="relative z-10 overflow-hidden"
        style={{ background: '#08080f', minHeight: '100vh' }}
      >
        {/* Left text — vertically centered */}
        <div
          className="absolute z-10 flex flex-col justify-center"
          style={{ left: '6%', top: 0, bottom: 0, width: 'clamp(240px, 28vw, 400px)' }}
        >
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase mb-5"
            style={{ color: 'rgba(255,255,255,0.3)' }}>How It Works</p>
          <h2 className="font-bold leading-[1.1] mb-6"
            style={{ fontSize: 'clamp(26px, 3.2vw, 44px)', color: '#fff' }}>
            Four phases.<br />Every generation.
          </h2>
          <p className="text-[14px] leading-relaxed mb-8"
            style={{ color: 'rgba(255,255,255,0.38)' }}>
            Each piece goes through a full pipeline — draft, detect, rewrite, polish — before you see it.
          </p>

          {/* Stat + beta callout */}
          <div className="flex flex-col gap-3 mb-10">
            {/* <15% badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <span className="text-[24px] font-black leading-none tracking-tight" style={{ color: '#fff' }}>&lt;15%</span>
              <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <span className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>
                AI rate on GPTZero.<br />Consistently.
              </span>
            </div>
            {/* Beta offer */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: '#4ade80' }} />
              <span className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Beta — 3 free generations/month.<br />No card required.
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="self-start px-6 py-2.5 text-[13px] font-semibold rounded-full transition"
            style={{ background: '#fff', color: '#000' }}
          >
            Try it free
          </button>
        </div>

        {/* CardSwap — anchored bottom-right */}
        <div
          className="absolute"
          style={{ right: '2%', bottom: '2%', zIndex: 5 }}
        >
          <CardSwap
            width={660} height={560}
            delay={4800}
            cardDistance={96}
            verticalDistance={28}
            skewAmount={4}
            easing="elastic"
          >
            {STEPS.map(step => (
              <div
                key={step.num}
                className="w-full h-full flex flex-col relative overflow-hidden"
              >
                {/* ── Image placeholder (top ~42%) ── */}
                <div
                  className="shrink-0 relative flex items-center justify-center"
                  style={{
                    height: '42%',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Placeholder icon + label */}
                  <div className="flex flex-col items-center gap-2 select-none">
                    <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
                    </svg>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                      IMAGE PLACEHOLDER
                    </span>
                  </div>
                  {/* Tag badge — top right */}
                  <div
                    className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{step.icon}</span>
                    {step.tag}
                  </div>
                </div>

                {/* ── Text content (bottom ~58%) ── */}
                <div className="flex-1 flex flex-col justify-center" style={{ padding: '28px 36px' }}>
                  <span className="block text-[11px] font-mono mb-2"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>{step.num}</span>
                  <h4 className="font-bold leading-tight mb-3"
                    style={{ fontSize: 'clamp(26px, 2.6vw, 34px)', color: '#ffffff' }}>
                    {step.title}
                  </h4>
                  <p className="text-[13.5px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.58)' }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </CardSwap>
        </div>

        {/* Fade card overflow → section bottom seamlessly */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ height: 120, background: 'linear-gradient(to bottom, transparent, #08080f)', zIndex: 20 }} />

      </section>

      {/* ═══ SECTION 5 — Founders ═══ */}
      <section className="relative z-10 px-6 py-20" style={{ background: '#0a0a12', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>About us</p>
          <p className="text-[clamp(18px,2.5vw,26px)] font-semibold mb-12 tracking-tight" style={{ color: '#fff' }}>
            Two freshmen. One problem worth solving.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Founder A', role: 'Co-founder', initials: 'FA' },
              { name: 'Founder B', role: 'Co-founder', initials: 'FB' },
            ].map(f => (
              <div key={f.name} className="rounded-2xl p-6 flex flex-col gap-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {f.initials}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: '#fff' }}>{f.name}</p>
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.role} · DontGetCaught.AI</p>
                  </div>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-2">
                  {/* Instagram */}
                  <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                  {/* TikTok */}
                  <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                    </svg>
                    TikTok
                  </a>
                  {/* Douyin */}
                  <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}>抖音</span>
                    Douyin
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — Tech Stack (LogoLoop) ═══ */}
      <section className="relative z-10 px-6 py-20" style={{ background: '#0c0c16', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto mb-10">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Built with</p>
          <p className="text-[clamp(20px,3vw,28px)] font-semibold tracking-tight" style={{ color: '#fff' }}>
            Best-in-class tools, end to end.
          </p>
        </div>
        <LogoLoop
          items={LOGO_ITEMS}
          speed={0.6}
          gap={56}
          logoHeight={28}
          fade
          scaleHover
          fadeColor="#0c0c16"
        />
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-8 px-6" style={{ background: '#0c0c16', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>DontGetCaught.AI</span>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.18)' }}>Free beta · Built by two freshmen</span>
        </div>
      </footer>

    </div>
  )
}
