import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken');
  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access landing, login, or register pages, redirect to trade page
  if (accessToken && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/trade', request.url));
  }

  // If user is NOT authenticated and tries to access a protected route, redirect to login
  const protectedRoutes = ['/trade', '/profile', '/bots'];
  if (!accessToken && protectedRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/trade/:path*', '/profile/:path*', '/bots/:path*'],
};
