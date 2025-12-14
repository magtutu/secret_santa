import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/exchange'];

// Define public routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/signup'];

// Configure middleware to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs';

/**
 * Middleware to handle authentication and authorization
 * Validates session tokens and redirects unauthenticated users
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('session_token')?.value;
  
  // Validate session
  const user = sessionToken ? await validateSession(sessionToken) : null;
  const isAuthenticated = !!user;
  
  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
