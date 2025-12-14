# Secret Santa Exchange

A web application for organizing and managing secret gift exchanges. Create exchanges, invite participants, and let the system handle secret santa assignments automatically.

Note: this application was built entirely with Kiro. It took about 5 hours of human time and around 155 credits of time using Claude Sonnet 4.5.

This seems to have cost approximately 155 / 1000 (credits/mo) * $20 (per month per 1000 credits) = $3.10 total.

## Features

- 🎁 **Easy Exchange Creation** - Set up gift exchanges with customizable details (name, date, budget)
- 🔒 **Secure Authentication** - User registration and login with encrypted passwords
- 👥 **Simple Invitations** - Share a unique code for participants to join
- 🎲 **Automated Assignments** - Generate random secret santa pairings with one click
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Clean interface built with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Authentication**: Custom session-based auth with bcrypt
- **Testing**: Vitest with property-based testing (fast-check)
- **Language**: TypeScript

## Prerequisites

- Node.js 20+ and npm
- Docker (for running PostgreSQL)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd secret-santa-exchange
```

### 2. Set Up Environment Variables

Rename the sample environment file and configure it:

```bash
cp .env.sample .env
```

Edit `.env` and update any necessary values (the defaults work for local development):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/secret_santa"
SESSION_SECRET="your-secret-key-here"
BASE_URL="http://localhost:3000"
```

**Important**: In production, change `SESSION_SECRET` to a secure random string. Generate one with:
```bash
openssl rand -base64 32
```

### 3. Start PostgreSQL Database

Pull and run a PostgreSQL Docker container:

```bash
# Pull the PostgreSQL image
docker pull postgres:16

# Run PostgreSQL with default password
docker run --name secret-santa-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=secret_santa \
  -p 5432:5432 \
  -d postgres:16
```

To stop the database later:
```bash
docker stop secret-santa-db
```

### 4. Install Dependencies

```bash
npm ci
```

### 5. Set Up the Database

Generate Prisma Client and push the schema to the database:

```bash
npx prisma generate
npx prisma db push
```

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Production Deployment

To build and run the application in production mode:

### 1. Set Production Environment Variables

Update your `.env` file with production values:

```env
DATABASE_URL="postgresql://user:password@your-db-host:5432/secret_santa"
SESSION_SECRET="<generate-secure-random-string>"
BASE_URL="https://your-domain.com"
```

### 2. Build the Application

```bash
npm ci
npx prisma generate
npx prisma db push  # Or use migrations: npx prisma migrate deploy
npm run build
```

### 3. Start the Production Server

```bash
npm start
```

The production server will run on port 3000 by default. Use a process manager like PM2 or run it behind a reverse proxy (nginx, Apache) for production deployments.

## Running Tests

The project includes comprehensive test coverage with both unit tests and property-based tests.

### Run All Tests

```bash
npm test
```

This runs all tests once and exits. Perfect for CI/CD pipelines.

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Tests will re-run automatically when you make changes to files.

### Test Coverage

The test suite includes:
- **130+ tests** covering all major functionality
- **Unit tests** - Test individual functions and components
- **Property-based tests** - Test universal properties with 100+ random inputs per test
- **Integration tests** - Test API routes and database operations

All tests must pass before deploying to production.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Start the production server
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database

## Usage

### Creating an Exchange

1. Sign up for an account or log in
2. Click "Create New Exchange" from the dashboard
3. Fill in the exchange details:
   - Name (required)
   - Description (optional)
   - Gift budget (optional)
   - Exchange date (required)
   - Invitee emails (optional)
4. Share the generated exchange code with participants

### Joining an Exchange

1. Sign up for an account or log in
2. Enter the exchange code on the dashboard
3. Click "Join Exchange"

### Generating Assignments

1. As the organizer, navigate to your exchange
2. Wait for at least 3 participants to join
3. Click "Generate Assignments"
4. Each participant can now view their secret santa assignment
5. As the organizer, you can view all assignments

## Database Schema

The application uses five main tables:

- **User** - User accounts with encrypted passwords
- **Session** - Active user sessions
- **Exchange** - Gift exchange events
- **Participant** - Join table linking users to exchanges
- **Assignment** - Secret santa pairings

## Testing

The project includes comprehensive test coverage:

- **Unit tests** - Test individual functions and components
- **Property-based tests** - Test universal properties across many inputs
- **Integration tests** - Test API routes and database operations

Run tests:
```bash
npm test
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Ensure PostgreSQL is running:
   ```bash
   docker ps | grep secret-santa-db
   ```

2. Check the DATABASE_URL in `.env` matches your setup

3. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Styling Not Working

If Tailwind CSS styles aren't loading:

1. Ensure you're using Tailwind CSS v4
2. Check that `app/globals.css` contains: `@import "tailwindcss";`
3. Restart the dev server

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
