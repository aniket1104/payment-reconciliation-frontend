'use client';

/**
 * Action Bar Component
 *
 * Contextual action bar displayed above the transactions table.
 * Shows different actions based on the active tab:
 *
 * - AUTO_MATCHED tab: "Confirm All Auto-Matched" bulk action
 * - UNMATCHED tab: "Export CSV" export action
 * - Other tabs: No actions (bar hidden)
 *
 * This component provides admin power features while maintaining
 * safety through explicit confirmation dialogs.
 */

import { MatchStatus, type BankTransaction } from '@/lib/types';
import { BulkConfirmBar } from '@/components/BulkConfirmBar';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  /** Currently active tab filter */
  activeTab: MatchStatus | null;
  /** Number of AUTO_MATCHED transactions in the batch */
  autoMatchedCount: number;
  /** Transactions currently displayed (for export) */
  transactions: BankTransaction[];
  /** Whether bulk confirm is in progress */
  isBulkConfirming: boolean;
  /** Callback to trigger bulk confirm */
  onBulkConfirm: () => Promise<void>;
  /** Whether any other action is in progress */
  isActionInProgress: boolean;
  /** Additional className */
  className?: string;
}

export function ActionBar({
  activeTab,
  autoMatchedCount,
  transactions,
  isBulkConfirming,
  onBulkConfirm,
  isActionInProgress,
  className,
}: ActionBarProps) {
  // Show bulk confirm bar for AUTO_MATCHED tab
  if (activeTab === MatchStatus.AUTO_MATCHED && autoMatchedCount > 0) {
    return (
      <div className={cn(className)}>
        <BulkConfirmBar
          autoMatchedCount={autoMatchedCount}
          isLoading={isBulkConfirming}
          onBulkConfirm={onBulkConfirm}
          disabled={isActionInProgress}
        />
      </div>
    );
  }

  // Show export bar for UNMATCHED tab
  if (activeTab === MatchStatus.UNMATCHED && transactions.length > 0) {
    return (
      <div
        className={cn(
          'border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <svg
              className="text-muted-foreground h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>

          {/* Message */}
          <div>
            <p className="text-foreground text-sm font-medium">
              {transactions.length.toLocaleString()} unmatched transaction
              {transactions.length !== 1 ? 's' : ''}
            </p>
            <p className="text-muted-foreground text-xs">
              Export for offline review or manual processing
            </p>
          </div>
        </div>

        {/* Export button */}
        <ExportButton
          transactions={transactions}
          filenamePrefix="unmatched_transactions"
          disabled={isActionInProgress}
        />
      </div>
    );
  }

  // No action bar for other tabs
  return null;
}

export default ActionBar;

