import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = ['/', '/login', '/register']

  // Ressources statiques à ignorer
  const staticPaths = [
    '_next/',
    'favicon.ico',
    'api/',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.css',
    '.js'
  ]

  // Si c'est une ressource statique, laisser passer
  if (staticPaths.some(path => pathname.includes(path))) {
    return NextResponse.next()
  }

  // Si on est sur une page publique, laisser passer
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // Pour les autres pages, vérifier l'auth côté client
  // Le middleware ne peut pas accéder aux cookies httpOnly facilement avec @supabase/supabase-js
  // La protection se fera donc côté client dans les composants
  return NextResponse.next()
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