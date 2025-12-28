'use client';

/**
 * Reconciliation Dashboard Page
 *
 * Main admin workspace for viewing and acting on reconciliation results.
 * Uses Redux for all state management and API calls.
 *
 * Displays:
 * - Batch summary with status counts
 * - Status-based tabs for filtering
 * - Paginated transactions table with inline actions
 * - Contextual action bar (bulk confirm, export)
 */

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReconciliationSummary } from '@/components/ReconciliationSummary';
import { ReconciliationTabs, type TabFilter } from '@/components/ReconciliationTabs';
import { TransactionsTable } from '@/components/TransactionsTable';
import { ManualMatchModal } from '@/components/ManualMatchModal';
import { ActionBar } from '@/components/ActionBar';
import { ErrorBanner } from '@/components/ErrorBanner';
import { type ActionType } from '@/components/TransactionActions';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBatchById } from '@/store/slices/batchesSlice';
import {
  fetchBatchTransactions,
  confirmMatch,
  rejectMatch,
  manualMatch,
  markExternal,
  bulkConfirm,
  setFilterStatus,
  setCurrentBatchId,
  clearTransactions,
} from '@/store/slices/transactionsSlice';
import {
  BatchStatus,
  MatchStatus,
  type BankTransaction,
} from '@/lib/types';
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  PAGINATION_DEFAULTS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Page props with dynamic route parameter
 */
interface PageProps {
  params: Promise<{ batchId: string }>;
}

/**
 * Map frontend enum to backend status (snake_case)
 */
function mapEnumToStatus(status: MatchStatus): string {
  const enumMap: Record<MatchStatus, string> = {
    [MatchStatus.AUTO_MATCHED]: 'auto_matched',
    [MatchStatus.NEEDS_REVIEW]: 'needs_review',
    [MatchStatus.UNMATCHED]: 'unmatched',
    [MatchStatus.CONFIRMED]: 'confirmed',
    [MatchStatus.EXTERNAL]: 'external',
  };
  return enumMap[status];
}

export default function ReconciliationDashboardPage({ params }: PageProps) {
  // Unwrap params using React.use()
  const { batchId } = use(params);
  const dispatch = useAppDispatch();

  // Redux state - batches
  const {
    currentBatch: batch,
    currentBatchLoading: batchLoading,
    error: batchError,
  } = useAppSelector((state) => state.batches);

  // Redux state - transactions
  const {
    transactions,
    loading: transactionsLoading,
    loadingMore: transactionsLoadingMore,
    error: transactionsError,
    nextCursor,
    hasMore,
    actionLoading,
    bulkConfirmLoading: isBulkConfirming,
  } = useAppSelector((state) => state.transactions);

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabFilter>(null);
  const [manualMatchModalOpen, setManualMatchModalOpen] = useState(false);
  const [manualMatchTransaction, setManualMatchTransaction] = useState<BankTransaction | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [bulkConfirmError, setBulkConfirmError] = useState<string | null>(null);

  // Derive action loading state for UI
  const actionLoadingId = actionLoading?.id || null;
  const actionLoadingType: ActionType | null = actionLoading?.type as ActionType || null;

  // =========================================================================
  // Data Fetching
  // =========================================================================

  /**
   * Fetch batch status via Redux
   */
  const fetchBatch = useCallback(async () => {
    dispatch(fetchBatchById(batchId));
  }, [dispatch, batchId]);

  /**
   * Fetch transactions via Redux
   */
  const fetchTransactionsData = useCallback(
    async (cursor?: string, append: boolean = false) => {
      const statusFilter = activeTab ? mapEnumToStatus(activeTab) : undefined;
      
      dispatch(
        fetchBatchTransactions({
          batchId,
          status: statusFilter,
          cursor,
          limit: PAGINATION_DEFAULTS.PAGE_SIZE,
          append,
        })
      );
    },
    [dispatch, batchId, activeTab]
  );

  // =========================================================================
  // Effects
  // =========================================================================

  /**
   * Set current batch ID and fetch data on mount
   */
  useEffect(() => {
    dispatch(setCurrentBatchId(batchId));
    fetchBatch();
  }, [dispatch, batchId, fetchBatch]);

  /**
   * Fetch transactions when tab changes or on mount
   */
  useEffect(() => {
    if (batchId) {
      fetchTransactionsData();
    }
  }, [batchId, activeTab, fetchTransactionsData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      dispatch(clearTransactions());
    };
  }, [dispatch]);

  // =========================================================================
  // Action Handlers
  // =========================================================================

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(
    async (transaction: BankTransaction) => {
      try {
        await dispatch(confirmMatch(transaction.id)).unwrap();
        fetchBatch(); // Refresh batch counts
        toast.success('Match confirmed successfully');
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to confirm match');
      }
    },
    [dispatch, fetchBatch]
  );

  /**
   * Handle reject action
   */
  const handleReject = useCallback(
    async (transaction: BankTransaction) => {
      try {
        await dispatch(rejectMatch({ transactionId: transaction.id })).unwrap();
        fetchBatch(); // Refresh batch counts
        toast.success('Match rejected');
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to reject match');
      }
    },
    [dispatch, fetchBatch]
  );

  /**
   * Handle find match action (opens modal)
   */
  const handleFindMatch = useCallback((transaction: BankTransaction) => {
    setManualMatchTransaction(transaction);
    setManualMatchModalOpen(true);
  }, []);

  /**
   * Handle manual match from modal
   */
  const handleManualMatch = useCallback(
    async (transactionId: string, invoiceId: string) => {
      setIsMatching(true);

      try {
        await dispatch(manualMatch({ transactionId, invoiceId })).unwrap();
        fetchBatch(); // Refresh batch counts
        setManualMatchModalOpen(false);
        setManualMatchTransaction(null);
        toast.success('Manual match completed');
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to match transaction');
      } finally {
        setIsMatching(false);
      }
    },
    [dispatch, fetchBatch]
  );

  /**
   * Handle mark external action
   */
  const handleMarkExternal = useCallback(
    async (transaction: BankTransaction) => {
      try {
        await dispatch(markExternal({ transactionId: transaction.id })).unwrap();
        fetchBatch(); // Refresh batch counts
        toast.success('Marked as external');
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to mark as external');
      }
    },
    [dispatch, fetchBatch]
  );

  /**
   * Close manual match modal
   */
  const handleCloseManualMatchModal = useCallback(() => {
    if (!isMatching) {
      setManualMatchModalOpen(false);
      setManualMatchTransaction(null);
    }
  }, [isMatching]);

  // =========================================================================
  // Bulk Actions
  // =========================================================================

  /**
   * Handle bulk confirm of all AUTO_MATCHED transactions
   */
  const handleBulkConfirm = useCallback(async () => {
    setBulkConfirmError(null);

    try {
      const result = await dispatch(bulkConfirm(batchId)).unwrap();
      await fetchBatch();

      // If on AUTO_MATCHED tab, refresh transactions
      if (activeTab === MatchStatus.AUTO_MATCHED) {
        await fetchTransactionsData();
      }

      toast.success(
        `Successfully confirmed ${result.confirmedCount.toLocaleString()} transaction${result.confirmedCount !== 1 ? 's' : ''}`
      );
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Failed to bulk confirm transactions';
      setBulkConfirmError(message);
      toast.error(message);
    }
  }, [dispatch, batchId, activeTab, fetchBatch, fetchTransactionsData]);

  /**
   * Dismiss bulk confirm error banner
   */
  const handleDismissBulkError = useCallback(() => {
    setBulkConfirmError(null);
  }, []);

  // =========================================================================
  // Navigation Handlers
  // =========================================================================

  /**
   * Handle tab change
   */
  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    dispatch(setFilterStatus(tab));
  };

  /**
   * Handle load more button click
   */
  const handleLoadMore = () => {
    if (nextCursor && !transactionsLoadingMore) {
      fetchTransactionsData(nextCursor, true);
    }
  };

  /**
   * Retry fetching transactions on error
   */
  const handleRetryTransactions = () => {
    fetchTransactionsData();
  };

  /**
   * Retry fetching batch on error
   */
  const handleRetryBatch = () => {
    fetchBatch();
  };

  // =========================================================================
  // Render
  // =========================================================================

  // Batch loading state
  if (batchLoading) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </header>
        <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  // Batch error state
  if (batchError || !batch) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-6">
          <Link
            href="/reconciliation/new"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Upload
          </Link>
        </div>
        <div className="mx-auto max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-6 w-6 text-destructive"
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
            <p className="mb-2 font-medium text-foreground">
              Failed to load reconciliation
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              {batchError || 'Reconciliation batch not found'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetryBatch}>
                Try Again
              </Button>
              <Button asChild>
                <Link href="/reconciliation/new">New Upload</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Get status colors
  const statusColors =
    BATCH_STATUS_COLORS[batch.status as BatchStatus] || BATCH_STATUS_COLORS.completed;

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      {/* Page Title */}
      <div className="border-b border-border bg-background pt-4 pb-4">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                Reconciliation Results
              </h1>
              <Badge
                className={cn(
                  'border font-medium',
                  statusColors.bg,
                  statusColors.text,
                  statusColors.border
                )}
              >
                {BATCH_STATUS_LABELS[batch.status as BatchStatus] || batch.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{batch.filename}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-8">
        {/* Summary cards */}
        <ReconciliationSummary batch={batch} />

        {/* Status tabs */}
        <ReconciliationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          batch={batch}
          disabled={transactionsLoading}
        />

        {/* Bulk action error banner */}
        {bulkConfirmError && (
          <ErrorBanner
            message={bulkConfirmError}
            onRetry={handleBulkConfirm}
            onDismiss={handleDismissBulkError}
          />
        )}

        {/* Contextual action bar (bulk confirm, export) */}
        <ActionBar
          activeTab={activeTab}
          autoMatchedCount={batch.autoMatchedCount}
          transactions={transactions}
          isBulkConfirming={isBulkConfirming}
          onBulkConfirm={handleBulkConfirm}
          isActionInProgress={actionLoadingId !== null || isBulkConfirming}
        />

        {/* Transactions table */}
        <TransactionsTable
          transactions={transactions}
          isLoading={transactionsLoading}
          isLoadingMore={transactionsLoadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          error={transactionsError}
          onRetry={handleRetryTransactions}
          actionLoadingId={actionLoadingId}
          actionLoadingType={actionLoadingType}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onFindMatch={handleFindMatch}
          onMarkExternal={handleMarkExternal}
        />
      </div>

      {/* Manual match modal */}
      <ManualMatchModal
        open={manualMatchModalOpen}
        onClose={handleCloseManualMatchModal}
        transaction={manualMatchTransaction}
        onMatch={handleManualMatch}
        isMatching={isMatching}
      />
    </main>
  );
}
