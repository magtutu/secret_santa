import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createAssignmentCycle } from './assignment';
import type { User } from './types';

describe('Assignment Service - Property-Based Tests', () => {
  describe('Property 17: Valid assignment structure', () => {
    // Feature: secret-santa-exchange, Property 17: Valid assignment structure
    // Validates: Requirements 5.1, 5.2, 5.3, 5.5
    it('should create valid assignment structure with no self-assignments and complete cycle', () => {
      fc.assert(
        fc.property(
          // Generate arrays of 3 to 20 participants
          fc.array(
            fc.record({
              id: fc.uuid(),
              email: fc.emailAddress(),
              password_hash: fc.string(),
              name: fc.string({ minLength: 1 }),
              created_at: fc.date(),
              updated_at: fc.date(),
            }),
            { minLength: 3, maxLength: 20 }
          ),
          (participants: User[]) => {
            const assignments = createAssignmentCycle(participants);

            // Property 1: Each participant appears exactly once as a giver
            const giverIds = assignments.map(a => a.giverId);
            const uniqueGiverIds = new Set(giverIds);
            expect(giverIds.length).toBe(participants.length);
            expect(uniqueGiverIds.size).toBe(participants.length);

            // Property 2: Each participant appears exactly once as a receiver
            const receiverIds = assignments.map(a => a.receiverId);
            const uniqueReceiverIds = new Set(receiverIds);
            expect(receiverIds.length).toBe(participants.length);
            expect(uniqueReceiverIds.size).toBe(participants.length);

            // Property 3: No self-assignments (no one gives to themselves)
            for (const assignment of assignments) {
              expect(assignment.giverId).not.toBe(assignment.receiverId);
            }

            // Property 4: All givers and receivers are valid participant IDs
            const participantIds = new Set(participants.map(p => p.id));
            for (const assignment of assignments) {
              expect(participantIds.has(assignment.giverId)).toBe(true);
              expect(participantIds.has(assignment.receiverId)).toBe(true);
            }

            // Property 5: Forms a complete cycle
            // Starting from any participant, following the chain should visit everyone exactly once
            // and return to the start
            const assignmentMap = new Map(
              assignments.map(a => [a.giverId, a.receiverId])
            );

            const startId = participants[0].id;
            let currentId = startId;
            const visited = new Set<string>();

            // Follow the chain
            for (let i = 0; i < participants.length; i++) {
              visited.add(currentId);
              const nextId = assignmentMap.get(currentId);
              expect(nextId).toBeDefined();
              currentId = nextId!;
            }

            // Should have visited everyone exactly once
            expect(visited.size).toBe(participants.length);
            // Should return to the start (complete cycle)
            expect(currentId).toBe(startId);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle minimum case of 3 participants', () => {
      const participants: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          password_hash: 'hash1',
          name: 'User 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          password_hash: 'hash2',
          name: 'User 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          email: 'user3@example.com',
          password_hash: 'hash3',
          name: 'User 3',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const assignments = createAssignmentCycle(participants);

      expect(assignments.length).toBe(3);
      
      // Verify no self-assignments
      for (const assignment of assignments) {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      }

      // Verify everyone gives and receives exactly once
      const giverIds = new Set(assignments.map(a => a.giverId));
      const receiverIds = new Set(assignments.map(a => a.receiverId));
      expect(giverIds.size).toBe(3);
      expect(receiverIds.size).toBe(3);
    });

    it('should throw error for fewer than 2 participants', () => {
      const singleParticipant: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          password_hash: 'hash1',
          name: 'User 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      expect(() => createAssignmentCycle(singleParticipant)).toThrow(
        'At least 2 participants are required to create assignments'
      );

      expect(() => createAssignmentCycle([])).toThrow(
        'At least 2 participants are required to create assignments'
      );
    });
  });
});
