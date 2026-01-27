'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

    if (isDevMode) {
      // 开发模式：清除 dev cookie
      document.cookie = 'dev_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      router.push('/login')
      router.refresh()
    } else {
      // 生产模式：真实 Supabase 登出
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-gray-700 hover:text-red-600 transition"
    >
      Sign Out
    </button>
  )
}
