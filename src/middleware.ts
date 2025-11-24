import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/', '/login', '/register']

  // Si on est sur une page publique, laisser passer
  if (publicPages.includes(pathname)) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Si pas de session et on essaie d'accéder à une page protégée
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Si on a une session et on essaie d'aller sur login/register, rediriger vers home
    if (session && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/home', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware auth error:', error)
    // En cas d'erreur, rediriger vers login
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}