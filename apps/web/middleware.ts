import { createAuthMiddleware } from '@better-auth/core';
import { authConfig } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authMiddleware = createAuthMiddleware({
  config: authConfig,
  
  // Public paths that don't require authentication
  publicPaths: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
    '/about',
  ],

  // Paths that require MFA to be completed
  mfaRequiredPaths: [
    '/dashboard',
    '/settings',
    '/photos',
    '/api/photos',
    '/api/settings',
  ],

  // Custom response for unauthorized requests
  onUnauthorized: (request) => {
    const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
    
    if (isApiRequest) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL('/login', request.url));
  },

  // Handle rate limiting responses
  onRateLimited: (request) => {
    const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
    
    if (isApiRequest) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    return NextResponse.redirect(new URL('/rate-limited', request.url));
  },

  // Session validation
  async validateSession(session) {
    // Check if session is expired due to inactivity
    const lastActivity = new Date(session.lastActivity).getTime();
    const now = Date.now();
    
    if (now - lastActivity > authConfig.session.inactivityTimeout * 1000) {
      return false;
    }

    // Update last activity
    await db.update('sessions')
      .set({ lastActivity: new Date() })
      .where('id', '=', session.id);

    return true;
  },
});

export default async function middleware(request: NextRequest) {
  // Add security headers
  const response = await authMiddleware(request);
  
  if (response) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 