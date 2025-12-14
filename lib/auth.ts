import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from './db';
import type { User, Session } from './types';

const BCRYPT_ROUNDS = 10;
const SESSION_TOKEN_BYTES = 32;
const SESSION_EXPIRY_DAYS = 7;

/**
 * Generates a secure random session token
 */
function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

/**
 * Calculates session expiry date
 */
function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS);
  return expiry;
}

/**
 * Hashes a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a new user account
 * @throws Error if email already exists or validation fails
 */
export async function signup(
  email: string,
  password: string,
  name: string
): Promise<User> {
  // Validate required fields
  if (!email || !password || !name) {
    throw new Error('Missing required fields: email, password, and name are required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      name,
    },
  });

  return user;
}

/**
 * Authenticates a user and creates a session
 * @throws Error if credentials are invalid
 */
export async function login(email: string, password: string): Promise<Session> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Create session
  const token = generateSessionToken();
  const expires_at = getSessionExpiry();

  const session = await prisma.session.create({
    data: {
      user_id: user.id,
      token,
      expires_at,
    },
  });

  return session;
}

/**
 * Destroys a session (logout)
 */
export async function logout(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { token: sessionToken },
  });
}

/**
 * Validates a session token and returns the associated user
 * @returns User if session is valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expires_at < new Date()) {
    // Delete expired session
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return session.user;
}
