import { describe, it, expect, afterAll } from 'vitest';
import { verifyDatabaseConnection, disconnectDatabase, prisma } from './db';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

describe('Database Connection', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should successfully connect with correct credentials', async () => {
    // This test verifies that the database connection works
    // If DATABASE_URL is configured correctly, this should not throw
    await expect(verifyDatabaseConnection()).resolves.not.toThrow();
  });

  it('should handle connection errors gracefully', async () => {
    // Create a Prisma client with invalid connection string
    const invalidPool = new Pool({
      connectionString: 'postgresql://invalid:invalid@localhost:9999/nonexistent',
      connectionTimeoutMillis: 2000,
    });
    
    const invalidAdapter = new PrismaPg(invalidPool);
    const invalidPrisma = new PrismaClient({
      adapter: invalidAdapter,
    });

    // Attempt to query with invalid connection
    await expect(async () => {
      await invalidPrisma.$queryRaw`SELECT 1`;
    }).rejects.toThrow();

    // Clean up
    await invalidPrisma.$disconnect();
    await invalidPool.end();
  });

  it('should execute basic queries', async () => {
    // Verify we can execute a simple query
    const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`;
    expect(result).toHaveLength(1);
    expect(result[0].result).toBe(1);
  });
});
