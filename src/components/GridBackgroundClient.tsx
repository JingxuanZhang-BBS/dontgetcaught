'use client'

import dynamic from 'next/dynamic'

const GridBackground = dynamic(() => import('./GridBackground'), { ssr: false })

interface Props {
  linesColor?: string
  scanColor?: string
  scanOpacity?: number
  gridScale?: number
  lineThickness?: number
  bloomIntensity?: number
  chromaticAberration?: number
  noiseIntensity?: number
  scanDuration?: number
  scanDelay?: number
}

export default function GridBackgroundClient(props: Props) {
  return <GridBackground {...props} />
}
