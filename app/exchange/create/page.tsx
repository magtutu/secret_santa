'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateExchangeForm } from '@/lib/validation';
import { FormError } from '@/components/FormError';
import { useToast } from '@/components/Toast';

export default function CreateExchangePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gift_budget: '',
    exchange_date: '',
    invitee_emails: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Prepare data for validation
    const exchangeData = {
      name: formData.name,
      description: formData.description || undefined,
      gift_budget: formData.gift_budget ? parseFloat(formData.gift_budget) : undefined,
      exchange_date: formData.exchange_date,
    };

    // Client-side validation
    const validation = validateExchangeForm(exchangeData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      // Parse invitee emails (comma or newline separated)
      const inviteeEmailsArray = formData.invitee_emails
        ? formData.invitee_emails
            .split(/[,\n]/)
            .map((email) => email.trim())
            .filter((email) => email.length > 0)
        : [];

      const response = await fetch('/api/exchange/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...exchangeData,
          invitee_emails: inviteeEmailsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Exchange created successfully!', 'success');
        // Redirect to exchange detail page
        router.push(`/exchange/${data.exchange.id}`);
      } else {
        setErrors([data.error || 'Failed to create exchange']);
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create Secret Santa Exchange
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up a new gift exchange and invite participants
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <FormError errors={errors} />

          <div className="space-y-4 rounded-md bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Exchange Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Family Christmas 2024"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Optional details about the exchange"
              />
            </div>

            <div>
              <label htmlFor="gift_budget" className="block text-sm font-medium text-gray-700">
                Gift Budget
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  $
                </span>
                <input
                  id="gift_budget"
                  name="gift_budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.gift_budget}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optional suggested budget per gift
              </p>
            </div>

            <div>
              <label htmlFor="exchange_date" className="block text-sm font-medium text-gray-700">
                Exchange Date <span className="text-red-500">*</span>
              </label>
              <input
                id="exchange_date"
                name="exchange_date"
                type="date"
                required
                value={formData.exchange_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                When will gifts be exchanged?
              </p>
            </div>

            <div>
              <label htmlFor="invitee_emails" className="block text-sm font-medium text-gray-700">
                Invite Participants (Optional)
              </label>
              <textarea
                id="invitee_emails"
                name="invitee_emails"
                rows={4}
                value={formData.invitee_emails}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Enter email addresses separated by commas or new lines&#10;e.g., friend@example.com, family@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Invitation links will be logged to the console (email sending not yet implemented)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Creating...' : 'Create Exchange'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
