import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  signup, 
  login, 
  logout, 
  validateSession, 
  hashPassword,
  verifyPassword 
} from './auth';
import { prisma } from './db';

describe('Authentication Service - Property-Based Tests', () => {
  describe('Property 3: Password hashing', () => {
    // Feature: secret-santa-exchange, Property 3: Password hashing
    // Validates: Requirements 1.3
    it('should never store passwords in plaintext', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (password) => {
            const hash = await hashPassword(password);
            // The hash should never equal the plaintext password
            expect(hash).not.toBe(password);
            // The hash should be a valid bcrypt hash (starts with $2b$ or $2a$)
            expect(hash).toMatch(/^\$2[ab]\$/);
          }
        ),
        { numRuns: 10 }
      );
    }, 30000); // 30 second timeout for 100 bcrypt operations
  });

  describe('Database-dependent properties', () => {
    beforeAll(async () => {
      await prisma.$connect();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    beforeEach(async () => {
      // Clean up test data before each test
      await prisma.session.deleteMany({});
      await prisma.user.deleteMany({});
    });

    describe('Property 1: Valid registration creates user', () => {
      // Feature: secret-santa-exchange, Property 1: Valid registration creates user
      // Validates: Requirements 1.1
      it('should create a user with matching email and name for valid registration data', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (email, password, name) => {
              const user = await signup(email, password, name);
              
              // User should be created with matching email and name
              expect(user.email).toBe(email);
              expect(user.name).toBe(name);
              expect(user.id).toBeDefined();
              
              // Verify user exists in database
              const dbUser = await prisma.user.findUnique({
                where: { email },
              });
              expect(dbUser).not.toBeNull();
              expect(dbUser?.email).toBe(email);
              expect(dbUser?.name).toBe(name);
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });

    describe('Property 2: Duplicate email rejection', () => {
      // Feature: secret-santa-exchange, Property 2: Duplicate email rejection
      // Validates: Requirements 1.2
      it('should reject registration attempts with existing email', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (email, password1, name1, password2, name2) => {
              // Create first user with the email
              await signup(email, password1, name1);
              
              // Attempt to create second user with same email should fail
              await expect(signup(email, password2, name2)).rejects.toThrow('Email already exists');
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });

    describe('Property 4: Missing required fields rejection', () => {
      // Feature: secret-santa-exchange, Property 4: Missing required fields rejection
      // Validates: Requirements 1.4
      it('should reject registration with missing email, password, or name', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.oneof(
              // Missing email (empty string)
              fc.record({
                email: fc.constant(''),
                password: fc.string({ minLength: 1, maxLength: 100 }),
                name: fc.string({ minLength: 1, maxLength: 100 }),
              }),
              // Missing password (empty string)
              fc.record({
                email: fc.emailAddress(),
                password: fc.constant(''),
                name: fc.string({ minLength: 1, maxLength: 100 }),
              }),
              // Missing name (empty string)
              fc.record({
                email: fc.emailAddress(),
                password: fc.string({ minLength: 1, maxLength: 100 }),
                name: fc.constant(''),
              })
            ),
            async (data) => {
              // Attempt to signup with missing field should fail
              await expect(signup(data.email, data.password, data.name)).rejects.toThrow('Missing required fields');
            }
          ),
          { numRuns: 10 }
        );
      }, 30000); // 30 second timeout
    });

    describe('Property 5: Successful authentication creates session', () => {
      // Feature: secret-santa-exchange, Property 5: Successful authentication creates session
      // Validates: Requirements 1.5, 2.1, 2.4
      it('should create a valid session that can authenticate subsequent requests', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (email, password, name) => {
              // Create user
              const user = await signup(email, password, name);
              
              // Login with correct credentials
              const session = await login(email, password);
              
              // Session should be created
              expect(session).toBeDefined();
              expect(session.token).toBeDefined();
              expect(session.user_id).toBe(user.id);
              
              // Session should be valid for authentication
              const validatedUser = await validateSession(session.token);
              expect(validatedUser).not.toBeNull();
              expect(validatedUser?.id).toBe(user.id);
              expect(validatedUser?.email).toBe(email);
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });

    describe('Property 6: Invalid credentials rejection', () => {
      // Feature: secret-santa-exchange, Property 6: Invalid credentials rejection
      // Validates: Requirements 2.2
      it('should reject login attempts with incorrect email or password', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.oneof(
              // Wrong email
              fc.emailAddress(),
              // Wrong password
              fc.string({ minLength: 1, maxLength: 100 })
            ),
            async (email, password, name, wrongCredential) => {
              // Create user
              await signup(email, password, name);
              
              // Try login with wrong email (if wrongCredential is an email)
              if (wrongCredential.includes('@') && wrongCredential !== email) {
                await expect(login(wrongCredential, password)).rejects.toThrow('Invalid credentials');
              }
              
              // Try login with wrong password (if wrongCredential is not the correct password)
              if (wrongCredential !== password) {
                await expect(login(email, wrongCredential)).rejects.toThrow('Invalid credentials');
              }
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });

    describe('Property 7: Protected page authorization', () => {
      // Feature: secret-santa-exchange, Property 7: Protected page authorization
      // Validates: Requirements 2.5
      it('should return null when validating session without valid token', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.oneof(
              // Invalid token (random string)
              fc.string({ minLength: 1, maxLength: 100 }),
              // Empty token
              fc.constant(''),
              // Non-existent token (valid hex format but not in database)
              fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join(''))
            ),
            async (invalidToken) => {
              // Attempting to validate an invalid session should return null
              const user = await validateSession(invalidToken);
              expect(user).toBeNull();
            }
          ),
          { numRuns: 10 }
        );
      }, 30000); // 30 second timeout
    });

    describe('Property 8: Session destruction on logout', () => {
      // Feature: secret-santa-exchange, Property 8: Session destruction on logout
      // Validates: Requirements 7.1, 7.2
      it('should destroy session so it cannot be used for subsequent authenticated requests', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (email, password, name) => {
              // Create user and login
              await signup(email, password, name);
              const session = await login(email, password);
              
              // Session should be valid before logout
              const userBeforeLogout = await validateSession(session.token);
              expect(userBeforeLogout).not.toBeNull();
              
              // Logout
              await logout(session.token);
              
              // Session should no longer be valid after logout
              const userAfterLogout = await validateSession(session.token);
              expect(userAfterLogout).toBeNull();
              
              // Verify session is removed from database
              const dbSession = await prisma.session.findUnique({
                where: { token: session.token },
              });
              expect(dbSession).toBeNull();
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });

    describe('Property 9: Post-logout authorization failure', () => {
      // Feature: secret-santa-exchange, Property 9: Post-logout authorization failure
      // Validates: Requirements 7.4
      it('should return null when validating session after logout', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            async (email, password, name) => {
              // Create user and login
              await signup(email, password, name);
              const session = await login(email, password);
              
              // Logout
              await logout(session.token);
              
              // Attempting to validate the session after logout should return null
              const user = await validateSession(session.token);
              expect(user).toBeNull();
            }
          ),
          { numRuns: 10 }
        );
      }, 60000); // 60 second timeout
    });
  });
});
