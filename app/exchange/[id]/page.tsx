import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { getExchange, getParticipants } from '@/lib/exchange';
import { prisma } from '@/lib/db';
import { GenerateAssignmentsButton } from '@/components/GenerateAssignmentsButton';

interface ExchangeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExchangeDetailPage({ params }: ExchangeDetailPageProps) {
  // Get the current authenticated user
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch exchange details
  let exchange;
  try {
    exchange = await getExchange(id);
  } catch (error) {
    notFound();
  }

  // Fetch participants
  const participants = await getParticipants(id);

  // Check if user is a participant
  const isParticipant = participants.some(p => p.id === user.id);
  
  if (!isParticipant) {
    redirect('/dashboard');
  }

  // Check if user is the organizer
  const isOrganizer = exchange.organizer_id === user.id;

  // Check if user has an assignment
  let userAssignment = null;
  if (exchange.assignments_generated) {
    userAssignment = await prisma.assignment.findUnique({
      where: {
        exchange_id_giver_id: {
          exchange_id: id,
          giver_id: user.id,
        },
      },
      include: {
        receiver: true,
      },
    });
  }

  // Fetch all assignments if organizer, ordered by when giver joined
  let allAssignments = null;
  if (isOrganizer && exchange.assignments_generated) {
    // First get all participants with their join times
    const participantsWithJoinTime = await prisma.participant.findMany({
      where: {
        exchange_id: id,
      },
      select: {
        user_id: true,
        joined_at: true,
      },
    });

    // Create a map of user_id to joined_at
    const joinTimeMap = new Map(
      participantsWithJoinTime.map(p => [p.user_id, p.joined_at])
    );

    // Fetch all assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        exchange_id: id,
      },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Sort by when the giver joined
    allAssignments = assignments.sort((a, b) => {
      const aJoinTime = joinTimeMap.get(a.giver_id)?.getTime() || 0;
      const bJoinTime = joinTimeMap.get(b.giver_id)?.getTime() || 0;
      return aJoinTime - bJoinTime;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                Secret Santa Exchange
              </Link>
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
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Exchange Details Card */}
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{exchange.name}</h1>
          
          {exchange.description && (
            <p className="text-gray-700 mb-4">{exchange.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-600">Exchange Date:</span>
              <p className="text-lg text-gray-900">
                {new Date(exchange.exchange_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {exchange.gift_budget && (
              <div>
                <span className="text-sm font-medium text-gray-600">Gift Budget:</span>
                <p className="text-lg text-gray-900">${exchange.gift_budget.toFixed(2)}</p>
              </div>
            )}

            {isOrganizer && (
              <div>
                <span className="text-sm font-medium text-gray-600">Exchange Code:</span>
                <p className="text-lg font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded inline-block">
                  {exchange.code}
                </p>
                <p className="text-xs text-gray-500 mt-1">Share this code with participants</p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-600">Your Role:</span>
              <p className="text-lg">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    isOrganizer
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isOrganizer ? 'Organizer' : 'Participant'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {isOrganizer && !exchange.assignments_generated && participants.length >= 3 && (
              <GenerateAssignmentsButton exchangeId={id} />
            )}

            {exchange.assignments_generated && userAssignment && (
              <div className="w-full">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Your Assignment</h3>
                  <p className="text-gray-700">
                    You are giving a gift to:{' '}
                    <span className="font-bold text-green-900">{userAssignment.receiver.name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Email: {userAssignment.receiver.email}
                  </p>
                </div>
              </div>
            )}

            {exchange.assignments_generated && !userAssignment && (
              <div className="w-full">
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-yellow-800">
                    Assignments have been generated, but you don't have an assignment yet.
                  </p>
                </div>
              </div>
            )}

            {!exchange.assignments_generated && isOrganizer && participants.length < 3 && (
              <div className="w-full">
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-yellow-800 font-semibold">
                    Cannot generate assignments yet
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    You need at least 3 participants to generate assignments. 
                    Currently you have {participants.length} participant{participants.length !== 1 ? 's' : ''}.
                    Share the exchange code with more people to join!
                  </p>
                </div>
              </div>
            )}

            {!exchange.assignments_generated && !isOrganizer && (
              <div className="w-full">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-blue-800">
                    Waiting for the organizer to generate assignments...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Participants ({participants.length})
          </h2>

          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{participant.name}</p>
                  <p className="text-sm text-gray-600">{participant.email}</p>
                </div>
                {participant.id === exchange.organizer_id && (
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                    Organizer
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All Assignments (Organizer Only) */}
        {isOrganizer && allAssignments && allAssignments.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                All Assignments
              </h2>
              <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                Organizer View Only
              </span>
            </div>
            
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-4">
              <p className="text-sm text-purple-800">
                <strong>Note:</strong> This view is only visible to you as the organizer. 
                Participants can only see their own assignment.
              </p>
            </div>

            <div className="space-y-3">
              {allAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.giver.name}</p>
                      <p className="text-sm text-gray-600">{assignment.giver.email}</p>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div>
                      <p className="font-medium text-gray-900">{assignment.receiver.name}</p>
                      <p className="text-sm text-gray-600">{assignment.receiver.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
