import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('POST /api/auth/signup', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should successfully create a user and session', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(requestBody.email);
    expect(data.user.name).toBe(requestBody.name);
    expect(data.user.id).toBeDefined();

    // Verify session cookie is set
    const cookies = response.cookies;
    const sessionCookie = cookies.get('session_token');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: requestBody.email },
    });
    expect(user).toBeDefined();
    expect(user?.name).toBe(requestBody.name);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    const requestBody = {
      email: 'duplicate@example.com',
      password: 'password123',
      name: 'First User',
    };

    const request1 = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    await POST(request1);

    // Try to create second user with same email
    const request2 = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...requestBody,
        name: 'Second User',
      }),
    });

    const response = await POST(request2);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email already exists');
  });

  it('should return validation errors for missing fields', async () => {
    const testCases = [
      {
        body: { password: 'password123', name: 'Test' },
        expectedError: 'Email is required',
      },
      {
        body: { email: 'test@example.com', name: 'Test' },
        expectedError: 'Password is required',
      },
      {
        body: { email: 'test@example.com', password: 'password123' },
        expectedError: 'Name is required',
      },
    ];

    for (const testCase of testCases) {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testCase.body),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain(testCase.expectedError);
    }
  });

  it('should return validation error for invalid email format', async () => {
    const requestBody = {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Email format is invalid');
  });

  it('should return validation error for weak password', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Password must be at least 8 characters');
  });

  it('should auto-join exchange when code is provided', async () => {
    // First create an exchange
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@example.com',
        password_hash: 'hash',
        name: 'Organizer',
      },
    });

    const exchange = await prisma.exchange.create({
      data: {
        name: 'Test Exchange',
        exchange_date: new Date('2025-12-25'),
        code: 'TEST123',
        organizer_id: organizer.id,
      },
    });

    // Add organizer as participant
    await prisma.participant.create({
      data: {
        exchange_id: exchange.id,
        user_id: organizer.id,
      },
    });

    // Now signup with exchange code
    const requestBody = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      exchangeCode: 'TEST123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    // Verify user was added as participant
    const participant = await prisma.participant.findFirst({
      where: {
        exchange_id: exchange.id,
        user: {
          email: requestBody.email,
        },
      },
    });

    expect(participant).toBeDefined();
  });
});
