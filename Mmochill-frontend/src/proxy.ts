import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const padding = '='.repeat((4 - payloadBase64.length % 4) % 4);
    const base64 = (payloadBase64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const payloadStr = atob(base64);
    const payload = JSON.parse(payloadStr);
    if (!payload.exp) return false;
    // Check if token expires within the next 10 seconds to allow network latency
    return (payload.exp * 1000) - 10000 < Date.now();
  } catch (e) {
    return true; // invalid token -> expired
  }
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const isAdminSubdomain = hostname.startsWith('admin.');
  const isPathAdmin = url.pathname.startsWith('/admin');

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Rule 1: Subdomain rewriting
  if (isAdminSubdomain && !isPathAdmin) {
    return NextResponse.rewrite(new URL(`/admin${url.pathname === '/' ? '' : url.pathname}`, request.url));
  }

  // Rule 2: Admin Route Protection
  if (isAdminSubdomain || isPathAdmin) {
    if (url.pathname === '/admin/login') {
        const adminAccessToken = request.cookies.get('admin_token')?.value || accessToken;
        if (adminAccessToken && !isTokenExpired(adminAccessToken) && userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
    }

    const adminAccessToken = request.cookies.get('admin_token')?.value || accessToken;
    if (!adminAccessToken || isTokenExpired(adminAccessToken) || userRole !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('access_token');
      response.cookies.delete('user_token');
      response.cookies.delete('user_token_local');
      response.cookies.delete('refresh_token');
      response.cookies.delete('user_role');
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Rule 3: Dashboard Protection
  const protectedRoutes = ['/profile', '/tasks', '/wallet', '/claim', '/withdraw', '/notifications'];
  const isProtected = url.pathname === '/' || protectedRoutes.some(path => url.pathname.startsWith(path));

  if (isProtected) {
    if (!accessToken || isTokenExpired(accessToken)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      const response = NextResponse.redirect(loginUrl);
      
      // Xoá mọi cookie khi token chết để ép login hoàn toàn mới
      response.cookies.delete('access_token');
      response.cookies.delete('user_token');
      response.cookies.delete('user_token_local');
      response.cookies.delete('refresh_token');
      response.cookies.delete('user_role');
      return response;
    }
  }

  // Rule 4: Auth Page Protection (Prevent logged in users from visiting login/register)
  const authRoutes = ['/login', '/register'];
  if (authRoutes.includes(url.pathname)) {
      if (refreshToken) {
          return NextResponse.redirect(new URL('/', request.url));
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
