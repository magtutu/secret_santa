import { describe, it, expect } from 'vitest';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ErrorCodes,
} from './errors';

describe('Error Handling Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create a standardized error response', async () => {
      const response = createErrorResponse(
        'Test error',
        400,
        ['Detail 1', 'Detail 2'],
        ErrorCodes.VALIDATION_ERROR
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Test error');
      expect(data.details).toEqual(['Detail 1', 'Detail 2']);
      expect(data.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('should create error response without optional fields', async () => {
      const response = createErrorResponse('Simple error', 500);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Simple error');
      expect(data.details).toBeUndefined();
      expect(data.code).toBeUndefined();
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a standardized success response', async () => {
      const response = createSuccessResponse({ id: '123' }, 200, 'Operation successful');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({ id: '123' });
      expect(data.message).toBe('Operation successful');
    });

    it('should create success response with defaults', async () => {
      const response = createSuccessResponse();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeUndefined();
      expect(data.message).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    it('should handle duplicate email error', async () => {
      const error = new Error('Email already exists');
      const response = handleApiError(error);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email already exists');
      expect(data.code).toBe(ErrorCodes.CONFLICT);
    });

    it('should handle invalid credentials error', async () => {
      const error = new Error('Invalid credentials');
      const response = handleApiError(error);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password');
      expect(data.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('should handle invalid exchange code error', async () => {
      const error = new Error('Invalid exchange code');
      const response = handleApiError(error);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid exchange code');
      expect(data.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should handle duplicate participant error', async () => {
      const error = new Error('User is already a participant in this exchange');
      const response = handleApiError(error);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('You are already a participant in this exchange');
      expect(data.code).toBe(ErrorCodes.CONFLICT);
    });

    it('should handle not found errors', async () => {
      const error = new Error('Exchange not found');
      const response = handleApiError(error);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Exchange not found');
      expect(data.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should handle organizer permission errors', async () => {
      const error = new Error('Only the organizer can generate assignments');
      const response = handleApiError(error);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Only the organizer can generate assignments');
      expect(data.code).toBe(ErrorCodes.UNAUTHORIZED);
    });

    it('should handle minimum participants error', async () => {
      const error = new Error('At least 3 participants are required');
      const response = handleApiError(error);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('At least 3 participants are required');
      expect(data.code).toBe(ErrorCodes.BAD_REQUEST);
    });

    it('should handle unknown errors with generic message', async () => {
      const error = new Error('Some random error');
      const response = handleApiError(error);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
      expect(data.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });
  });
});
