# Error Handling and User Feedback

This document describes the comprehensive error handling and user feedback system implemented in the Secret Santa Exchange application.

## Overview

The application implements a multi-layered error handling approach that ensures:
- Consistent error responses across all API routes
- User-friendly error messages
- React error boundaries for catching component errors
- Toast notifications for real-time feedback
- Loading states for async operations
- Form validation error display

## Components

### 1. Error Response Utilities (`lib/errors.ts`)

Provides standardized error handling for API routes:

```typescript
import { createErrorResponse, handleApiError, requireAuth } from '@/lib/errors';

// Create a standardized error response
return createErrorResponse('Error message', 400, ['detail1', 'detail2'], ErrorCodes.VALIDATION_ERROR);

// Handle common API errors automatically
try {
  // ... API logic
} catch (error) {
  return handleApiError(error);
}

// Require authentication with automatic error handling
const authResult = await requireAuth(sessionToken, validateSession);
if ('error' in authResult) {
  return authResult.error;
}
const user = authResult.user;
```

**Error Codes:**
- `VALIDATION_ERROR`: Input validation failures (400)
- `AUTHENTICATION_REQUIRED`: Missing or invalid session (401)
- `UNAUTHORIZED`: Permission denied (403)
- `NOT_FOUND`: Resource not found (404)
- `CONFLICT`: Duplicate resource (409)
- `BAD_REQUEST`: Invalid request (400)
- `INTERNAL_ERROR`: Unexpected server error (500)

### 2. Error Boundary (`components/ErrorBoundary.tsx`)

Catches React component errors and displays a fallback UI:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

Features:
- Displays user-friendly error message
- Shows error details in development mode
- Provides "Refresh Page" and "Go to Dashboard" buttons
- Logs errors to console for debugging

### 3. Toast Notifications (`components/Toast.tsx`)

Provides real-time feedback for user actions:

```typescript
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleAction = async () => {
    try {
      await someAction();
      showToast('Success!', 'success');
    } catch (error) {
      showToast('Error occurred', 'error');
    }
  };
}
```

**Toast Types:**
- `success`: Green toast for successful operations
- `error`: Red toast for errors
- `warning`: Yellow toast for warnings
- `info`: Blue toast for informational messages

**Features:**
- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss with close button
- Stacks multiple toasts
- Accessible with ARIA attributes

### 4. Form Error Display (`components/FormError.tsx`)

Displays validation errors in forms:

```typescript
import { FormError } from '@/components/FormError';

<FormError errors={['Email is required', 'Password must be at least 8 characters']} />
```

Features:
- Displays single error as paragraph
- Displays multiple errors as bulleted list
- Red background with error icon
- Accessible with role="alert"

### 5. Loading States (`components/LoadingSpinner.tsx`)

Provides visual feedback during async operations:

```typescript
import { LoadingSpinner, LoadingPage } from '@/components/LoadingSpinner';

// Inline spinner
<LoadingSpinner size="sm" />  // sm, md, or lg

// Full page loading
<LoadingPage message="Loading your data..." />
```

## Usage Patterns

### API Routes

All API routes follow this pattern:

```typescript
import { createErrorResponse, handleApiError, requireAuth, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const sessionToken = request.cookies.get('session_token')?.value;
    const authResult = await requireAuth(sessionToken, validateSession);
    if ('error' in authResult) {
      return authResult.error;
    }
    const user = authResult.user;

    // 2. Validation
    const validation = validateInput(data);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.errors.join(', '),
        400,
        validation.errors,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 3. Business logic
    const result = await performAction(data);

    // 4. Success response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 5. Error handling
    return handleApiError(error);
  }
}
```

### Client Components

Client components follow this pattern:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { FormError } from '@/components/FormError';

export default function MyPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Success!', 'success');
        router.push('/next-page');
      } else {
        setErrors([result.error || 'Operation failed']);
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      setErrors([errorMessage]);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormError errors={errors} />
      
      {/* Form fields */}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Root Layout Integration

The root layout wraps the entire application with error handling:

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Best Practices

1. **Always validate input** on both client and server side
2. **Use specific error messages** that help users understand what went wrong
3. **Log errors server-side** for debugging while showing user-friendly messages to clients
4. **Provide loading states** for all async operations
5. **Clear errors** when user starts typing in forms
6. **Use toast notifications** for success/error feedback after actions
7. **Handle edge cases** like network failures, timeouts, and unexpected errors
8. **Test error scenarios** to ensure proper error handling

## Testing

All error handling components and utilities have comprehensive tests:

- `lib/errors.test.ts`: Tests for error response utilities
- `components/ErrorBoundary.test.tsx`: Tests for error boundary
- `components/Toast.test.tsx`: Tests for toast notifications
- API route tests verify proper error responses

## Requirements Validation

This implementation satisfies:
- **Requirement 8.2**: Clear feedback about success or failure
- **Requirement 8.3**: User-friendly error messages
