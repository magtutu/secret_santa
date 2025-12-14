import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser, requireAuth } from './session';
import * as auth from './auth';

// Mock the Next.js cookies function
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock the auth module
vi.mock('./auth', () => ({
  validateSession: vi.fn(),
}));

describe('Session Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when valid session token exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      } as any);

      // Mock validateSession
      vi.mocked(auth.validateSession).mockResolvedValue(mockUser);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(auth.validateSession).toHaveBeenCalledWith('valid-token');
    });

    it('should return null when no session token exists', async () => {
      // Mock cookies with no session token
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(auth.validateSession).not.toHaveBeenCalled();
    });

    it('should return null when session is invalid', async () => {
      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
      } as any);

      // Mock validateSession returning null
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
      expect(auth.validateSession).toHaveBeenCalledWith('invalid-token');
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      } as any);

      // Mock validateSession
      vi.mocked(auth.validateSession).mockResolvedValue(mockUser);

      const user = await requireAuth();

      expect(user).toEqual(mockUser);
    });

    it('should throw error when not authenticated', async () => {
      // Mock cookies with no session token
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });

    it('should throw error when session is invalid', async () => {
      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
      } as any);

      // Mock validateSession returning null
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('Authentication required');
    });
  });
});
