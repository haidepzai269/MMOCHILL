import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Determine if the request is for the admin subdomain
  // This handles localhost (admin.localhost:3000) or production (admin.kiemlua.com)
  const isAdminSubdomain = hostname.startsWith('admin.');

  // Path starts with /admin
  const isPathAdmin = url.pathname.startsWith('/admin');

  // Rule 1: If on the admin subdomain and NOT already on the /admin path, rewrite internally to /admin
  if (isAdminSubdomain && !isPathAdmin) {
    return NextResponse.rewrite(new URL(`/admin${url.pathname === '/' ? '' : url.pathname}`, request.url));
  }

  // Allow access to /admin on both main domain and subdomain for convenience
  // (Previously it was restricted to only admin subdomain)
  if (!isAdminSubdomain && isPathAdmin) {
    // Just continue to auth check
  }

  // Auth logic for the Admin Panel
  if (isAdminSubdomain || isPathAdmin) {
    // Exclude the login page from token check
    if (url.pathname === '/admin/login') {
        return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    if (!token || token !== 'demo_admin_token') {
      // If unauthorized on the admin domain, redirect to the main domain's home page.
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Dashboard Protection (Main domain)
  const protectedRoutes = ['/profile', '/tasks', '/wallet', '/claim'];
  const isProtected = protectedRoutes.some(path => url.pathname.startsWith(path));

  if (isProtected) {
    const userToken = request.cookies.get('user_token')?.value;
    if (!userToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
