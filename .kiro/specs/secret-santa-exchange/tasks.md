# Implementation Plan

- [x] 1. Initialize Next.js project with dependencies
  - Create Next.js 14+ project with App Router
  - Install and configure Tailwind CSS
  - Install database dependencies (Prisma or pg)
  - Install bcrypt for password hashing
  - Install fast-check for property-based testing
  - Install Vitest for unit testing
  - Set up TypeScript configuration
  - _Requirements: 10.1, 8.6_

- [x] 2. Set up database schema and connection
  - Create Prisma schema or SQL migration files for User, Session, Exchange, Participant, and Assignment tables
  - Configure database connection with environment variables (localhost, postgres/password)
  - Create database client/connection module
  - Add database indexes for email, exchange code, and session token
  - _Requirements: 9.2_

- [x] 2.1 Write unit tests for database connection
  - Test successful connection with correct credentials
  - Test connection error handling
  - _Requirements: 9.2_

- [x] 3. Implement authentication service and password hashing
  - Create auth service module with signup, login, logout, and validateSession functions
  - Implement bcrypt password hashing (minimum 10 rounds)
  - Implement secure session token generation
  - Create session management utilities
  - _Requirements: 1.1, 1.3, 2.1, 7.1_

- [x] 3.1 Write property test for password hashing
  - **Property 3: Password hashing**
  - **Validates: Requirements 1.3**

- [x] 3.2 Write property test for valid registration
  - **Property 1: Valid registration creates user**
  - **Validates: Requirements 1.1**

- [x] 3.3 Write property test for duplicate email rejection
  - **Property 2: Duplicate email rejection**
  - **Validates: Requirements 1.2**

- [x] 3.4 Write property test for missing fields rejection
  - **Property 4: Missing required fields rejection**
  - **Validates: Requirements 1.4**

- [x] 3.5 Write property test for session creation
  - **Property 5: Successful authentication creates session**
  - **Validates: Requirements 1.5, 2.1, 2.4**

- [x] 3.6 Write property test for invalid credentials
  - **Property 6: Invalid credentials rejection**
  - **Validates: Requirements 2.2**

- [x] 4. Create validation utilities
  - Create shared validation functions for email format, password strength, required fields
  - Create validation schemas for signup and exchange creation forms
  - Ensure validation can be used on both client and server
  - _Requirements: 1.4, 3.4_

- [x] 4.1 Write unit tests for validation utilities
  - Test email validation with valid and invalid formats
  - Test required field validation
  - Test password strength requirements
  - _Requirements: 1.4, 3.4_

- [x] 5. Implement signup API route and page
  - Create POST /api/auth/signup route with server-side validation
  - Implement user creation with password hashing
  - Create session after successful signup
  - Handle duplicate email errors
  - Create signup page with form and client-side validation
  - Handle query parameter for exchange code (auto-join after signup)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5.1 Write unit tests for signup API route
  - Test successful signup flow
  - Test duplicate email handling
  - Test validation error responses
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 6. Implement login API route and page
  - Create POST /api/auth/login route with credential validation
  - Verify password against hash
  - Create session on successful login
  - Create login page with form and client-side validation
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.1 Write property test for protected page authorization
  - **Property 7: Protected page authorization**
  - **Validates: Requirements 2.5**

- [x] 7. Implement logout API route
  - Create POST /api/auth/logout route
  - Destroy session and remove from database
  - Clear session cookie
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 7.1 Write property test for session destruction
  - **Property 8: Session destruction on logout**
  - **Validates: Requirements 7.1, 7.2**

- [x] 7.2 Write property test for post-logout authorization
  - **Property 9: Post-logout authorization failure**
  - **Validates: Requirements 7.4**

- [ ] 8. Create authentication middleware
  - Create middleware to validate session tokens
  - Implement redirect logic for unauthenticated users
  - Protect dashboard and exchange pages
  - _Requirements: 2.5, 7.4_

- [ ] 9. Implement exchange service
  - Create exchange service module with createExchange, getExchange, getUserExchanges, joinExchange, and getParticipants functions
  - Implement unique exchange code generation (6-8 alphanumeric characters)
  - Implement logic to add organizer as first participant
  - _Requirements: 3.1, 3.2, 3.3, 4.2_

- [ ] 9.1 Write property test for valid exchange creation
  - **Property 10: Valid exchange creation**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [ ] 9.2 Write property test for exchange code uniqueness
  - **Property 11: Exchange code uniqueness**
  - **Validates: Requirements 3.2**

- [ ] 9.3 Write property test for missing exchange fields
  - **Property 12: Missing exchange fields rejection**
  - **Validates: Requirements 3.4**

- [ ] 10. Implement create exchange API route and page
  - Create POST /api/exchange/create route with server-side validation
  - Handle exchange creation with organizer as first participant
  - Process optional invitee_emails array
  - Log invitation emails to console with signup links
  - Create exchange creation page with form and client-side validation
  - Include optional email invitation field
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10.1 Write unit tests for invitation email logging
  - Test console output format
  - Test signup link generation with exchange code
  - _Requirements: 3.5_

- [ ] 11. Implement join exchange API route
  - Create POST /api/exchange/join route
  - Validate exchange code exists
  - Prevent duplicate participation
  - Add user as participant
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 11.1 Write property test for valid code joins
  - **Property 13: Valid code joins exchange**
  - **Validates: Requirements 4.2, 4.4**

- [ ] 11.2 Write property test for duplicate join prevention
  - **Property 14: Duplicate join prevention**
  - **Validates: Requirements 4.3**

- [ ] 11.3 Write property test for invalid code rejection
  - **Property 15: Invalid code rejection**
  - **Validates: Requirements 4.5**

- [ ] 12. Implement dashboard page
  - Create dashboard page that fetches and displays all exchanges for logged-in user
  - Show exchange name, date, participant count, and role (organizer/participant)
  - Add navigation to create new exchange
  - Add links to individual exchange pages
  - _Requirements: 2.3, 3.5_

- [ ] 13. Implement assignment service
  - Create assignment service module with createAssignmentCycle function
  - Implement randomized cycle algorithm (shuffle participants, create chain, close loop)
  - Ensure no self-assignments
  - Ensure complete cycle formation
  - Keep algorithm pure (no database operations)
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 13.1 Write property test for assignment structure
  - **Property 17: Valid assignment structure**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ] 14. Implement generate assignments API route
  - Create POST /api/exchange/[id]/assign route
  - Verify organizer permission
  - Check minimum participant count (3+)
  - Call assignment service to generate cycle
  - Store assignments in database
  - _Requirements: 5.1, 5.4, 5.5_

- [ ] 14.1 Write unit tests for assignment generation
  - Test organizer permission check
  - Test minimum participant validation
  - Test assignment storage
  - _Requirements: 5.4, 5.5_

- [ ] 15. Implement exchange detail page
  - Create exchange/[id]/page.tsx to display exchange details
  - Show exchange name, description, budget, date, and code
  - List all participants
  - Show "Generate Assignments" button for organizer (if not yet generated)
  - Show "View My Assignment" button for participants (if assignments generated)
  - Handle assignment generation trigger
  - _Requirements: 4.1, 5.1, 6.2_

- [ ] 15.1 Write property test for exchange code visibility
  - **Property 16: Exchange code visibility**
  - **Validates: Requirements 4.1**

- [ ] 16. Implement assignment viewing
  - Create GET /api/assignment/[exchangeId] route
  - Verify user is participant in exchange
  - Return only the user's receiver information
  - Prevent viewing other participants' assignments
  - Add assignment display to exchange detail page
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 16.1 Write property test for assignment information hiding
  - **Property 18: Assignment information hiding**
  - **Validates: Requirements 6.1**

- [ ] 16.2 Write property test for assignment authorization
  - **Property 19: Assignment authorization**
  - **Validates: Requirements 6.3, 6.4**

- [ ] 17. Implement UI components with Tailwind CSS
  - Create reusable Button component with Tailwind classes
  - Create reusable Input component with Tailwind classes and required field indicators
  - Create reusable Card component with Tailwind classes
  - Create Navigation component with Tailwind classes
  - Ensure responsive design with Tailwind breakpoints
  - _Requirements: 8.1, 8.4, 8.5, 8.6_

- [ ] 17.1 Write property test for required field indicators
  - **Property 20: Required field indicators**
  - **Validates: Requirements 8.4**

- [ ] 17.2 Write property test for Tailwind CSS usage
  - **Property 21: Tailwind CSS usage**
  - **Validates: Requirements 8.6**

- [ ] 18. Add error handling and user feedback
  - Implement consistent error response format for all API routes
  - Add error boundary components for React errors
  - Add toast/notification system for user feedback
  - Display validation errors on forms
  - Handle loading states during API calls
  - _Requirements: 8.2, 8.3_

- [ ] 19. Implement home/landing page
  - Create root page.tsx with welcome message
  - Add links to login and signup
  - Style with Tailwind CSS
  - _Requirements: 8.1, 8.6_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Verify all features work end-to-end
  - Check database operations
  - Verify authentication flows
  - Test exchange creation and joining
  - Test assignment generation and viewing
  - Ask the user if questions arise
