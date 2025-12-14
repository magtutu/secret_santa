import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should successfully log in with valid credentials', async () => {
    // Create a test user
    const password = 'testpassword123';
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password_hash: passwordHash,
        name: 'Test User',
      },
    });

    // Create login request
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe(user.id);

    // Verify session cookie was set
    const cookies = response.cookies;
    const sessionCookie = cookies.get('session_token');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    // Verify session was created in database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie?.value },
    });
    expect(session).toBeDefined();
    expect(session?.user_id).toBe(user.id);
  });

  it('should reject login with invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'somepassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should reject login with invalid password', async () => {
    // Create a test user
    const passwordHash = await hashPassword('correctpassword');
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password_hash: passwordHash,
        name: 'Test User',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid email or password');
  });

  it('should reject login with missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: 'somepassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Email is required');
  });

  it('should reject login with missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Password is required');
  });

  it('should reject login with invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'somepassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Email format is invalid');
  });
});
