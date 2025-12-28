'use client';

/**
 * Home Page - Reconciliation Dashboard
 *
 * Displays all reconciliation batches in a sleek table format.
 * Features:
 * - CTA button to start new reconciliation
 * - Clickable rows to navigate to batch details
 * - Status badges with color coding
 * - Loading and empty states
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllBatches } from '@/store/slices/batchesSlice';
import { BatchStatus } from '@/lib/types';
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from '@/lib/constants';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function Home() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { batches, loading, error, total } = useAppSelector((state) => state.batches);

  // Fetch batches on mount
  useEffect(() => {
    dispatch(fetchAllBatches({ limit: 50 }));
  }, [dispatch]);

  /**
   * Navigate to batch detail page
   */
  const handleRowClick = (batchId: string) => {
    router.push(`/reconciliation/${batchId}` as Route);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Minimal Header */}


      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-6 py-8">
        {/* Stats Bar */}
        {!loading && batches.length > 0 && (
          <div className="mb-6 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{total || batches.length}</p>
                <p className="text-xs text-muted-foreground">Total Batches</p>
              </div>
            </div>
          </div>
        )}

        {/* Batches Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/30 px-6 py-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">File Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Transactions</div>
            <div className="col-span-2 text-right">Matched</div>
            <div className="col-span-2 text-right">Created</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4">
                  <div className="col-span-4">
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="col-span-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="mb-2 font-medium text-foreground">Failed to load batches</p>
              <p className="mb-4 text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                onClick={() => dispatch(fetchAllBatches({ limit: 50 }))}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && batches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No reconciliations yet
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Upload a CSV file containing bank transactions to start matching them with invoices.
              </p>
              <Button asChild size="lg">
                <Link href="/reconciliation/new">Start Your First Reconciliation</Link>
              </Button>
            </div>
          )}

          {/* Batches List */}
          {!loading && !error && batches.length > 0 && (
            <div className="divide-y divide-border">
              {batches.map((batch) => {
                const statusColors =
                  BATCH_STATUS_COLORS[batch.status as BatchStatus] ||
                  BATCH_STATUS_COLORS.completed;
                const matchRate =
                  batch.totalTransactions > 0
                    ? Math.round(
                        (batch.autoMatchedCount / batch.totalTransactions) * 100
                      )
                    : 0;

                return (
                  <button
                    key={batch.id}
                    onClick={() => handleRowClick(batch.id)}
                    className="grid w-full grid-cols-12 gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                  >
                    {/* File Name */}
                    <div className="col-span-4">
                      <p className="truncate font-medium text-foreground">
                        {batch.filename}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ID: {batch.id.slice(0, 8)}...
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
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

                    {/* Transactions Count */}
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="tabular-nums text-foreground">
                        {batch.totalTransactions.toLocaleString()}
                      </span>
                    </div>

                    {/* Match Rate */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            matchRate >= 80
                              ? 'bg-emerald-500'
                              : matchRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                          style={{ width: `${matchRate}%` }}
                        />
                      </div>
                      <span className="min-w-[3ch] text-right tabular-nums text-muted-foreground">
                        {matchRate}%
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2 flex items-center justify-end text-sm text-muted-foreground">
                      {formatDate(batch.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
