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
import { Input } from '@/components/ui/input';
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
  /** Pagination props */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
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
  pagination,
  onPageChange,
  onLimitChange,
  onConfirm,
  onReject,
  onFindMatch,
  onMarkExternal,
}: TransactionsTableProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    if (!pagination) return [];

    const { page, totalPages } = pagination;
    const delta = 1; // Number of pages to show on each side of current
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Always show first, last, and pages around current
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      }
    }

    // Add gaps
    let l: number | undefined;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onPageChange) {
      const val = parseInt((e.currentTarget).value);
      if (!isNaN(val) && pagination && val >= 1 && val <= pagination.totalPages) {
        onPageChange(val);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-muted-foreground font-medium">
                <th className="h-10 px-4 w-[120px]">Date</th>
                <th className="h-10 px-4 w-[20%]">Description</th>
                <th className="h-10 px-4 w-[120px] text-right">Amount</th>
                <th className="h-10 px-4 w-[120px]">Status</th>
                <th className="h-10 px-4 w-[15%]">Reference</th>
                <th className="h-10 px-4 w-[15%]">Matched Invoice</th>
                <th className="h-10 px-4 w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && transactions.length === 0 ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-4 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="h-32 text-center p-4">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p>No transactions found</p>
                      {error && (
                        <div className="mt-2 flex flex-col gap-2">
                          <p className="text-sm text-destructive">{error}</p>
                          {onRetry && (
                            <Button variant="outline" size="sm" onClick={onRetry}>
                              Try Again
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onConfirm={onConfirm}
                    onReject={onReject}
                    onFindMatch={onFindMatch}
                    onMarkExternal={onMarkExternal}
                    isActionLoading={actionLoadingId === transaction.id}
                    loadingAction={actionLoadingType}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && onPageChange && (
        <div className="flex flex-col items-center justify-between gap-4 py-2 sm:flex-row">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Showing <span className="font-medium text-foreground">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </span>-
              <span className="font-medium text-foreground">
                 {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of{' '}
              <span className="font-medium text-foreground">{pagination.total}</span> transactions
            </span>

            {onLimitChange && (
               <div className="flex items-center gap-2">
                 <span>Rows per page</span>
                 <select
                   className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                   value={pagination.limit}
                   onChange={(e) => onLimitChange(parseInt(e.target.value))}
                 >
                   {[10, 25, 50, 100].map((pageSize) => (
                     <option key={pageSize} value={pageSize}>
                       {pageSize}
                     </option>
                   ))}
                 </select>
               </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <nav role="navigation" aria-label="pagination" className="mx-auto flex w-full justify-center">
              <ul className="flex flex-row items-center gap-1">
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                </li>
                
                {getPageNumbers().map((pageNum, i) => (
                  <li key={i}>
                    {pageNum === '...' ? (
                      <span className="flex h-9 w-9 items-center justify-center">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M4.25 7.50001C4.25 8.0523 3.80229 8.50001 3.25 8.50001C2.69772 8.50001 2.25 8.0523 2.25 7.50001C2.25 6.94773 2.69772 6.50001 3.25 6.50001C3.80229 6.50001 4.25 6.94773 4.25 7.50001ZM8.25 7.50001C8.25 8.0523 7.80229 8.50001 7.25 8.50001C6.69772 8.50001 6.25 8.0523 6.25 7.50001C6.25 6.94773 6.69772 6.50001 7.25 6.50001C7.80229 6.50001 8.25 6.94773 8.25 7.50001ZM12.25 7.5C12.25 8.05228 11.8023 8.5 11.25 8.5C10.6977 8.5 10.25 8.05228 10.25 7.5C10.25 6.94772 10.6977 6.5 11.25 6.5C11.8023 6.5 12.25 6.94772 12.25 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        <span className="sr-only">More pages</span>
                      </span>
                    ) : (
                      <Button
                        variant={pagination.page === pageNum ? "outline" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(pageNum as number)}
                        aria-current={pagination.page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </Button>
                    )}
                  </li>
                ))}

                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                  >
                    <span className="sr-only">Go to next page</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                  </Button>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-2 text-sm ml-4">
              <span className="whitespace-nowrap">Go to page</span>
              <Input
                type="number"
                min={1}
                max={pagination.totalPages}
                className="h-8 w-16"
                onKeyDown={handlePageInput}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legacy Load More (if pagination not provided) */}
      {!pagination && hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full max-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

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
