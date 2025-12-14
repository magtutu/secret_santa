'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

export function GenerateAssignmentsButton({ exchangeId }: { exchangeId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!confirm('Are you sure you want to generate assignments? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/exchange/${exchangeId}/assign`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        showToast('Assignments generated successfully!', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to generate assignments', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isLoading}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Generating...</span>
        </>
      ) : (
        'Generate Assignments'
      )}
    </button>
  );
}
