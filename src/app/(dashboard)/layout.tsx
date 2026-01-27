import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  let user: any = null

  if (isDevMode) {
    // 开发模式：使用假用户
    user = {
      id: 'dev-user-123',
      email: 'dev@example.com (Dev Mode)',
    }
  } else {
    // 生产模式：真实 Supabase 认证
    const supabase = await createClient()

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser) {
      redirect('/login')
    }

    user = supabaseUser
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                English Style Writer
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/style-library"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Style Library
                </Link>
                <Link
                  href="/new-task"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  New Task
                </Link>
                <Link
                  href="/history"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  History
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
