import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { validateLoginForm } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
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
    // Handle invalid credentials
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Handle other errors
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
