// path: frontend/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware that protects all /admin/* routes.
 * If the HttpOnly `access_token` cookie is missing,
 * the user is redirected to /admin/login.
 *
 * Note: the cookie is HttpOnly, so we can only check for its
 * presence here (not its validity). Full validation happens
 * server-side on the API.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};