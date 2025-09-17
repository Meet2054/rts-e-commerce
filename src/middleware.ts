// src/middleware.ts (Optional - for auth protection)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect API admin routes, not page routes
  // Let client-side auth handle page protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*']
};