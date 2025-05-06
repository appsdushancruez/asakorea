import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const publicPaths = ['/', '/auth/login'];
  const isPublic = publicPaths.includes(req.nextUrl.pathname);

  // Exclude all static files (with an extension) from auth redirect
  const isStaticFile = /\.[^/]+$/.test(req.nextUrl.pathname);

  // If user is not signed in and the current path is not public or static,
  // redirect the user to /auth/login
  if (!session && !isPublic && !isStaticFile && !req.nextUrl.pathname.startsWith('/_next') && !req.nextUrl.pathname.startsWith('/favicon.ico') && !req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If user is signed in and the current path is /auth/login,
  // redirect the user to /dashboard/physical/students
  if (session && req.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard/physical/students', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 