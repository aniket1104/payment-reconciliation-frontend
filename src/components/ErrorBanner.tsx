'use client';

/**
 * Error Banner Component
 *
 * Inline, dismissible error banner for displaying errors within the page.
 * Used for non-blocking errors that don't require a full page error state.
 *
 * Features:
 * - Dismissible with X button
 * - Optional retry action
 * - Smooth fade animation
 * - Accessible design
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  /** Error message to display */
  message: string;
  /** Optional callback when retry button is clicked */
  onRetry?: () => void;
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Additional className for the container */
  className?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  dismissible = true,
  className,
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={cn(
        'bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-lg border p-4',
        'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        className
      )}
    >
      {/* Error icon */}
      <div className="bg-destructive/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <svg
          className="text-destructive h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Message */}
      <p className="text-destructive flex-1 text-sm font-medium">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3"
          >
            Retry
          </Button>
        )}

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="text-destructive/70 hover:text-destructive rounded p-1 transition-colors"
            aria-label="Dismiss error"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;

