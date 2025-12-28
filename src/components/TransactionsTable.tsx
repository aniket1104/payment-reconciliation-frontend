'use client';

/**
 * Transactions Table Component
 *
 * Displays bank transactions in a paginated table with inline actions.
 * Uses cursor-based pagination for efficient handling of large datasets.
 *
 * Features:
 * - Cursor-based pagination (NOT offset)
 * - "Load more" button to fetch next page
 * - Appends rows (does not replace)
 * - Status badges with colors
 * - Confidence percentage display
 * - Inline action buttons per row
 * - Loading, empty, and error states
 * - Memoized rows for performance (Phase F6)
 */

import { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TransactionActions,
  type ActionType,
} from '@/components/TransactionActions';
import { MatchStatus, type BankTransaction } from '@/lib/types';
import {
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
  getConfidenceLevel,
  CONFIDENCE_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface TransactionsTableProps {
  /** Array of transactions to display */
  transactions: BankTransaction[];
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether next page is being fetched */
  isLoadingMore: boolean;
  /** Whether there are more transactions to load */
  hasMore: boolean;
  /** Callback to load more transactions */
  onLoadMore: () => void;
  /** Error message to display */
  error: string | null;
  /** Callback to retry on error */
  onRetry: () => void;
  /** ID of transaction currently being acted upon */
  actionLoadingId: string | null;
  /** Type of action currently in progress */
  actionLoadingType: ActionType | null;
  /** Callback when confirm action is triggered */
  onConfirm: (transaction: BankTransaction) => void;
  /** Callback when reject action is triggered */
  onReject: (transaction: BankTransaction) => void;
  /** Callback when find match action is triggered */
  onFindMatch: (transaction: BankTransaction) => void;
  /** Callback when mark external action is triggered */
  onMarkExternal: (transaction: BankTransaction) => void;
}

/**
 * Table header columns configuration
 */
const columns = [
  { key: 'date', label: 'Date', width: 'w-28' },
  { key: 'description', label: 'Description', width: 'min-w-[180px]' },
  { key: 'amount', label: 'Amount', width: 'w-28 text-right' },
  { key: 'invoice', label: 'Matched Invoice', width: 'min-w-[160px]' },
  { key: 'confidence', label: 'Confidence', width: 'w-24 text-right' },
  { key: 'status', label: 'Status', width: 'w-28' },
  { key: 'actions', label: 'Actions', width: 'w-44' },
];

/**
 * Skeleton row for loading state
 */
function SkeletonRow() {
  return (
    <tr className="border-border border-b">
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-12" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-7 w-32" />
      </td>
    </tr>
  );
}

/**
 * Format confidence score for display
 */
function formatConfidence(score: number | null): string {
  if (score === null) return '—';
  return `${Math.round(score)}%`;
}

/**
 * Memoized Transaction Row Component
 *
 * Prevents unnecessary re-renders when other rows change.
 * Only re-renders when:
 * - The transaction data changes
 * - Loading state for this row changes
 * - Action callbacks change (stabilized with useCallback in parent)
 */
interface TransactionRowProps {
  transaction: BankTransaction;
  isActionLoading: boolean;
  loadingAction: ActionType | null;
  onConfirm: (transaction: BankTransaction) => void;
  onReject: (transaction: BankTransaction) => void;
  onFindMatch: (transaction: BankTransaction) => void;
  onMarkExternal: (transaction: BankTransaction) => void;
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  isActionLoading,
  loadingAction,
  onConfirm,
  onReject,
  onFindMatch,
  onMarkExternal,
}: TransactionRowProps) {
  const statusColors = MATCH_STATUS_COLORS[
    transaction.status as MatchStatus
  ] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  };
  const confidenceLevel = transaction.confidenceScore
    ? getConfidenceLevel(transaction.confidenceScore)
    : 'none';

  return (
    <tr
      className={cn(
        'hover:bg-muted/50 transition-colors',
        isActionLoading && 'bg-muted/30'
      )}
    >
      {/* Date */}
      <td className="text-foreground px-4 py-3 text-sm whitespace-nowrap">
        {formatDate(transaction.transactionDate)}
      </td>

      {/* Description - Clickable link to detail page */}
      <td className="px-4 py-3">
        <Link
          href={
            `/transactions/${transaction.id}` as '/transactions/[transactionId]'
          }
          className="group block"
        >
          <p className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
            {transaction.description}
          </p>
          <p className="text-muted-foreground group-hover:text-primary/70 mt-0.5 text-xs transition-colors">
            View details →
          </p>
        </Link>
      </td>

      {/* Amount */}
      <td className="text-foreground px-4 py-3 text-right text-sm font-medium whitespace-nowrap tabular-nums">
        {formatCurrency(transaction.amount)}
      </td>

      {/* Matched Invoice */}
      <td className="px-4 py-3">
        {transaction.matchedInvoice ? (
          <div>
            <p className="text-foreground text-sm font-medium">
              {transaction.matchedInvoice.invoiceNumber}
            </p>
            <p className="text-muted-foreground text-xs">
              {transaction.matchedInvoice.customerName}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>

      {/* Confidence */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            CONFIDENCE_COLORS[confidenceLevel]
          )}
        >
          {formatConfidence(transaction.confidenceScore)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge
          className={cn(
            'border font-medium',
            statusColors.bg,
            statusColors.text,
            statusColors.border
          )}
        >
          {MATCH_STATUS_LABELS[transaction.status as MatchStatus] ||
            transaction.status}
        </Badge>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <TransactionActions
          transaction={transaction}
          isLoading={isActionLoading}
          loadingAction={isActionLoading ? loadingAction : null}
          onConfirm={onConfirm}
          onReject={onReject}
          onFindMatch={onFindMatch}
          onMarkExternal={onMarkExternal}
        />
      </td>
    </tr>
  );
});

export function TransactionsTable({
  transactions,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  error,
  onRetry,
  actionLoadingId,
  actionLoadingType,
  onConfirm,
  onReject,
  onFindMatch,
  onMarkExternal,
}: TransactionsTableProps) {
  // Initial loading state - show skeleton table
  if (isLoading && transactions.length === 0) {
    return (
      <div className="border-border bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-border bg-muted/50 border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase',
                      col.width
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Error state
  if (error && transactions.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center rounded-lg border p-12 text-center">
        <div className="bg-destructive/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            className="text-destructive h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-foreground mb-2 font-medium">
          Failed to load transactions
        </p>
        <p className="text-muted-foreground mb-4 text-sm">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && transactions.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center rounded-lg border p-12 text-center">
        <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            className="text-muted-foreground h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <p className="text-foreground font-medium">No transactions found</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Try selecting a different status filter.
        </p>
      </div>
    );
  }

  // Data table
  return (
    <div className="space-y-4">
      <div className="border-border bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table header */}
            <thead>
              <tr className="border-border bg-muted/50 border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase',
                      col.width
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body - uses memoized rows for performance */}
            <tbody className="divide-border divide-y">
              {transactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  isActionLoading={actionLoadingId === txn.id}
                  loadingAction={actionLoadingType}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onFindMatch={onFindMatch}
                  onMarkExternal={onMarkExternal}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More section */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {transactions.length.toLocaleString()} transaction
          {transactions.length !== 1 ? 's' : ''}
        </p>

        {/* Load More button - only visible when hasMore is true */}
        {hasMore && (
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
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
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        )}
      </div>

      {/* Error during load more */}
      {error && transactions.length > 0 && (
        <div className="bg-destructive/10 text-destructive flex items-center justify-center gap-2 rounded-md p-3 text-sm">
          <svg
            className="h-4 w-4 shrink-0"
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
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={onRetry} className="ml-2">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export default TransactionsTable;
