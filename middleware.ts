import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = req.nextUrl

  // Public routes — token-bearing customer links and unauthenticated webhooks.
  // /pay and /api/payments/ share the same token model; RLS on payments/proposals
  // scopes mutations to the row matching the token, so no agent session is needed.
  // /api/proposals/[id]/pdf is intentionally public too so emailed PDF links work.
  const isPublicPayments = pathname.startsWith('/api/payments/')
  const isPublicProposalPdf =
    pathname.startsWith('/api/proposals/') && pathname.endsWith('/pdf')
  if (pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/pay') ||
      pathname === '/' ||
      isPublicPayments ||
      isPublicProposalPdf) {
    // Allow public access
  } else if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/customers') ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/proposals') ||
      pathname.startsWith('/api/')) {
    if (!user) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Public routes — redirect logged-in users away from landing
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
