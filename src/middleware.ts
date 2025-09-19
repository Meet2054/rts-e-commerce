// src/middleware.ts - Simplified version without Firebase Admin
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Basic auth check for API admin routes
  if (pathname.startsWith('/api/admin')) {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Let the API route handle token validation
  }

  // For protected pages, basic token check (disabled for development)
  if (
    pathname.startsWith('/products') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/admin')
  ) {
    // For development, skip the token check in middleware
    // Let the client-side components (ApprovalGuard) handle authentication
    // This prevents redirect loops during development
    
    // In production, you might want to enable this:
    // const token = request.cookies.get('auth-token')?.value;
    // if (!token) {
    //   return NextResponse.redirect(new URL('/sign-in', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    // Removing client-side routes from middleware protection
    // Let ApprovalGuard components handle protection instead
    // '/products/:path*',
    // '/cart/:path*',
    // '/admin/:path*'
  ]
};