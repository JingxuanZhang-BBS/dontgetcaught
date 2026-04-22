'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/login?reset=success')
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
          <h1 className="text-2xl font-semibold text-white/90 mt-6 mb-1">Set new password</h1>
          <p className="text-sm text-white/35">Choose a new password for your account</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-500/20 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.07)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">
              NEW PASSWORD
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
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
