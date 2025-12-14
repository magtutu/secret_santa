import { NextRequest, NextResponse } from 'next/server';
import { joinExchange } from '@/lib/exchange';
import { validateSession } from '@/lib/auth';
import { createErrorResponse, handleApiError, requireAuth, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const sessionToken = request.cookies.get('session_token')?.value;
    const authResult = await requireAuth(sessionToken, validateSession);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const user = authResult.user;

    const body = await request.json();
    const { code } = body;

    // Validate code is provided
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return createErrorResponse(
        'Exchange code is required',
        400,
        undefined,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Join exchange
    const participant = await joinExchange(user.id, code.trim());

    return NextResponse.json(
      {
        success: true,
        participant: {
          id: participant.id,
          exchange_id: participant.exchange_id,
          user_id: participant.user_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
