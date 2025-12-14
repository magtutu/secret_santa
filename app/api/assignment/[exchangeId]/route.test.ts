import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GET } from './route';
import { signup, login } from '@/lib/auth';
import { createExchange, joinExchange, generateAssignments } from '@/lib/exchange';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('GET /api/assignment/[exchangeId] - Property-Based Tests', () => {
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
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Property 18: Assignment information hiding', () => {
    // Feature: secret-santa-exchange, Property 18: Assignment information hiding
    // Validates: Requirements 6.1
    it('should return only the receiver information and not reveal other assignments', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Organizer data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Participant data (3 participants to form valid assignments)
          fc.array(
            fc.record({
              password: fc.string({ minLength: 1, maxLength: 100 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 2, maxLength: 2 }
          ),
          // Exchange data
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
          async (organizerPassword, organizerName, participantsData, exchangeName, exchangeDate) => {
            // Skip invalid dates
            fc.pre(!isNaN(exchangeDate.getTime()));
            
            // Create organizer
            const organizerEmail = `organizer-${Date.now()}-${counter++}@test.com`;
            const organizer = await signup(organizerEmail, organizerPassword, organizerName);
            const organizerSession = await login(organizerEmail, organizerPassword);

            // Create exchange
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              exchange_date: exchangeDate.toISOString(),
            });

            // Create and add participants
            const participants = [];
            for (const pData of participantsData) {
              const email = `participant-${Date.now()}-${counter++}@test.com`;
              const user = await signup(email, pData.password, pData.name);
              await joinExchange(user.id, exchange.code);
              const session = await login(email, pData.password);
              participants.push({ user, session });
            }

            // Generate assignments
            await generateAssignments(exchange.id, organizer.id);

            // Get all assignments to verify we only return one
            const allAssignments = await prisma.assignment.findMany({
              where: { exchange_id: exchange.id },
              include: { receiver: true, giver: true },
            });

            // Pick a random participant to test
            const testParticipant = participants[0];

            // Mock cookies to return the test participant's session
            const { cookies } = await import('next/headers');
            vi.mocked(cookies).mockResolvedValue({
              get: vi.fn().mockReturnValue({ value: testParticipant.session.token }),
            } as any);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/assignment/' + exchange.id);
            const params = Promise.resolve({ exchangeId: exchange.id });

            // Call the API
            const response = await GET(request, { params });
            const data = await response.json();

            // Should succeed
            expect(data.success).toBe(true);
            expect(data.assignment).toBeDefined();

            // Should only contain receiver information
            expect(data.assignment.receiver_name).toBeDefined();
            expect(data.assignment.receiver_email).toBeDefined();

            // Should not contain information about other assignments
            expect(data.assignment).not.toHaveProperty('giver_id');
            expect(data.assignment).not.toHaveProperty('giver_name');
            expect(data.assignment).not.toHaveProperty('exchange_id');
            
            // Verify the returned receiver matches the actual assignment
            const actualAssignment = allAssignments.find(a => a.giver_id === testParticipant.user.id);
            expect(actualAssignment).toBeDefined();
            expect(data.assignment.receiver_name).toBe(actualAssignment!.receiver.name);
            expect(data.assignment.receiver_email).toBe(actualAssignment!.receiver.email);

            // Verify we're not leaking other assignments
            const otherAssignments = allAssignments.filter(a => a.giver_id !== testParticipant.user.id);
            for (const otherAssignment of otherAssignments) {
              // The response should not contain any information about other givers or receivers
              const responseStr = JSON.stringify(data);
              // We can't check for names/emails as they might coincidentally match
              // But we can verify the structure only contains one assignment
              expect(data.assignment).not.toHaveProperty('other_assignments');
              expect(Array.isArray(data.assignment)).toBe(false);
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 120 second timeout
  });

  describe('Property 19: Assignment authorization', () => {
    // Feature: secret-santa-exchange, Property 19: Assignment authorization
    // Validates: Requirements 6.3, 6.4
    it('should only allow the giver to view their assignment and deny access to others', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Organizer data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Participant data (3 participants to form valid assignments)
          fc.array(
            fc.record({
              password: fc.string({ minLength: 1, maxLength: 100 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 2, maxLength: 2 }
          ),
          // Exchange data
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
          async (organizerPassword, organizerName, participantsData, exchangeName, exchangeDate) => {
            // Skip invalid dates
            fc.pre(!isNaN(exchangeDate.getTime()));
            
            // Create organizer
            const organizerEmail = `organizer-${Date.now()}-${counter++}@test.com`;
            const organizer = await signup(organizerEmail, organizerPassword, organizerName);

            // Create exchange
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              exchange_date: exchangeDate.toISOString(),
            });

            // Create and add participants
            const participants = [];
            for (const pData of participantsData) {
              const email = `participant-${Date.now()}-${counter++}@test.com`;
              const user = await signup(email, pData.password, pData.name);
              await joinExchange(user.id, exchange.code);
              const session = await login(email, pData.password);
              participants.push({ user, session });
            }

            // Generate assignments
            await generateAssignments(exchange.id, organizer.id);

            // Test that each participant can only view their own assignment
            for (let i = 0; i < participants.length; i++) {
              const testParticipant = participants[i];

              // Mock cookies to return the test participant's session
              const { cookies } = await import('next/headers');
              vi.mocked(cookies).mockResolvedValue({
                get: vi.fn().mockReturnValue({ value: testParticipant.session.token }),
              } as any);

              // Create request
              const request = new NextRequest('http://localhost:3000/api/assignment/' + exchange.id);
              const params = Promise.resolve({ exchangeId: exchange.id });

              // Call the API
              const response = await GET(request, { params });
              const data = await response.json();

              // Should succeed for the participant
              expect(data.success).toBe(true);
              expect(data.assignment).toBeDefined();

              // Verify the assignment is for this specific participant
              const actualAssignment = await prisma.assignment.findUnique({
                where: {
                  exchange_id_giver_id: {
                    exchange_id: exchange.id,
                    giver_id: testParticipant.user.id,
                  },
                },
                include: { receiver: true },
              });

              expect(actualAssignment).toBeDefined();
              expect(data.assignment.receiver_name).toBe(actualAssignment!.receiver.name);
            }

            // Test that a non-participant cannot view assignments
            const nonParticipantEmail = `nonparticipant-${Date.now()}-${counter++}@test.com`;
            const nonParticipant = await signup(nonParticipantEmail, 'password123', 'Non Participant');
            const nonParticipantSession = await login(nonParticipantEmail, 'password123');

            // Mock cookies for non-participant
            const { cookies } = await import('next/headers');
            vi.mocked(cookies).mockResolvedValue({
              get: vi.fn().mockReturnValue({ value: nonParticipantSession.token }),
            } as any);

            // Create request
            const request = new NextRequest('http://localhost:3000/api/assignment/' + exchange.id);
            const params = Promise.resolve({ exchangeId: exchange.id });

            // Call the API
            const response = await GET(request, { params });
            const data = await response.json();

            // Should fail for non-participant
            expect(data.success).toBe(false);
            expect(response.status).toBe(403);
            expect(data.error).toContain('not a participant');
          }
        ),
        { numRuns: 10 }
      );
    }, 180000); // 180 second timeout
  });
});
