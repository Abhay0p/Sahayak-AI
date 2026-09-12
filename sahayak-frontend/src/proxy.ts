import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secret key for JWT verification in Edge middleware
const secretKey = process.env.JWT_SECRET || 'sahayak-fallback-secret-for-development';
const key = new TextEncoder().encode(secretKey);

// Define protected routes and their required roles
// If roles array is empty, any authenticated user can access it
const protectedRoutes: { path: string; roles?: string[] }[] = [
  { path: '/play' },
  { path: '/my-day' },
  { path: '/messages' },
  { path: '/reminders' },
  { path: '/profile' },
  { path: '/admin', roles: ['admin'] },
  { path: '/caregiver', roles: ['caregiver', 'admin'] },
  { path: '/family-connect', roles: ['elderly', 'family', 'admin'] },
  { path: '/family', roles: ['family', 'admin'] },
  { path: '/healthcare', roles: ['healthcare', 'admin'] }
];

export async function proxy(req: NextRequest) {
  // Demo Mode: Bypass all strict edge middleware checks
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - though we could protect them, we handle API auth explicitly)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
