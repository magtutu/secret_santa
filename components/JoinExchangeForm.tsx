'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './Toast';
import { FormError } from './FormError';

export function JoinExchangeForm() {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!code.trim()) {
      setErrors(['Exchange code is required']);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/exchange/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Successfully joined exchange!', 'success');
        router.push(`/exchange/${data.participant.exchange_id}`);
      } else {
        setErrors([data.error || 'Failed to join exchange']);
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
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Join an Exchange</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError errors={errors} />

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Exchange Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (errors.length > 0) setErrors([]);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Enter exchange code"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isLoading ? 'Joining...' : 'Join Exchange'}
        </button>
      </form>
    </div>
  );
}
