'use client';

/**
 * Transaction Actions Component
 *
 * Renders inline action buttons for a single transaction row.
 * Actions are context-sensitive based on transaction status.
 *
 * Supported actions by status:
 * - AUTO_MATCHED: Confirm, Reject
 * - NEEDS_REVIEW: Confirm, Reject, Find Match
 * - UNMATCHED: Find Match, Mark External
 * - CONFIRMED/EXTERNAL: No actions (read-only)
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
import { MatchStatus, type BankTransaction } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Action types that can be performed
 */
export type ActionType = 'confirm' | 'reject' | 'findMatch' | 'markExternal';

interface TransactionActionsProps {
  /** The transaction to render actions for */
  transaction: BankTransaction;
  /** Whether any action is currently in progress */
  isLoading: boolean;
  /** Which action is loading (for showing spinner on correct button) */
  loadingAction: ActionType | null;
  /** Callback when confirm action is triggered */
  onConfirm: (transaction: BankTransaction) => void;
  /** Callback when reject action is triggered */
  onReject: (transaction: BankTransaction) => void;
  /** Callback when find match action is triggered (opens modal) */
  onFindMatch: (transaction: BankTransaction) => void;
  /** Callback when mark external action is triggered */
  onMarkExternal: (transaction: BankTransaction) => void;
}

/**
 * Small loading spinner
 */
function LoadingSpinner() {
  return (
    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
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

export function TransactionActions({
  transaction,
  isLoading,
  loadingAction,
  onConfirm,
  onReject,
  onFindMatch,
  onMarkExternal,
}: TransactionActionsProps) {
  // Dialog state for confirmations
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);

  const status = transaction.status;

  // Determine which actions are available based on status
  const canConfirm =
    status === MatchStatus.AUTO_MATCHED || status === MatchStatus.NEEDS_REVIEW;
  const canReject =
    status === MatchStatus.AUTO_MATCHED || status === MatchStatus.NEEDS_REVIEW;
  const canFindMatch =
    status === MatchStatus.NEEDS_REVIEW || status === MatchStatus.UNMATCHED;
  const canMarkExternal = status === MatchStatus.UNMATCHED;

  // If no actions available, show read-only indicator
  if (!canConfirm && !canReject && !canFindMatch && !canMarkExternal) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // Handle confirm action with dialog
  const handleConfirmClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    setConfirmDialogOpen(false);
    onConfirm(transaction);
  };

  // Handle reject action with dialog
  const handleRejectClick = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectAction = () => {
    setRejectDialogOpen(false);
    onReject(transaction);
  };

  // Handle mark external action with dialog
  const handleExternalClick = () => {
    setExternalDialogOpen(true);
  };

  const handleExternalAction = () => {
    setExternalDialogOpen(false);
    onMarkExternal(transaction);
  };

  // Handle find match (opens modal, no dialog needed)
  const handleFindMatchClick = () => {
    onFindMatch(transaction);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Confirm button */}
      {canConfirm && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={cn(
              'h-7 px-2 text-xs',
              'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
              'dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
            )}
          >
            {loadingAction === 'confirm' ? <LoadingSpinner /> : 'Confirm'}
          </Button>

          <AlertDialog
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm this match?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will confirm the match between the transaction and
                  invoice{' '}
                  <strong>
                    {transaction.matchedInvoice?.invoiceNumber || 'N/A'}
                  </strong>
                  . This action is audited.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmAction}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirm Match
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Reject button */}
      {canReject && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRejectClick}
            disabled={isLoading}
            className={cn(
              'h-7 px-2 text-xs',
              'text-red-600 hover:bg-red-50 hover:text-red-700',
              'dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300'
            )}
          >
            {loadingAction === 'reject' ? <LoadingSpinner /> : 'Reject'}
          </Button>

          <AlertDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Reject this suggested match?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject the suggested match and mark the transaction
                  as unmatched. You can then manually find a different invoice
                  or mark it as external.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRejectAction}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reject Match
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Find Match button */}
      {canFindMatch && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFindMatchClick}
          disabled={isLoading}
          className={cn(
            'h-7 px-2 text-xs',
            'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
            'dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300'
          )}
        >
          {loadingAction === 'findMatch' ? <LoadingSpinner /> : 'Find Match'}
        </Button>
      )}

      {/* Mark External button */}
      {canMarkExternal && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalClick}
            disabled={isLoading}
            className={cn(
              'h-7 px-2 text-xs',
              'text-slate-600 hover:bg-slate-100 hover:text-slate-700',
              'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300'
            )}
          >
            {loadingAction === 'markExternal' ? <LoadingSpinner /> : 'External'}
          </Button>

          <AlertDialog
            open={externalDialogOpen}
            onOpenChange={setExternalDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as external?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the transaction as external, indicating that no
                  matching invoice exists in the system. Use this for payments
                  that don&apos;t correspond to any known invoice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExternalAction}>
                  Mark as External
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

export default TransactionActions;
