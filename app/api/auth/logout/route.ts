import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      // Even if no session, clear cookie and return success
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      response.cookies.delete('session_token');
      return response;
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

    return handleApiError(error);
  }
}
