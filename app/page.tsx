import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Secret Santa Exchange
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Organize and manage your secret gift exchanges with ease. 
            Create exchanges, invite participants, and let us handle the secret assignments.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid gap-6 sm:grid-cols-3 mt-12">
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                Easy Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create an exchange in minutes with customizable details like budget and date.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Secret Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated random assignment ensures everyone gets a match while keeping it secret.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Simple Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share a unique code with your group and let them join with a single click.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="lg" className="min-w-[200px]">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="min-w-[200px]">
              Log In
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-sm text-gray-500">
          <p>Perfect for families, friends, and coworkers</p>
        </div>
      </div>
    </main>
  );
}
