import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { signup, login } from '@/lib/auth';

describe('POST /api/exchange/create', () => {
  let consoleLogSpy: any;

  beforeEach(async () => {
    // Clean up test data
    await prisma.assignment.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.exchange.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    // Spy on console.log to verify invitation logging
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should create exchange with valid data', async () => {
    // Create and authenticate user
    const user = await signup('test@example.com', 'password123', 'Test User');
    const session = await login('test@example.com', 'password123');

    // Create request
    const request = new NextRequest('http://localhost:3000/api/exchange/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({
        name: 'Test Exchange',
        description: 'A test exchange',
        gift_budget: 50,
        exchange_date: '2025-12-25',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.exchange).toBeDefined();
    expect(data.exchange.name).toBe('Test Exchange');
    expect(data.exchange.code).toBeDefined();
    expect(data.exchange.organizer_id).toBe(user.id);
  });

  it('should reject unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/exchange/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Exchange',
        exchange_date: '2025-12-25',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
  });

  it('should validate required fields', async () => {
    // Create and authenticate user
    await signup('test2@example.com', 'password123', 'Test User');
    const session = await login('test2@example.com', 'password123');

    // Create request with missing required field
    const request = new NextRequest('http://localhost:3000/api/exchange/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({
        name: 'Test Exchange',
        // Missing exchange_date
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should log invitation emails when invitee_emails provided', async () => {
    // Create and authenticate user
    await signup('test3@example.com', 'password123', 'Test Organizer');
    const session = await login('test3@example.com', 'password123');

    const inviteeEmails = ['friend1@example.com', 'friend2@example.com'];

    const request = new NextRequest('http://localhost:3000/api/exchange/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({
        name: 'Holiday Party',
        exchange_date: '2025-12-25',
        invitee_emails: inviteeEmails,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    // Verify invitation emails were logged
    const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
    const output = calls.join('\n');

    inviteeEmails.forEach((email) => {
      expect(output).toContain(`To: ${email}`);
    });
    expect(output).toContain('Holiday Party');
    expect(output).toContain('Test Organizer');
  });

  it('should handle empty invitee_emails array', async () => {
    // Create and authenticate user
    await signup('test4@example.com', 'password123', 'Test User');
    const session = await login('test4@example.com', 'password123');

    const request = new NextRequest('http://localhost:3000/api/exchange/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_token=${session.token}`,
      },
      body: JSON.stringify({
        name: 'Test Exchange',
        exchange_date: '2025-12-25',
        invitee_emails: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    // Verify no invitation emails were logged
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
