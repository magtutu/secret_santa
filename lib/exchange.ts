import { randomBytes } from 'crypto';
import { prisma } from './db';
import type { Exchange, User, Participant, Assignment } from './types';
import { createAssignmentCycle } from './assignment';

const EXCHANGE_CODE_LENGTH = 8;
const MAX_CODE_GENERATION_ATTEMPTS = 10;

/**
 * Generates a unique alphanumeric exchange code
 */
async function generateUniqueExchangeCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    // Generate random alphanumeric code (6-8 characters)
    const code = randomBytes(EXCHANGE_CODE_LENGTH)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, EXCHANGE_CODE_LENGTH)
      .toUpperCase();
    
    // Check if code already exists
    const existing = await prisma.exchange.findUnique({
      where: { code },
    });
    
    if (!existing) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique exchange code');
}

/**
 * Creates a new exchange with the organizer as the first participant
 * @throws Error if required fields are missing or validation fails
 */
export async function createExchange(
  organizerId: string,
  data: {
    name: string;
    description?: string;
    gift_budget?: number;
    exchange_date: string;
  }
): Promise<Exchange> {
  // Validate required fields
  if (!data.name || !data.exchange_date) {
    throw new Error('Missing required fields: name and exchange_date are required');
  }

  // Generate unique code
  const code = await generateUniqueExchangeCode();

  // Parse exchange date
  const exchangeDate = new Date(data.exchange_date);
  if (isNaN(exchangeDate.getTime())) {
    throw new Error('Invalid exchange_date format');
  }

  // Create exchange and add organizer as first participant in a transaction
  const exchange = await prisma.$transaction(async (tx) => {
    // Create the exchange
    const newExchange = await tx.exchange.create({
      data: {
        name: data.name,
        description: data.description,
        gift_budget: data.gift_budget,
        exchange_date: exchangeDate,
        code,
        organizer_id: organizerId,
      },
    });

    // Add organizer as first participant
    await tx.participant.create({
      data: {
        exchange_id: newExchange.id,
        user_id: organizerId,
      },
    });

    return newExchange;
  });

  return exchange;
}

/**
 * Retrieves an exchange by ID
 * @throws Error if exchange not found
 */
export async function getExchange(exchangeId: string): Promise<Exchange> {
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
  });

  if (!exchange) {
    throw new Error('Exchange not found');
  }

  return exchange;
}

/**
 * Retrieves all exchanges a user is participating in
 */
export async function getUserExchanges(userId: string): Promise<Exchange[]> {
  const participants = await prisma.participant.findMany({
    where: { user_id: userId },
    include: { exchange: true },
  });

  return participants.map((p) => p.exchange);
}

/**
 * Adds a user to an exchange using the exchange code
 * @throws Error if code is invalid or user is already a participant
 */
export async function joinExchange(userId: string, code: string): Promise<Participant> {
  // Find exchange by code
  const exchange = await prisma.exchange.findUnique({
    where: { code },
  });

  if (!exchange) {
    throw new Error('Invalid exchange code');
  }

  // Check if user is already a participant
  const existingParticipant = await prisma.participant.findUnique({
    where: {
      exchange_id_user_id: {
        exchange_id: exchange.id,
        user_id: userId,
      },
    },
  });

  if (existingParticipant) {
    throw new Error('User is already a participant in this exchange');
  }

  // Add user as participant
  const participant = await prisma.participant.create({
    data: {
      exchange_id: exchange.id,
      user_id: userId,
    },
  });

  return participant;
}

/**
 * Retrieves all participants for an exchange
 */
export async function getParticipants(exchangeId: string): Promise<User[]> {
  const participants = await prisma.participant.findMany({
    where: { exchange_id: exchangeId },
    include: { user: true },
  });

  return participants.map((p) => p.user);
}

/**
 * Generates secret santa assignments for an exchange
 * @throws Error if user is not the organizer, insufficient participants, or assignments already generated
 */
export async function generateAssignments(
  exchangeId: string,
  organizerId: string
): Promise<Assignment[]> {
  // Get the exchange
  const exchange = await prisma.exchange.findUnique({
    where: { id: exchangeId },
  });

  if (!exchange) {
    throw new Error('Exchange not found');
  }

  // Verify the user is the organizer
  if (exchange.organizer_id !== organizerId) {
    throw new Error('Only the organizer can generate assignments');
  }

  // Check if assignments already generated
  if (exchange.assignments_generated) {
    throw new Error('Assignments have already been generated for this exchange');
  }

  // Get all participants
  const participants = await getParticipants(exchangeId);

  // Validate minimum participant count
  if (participants.length < 3) {
    throw new Error('At least 3 participants are required to generate assignments');
  }

  // Generate assignment pairs using the pure algorithm
  const assignmentPairs = createAssignmentCycle(participants);

  // Store assignments in database and mark exchange as assignments_generated
  const assignments = await prisma.$transaction(async (tx) => {
    // Create all assignments
    const createdAssignments = await Promise.all(
      assignmentPairs.map((pair) =>
        tx.assignment.create({
          data: {
            exchange_id: exchangeId,
            giver_id: pair.giverId,
            receiver_id: pair.receiverId,
          },
        })
      )
    );

    // Mark exchange as assignments generated
    await tx.exchange.update({
      where: { id: exchangeId },
      data: { assignments_generated: true },
    });

    return createdAssignments;
  });

  return assignments;
}
