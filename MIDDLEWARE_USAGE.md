# Authentication Middleware Usage

## Overview

The authentication middleware automatically protects routes and manages user sessions across the application.

## How It Works

### Protected Routes

The middleware automatically protects the following routes:
- `/dashboard` - User dashboard
- `/exchange/*` - All exchange-related pages

Unauthenticated users attempting to access these routes will be redirected to `/login` with a `redirect` query parameter to return them to their original destination after login.

### Auth Routes

The middleware handles authentication pages:
- `/login` - Login page
- `/signup` - Signup page

Authenticated users attempting to access these routes will be automatically redirected to `/dashboard`.

### Public Routes

All other routes (like the home page `/`) are public and accessible to everyone.

## Session Management

### In Server Components

Use the session utilities from `lib/session.ts`:

```typescript
import { getCurrentUser, requireAuth } from '@/lib/session';

// Get current user (returns null if not authenticated)
export default async function MyPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.name}!</div>;
}

// Require authentication (throws error if not authenticated)
export default async function ProtectedPage() {
  const user = await requireAuth(); // Will throw if not authenticated
  
  return <div>Welcome, {user.name}!</div>;
}
```

### In API Routes

Access the session token from cookies:

```typescript
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const user = await validateSession(sessionToken);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
  
  // User is authenticated
  return NextResponse.json({ user });
}
```

## Configuration

The middleware is configured in `middleware.ts` at the project root. To add more protected routes, update the `PROTECTED_ROUTES` array:

```typescript
const PROTECTED_ROUTES = ['/dashboard', '/exchange', '/my-new-route'];
```

## Testing

The middleware includes comprehensive tests in `middleware.test.ts` that verify:
- Protected routes redirect unauthenticated users
- Authenticated users can access protected routes
- Auth routes redirect authenticated users to dashboard
- Public routes are accessible to everyone
- Session validation is called correctly

Run tests with:
```bash
npm test middleware.test.ts
```
