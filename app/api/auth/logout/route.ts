import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // Destroy session in database
      try {
        await logout(sessionToken);
      } catch (error: any) {
        // Ignore errors if session doesn't exist (already logged out)
        if (error.code !== 'P2025') {
          throw error;
        }
      }
    }

    // Create redirect response to login page
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Clear session cookie
    response.cookies.delete('session_token');

    return response;
  } catch (error: any) {
    // On error, still redirect to login and clear cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }
}
