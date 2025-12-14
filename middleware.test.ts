import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import * as auth from '@/lib/auth';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  validateSession: vi.fn(),
}));

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from /dashboard to /login', async () => {
      // Mock no valid session
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      const response = await middleware(request);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fdashboard');
    });

    it('should redirect unauthenticated users from /exchange to /login', async () => {
      // Mock no valid session
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/exchange/123'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should allow authenticated users to access /dashboard', async () => {
      // Mock valid session
      vi.mocked(auth.validateSession).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'), {
        headers: {
          cookie: 'session_token=valid-token',
        },
      });
      const response = await middleware(request);

      // Should proceed without redirect
      expect(response.status).not.toBe(307);
    });

    it('should allow authenticated users to access /exchange pages', async () => {
      // Mock valid session
      vi.mocked(auth.validateSession).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new NextRequest(new URL('http://localhost:3000/exchange/create'), {
        headers: {
          cookie: 'session_token=valid-token',
        },
      });
      const response = await middleware(request);

      // Should proceed without redirect
      expect(response.status).not.toBe(307);
    });
  });

  describe('Auth Routes', () => {
    it('should allow unauthenticated users to access /login', async () => {
      // Mock no valid session
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/login'));
      const response = await middleware(request);

      // Should proceed without redirect
      expect(response.status).not.toBe(307);
    });

    it('should allow unauthenticated users to access /signup', async () => {
      // Mock no valid session
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/signup'));
      const response = await middleware(request);

      // Should proceed without redirect
      expect(response.status).not.toBe(307);
    });

    it('should redirect authenticated users from /login to /dashboard', async () => {
      // Mock valid session
      vi.mocked(auth.validateSession).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new NextRequest(new URL('http://localhost:3000/login'), {
        headers: {
          cookie: 'session_token=valid-token',
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect authenticated users from /signup to /dashboard', async () => {
      // Mock valid session
      vi.mocked(auth.validateSession).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const request = new NextRequest(new URL('http://localhost:3000/signup'), {
        headers: {
          cookie: 'session_token=valid-token',
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('Public Routes', () => {
    it('should allow access to home page without authentication', async () => {
      // Mock no valid session
      vi.mocked(auth.validateSession).mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      // Should proceed without redirect
      expect(response.status).not.toBe(307);
    });
  });

  describe('Session Validation', () => {
    it('should call validateSession with the session token from cookies', async () => {
      const mockValidateSession = vi.mocked(auth.validateSession);
      mockValidateSession.mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'), {
        headers: {
          cookie: 'session_token=test-token-123',
        },
      });
      await middleware(request);

      expect(mockValidateSession).toHaveBeenCalledWith('test-token-123');
    });

    it('should not call validateSession when no session token exists', async () => {
      const mockValidateSession = vi.mocked(auth.validateSession);
      mockValidateSession.mockResolvedValue(null);

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
      await middleware(request);

      expect(mockValidateSession).not.toHaveBeenCalled();
    });
  });
});
