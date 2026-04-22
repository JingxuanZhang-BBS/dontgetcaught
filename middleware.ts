import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 开发模式：跳过真实认证
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  let supabaseResponse = NextResponse.next({
    request,
  })

  // 在开发模式下，假设用户已登录
  let user = null

  if (isDevMode) {
    // 检查是否有 dev_logged_in cookie
    const hasDevSession = request.cookies.has('dev_logged_in')
    if (hasDevSession) {
      user = { id: 'dev-user-123', email: 'dev@example.com' } // Mock user
    }
  } else {
    // 生产模式：使用真实 Supabase 认证
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options: opts }) =>
                supabaseResponse.cookies.set(name, value, opts)
              )
            },
          },
        }
      )

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()
      user = supabaseUser
    } catch {
      // Supabase 出错时 user 保持 null，受保护路由正常跳转登录
    }
  }

  // Protected routes that require authentication
  const protectedPaths = ['/demo.html']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/demo.html'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
