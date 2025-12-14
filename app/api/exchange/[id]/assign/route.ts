import { NextRequest, NextResponse } from 'next/server';
import { generateAssignments } from '@/lib/exchange';
import { validateSession } from '@/lib/auth';
import { handleApiError, requireAuth } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const sessionToken = request.cookies.get('session_token')?.value;
    const authResult = await requireAuth(sessionToken, validateSession);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const user = authResult.user;

    const { id: exchangeId } = await params;

    // Generate assignments
    const assignments = await generateAssignments(exchangeId, user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Assignments generated successfully',
        count: assignments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
