import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { validateLoginForm } from '@/lib/validation';
import { createErrorResponse, handleApiError, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.join(', '),
        400,
        validation.errors,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Attempt login
    const session = await login(email, password);

    // Get user info for response
    const user = await session.user;

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: session.user_id,
          email: email,
        },
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expires_at,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return handleApiError(error);
  }
}
