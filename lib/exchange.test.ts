import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  createExchange,
  getExchange,
  getUserExchanges,
  joinExchange,
  getParticipants,
} from './exchange';
import { signup } from './auth';
import { prisma } from './db';

describe('Exchange Service - Property-Based Tests', () => {
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

  describe('Property 10: Valid exchange creation', () => {
    // Feature: secret-santa-exchange, Property 10: Valid exchange creation
    // Validates: Requirements 3.1, 3.2, 3.3, 3.5
    it('should create exchange with unique code and organizer as first participant', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // User data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Exchange data
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
          fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
          async (password, name, exchangeName, description, giftBudget, exchangeDate) => {
            // Skip invalid dates
            fc.pre(!isNaN(exchangeDate.getTime()));
            
            // Create unique email using counter and timestamp
            const email = `test-${Date.now()}-${counter++}@test.com`;
            
            // Create organizer user
            const organizer = await signup(email, password, name);

            // Create exchange
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              description,
              gift_budget: giftBudget,
              exchange_date: exchangeDate.toISOString(),
            });

            // Exchange should be created with correct data
            expect(exchange.name).toBe(exchangeName);
            // Prisma returns null for undefined optional fields
            expect(exchange.description).toBe(description ?? null);
            // Use closeTo for floating point comparison to handle precision issues
            if (giftBudget !== undefined) {
              expect(exchange.gift_budget).toBeCloseTo(giftBudget, 5);
            } else {
              expect(exchange.gift_budget).toBeNull();
            }
            expect(exchange.organizer_id).toBe(organizer.id);
            expect(exchange.id).toBeDefined();

            // Exchange should have a unique code
            expect(exchange.code).toBeDefined();
            expect(exchange.code.length).toBeGreaterThanOrEqual(6);
            expect(exchange.code.length).toBeLessThanOrEqual(8);
            expect(exchange.code).toMatch(/^[A-Z0-9]+$/);

            // Verify exchange is stored in database
            const dbExchange = await prisma.exchange.findUnique({
              where: { id: exchange.id },
            });
            expect(dbExchange).not.toBeNull();
            expect(dbExchange?.code).toBe(exchange.code);

            // Organizer should be added as first participant
            const participants = await getParticipants(exchange.id);
            expect(participants).toHaveLength(1);
            expect(participants[0].id).toBe(organizer.id);
            expect(participants[0].email).toBe(email);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout
  });

  describe('Property 11: Exchange code uniqueness', () => {
    // Feature: secret-santa-exchange, Property 11: Exchange code uniqueness
    // Validates: Requirements 3.2
    it('should generate unique codes for all created exchanges', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Create multiple exchanges (reduced to 2-5 for performance)
          fc.array(
            fc.record({
              password: fc.string({ minLength: 1, maxLength: 100 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              exchangeName: fc.string({ minLength: 1, maxLength: 200 }),
              exchangeDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (exchangeData) => {
            // Skip if any dates are invalid
            fc.pre(exchangeData.every(data => !isNaN(data.exchangeDate.getTime())));
            
            const codes = new Set<string>();

            for (const data of exchangeData) {
              // Create unique email using counter and timestamp
              const email = `test-${Date.now()}-${counter++}@test.com`;
              
              // Create organizer
              const organizer = await signup(email, data.password, data.name);

              // Create exchange
              const exchange = await createExchange(organizer.id, {
                name: data.exchangeName,
                exchange_date: data.exchangeDate.toISOString(),
              });

              // Code should be unique
              expect(codes.has(exchange.code)).toBe(false);
              codes.add(exchange.code);
            }

            // All codes should be unique
            expect(codes.size).toBe(exchangeData.length);
          }
        ),
        { numRuns: 10 }
      );
    }, 180000); // 180 second timeout for multiple exchanges
  });

  describe('Property 12: Missing exchange fields rejection', () => {
    // Feature: secret-santa-exchange, Property 12: Missing exchange fields rejection
    // Validates: Requirements 3.4
    it('should reject exchange creation with missing name or exchange_date', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // User data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Exchange data with missing fields
          fc.oneof(
            // Missing name (empty string)
            fc.record({
              name: fc.constant(''),
              exchange_date: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString()),
            }),
            // Missing exchange_date (empty string)
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 200 }),
              exchange_date: fc.constant(''),
            })
          ),
          async (password, name, exchangeData) => {
            // Create unique email using counter and timestamp
            const email = `test-${Date.now()}-${counter++}@test.com`;
            
            // Create organizer user
            const organizer = await signup(email, password, name);

            // Attempt to create exchange with missing field should fail
            await expect(
              createExchange(organizer.id, exchangeData as any)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout
  });

  describe('Property 13: Valid code joins exchange', () => {
    // Feature: secret-santa-exchange, Property 13: Valid code joins exchange
    // Validates: Requirements 4.2, 4.4
    it('should add user as participant when joining with valid exchange code', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Organizer data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Joining user data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Exchange data
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
          async (organizerPassword, organizerName, joinerPassword, joinerName, exchangeName, exchangeDate) => {
            // Skip invalid dates
            fc.pre(!isNaN(exchangeDate.getTime()));
            
            // Create unique emails using counter and timestamp
            const organizerEmail = `organizer-${Date.now()}-${counter++}@test.com`;
            const joinerEmail = `joiner-${Date.now()}-${counter++}@test.com`;
            
            // Create organizer and exchange
            const organizer = await signup(organizerEmail, organizerPassword, organizerName);
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              exchange_date: exchangeDate.toISOString(),
            });

            // Create joining user
            const joiner = await signup(joinerEmail, joinerPassword, joinerName);

            // Join exchange with valid code
            const participant = await joinExchange(joiner.id, exchange.code);

            // Participant should be created
            expect(participant).toBeDefined();
            expect(participant.exchange_id).toBe(exchange.id);
            expect(participant.user_id).toBe(joiner.id);

            // Verify user is now a participant
            const participants = await getParticipants(exchange.id);
            expect(participants).toHaveLength(2); // Organizer + joiner
            expect(participants.some(p => p.id === joiner.id)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout
  });

  describe('Property 14: Duplicate join prevention', () => {
    // Feature: secret-santa-exchange, Property 14: Duplicate join prevention
    // Validates: Requirements 4.3
    it('should prevent duplicate participation when user attempts to join same exchange twice', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Organizer data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Joining user data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Exchange data
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
          async (organizerPassword, organizerName, joinerPassword, joinerName, exchangeName, exchangeDate) => {
            // Create unique emails using counter and timestamp
            const organizerEmail = `organizer-${Date.now()}-${counter++}@test.com`;
            const joinerEmail = `joiner-${Date.now()}-${counter++}@test.com`;
            
            // Create organizer and exchange
            const organizer = await signup(organizerEmail, organizerPassword, organizerName);
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              exchange_date: exchangeDate.toISOString(),
            });

            // Create joining user
            const joiner = await signup(joinerEmail, joinerPassword, joinerName);

            // Join exchange first time
            await joinExchange(joiner.id, exchange.code);

            // Get participant count after first join
            const participantsAfterFirstJoin = await getParticipants(exchange.id);
            const countAfterFirstJoin = participantsAfterFirstJoin.length;

            // Attempt to join again should fail
            await expect(joinExchange(joiner.id, exchange.code)).rejects.toThrow();

            // Participant count should remain unchanged
            const participantsAfterSecondAttempt = await getParticipants(exchange.id);
            expect(participantsAfterSecondAttempt.length).toBe(countAfterFirstJoin);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout
  });

  describe('Property 15: Invalid code rejection', () => {
    // Feature: secret-santa-exchange, Property 15: Invalid code rejection
    // Validates: Requirements 4.5
    it('should reject join attempts with non-existent exchange code', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // User data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          // Invalid code (random string that doesn't exist)
          fc.string({ minLength: 6, maxLength: 8 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'X')),
          async (password, name, invalidCode) => {
            // Create user
            const email = `test-${Date.now()}-${counter++}@test.com`;
            const user = await signup(email, password, name);

            // Attempt to join with invalid code should fail
            await expect(joinExchange(user.id, invalidCode)).rejects.toThrow('Invalid exchange code');
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout
  });
});
