import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';
import { act } from 'react';

// Test component that uses the toast hook
function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
    </div>
  );
}

describe('Toast', () => {
  it('should display success toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeDefined();
    });
  });

  it('should display error toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeDefined();
    });
  });

  it('should display info toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeDefined();
    });
  });
});
