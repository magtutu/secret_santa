import type { User } from './types';

/**
 * Shuffles an array using Fisher-Yates algorithm
 * Creates a new array to avoid mutating the original
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a cycle of secret santa assignments
 * 
 * This is a pure function that takes participants and returns assignment pairs.
 * Each participant will give to exactly one other participant and receive from exactly one.
 * The algorithm creates a complete cycle with no self-assignments.
 * 
 * Algorithm:
 * 1. Shuffle the participants randomly
 * 2. Create pairs where each participant gives to the next in the shuffled list
 * 3. The last participant gives to the first, completing the cycle
 * 
 * @param participants - Array of users participating in the exchange
 * @returns Array of assignment pairs with giverId and receiverId
 * @throws Error if fewer than 2 participants (need at least 2 for valid assignments)
 */
export function createAssignmentCycle(
  participants: User[]
): Array<{ giverId: string; receiverId: string }> {
  // Validate minimum participants
  if (participants.length < 2) {
    throw new Error('At least 2 participants are required to create assignments');
  }

  // Shuffle participants to randomize assignments
  const shuffled = shuffleArray(participants);

  // Create assignment pairs in a cycle
  const assignments: Array<{ giverId: string; receiverId: string }> = [];

  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i];
    // Next person in the cycle (wraps around to first person for the last giver)
    const receiver = shuffled[(i + 1) % shuffled.length];

    assignments.push({
      giverId: giver.id,
      receiverId: receiver.id,
    });
  }

  return assignments;
}
