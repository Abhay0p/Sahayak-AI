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
  const { pathname } = req.nextUrl;

  // Check if the current route is protected
  const protectedRoute = protectedRoutes.find(route => pathname.startsWith(route.path));
  
  if (!protectedRoute) {
    return NextResponse.next();
  }

  // Get the session cookie
  const sessionCookie = req.cookies.get('sahayak_session')?.value;

  if (!sessionCookie) {
    // If API route is protected, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Verify the JWT session
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256'],
    });

    const user = payload.user as any;

    // Check role-based access if specified
    if (protectedRoute.roles && protectedRoute.roles.length > 0) {
      if (!user.role || !protectedRoute.roles.includes(user.role)) {
        // Redirect unauthorized roles to their appropriate dashboard or home
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Session is invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('sahayak_session');
    return response;
  }
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
