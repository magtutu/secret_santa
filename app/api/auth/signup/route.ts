import { NextRequest, NextResponse } from 'next/server';
import { signup, login } from '@/lib/auth';
import { validateSignupForm } from '@/lib/validation';
import { prisma } from '@/lib/db';
import { createErrorResponse, handleApiError, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, exchangeCode } = body;

    // Validate input
    const validation = validateSignupForm({ email, password, name });
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.join(', '),
        400,
        validation.errors,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Create user
    const user = await signup(email, password, name);

    // Create session
    const session = await login(email, password);

    // If exchange code provided, join the exchange
    if (exchangeCode) {
      try {
        const exchange = await prisma.exchange.findUnique({
          where: { code: exchangeCode },
        });

        if (exchange) {
          // Check if user is already a participant
          const existingParticipant = await prisma.participant.findFirst({
            where: {
              exchange_id: exchange.id,
              user_id: user.id,
            },
          });

          if (!existingParticipant) {
            await prisma.participant.create({
              data: {
                exchange_id: exchange.id,
                user_id: user.id,
              },
            });
          }
        }
      } catch (joinError) {
        // Log error but don't fail signup
        console.error('Error joining exchange after signup:', joinError);
      }
    }

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
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
