'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import TextPressure from '@/components/TextPressure'

const Grainient = dynamic(() => import('@/components/Grainient'), { ssr: false })

export default function LandingPage() {
  const featuresRef = useRef<HTMLElement>(null)

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="cursor-magnify min-h-screen overflow-x-hidden">
      {/* ── Animated Grainient Background ── */}
      <div className="fixed inset-0 -z-10">
        <Grainient
          color1="#3898c2"
          color2="#a791fd"
          color3="#dfcece"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-7xl px-6 py-5 flex justify-between items-center">
          <div className="text-sm font-semibold tracking-widest uppercase text-[#2D1B4E]/60">
            DontGetCaught.AI
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium text-[#2D1B4E]/70 hover:text-[#2D1B4E] transition rounded-full border border-[#2D1B4E]/15 hover:border-[#2D1B4E]/30 bg-white/40 backdrop-blur-sm"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 text-sm font-medium text-white bg-[#2D1B4E] hover:bg-[#3d2a5c] transition rounded-full shadow-md shadow-purple-900/10"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative h-screen flex flex-col items-center">
        {/* Small spacer for fixed nav */}
        <div className="shrink-0 h-14" />

        {/* Title - dominant visual, scale fills the 55vh container */}
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

        {/* Subtitle + Button - pushed toward bottom of remaining space */}
        <div className="flex-1 flex flex-col items-center justify-end gap-4 pb-16">
          <p className="text-base md:text-lg text-[#2b0f3a]/65 max-w-lg text-center leading-relaxed tracking-wide">
            Trained on your writing. Generated in your voice.<br />
            <span className="font-semibold text-[#2b0f3a]/80">Zero AI detected. Zero extra effort.</span>
          </p>

          {/* White capsule TRY NOW button */}
          <Link
            href="/login"
            className="px-10 py-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2b0f3a] bg-white hover:bg-white/90 rounded-full transition-all shadow-lg shadow-[#2b0f3a]/10 hover:shadow-xl hover:scale-[1.02] border border-white/80"
          >
            Try Now
          </Link>
        </div>

        {/* Down arrow scroll hint */}
        <button
          onClick={scrollToFeatures}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#2b0f3a]/25 hover:text-[#2b0f3a]/50 transition"
        >
          <svg
            className="w-6 h-6 animate-bounce-slow"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* ── How It Works ── */}
      <section ref={featuresRef} className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs tracking-[0.4em] uppercase text-[#2D1B4E]/40 font-medium mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#2D1B4E] mb-20">
            Three simple steps to your voice
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Upload Samples',
                desc: 'Upload 3-5 of your English documents. We need about 2,000-6,000 words to learn your unique style.',
              },
              {
                step: '02',
                title: 'We Learn Your Style',
                desc: 'Our AI analyzes your sentence rhythm, word choice, punctuation habits, and the natural imperfections that make writing yours.',
              },
              {
                step: '03',
                title: 'Generate & Export',
                desc: 'Give us a topic or prompt. We generate content in your style. Revise with natural language, then export to Word.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative p-8 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 hover:bg-white/60 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300"
              >
                <div className="text-5xl font-black text-[#2D1B4E]/10 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#2D1B4E] mb-3">
                  {item.title}
                </h3>
                <p className="text-base text-[#2D1B4E]/65 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2D1B4E] mb-4">
          Ready to write like yourself?
        </h2>
        <p className="text-base text-[#2D1B4E]/60 mb-8">
          Upload your samples and start generating in minutes.
        </p>
        <Link
          href="/signup"
          className="inline-block px-10 py-4 text-sm font-bold tracking-[0.2em] uppercase text-white bg-[#2D1B4E] hover:bg-[#3d2a5c] rounded-full transition shadow-lg shadow-purple-900/15 hover:shadow-xl"
        >
          Get Started Free
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 text-center">
        <p className="text-xs text-[#2D1B4E]/25 tracking-wider">
          &copy; 2026 DontGetCaught.AI &mdash; All rights reserved.
        </p>
      </footer>
    </div>
  )
}
