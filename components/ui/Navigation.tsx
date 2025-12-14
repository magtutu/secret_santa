'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavigationProps {
  user?: {
    name: string;
    email: string;
  } | null;
  onLogout?: () => void;
}

export function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              Secret Santa Exchange
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/exchange/create"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/exchange/create')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Create Exchange
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-700">
                  Welcome, {user.name}
                </span>
                {onLogout ? (
                  <button
                    onClick={onLogout}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Log out
                  </button>
                ) : (
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      Log out
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu for authenticated users */}
        {user && (
          <div className="md:hidden pb-3 space-y-1">
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/exchange/create"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/exchange/create')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Create Exchange
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
