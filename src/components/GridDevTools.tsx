'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'

const GridBackground = dynamic(() => import('./GridBackground'), { ssr: false })

export interface GridParams {
  linesColor: string
  scanColor: string
  scanOpacity: number
  gridScale: number
  lineThickness: number
  bloomIntensity: number
  chromaticAberration: number
  noiseIntensity: number
  scanDuration: number
  scanDelay: number
}

interface SliderProps {
  label: string
  param: keyof GridParams
  min: number
  max: number
  step: number
  value: number
  onChange: (key: keyof GridParams, val: number) => void
}

function Slider({ label, param, min, max, step, value, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-[110px] shrink-0 font-mono">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(param, parseFloat(e.target.value))}
        className="flex-1 h-[3px] accent-white cursor-pointer"
      />
      <span className="text-[10px] text-white/60 font-mono w-[52px] text-right shrink-0">
        {value.toString().includes('.') ? value.toFixed(value < 0.01 ? 5 : value < 1 ? 3 : 2) : value}
      </span>
    </div>
  )
}

export default function GridDevTools({ defaults }: { defaults: GridParams }) {
  const [params, setParams] = useState<GridParams>(defaults)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const set = (key: keyof GridParams, val: number | string) =>
    setParams(p => ({ ...p, [key]: val }))

  const copyCode = () => {
    const lines = [
      `linesColor="${params.linesColor}"`,
      `scanColor="${params.scanColor}"`,
      `scanOpacity={${params.scanOpacity}}`,
      `gridScale={${params.gridScale}}`,
      `lineThickness={${params.lineThickness}}`,
      `bloomIntensity={${params.bloomIntensity}}`,
      `chromaticAberration={${params.chromaticAberration}}`,
      `noiseIntensity={${params.noiseIntensity}}`,
      `scanDuration={${params.scanDuration}}`,
      `scanDelay={${params.scanDelay}}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const controls = (
    <>
      {/* Toggle button — portaled to body, always clickable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono text-white/50 hover:text-white/90 transition border border-white/10 hover:border-white/25"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        grid
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-14 right-4 z-[9999] w-[340px] rounded-xl border border-white/10 p-4 flex flex-col gap-3"
          style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Grid Dev Tools</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setParams(defaults)} className="text-[10px] font-mono text-white/30 hover:text-white/70 transition px-2 py-1 rounded border border-white/10 hover:border-white/20">
                reset
              </button>
              <button onClick={copyCode} className="text-[10px] font-mono text-white/40 hover:text-white/80 transition px-2 py-1 rounded border border-white/10 hover:border-white/25">
                {copied ? '✓ copied' : 'copy props'}
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono">linesColor</span>
              <input type="color" value={params.linesColor} onChange={e => set('linesColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-[10px] text-white/50 font-mono">{params.linesColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono">scanColor</span>
              <input type="color" value={params.scanColor} onChange={e => set('scanColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-[10px] text-white/50 font-mono">{params.scanColor}</span>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-2.5">
            <Slider label="scanOpacity"       param="scanOpacity"       min={0}    max={1}    step={0.01}   value={params.scanOpacity}       onChange={set} />
            <Slider label="gridScale"         param="gridScale"         min={0.05} max={0.3}  step={0.005}  value={params.gridScale}         onChange={set} />
            <Slider label="lineThickness"     param="lineThickness"     min={0.3}  max={3}    step={0.05}   value={params.lineThickness}     onChange={set} />
            <Slider label="bloomIntensity"    param="bloomIntensity"    min={0}    max={2}    step={0.05}   value={params.bloomIntensity}    onChange={set} />
            <Slider label="chromaticAberr."   param="chromaticAberration" min={0} max={0.01} step={0.0001} value={params.chromaticAberration} onChange={set} />
            <Slider label="noiseIntensity"    param="noiseIntensity"    min={0}    max={0.02} step={0.001}  value={params.noiseIntensity}    onChange={set} />
            <Slider label="scanDuration"      param="scanDuration"      min={0.5}  max={15}   step={0.5}    value={params.scanDuration}      onChange={set} />
            <Slider label="scanDelay"         param="scanDelay"         min={0}    max={30}   step={0.5}    value={params.scanDelay}         onChange={set} />
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Grid renders inside the parent container as before */}
      <GridBackground {...params} />

      {/* Controls portaled to document.body — bypasses pointer-events-none */}
      {mounted && createPortal(controls, document.body)}
    </>
  )
}
