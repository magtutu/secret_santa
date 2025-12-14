import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from './route';
import { signup, login } from '@/lib/auth';
import { createExchange } from '@/lib/exchange';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('POST /api/exchange/join', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.assignment.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.exchange.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should successfully join an exchange with valid code', async () => {
    // Create organizer and exchange
    const organizer = await signup('organizer@test.com', 'password123', 'Organizer');
    const exchange = await createExchange(organizer.id, {
      name: 'Test Exchange',
      exchange_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Create joining user and login
    const joiner = await signup('joiner@test.com', 'password123', 'Joiner');
    const session = await login('joiner@test.com', 'password123');

    // Create request
    const request = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({ code: exchange.code }),
    });

    // Call route handler
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.participant).toBeDefined();
    expect(data.participant.exchange_id).toBe(exchange.id);
    expect(data.participant.user_id).toBe(joiner.id);
  });

  it('should reject join with invalid exchange code', async () => {
    // Create user and login
    const user = await signup('user@test.com', 'password123', 'User');
    const session = await login('user@test.com', 'password123');

    // Create request with invalid code
    const request = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({ code: 'INVALID123' }),
    });

    // Call route handler
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid exchange code');
  });

  it('should prevent duplicate participation', async () => {
    // Create organizer and exchange
    const organizer = await signup('organizer@test.com', 'password123', 'Organizer');
    const exchange = await createExchange(organizer.id, {
      name: 'Test Exchange',
      exchange_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Create joining user and login
    const joiner = await signup('joiner@test.com', 'password123', 'Joiner');
    const session = await login('joiner@test.com', 'password123');

    // Create request
    const request = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({ code: exchange.code }),
    });

    // Join first time
    const response1 = await POST(request);
    expect(response1.status).toBe(200);

    // Try to join again
    const request2 = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({ code: exchange.code }),
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    // Verify duplicate is rejected
    expect(response2.status).toBe(409);
    expect(data2.success).toBe(false);
    expect(data2.error).toContain('already a participant');
  });

  it('should reject unauthenticated requests', async () => {
    // Create request without session token
    const request = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'TESTCODE' }),
    });

    // Call route handler
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  it('should reject request with missing code', async () => {
    // Create user and login
    const user = await signup('user@test.com', 'password123', 'User');
    const session = await login('user@test.com', 'password123');

    // Create request without code
    const request = new NextRequest('http://localhost:3000/api/exchange/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({}),
    });

    // Call route handler
    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Exchange code is required');
  });
});
