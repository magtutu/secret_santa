import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderToString } from 'react-dom/server';
import { signup } from '@/lib/auth';
import { createExchange } from '@/lib/exchange';
import { prisma } from '@/lib/db';

// We'll test the page logic by mocking the session and checking the rendered output
vi.mock('@/lib/session', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('@/components/Toast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
  ToastProvider: ({ children }: any) => children,
}));

describe('Exchange Detail Page - Property-Based Tests', () => {
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

  describe('Property 16: Exchange code visibility', () => {
    // Feature: secret-santa-exchange, Property 16: Exchange code visibility
    // Validates: Requirements 4.1
    it('should display exchange code when viewed by organizer', async () => {
      let counter = 0;
      await fc.assert(
        fc.asyncProperty(
          // Organizer data
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
            const email = `organizer-${Date.now()}-${counter++}@test.com`;
            
            // Create organizer user
            const organizer = await signup(email, password, name);

            // Create exchange
            const exchange = await createExchange(organizer.id, {
              name: exchangeName,
              description,
              gift_budget: giftBudget,
              exchange_date: exchangeDate.toISOString(),
            });

            // Mock getCurrentUser to return the organizer
            const { getCurrentUser } = await import('@/lib/session');
            vi.mocked(getCurrentUser).mockResolvedValue(organizer);

            // Import and render the page component
            const ExchangeDetailPage = (await import('./page')).default;
            const params = Promise.resolve({ id: exchange.id });
            const result = await ExchangeDetailPage({ params });

            // Render the React element to HTML string
            const rendered = renderToString(result);

            // The exchange code should be present in the rendered output for the organizer
            expect(rendered).toContain(exchange.code);
          }
        ),
        { numRuns: 10 }
      );
    }, 120000); // 120 second timeout
  });
});
