import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';
import { signup, login } from '@/lib/auth';
import { createExchange, joinExchange } from '@/lib/exchange';
import { NextRequest } from 'next/server';

describe('POST /api/exchange/[id]/assign', () => {
  let organizerToken: string;
  let organizerId: string;
  let participantToken: string;
  let participantId: string;
  let exchangeId: string;

  beforeEach(async () => {
    // Clean up database
    await prisma.assignment.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.exchange.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create organizer
    const organizerEmail = `organizer-${Date.now()}@test.com`;
    const organizer = await signup(organizerEmail, 'password123', 'Organizer');
    organizerId = organizer.id;
    const organizerSession = await login(organizerEmail, 'password123');
    organizerToken = organizerSession.token;

    // Create participant
    const participantEmail = `participant-${Date.now()}@test.com`;
    const participant = await signup(participantEmail, 'password123', 'Participant');
    participantId = participant.id;
    const participantSession = await login(participantEmail, 'password123');
    participantToken = participantSession.token;

    // Create exchange
    const exchange = await createExchange(organizerId, {
      name: 'Test Exchange',
      exchange_date: new Date(Date.now() + 86400000).toISOString(),
    });
    exchangeId = exchange.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.assignment.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.exchange.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should reject unauthenticated requests', async () => {
    const request = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: exchangeId } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Authentication required');
  });

  it('should reject non-organizer requests', async () => {
    // Add two more participants to meet minimum
    const user2 = await signup(`user2-${Date.now()}@test.com`, 'password123', 'User 2');
    const user3 = await signup(`user3-${Date.now()}@test.com`, 'password123', 'User 3');
    await joinExchange(user2.id, (await prisma.exchange.findUnique({ where: { id: exchangeId } }))!.code);
    await joinExchange(user3.id, (await prisma.exchange.findUnique({ where: { id: exchangeId } }))!.code);

    const request = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${participantToken}`,
      },
    });

    const response = await POST(request, { params: { id: exchangeId } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Only the organizer');
  });

  it('should reject if fewer than 3 participants', async () => {
    const request = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${organizerToken}`,
      },
    });

    const response = await POST(request, { params: { id: exchangeId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('At least 3 participants');
  });

  it('should successfully generate assignments for valid exchange', async () => {
    // Add two more participants to meet minimum
    const user2 = await signup(`user2-${Date.now()}@test.com`, 'password123', 'User 2');
    const user3 = await signup(`user3-${Date.now()}@test.com`, 'password123', 'User 3');
    const exchange = await prisma.exchange.findUnique({ where: { id: exchangeId } });
    await joinExchange(user2.id, exchange!.code);
    await joinExchange(user3.id, exchange!.code);

    const request = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${organizerToken}`,
      },
    });

    const response = await POST(request, { params: { id: exchangeId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(3);

    // Verify assignments were stored
    const assignments = await prisma.assignment.findMany({
      where: { exchange_id: exchangeId },
    });
    expect(assignments).toHaveLength(3);

    // Verify exchange marked as assignments_generated
    const updatedExchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
    });
    expect(updatedExchange?.assignments_generated).toBe(true);
  });

  it('should reject if assignments already generated', async () => {
    // Add two more participants and generate assignments
    const user2 = await signup(`user2-${Date.now()}@test.com`, 'password123', 'User 2');
    const user3 = await signup(`user3-${Date.now()}@test.com`, 'password123', 'User 3');
    const exchange = await prisma.exchange.findUnique({ where: { id: exchangeId } });
    await joinExchange(user2.id, exchange!.code);
    await joinExchange(user3.id, exchange!.code);

    // First generation
    const request1 = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${organizerToken}`,
      },
    });
    await POST(request1, { params: { id: exchangeId } });

    // Second generation attempt
    const request2 = new NextRequest(`http://localhost/api/exchange/${exchangeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${organizerToken}`,
      },
    });

    const response = await POST(request2, { params: { id: exchangeId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already been generated');
  });

  it('should return 404 for non-existent exchange', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const request = new NextRequest(`http://localhost/api/exchange/${fakeId}/assign`, {
      method: 'POST',
      headers: {
        Cookie: `session_token=${organizerToken}`,
      },
    });

    const response = await POST(request, { params: { id: fakeId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not found');
  });
});
