'use client'
import { useRef, useEffect, useCallback } from 'react'
import './LogoLoop.css'

interface LogoItem {
  key: string
  node: React.ReactNode
  href?: string
}

interface LogoLoopProps {
  items: LogoItem[]
  speed?: number
  gap?: number
  logoHeight?: number
  direction?: 'left' | 'right'
  fade?: boolean
  scaleHover?: boolean
  pauseOnHover?: boolean
  fadeColor?: string
  className?: string
}

const LogoLoop = ({
  items,
  speed = 0.5,
  gap = 48,
  logoHeight = 28,
  direction = 'left',
  fade = true,
  scaleHover = true,
  pauseOnHover = true,
  fadeColor,
  className,
}: LogoLoopProps) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const posRef = useRef(0)
  const pausedRef = useRef(false)
  const frameRef = useRef(0)
  const listWidthRef = useRef(0)

  const measure = useCallback(() => {
    if (listRef.current) {
      listWidthRef.current = listRef.current.offsetWidth
    }
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  useEffect(() => {
    const step = () => {
      if (!pausedRef.current && trackRef.current && listWidthRef.current > 0) {
        const delta = direction === 'right' ? speed : -speed
        posRef.current += delta
        if (posRef.current <= -listWidthRef.current) posRef.current += listWidthRef.current
        if (posRef.current >= 0) posRef.current -= listWidthRef.current
        trackRef.current.style.transform = `translateX(${posRef.current}px)`
      }
      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [speed, direction])

  const classes = [
    'logoloop',
    fade ? 'logoloop--fade' : '',
    scaleHover ? 'logoloop--scale-hover' : '',
    className || '',
  ].filter(Boolean).join(' ')

  const cssVars = {
    '--logoloop-gap': gap + 'px',
    '--logoloop-logoHeight': logoHeight + 'px',
    ...(fadeColor ? { '--logoloop-fadeColor': fadeColor } : {}),
  } as React.CSSProperties

  return (
    <div
      className={classes}
      style={cssVars}
      onMouseEnter={() => { if (pauseOnHover) pausedRef.current = true }}
      onMouseLeave={() => { if (pauseOnHover) pausedRef.current = false }}
    >
      <div className="logoloop__track" ref={trackRef}>
        {[0, 1].map(copy => (
          <ul key={copy} className="logoloop__list" ref={copy === 0 ? listRef : undefined}>
            {items.map(item => (
              <li key={item.key} className="logoloop__item">
                {item.href ? (
                  <a className="logoloop__link" href={item.href} target="_blank" rel="noopener noreferrer">
                    <span className="logoloop__node">{item.node}</span>
                  </a>
                ) : (
                  <span className="logoloop__node">{item.node}</span>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

export default LogoLoop
