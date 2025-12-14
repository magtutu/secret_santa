import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createErrorResponse, handleApiError, requireAuth, ErrorCodes } from '@/lib/errors';

/**
 * GET /api/assignment/[exchangeId]
 * Returns the authenticated user's assignment for the specified exchange
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchangeId: string }> }
) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    const authResult = await requireAuth(sessionToken, validateSession);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const user = authResult.user;

    const { exchangeId } = await params;

    // Verify user is a participant in the exchange
    const participant = await prisma.participant.findUnique({
      where: {
        exchange_id_user_id: {
          exchange_id: exchangeId,
          user_id: user.id,
        },
      },
    });

    if (!participant) {
      return createErrorResponse(
        'You are not a participant in this exchange',
        403,
        undefined,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Get the user's assignment (where they are the giver)
    const assignment = await prisma.assignment.findUnique({
      where: {
        exchange_id_giver_id: {
          exchange_id: exchangeId,
          giver_id: user.id,
        },
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      return createErrorResponse(
        'Assignments have not been generated yet',
        404,
        undefined,
        ErrorCodes.NOT_FOUND
      );
    }

    // Return only the receiver's information (not other assignments)
    return NextResponse.json({
      success: true,
      assignment: {
        receiver_name: assignment.receiver.name,
        receiver_email: assignment.receiver.email,
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
