import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { getUserExchanges, getParticipants } from '@/lib/exchange';
import { JoinExchangeForm } from '@/components/JoinExchangeForm';

export default async function DashboardPage() {
  // Get the current authenticated user
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch all exchanges the user is part of
  const exchanges = await getUserExchanges(user.id);

  // Fetch participant counts for each exchange
  const exchangesWithDetails = await Promise.all(
    exchanges.map(async (exchange) => {
      const participants = await getParticipants(exchange.id);
      const isOrganizer = exchange.organizer_id === user.id;
      
      return {
        ...exchange,
        participantCount: participants.length,
        role: isOrganizer ? 'organizer' : 'participant',
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Secret Santa Exchange</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Exchanges</h2>
          <Link
            href="/exchange/create"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Exchange
          </Link>
        </div>

        {/* Join Exchange Form */}
        <div className="mb-6">
          <JoinExchangeForm />
        </div>

        {exchangesWithDetails.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">You haven't joined any exchanges yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Create a new exchange or join one with an exchange code.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exchangesWithDetails.map((exchange) => (
              <Link
                key={exchange.id}
                href={`/exchange/${exchange.id}`}
                className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {exchange.name}
                  </h3>
                  {exchange.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {exchange.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(exchange.exchange_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-medium text-gray-900">
                      {exchange.participantCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        exchange.role === 'organizer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {exchange.role}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
