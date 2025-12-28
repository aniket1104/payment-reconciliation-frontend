'use client';

/**
 * Transaction Detail Page
 *
 * PHASE F5: Explainability & Audit Detail View
 *
 * Uses Redux for fetching transaction details.
 * This page provides a comprehensive, read-only view of a single transaction.
 *
 * Key Principles:
 * - READ-ONLY: No actions are allowed on this page
 * - DESKTOP-ONLY: Part of the desktop-only admin interface
 * - TRUSTWORTHY: All data comes directly from the backend via Redux
 */

import { useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TransactionDetailsCard } from '@/components/TransactionDetailsCard';
import { InvoiceDetailsCard } from '@/components/InvoiceDetailsCard';
import { MatchExplanationCard } from '@/components/MatchExplanationCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTransactionById,
  clearCurrentTransaction,
} from '@/store/slices/transactionsSlice';
import { type Invoice } from '@/lib/types';
import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Page props with dynamic route parameter
 */
interface PageProps {
  params: Promise<{ transactionId: string }>;
}

/**
 * Loading skeleton for the page
 */
function LoadingSkeleton() {
  return (
    <main className="bg-background min-h-screen">
      {/* Header skeleton */}
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </header>

      {/* Content skeleton */}
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <Skeleton className="h-96 rounded-xl" />
          {/* Right column */}
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <main className="bg-background min-h-screen">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-6">
          <Link
            href="/reconciliation/new"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
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
            Failed to load transaction
          </p>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
            <Button asChild>
              <Link href="/reconciliation/new">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TransactionDetailPage({ params }: PageProps) {
  // Unwrap params using React.use()
  const { transactionId } = use(params);
  const dispatch = useAppDispatch();

  // Redux state
  const {
    currentTransaction: transaction,
    currentTransactionLoading: loading,
    error,
  } = useAppSelector((state) => state.transactions);

  /**
   * Fetch transaction details via Redux thunk
   */
  const fetchTransaction = useCallback(() => {
    dispatch(fetchTransactionById(transactionId));
  }, [dispatch, transactionId]);

  // Fetch on mount
  useEffect(() => {
    fetchTransaction();

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentTransaction());
    };
  }, [fetchTransaction, dispatch]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !transaction) {
    return (
      <ErrorState
        error={error || 'Transaction not found'}
        onRetry={fetchTransaction}
      />
    );
  }

  // Get status colors
  const statusColors = MATCH_STATUS_COLORS[transaction.status] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  };

  // Build back link - try to include batch context
  const backLink = (
    transaction.batchId
      ? `/reconciliation/${transaction.batchId}`
      : '/reconciliation/new'
  ) as '/reconciliation/new';

  // Create invoice object for InvoiceDetailsCard (may need extended data)
  const invoiceForCard: Invoice | null = transaction.matchedInvoice
    ? {
        id: transaction.matchedInvoice.id,
        invoiceNumber: transaction.matchedInvoice.invoiceNumber,
        customerName: transaction.matchedInvoice.customerName,
        amount: transaction.matchedInvoice.amount,
        status: 'PENDING' as Invoice['status'],
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  return (
    <main className="bg-background min-h-screen">
      {/* Page header */}
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
          <div>
            {/* Breadcrumb */}
            <nav className="mb-1 flex items-center gap-2 text-sm">
              <Link
                href={backLink}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Reconciliation
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium">
                Transaction Details
              </span>
            </nav>
            {/* Title with status */}
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-xl font-semibold">
                Transaction Details
              </h1>
              <Badge
                className={cn(
                  'border font-medium',
                  statusColors.bg,
                  statusColors.text,
                  statusColors.border
                )}
              >
                {MATCH_STATUS_LABELS[transaction.status] || transaction.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={backLink}>← Back to Reconciliation</Link>
          </Button>
        </div>
      </header>

      {/* Main content - Two column layout */}
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Bank Transaction Details */}
          <div>
            <TransactionDetailsCard transaction={transaction} />
          </div>

          {/* Right Column: Invoice Details + Match Explanation */}
          <div className="space-y-6">
            {/* Invoice Details Card */}
            <InvoiceDetailsCard invoice={invoiceForCard} />

            {/* Match Explanation Card */}
            <MatchExplanationCard
              matchDetails={transaction.matchDetails}
              confidenceScore={transaction.confidenceScore}
            />
          </div>
        </div>

        {/* Page-level disclaimer */}
        <div className="border-border bg-muted/30 mt-8 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <svg
              className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <div>
              <p className="text-foreground text-sm font-medium">
                Explainability & Audit View
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                This page displays the matching analysis as computed by the reconciliation
                engine. All scores and explanations are stored values from the original
                processing — they are not recalculated when viewing this page. For
                actions like confirming, rejecting, or manually matching, please use the
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
