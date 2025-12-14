import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from './route';
import { signup, login } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('POST /api/auth/logout', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should successfully logout and clear session cookie', async () => {
    // Create user and login
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';
    
    await signup(email, password, name);
    const session = await login(email, password);

    // Create request with session cookie
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cookie': `session_token=${session.token}`,
      },
    });

    // Call logout
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify session cookie is cleared (deleted cookies have empty value and expired date)
    const cookies = response.cookies;
    const sessionCookie = cookies.get('session_token');
    expect(sessionCookie?.value).toBe('');

    // Verify session is removed from database
    const dbSession = await prisma.session.findUnique({
      where: { token: session.token },
    });
    expect(dbSession).toBeNull();
  });

  it('should return error when no session token provided', async () => {
    // Create request without session cookie
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    // Call logout
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No active session');
  });

  it('should handle already logged out session gracefully', async () => {
    // Create user and login
    const email = 'test2@example.com';
    const password = 'password123';
    const name = 'Test User 2';
    
    await signup(email, password, name);
    const session = await login(email, password);

    // Manually delete session from database
    await prisma.session.delete({
      where: { token: session.token },
    });

    // Create request with session cookie
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Cookie': `session_token=${session.token}`,
      },
    });

    // Call logout
    const response = await POST(request);
    const data = await response.json();

    // Should still succeed and clear cookie
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
