'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TOS_TEXT = `Privacy Policy of dontgetcaught.com
Latest update: April 23, 2026

SUMMARY

Data we collect automatically
We automatically collect data when you use the Service, including: Usage Data, device and browser information, IP address, and Trackers (cookies or similar technologies). Trusted third parties may assist in processing this data, including Anthropic and hosting providers.

Data you give to us
We collect data you provide, including: email address (for account creation and communication), prompts submitted to the Service, and generated outputs. This data is used to operate and improve the Service.

OWNER AND DATA CONTROLLER
dontgetcaught.com | Email: calpoppink@gmail.com

TYPES OF DATA COLLECTED
Email address, account credentials, prompts and generated text outputs, Usage Data, Trackers. Personal Data may be freely provided by the User or collected automatically. Users are responsible for any third-party personal data they submit.

MODE AND PLACE OF PROCESSING
Data is processed using computers and IT tools. Authorized personnel and third-party providers may access the data. Data is processed in the United States and in locations where service providers operate. Data is stored as long as necessary to provide the Service, improve the product, and comply with legal obligations.

AI PROCESSING SERVICES
The Service uses third-party AI providers, including Anthropic. Personal Data processed: prompts, generated outputs, usage data. These providers may process data according to their own privacy policies.

COOKIE POLICY
This Application uses Trackers. Users can manage preferences through browser settings.

GDPR USER RIGHTS
Users have the right to: access their data, correct their data, delete their data, restrict processing, object to processing, and data portability. Requests can be made via the contact email.

---

Terms and Conditions of dontgetcaught.com
Latest update: April 23, 2026

INTRODUCTION
These Terms govern the use of this Application and any related agreements. dontgetcaught.com provides AI-assisted tools for rewriting text, improving tone and readability, and generating human-like written content.

WHAT THE USER SHOULD KNOW AT A GLANCE
• The Service uses AI-generated content
• Outputs may not be original or accurate
• The Service does not guarantee avoidance of AI detection
• Users are responsible for how outputs are used

ACCOUNT REGISTRATION
Users must provide accurate information and maintain account security.

ACCEPTABLE USE
Users agree NOT to: use the Service for academic dishonesty, submit AI-generated content as original work where prohibited, plagiarize or infringe intellectual property, misrepresent authorship, or use the Service unlawfully.

AI DISCLAIMER
The Service relies on artificial intelligence. The Owner does NOT guarantee: originality, accuracy, compliance with academic or professional standards, or success in avoiding AI detection systems.

CONTENT PROVIDED BY USERS
Users are fully responsible for any content they submit. Users confirm they have the legal right to use submitted content. Users are solely liable for plagiarism, copyright infringement, and misuse of generated outputs.

LIMITATION OF LIABILITY
To the maximum extent permitted by law, the Owner is not liable for: academic penalties (including expulsion), legal consequences, plagiarism claims, loss of reputation or opportunity, or damages resulting from use of AI-generated content.

INDEMNIFICATION
Users agree to indemnify and hold harmless the Owner from any claims arising from misuse of the Service, violation of laws, or violation of third-party rights.

CHANGES TO THESE TERMS
We may update these Terms. Continued use constitutes acceptance.

GOVERNING LAW: Massachusetts`

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tosChecked, setTosChecked]           = useState(false)
  const [showTos, setShowTos]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [loading, setLoading]                 = useState(false)
  const [emailSent, setEmailSent]             = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!tosChecked) { setError('Please agree to the Terms & Privacy Policy to continue'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { tos_accepted_at: new Date().toISOString() },
        },
      })
      if (error) throw error
      setEmailSent(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup')
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
            <Link href="/login" className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition">
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
                <label htmlFor="email" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">EMAIL</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/85 placeholder-white/20 outline-none border border-white/10 focus:border-white/25 transition"
                  style={{ background: '#161616', colorScheme: 'dark' }} />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">PASSWORD</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/85 placeholder-white/20 outline-none border border-white/10 focus:border-white/25 transition"
                  style={{ background: '#161616', colorScheme: 'dark' }} />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-white/40 mb-2 tracking-wide">CONFIRM PASSWORD</label>
                <input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/85 placeholder-white/20 outline-none border border-white/10 focus:border-white/25 transition"
                  style={{ background: '#161616', colorScheme: 'dark' }} />
              </div>

              {/* TOS checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <div
                  onClick={() => setTosChecked(v => !v)}
                  className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition"
                  style={{
                    background: tosChecked ? '#fff' : 'transparent',
                    border: '1.5px solid ' + (tosChecked ? '#fff' : 'rgba(255,255,255,0.2)'),
                  }}
                >
                  {tosChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-white/40 leading-relaxed">
                  I have read and agree to the{' '}
                  <button type="button" onClick={() => setShowTos(true)}
                    className="text-white/70 underline underline-offset-2 hover:text-white transition">
                    Terms of Service & Privacy Policy
                  </button>
                </span>
              </label>

              <button type="submit" disabled={loading || !tosChecked}
                className="w-full py-3 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/30">
              Already have an account?{' '}
              <Link href="/login" className="text-white/60 hover:text-white transition underline underline-offset-2">Sign in</Link>
            </p>
          </>
        )}
      </div>

      {/* TOS Modal */}
      {showTos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowTos(false) }}>
          <div className="w-full max-w-lg rounded-2xl flex flex-col" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-sm font-semibold text-white/80">Terms of Service & Privacy Policy</span>
              <button onClick={() => setShowTos(false)} className="text-white/40 hover:text-white/70 transition text-lg leading-none">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {TOS_TEXT}
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => { setTosChecked(true); setShowTos(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black bg-white hover:bg-white/90 transition">
                I Agree
              </button>
              <button onClick={() => setShowTos(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
