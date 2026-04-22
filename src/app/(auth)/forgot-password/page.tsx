'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0d0d0d' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <img src="/776e97c779b6f253df59a1034b9fbf25.png" alt="DontGetCaught" style={{ width: 64, height: 64, borderRadius: '50%', background: '#f7f6f4', padding: 8, objectFit: 'contain', boxSizing: 'border-box' }} />
          </Link>
          <h1 className="text-2xl font-semibold text-white/90 mt-6 mb-1">Reset your password</h1>
          <p className="text-sm text-white/35">Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mb-6 px-4 py-4 rounded-xl border border-green-500/20 text-sm text-green-400" style={{ background: 'rgba(34,197,94,0.07)' }}>
              Check your inbox — a reset link has been sent to <strong>{email}</strong>.
            </div>
            <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition underline underline-offset-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl border border-red-500/20 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.07)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/30">
              <Link href="/login" className="text-white/40 hover:text-white/70 transition underline underline-offset-2">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
