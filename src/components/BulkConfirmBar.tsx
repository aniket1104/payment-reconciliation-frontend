'use client';

/**
 * Bulk Confirm Bar Component
 *
 * Provides bulk confirmation functionality for AUTO_MATCHED transactions.
 * This is an admin power feature to efficiently confirm many transactions at once.
 *
 * SAFETY FEATURES:
 * - Only visible when AUTO_MATCHED tab is active
 * - Only visible when there are AUTO_MATCHED transactions
 * - Requires explicit confirmation dialog before action
 * - Shows clear count of affected transactions
 * - Cannot be triggered accidentally
 * - Disables all actions during processing
 *
 * This component does NOT use optimistic UI - it waits for backend confirmation
 * before updating the UI to ensure data integrity.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface BulkConfirmBarProps {
  /** Number of AUTO_MATCHED transactions that will be confirmed */
  autoMatchedCount: number;
  /** Whether the bulk action is currently in progress */
  isLoading: boolean;
  /** Callback to trigger bulk confirm action */
  onBulkConfirm: () => Promise<void>;
  /** Whether any other action is in progress (disable for safety) */
  disabled?: boolean;
}

/**
 * Loading spinner component
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function BulkConfirmBar({
  autoMatchedCount,
  isLoading,
  onBulkConfirm,
  disabled = false,
}: BulkConfirmBarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't render if no AUTO_MATCHED transactions
  if (autoMatchedCount === 0) {
    return null;
  }

  const handleConfirm = async () => {
    setDialogOpen(false);
    await onBulkConfirm();
  };

  const isDisabled = disabled || isLoading;

  return (
    <>
      {/* Bulk action bar */}
      <div className="border-border bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="bg-emerald-100 dark:bg-emerald-900/50 flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Message */}
          <div>
            <p className="text-foreground text-sm font-medium">
              {autoMatchedCount.toLocaleString()} auto-matched transaction
              {autoMatchedCount !== 1 ? 's' : ''} ready for confirmation
            </p>
            <p className="text-muted-foreground text-xs">
              High-confidence matches that can be confirmed in bulk
            </p>
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={isDisabled}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Confirming...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirm All Auto-Matched
            </>
          )}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm all auto-matched transactions?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will confirm{' '}
                <strong className="text-foreground">
                  {autoMatchedCount.toLocaleString()}
                </strong>{' '}
                auto-matched transaction{autoMatchedCount !== 1 ? 's' : ''} in
                this batch.
              </span>
              <span className="block text-amber-600 dark:text-amber-400">
                ⚠️ This action cannot be undone.
              </span>
              <span className="block">
                Each confirmation will be recorded in the audit log.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                'Confirm All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BulkConfirmBar;

