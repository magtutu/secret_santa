import { NextRequest, NextResponse } from 'next/server';
import { createExchange } from '@/lib/exchange';
import { validateExchangeForm } from '@/lib/validation';
import { validateSession } from '@/lib/auth';
import { logInvitationEmails } from '@/lib/invitation';
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
    const { name, description, gift_budget, exchange_date, invitee_emails } = body;

    // Validate input
    const validation = validateExchangeForm({ name, description, gift_budget, exchange_date });
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.join(', '),
        400,
        validation.errors,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Create exchange
    const exchange = await createExchange(user.id, {
      name,
      description,
      gift_budget,
      exchange_date,
    });

    // Process invitation emails if provided
    if (invitee_emails && Array.isArray(invitee_emails) && invitee_emails.length > 0) {
      // Filter out empty strings and validate emails
      const validEmails = invitee_emails.filter(
        (email) => typeof email === 'string' && email.trim().length > 0
      );

      if (validEmails.length > 0) {
        logInvitationEmails(validEmails, exchange.name, user.name, exchange.code);
      }
    }

    return NextResponse.json(
      {
        success: true,
        exchange: {
          id: exchange.id,
          name: exchange.name,
          description: exchange.description,
          gift_budget: exchange.gift_budget,
          exchange_date: exchange.exchange_date.toISOString(),
          code: exchange.code,
          organizer_id: exchange.organizer_id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
