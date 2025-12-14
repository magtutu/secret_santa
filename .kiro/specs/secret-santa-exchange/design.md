# Design Document

## Overview

The Secret Santa Exchange application is a Next.js web application that enables groups to organize secret gift exchanges. The system uses a PostgreSQL database for data persistence and session management, with Tailwind CSS for styling. The architecture follows Next.js conventions with server-side rendering, API routes for backend logic, and a component-based UI structure.

The application handles user authentication, exchange creation and management, participant invitations, and automated secret assignment generation while maintaining the secrecy of gift-giver pairings.

**Multi-Exchange Support**: The system supports multiple concurrent exchanges. Users can create and participate in multiple exchanges simultaneously. Each exchange operates independently with its own participants, assignments, and settings.

**Invitation System**: When an exchange is created, the organizer can invite participants by email addresses. Since email sending is not yet implemented, the system logs invitation details to the console, including the signup/join link for each invited participant.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM/Database Client**: Prisma or pg (node-postgres)
- **Authentication**: next-auth or custom session management with secure cookies
- **Password Hashing**: bcrypt
- **Session Storage**: PostgreSQL database

### Application Structure

```
secret-santa-exchange/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx              # Lists all exchanges user is part of
│   ├── exchange/
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx          # Individual exchange details
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── exchange/
│   │   │   ├── create/
│   │   │   │   └── route.ts
│   │   │   ├── join/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── assign/
│   │   │           └── route.ts
│   │   └── assignment/
│   │       └── [id]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Navigation.tsx
│   └── forms/
│       ├── SignupForm.tsx
│       ├── LoginForm.tsx
│       └── CreateExchangeForm.tsx
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── session.ts
│   └── assignment.ts
├── types/
│   └── index.ts
└── prisma/
    └── schema.prisma
```

## Components and Interfaces

### Database Schema

```typescript
// User table
interface User {
  id: string;              // UUID primary key
  email: string;           // Unique, not null
  password_hash: string;   // Hashed password
  name: string;            // User's display name
  created_at: Date;
  updated_at: Date;
}

// Session table
interface Session {
  id: string;              // UUID primary key
  user_id: string;         // Foreign key to User
  token: string;           // Unique session token
  expires_at: Date;
  created_at: Date;
}

// Exchange table
interface Exchange {
  id: string;              // UUID primary key
  name: string;            // Exchange name
  description: string;     // Optional description
  gift_budget: number;     // Optional budget amount
  exchange_date: Date;     // Date of gift exchange
  code: string;            // Unique shareable code
  organizer_id: string;    // Foreign key to User
  assignments_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

// Participant table (join table)
interface Participant {
  id: string;              // UUID primary key
  exchange_id: string;     // Foreign key to Exchange
  user_id: string;         // Foreign key to User
  joined_at: Date;
}

// Assignment table
interface Assignment {
  id: string;              // UUID primary key
  exchange_id: string;     // Foreign key to Exchange
  giver_id: string;        // Foreign key to User (who gives)
  receiver_id: string;     // Foreign key to User (who receives)
  created_at: Date;
}
```

### API Interfaces

```typescript
// Authentication
interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
}

// Exchange Management
interface CreateExchangeRequest {
  name: string;
  description?: string;
  gift_budget?: number;
  exchange_date: string;
  invitee_emails?: string[];  // Optional list of emails to invite
}

interface JoinExchangeRequest {
  code: string;
}

interface InvitationEmailLog {
  recipient_email: string;
  exchange_name: string;
  organizer_name: string;
  signup_link: string;  // URL with exchange code pre-filled
}

interface ExchangeResponse {
  success: boolean;
  exchange?: {
    id: string;
    name: string;
    description?: string;
    gift_budget?: number;
    exchange_date: string;
    code: string;
    organizer_id: string;
    participants: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    assignments_generated: boolean;
  };
  error?: string;
}

// Assignment
interface AssignmentResponse {
  success: boolean;
  assignment?: {
    receiver_name: string;
    receiver_email: string;
  };
  error?: string;
}
```

### Core Services

```typescript
// Authentication Service
interface AuthService {
  signup(email: string, password: string, name: string): Promise<User>;
  login(email: string, password: string): Promise<Session>;
  logout(sessionToken: string): Promise<void>;
  validateSession(sessionToken: string): Promise<User | null>;
}

// Exchange Service
interface ExchangeService {
  createExchange(organizerId: string, data: CreateExchangeRequest): Promise<Exchange>;
  getExchange(exchangeId: string): Promise<Exchange>;
  getUserExchanges(userId: string): Promise<Exchange[]>;
  joinExchange(userId: string, code: string): Promise<Participant>;
  generateAssignments(exchangeId: string, organizerId: string): Promise<Assignment[]>;
  getParticipants(exchangeId: string): Promise<User[]>;
}

// Assignment Service
interface AssignmentService {
  createAssignmentCycle(participants: User[]): { giverId: string; receiverId: string }[];
  getAssignmentForUser(exchangeId: string, userId: string): Promise<Assignment | null>;
}
```

## Data Models

### User Model
- Represents registered users in the system
- Email must be unique and validated
- Passwords are hashed using bcrypt before storage
- Users can be organizers and/or participants in multiple exchanges

### Session Model
- Stores active user sessions
- Token is a secure random string stored in HTTP-only cookies
- Sessions expire after a configurable period (e.g., 7 days)
- Expired sessions are cleaned up periodically

### Exchange Model
- Represents a secret santa event
- Code is a unique 6-8 character alphanumeric string for easy sharing
- Organizer has special permissions (generate assignments, view all participants)
- Exchange date helps participants know the deadline

### Participant Model
- Join table linking Users to Exchanges
- Prevents duplicate participation (unique constraint on user_id + exchange_id)
- Tracks when each user joined

### Assignment Model
- Stores the secret pairings
- Each participant appears exactly once as giver and once as receiver
- Forms a complete cycle through all participants
- Only visible to the individual giver (not to organizer or other participants)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication and User Management Properties

**Property 1: Valid registration creates user**
*For any* valid registration data (unique email, password, name), submitting the registration should create a user in the database with matching email and name.
**Validates: Requirements 1.1**

**Property 2: Duplicate email rejection**
*For any* existing user email, attempting to register with that email should be rejected with an error.
**Validates: Requirements 1.2**

**Property 3: Password hashing**
*For any* password submitted during registration, the stored password hash should not equal the plaintext password.
**Validates: Requirements 1.3**

**Property 4: Missing required fields rejection**
*For any* registration data with one or more missing required fields (email, password, or name), the registration should be rejected with an error indicating the missing fields.
**Validates: Requirements 1.4**

**Property 5: Successful authentication creates session**
*For any* registered user, logging in with correct credentials should create a valid session that can be used to authenticate subsequent requests.
**Validates: Requirements 1.5, 2.1, 2.4**

**Property 6: Invalid credentials rejection**
*For any* login attempt with incorrect email or password, the system should reject the authentication and return an error.
**Validates: Requirements 2.2**

**Property 7: Protected page authorization**
*For any* protected page, accessing it without a valid session should result in redirection to the login page.
**Validates: Requirements 2.5**

**Property 8: Session destruction on logout**
*For any* active session, logging out should destroy the session such that it cannot be used for subsequent authenticated requests.
**Validates: Requirements 7.1, 7.2**

**Property 9: Post-logout authorization failure**
*For any* user who has logged out, attempting to access protected pages should redirect to the login page.
**Validates: Requirements 7.4**

### Exchange Management Properties

**Property 10: Valid exchange creation**
*For any* valid exchange data (name, exchange date, optional description and budget), creating an exchange should result in a stored exchange with a unique code and the creator as both organizer and first participant.
**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

**Property 11: Exchange code uniqueness**
*For any* set of created exchanges, all exchange codes should be unique.
**Validates: Requirements 3.2**

**Property 12: Missing exchange fields rejection**
*For any* exchange creation request missing required fields (name or exchange date), the creation should be rejected with an error.
**Validates: Requirements 3.4**

**Property 13: Valid code joins exchange**
*For any* valid exchange code and authenticated user not already in the exchange, joining with that code should add the user as a participant.
**Validates: Requirements 4.2, 4.4**

**Property 14: Duplicate join prevention**
*For any* user already participating in an exchange, attempting to join that exchange again should not create a duplicate participant record.
**Validates: Requirements 4.3**

**Property 15: Invalid code rejection**
*For any* non-existent exchange code, attempting to join should be rejected with an error.
**Validates: Requirements 4.5**

**Property 16: Exchange code visibility**
*For any* exchange viewed by its organizer, the rendered output should contain the exchange's shareable code.
**Validates: Requirements 4.1**

### Assignment Properties

**Property 17: Valid assignment structure**
*For any* exchange with 3 or more participants, generating assignments should create a set where each participant appears exactly once as a giver and exactly once as a receiver, with no self-assignments, forming a complete cycle.
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

**Property 18: Assignment information hiding**
*For any* participant viewing their assignment, the response should contain only their receiver's information and not reveal other assignments.
**Validates: Requirements 6.1**

**Property 19: Assignment authorization**
*For any* assignment, only the participant who is the giver should be able to view that assignment; other users should be denied access.
**Validates: Requirements 6.3, 6.4**

### UI and Validation Properties

**Property 20: Required field indicators**
*For any* form with required fields, the rendered markup should include indicators (visual or semantic) identifying which fields are required.
**Validates: Requirements 8.4**

**Property 21: Tailwind CSS usage**
*For any* rendered UI component, the HTML should contain Tailwind CSS utility classes for styling.
**Validates: Requirements 8.6**

## Error Handling

### Authentication Errors
- Invalid credentials: Return 401 with clear error message
- Duplicate email: Return 409 with indication that email exists
- Missing fields: Return 400 with list of required fields
- Session expired: Return 401 and redirect to login

### Exchange Errors
- Invalid exchange code: Return 404 with error message
- Missing required fields: Return 400 with field validation errors
- Insufficient participants for assignment: Return 400 with minimum requirement message
- Unauthorized access: Return 403 with access denied message

### Database Errors
- Connection failure: Log error, return 500 with generic message
- Query failure: Log error, return 500 with generic message
- Constraint violation: Return 409 with appropriate message

### General Error Handling Strategy
- All errors should be logged server-side with full details
- Client-facing errors should be user-friendly without exposing system internals
- API routes should return consistent error response format:
  ```typescript
  {
    success: false,
    error: "User-friendly error message"
  }
  ```
- Validation errors should include field-specific messages
- Unexpected errors should return generic 500 response

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests. Unit tests will focus on:

- **Authentication logic**: Testing password hashing, credential validation, session creation/destruction
- **Exchange code generation**: Verifying uniqueness and format
- **Input validation**: Testing form validation functions for required fields and data formats
- **Database operations**: Testing individual CRUD operations with test database
- **API route handlers**: Testing request/response handling for each endpoint

Unit tests will verify specific examples and edge cases, such as:
- Empty input handling
- Boundary conditions (e.g., exactly 3 participants)
- Error conditions (duplicate emails, invalid codes)
- Integration between components

### Property-Based Testing

The application will use **fast-check** as the property-based testing library. Property-based tests will verify universal properties across many randomly generated inputs.

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format:
```typescript
// Feature: secret-santa-exchange, Property 1: Valid registration creates user
```

**Property Implementation**: Each correctness property listed above will be implemented as a single property-based test. These tests will:

- Generate random valid inputs (users, exchanges, participants)
- Execute the system operations
- Verify the stated property holds
- Use smart generators that constrain inputs to valid ranges

**Key Properties to Test**:
- Assignment structure properties (cycle formation, no self-assignment, complete coverage)
- Authentication properties (session creation, credential validation)
- Data persistence properties (round-trip database operations)
- Authorization properties (access control for assignments and exchanges)
- Uniqueness properties (exchange codes, user emails)
- Idempotence properties (duplicate join prevention)

### Testing Approach

The dual testing approach provides comprehensive coverage:
- **Unit tests** catch concrete bugs in specific scenarios and verify integration points
- **Property tests** verify general correctness across the input space and catch edge cases that might be missed in example-based testing

Together, these testing strategies ensure both specific functionality and general correctness of the Secret Santa Exchange application.

## Implementation Notes

### Security Considerations
- All passwords must be hashed with bcrypt (minimum 10 rounds)
- Session tokens must be cryptographically secure random strings
- Session cookies must be HTTP-only and secure (HTTPS only in production)
- SQL injection prevention through parameterized queries
- CSRF protection for state-changing operations
- **Dual validation**: Input validation must occur on both client-side (immediate feedback) and server-side (security enforcement)
  - Client-side validation using HTML5 validation and JavaScript for UX
  - Server-side validation in API routes to prevent bypassing client validation
  - Both signup and exchange creation forms require dual validation
  - Server must never trust client-submitted data

### Performance Considerations
- Database indexes on frequently queried fields (email, exchange code, session token)
- Connection pooling for database connections
- Efficient assignment algorithm (O(n) time complexity)
- Lazy loading of participant lists for large exchanges

### Assignment Algorithm
The secret santa assignment generation uses a two-layer approach:

**AssignmentService.createAssignmentCycle()**: Pure algorithm that takes a list of participants and returns giver-receiver pairs
1. Shuffle the list of participants randomly
2. Create pairs where each participant gives to the next in the shuffled list
3. The last participant gives to the first, completing the cycle
4. This ensures each person gives to exactly one and receives from exactly one
5. Returns plain objects with giverId and receiverId

**ExchangeService.generateAssignments()**: Orchestration layer that handles business logic
1. Validates the organizer has permission
2. Checks minimum participant count (3+)
3. Fetches participants from database
4. Calls AssignmentService.createAssignmentCycle() to get the pairs
5. Stores the assignments in the database
6. Returns the created Assignment records

This separation keeps the algorithm logic pure and testable while the service layer handles database operations and authorization.

### Database Migrations
- Use Prisma migrations or custom SQL migration scripts
- Version control all schema changes
- Include rollback scripts for each migration
- Test migrations on development database before production

### Environment Configuration
- Database connection string from environment variables
- Session secret from environment variables
- Different configurations for development, test, and production
- Never commit secrets to version control
- Base URL for generating invitation links (e.g., http://localhost:3000 in development)

### Invitation Email Logging
Since email sending is not yet implemented, the system will log invitation details to the console when an exchange is created with invitee emails:

```typescript
// Console output format for each invitee
console.log('=== INVITATION EMAIL ===');
console.log(`To: ${invitee_email}`);
console.log(`Subject: You're invited to ${exchange_name}!`);
console.log(`From: ${organizer_name}`);
console.log(`\nJoin link: ${base_url}/signup?code=${exchange_code}`);
console.log(`\nMessage: ${organizer_name} has invited you to participate in "${exchange_name}".`);
console.log('========================\n');
```

The signup link includes the exchange code as a query parameter, allowing new users to automatically join the exchange after registration.
