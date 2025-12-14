/**
 * Error handling utilities for consistent error responses
 */

export interface ApiError {
  success: false;
  error: string;
  details?: string[];
  code?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  statusCode: number,
  details?: string[],
  code?: string
): Response {
  const body: ApiError = {
    success: false,
    error,
    ...(details && { details }),
    ...(code && { code }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = any>(
  data?: T,
  statusCode: number = 200,
  message?: string
): Response {
  const body: ApiSuccess<T> = {
    success: true,
    ...(data && { data }),
    ...(message && { message }),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle common API errors and return appropriate responses
 */
export function handleApiError(error: any): Response {
  console.error('API Error:', error);

  // Handle specific known errors
  if (error.message === 'Email already exists') {
    return createErrorResponse(
      'Email already exists',
      409,
      undefined,
      ErrorCodes.CONFLICT
    );
  }

  if (error.message === 'Invalid credentials') {
    return createErrorResponse(
      'Invalid email or password',
      401,
      undefined,
      ErrorCodes.UNAUTHORIZED
    );
  }

  if (error.message === 'Invalid exchange code') {
    return createErrorResponse(
      'Invalid exchange code',
      404,
      undefined,
      ErrorCodes.NOT_FOUND
    );
  }

  if (error.message === 'User is already a participant in this exchange') {
    return createErrorResponse(
      'You are already a participant in this exchange',
      409,
      undefined,
      ErrorCodes.CONFLICT
    );
  }

  if (error.message?.includes('not found')) {
    return createErrorResponse(
      error.message,
      404,
      undefined,
      ErrorCodes.NOT_FOUND
    );
  }

  if (error.message?.includes('Only the organizer')) {
    return createErrorResponse(
      error.message,
      403,
      undefined,
      ErrorCodes.UNAUTHORIZED
    );
  }

  if (
    error.message?.includes('At least 3 participants') ||
    error.message?.includes('already been generated') ||
    error.message?.includes('Missing required fields')
  ) {
    return createErrorResponse(
      error.message,
      400,
      undefined,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Default internal server error
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    undefined,
    ErrorCodes.INTERNAL_ERROR
  );
}

/**
 * Validate authentication and return user or error response
 */
export async function requireAuth(
  sessionToken: string | undefined,
  validateSession: (token: string) => Promise<any>
): Promise<{ user: any } | { error: Response }> {
  if (!sessionToken) {
    return {
      error: createErrorResponse(
        'Authentication required',
        401,
        undefined,
        ErrorCodes.AUTHENTICATION_REQUIRED
      ),
    };
  }

  const user = await validateSession(sessionToken);
  if (!user) {
    return {
      error: createErrorResponse(
        'Authentication required',
        401,
        undefined,
        ErrorCodes.AUTHENTICATION_REQUIRED
      ),
    };
  }

  return { user };
}
