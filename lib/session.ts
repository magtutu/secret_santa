import { cookies } from 'next/headers';
import { validateSession } from './auth';
import type { User } from './types';

/**
 * Gets the current authenticated user from the session cookie
 * This should be called from Server Components or Server Actions
 * @returns User if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  return validateSession(sessionToken);
}

/**
 * Gets the current authenticated user or throws an error
 * Use this in protected routes where authentication is required
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}
