'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                   = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const [emailSent, setEmailSent]           = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        setEmailSent(true)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0d0d0d' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <img src="/776e97c779b6f253df59a1034b9fbf25.png" alt="DontGetCaught" style={{ width: 64, height: 64, borderRadius: '50%', background: '#f7f6f4', padding: 8, objectFit: 'contain', boxSizing: 'border-box' }} />
          </Link>
          <h1 className="text-2xl font-semibold text-white/90 mt-6 mb-1">Create account</h1>
          <p className="text-sm text-white/35">Start generating in seconds</p>
        </div>

        {emailSent ? (
          <div className="text-center">
            <div className="mb-6 px-4 py-4 rounded-xl border border-white/10 text-sm" style={{ background: '#161616' }}>
              <p className="text-white/80 font-medium mb-1">Check your email</p>
              <p className="text-white/40 text-xs">
                We sent a verification link to <span className="text-white/60">{email}</span>
              </p>
            </div>
            <p className="text-xs text-white/25 mb-5">Didn&apos;t receive it? Check your spam folder.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl border border-red-500/20 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.07)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
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

              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">
                  CONFIRM PASSWORD
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/30">
              Already have an account?{' '}
              <Link href="/login" className="text-white/60 hover:text-white transition underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
