import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

// Placeholder until credits system is built
const PLACEHOLDER_CREDITS = 50

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  let user: any = null

  if (isDevMode) {
    user = { id: 'dev-user-123', email: 'dev@example.com' }
  } else {
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (!supabaseUser) redirect('/login')
    user = supabaseUser
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #e8eaf0 0%, #e0e4ec 30%, #dbd8e8 65%, #d4d9e4 100%)' }}>
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-md border-b border-white/60">
        <nav className="mx-auto max-w-5xl px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xs font-medium tracking-widest uppercase text-slate-500/80 hover:text-slate-700 transition">
            DontGetCaught.AI
          </Link>
          <div className="flex items-center gap-4">
            {/* Credits badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs font-semibold text-slate-600">{PLACEHOLDER_CREDITS} credits</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
