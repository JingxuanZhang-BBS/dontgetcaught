import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import CreditsDisplay from '@/components/CreditsDisplay'
import GridBackgroundClient from '@/components/GridBackgroundClient'

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
    <div className="min-h-screen text-white" style={{ background: '#0d0d0d' }}>

      {/* Very subtle grid background — full screen, low contrast */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GridBackgroundClient
          linesColor="#222222"
          scanColor="#ffffff"
          scanOpacity={0.08}
          gridScale={0.13}
          lineThickness={0.7}
          bloomIntensity={0.1}
          chromaticAberration={0.0002}
          noiseIntensity={0.003}
          scanDuration={6.0}
          scanDelay={10.0}
        />
      </div>

      {/* Nav */}

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(12px)' }}>
        <nav className="mx-auto max-w-5xl px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-xs font-medium tracking-[0.25em] uppercase text-white/30 hover:text-white/60 transition">
            DontGetCaught.AI
          </Link>
          <div className="flex items-center gap-4">
            <CreditsDisplay />
            <span className="text-xs text-white/25 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="relative z-10 pt-16">
        {children}
      </main>
    </div>
  )
}
