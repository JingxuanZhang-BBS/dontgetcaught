'use client'

import { useEffect } from 'react'

export default function DashboardPage() {
  useEffect(() => {
    window.location.replace('/demo.html')
  }, [])
  return null
}
