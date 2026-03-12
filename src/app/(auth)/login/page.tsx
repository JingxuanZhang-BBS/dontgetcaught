'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 500))
        document.cookie = 'dev_logged_in=true; path=/; max-age=86400'
        router.push('/dashboard')
        router.refresh()
      } else {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0d0d0d' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="text-xs font-medium tracking-[0.25em] uppercase text-white/30 hover:text-white/55 transition">
            DontGetCaught.AI
          </Link>
          <h1 className="text-2xl font-semibold text-white/90 mt-6 mb-1">Welcome back</h1>
          <p className="text-sm text-white/35">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-500/20 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.07)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm text-white/85 placeholder-white/20 outline-none border border-white/10 focus:border-white/25 transition"
              style={{ background: '#161616', colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm text-white/85 placeholder-white/20 outline-none border border-white/10 focus:border-white/25 transition"
              style={{ background: '#161616', colorScheme: 'dark' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/30">
          No account?{' '}
          <Link href="/signup" className="text-white/60 hover:text-white transition underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
