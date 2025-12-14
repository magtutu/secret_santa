import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      );
    }

    // Destroy session in database
    await logout(sessionToken);

    // Create response
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.delete('session_token');

    return response;
  } catch (error: any) {
    // Handle case where session doesn't exist (already logged out)
    if (error.code === 'P2025') {
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      response.cookies.delete('session_token');
      return response;
    }

    // Handle other errors
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
