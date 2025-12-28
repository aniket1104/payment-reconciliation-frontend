'use client';

/**
 * Reconciliation Progress Component
 *
 * Displays real-time progress of a reconciliation batch.
 * Features:
 * - Uses Redux thunk for fetching batch status
 * - Polls backend every 2 seconds for progress updates
 * - Shows progress bar with percentage
 * - Displays count breakdown (auto-matched, needs review, unmatched)
 * - Handles completion and failure states
 * - Cleans up polling on unmount
 */

import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { fetchBatchById, updateCurrentBatch } from '@/store/slices/batchesSlice';
import { BatchStatus, MatchStatus, type ReconciliationBatch } from '@/lib/types';
import {
  POLLING_INTERVALS,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
  MATCH_STATUS_COLORS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ReconciliationProgressProps {
  /** The batch ID to track */
  batchId: string;
  /** Current batch data (if available) */
  batch: ReconciliationBatch | null;
  /** Called when batch data is updated */
  onBatchUpdate: (batch: ReconciliationBatch) => void;
  /** Called when processing completes */
  onComplete: (batch: ReconciliationBatch) => void;
  /** Called when processing fails */
  onError: (error: string) => void;
  /** Whether there's an error state */
  error: string | null;
  /** Callback to retry on error */
  onRetry?: () => void;
}

/**
 * Format the status text based on current progress
 */
function getStatusText(batch: ReconciliationBatch): string {
  const { status, processedCount, totalTransactions } = batch;

  if (status === BatchStatus.UPLOADING) {
    return 'Preparing file for processing...';
  }

  if (status === BatchStatus.PROCESSING) {
    if (totalTransactions === 0) {
      return 'Reading transactions from file...';
    }

    // Check if we're near completion
    if (processedCount >= totalTransactions - 1) {
      return 'Finalizing reconciliation...';
    }

    return `Processing ${processedCount.toLocaleString()} of ${totalTransactions.toLocaleString()} transactions...`;
  }

  if (status === BatchStatus.COMPLETED) {
    return 'Reconciliation complete!';
  }

  if (status === BatchStatus.FAILED) {
    return 'Reconciliation failed';
  }

  return 'Unknown status';
}

/**
 * Calculate progress percentage safely
 */
function calculateProgress(batch: ReconciliationBatch): number {
  const { processedCount, totalTransactions, status } = batch;

  // If uploading, show indeterminate (0)
  if (status === BatchStatus.UPLOADING) {
    return 0;
  }

  // If completed, always 100%
  if (status === BatchStatus.COMPLETED) {
    return 100;
  }

  // Avoid division by zero
  if (totalTransactions === 0) {
    return 0;
  }

  return Math.min(Math.round((processedCount / totalTransactions) * 100), 100);
}

export function ReconciliationProgress({
  batchId,
  batch,
  onBatchUpdate,
  onComplete,
  onError,
  error,
  onRetry,
}: ReconciliationProgressProps) {
  const dispatch = useAppDispatch();
  
  // Track if polling should continue
  const shouldPollRef = useRef(true);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef(0);

  /**
   * Fetch batch status using Redux thunk
   */
  const fetchBatchStatus = useCallback(async () => {
    try {
      const result = await dispatch(fetchBatchById(batchId)).unwrap();

      // Reset error counter on success
      consecutiveErrorsRef.current = 0;

      // Update via callback for parent component
      onBatchUpdate(result);
      // Also update Redux store directly
      dispatch(updateCurrentBatch(result));

      // Check if processing is complete
      if (result.status === BatchStatus.COMPLETED) {
        shouldPollRef.current = false;
        onComplete(result);
        return;
      }

      // Check if processing failed
      if (result.status === BatchStatus.FAILED) {
        shouldPollRef.current = false;
        onError('Reconciliation failed. Please try again.');
        return;
      }

      // Continue polling if still processing
      if (shouldPollRef.current) {
        pollTimeoutRef.current = setTimeout(
          fetchBatchStatus,
          POLLING_INTERVALS.BATCH_PROGRESS
        );
      }
    } catch (err) {
      consecutiveErrorsRef.current++;

      // After 3 consecutive errors, stop polling and show error
      if (consecutiveErrorsRef.current >= 3) {
        shouldPollRef.current = false;
        const message =
          typeof err === 'string'
            ? err
            : 'Failed to fetch progress. Please check your connection.';
        onError(message);
        return;
      }

      // Retry with backoff on transient errors
      if (shouldPollRef.current) {
        const backoffMs = POLLING_INTERVALS.BATCH_PROGRESS * consecutiveErrorsRef.current;
        pollTimeoutRef.current = setTimeout(fetchBatchStatus, backoffMs);
      }
    }
  }, [batchId, dispatch, onBatchUpdate, onComplete, onError]);

  /**
   * Start polling when component mounts or batchId changes
   */
  useEffect(() => {
    shouldPollRef.current = true;
    consecutiveErrorsRef.current = 0;

    // Initial fetch
    fetchBatchStatus();

    // Cleanup on unmount
    return () => {
      shouldPollRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [fetchBatchStatus]);

  // Handle retry
  const handleRetry = () => {
    shouldPollRef.current = true;
    consecutiveErrorsRef.current = 0;
    onRetry?.();
    fetchBatchStatus();
  };

  // Calculate display values
  const progress = batch ? calculateProgress(batch) : 0;
  const statusText = batch ? getStatusText(batch) : 'Loading...';
  const isProcessing =
    batch?.status === BatchStatus.PROCESSING || batch?.status === BatchStatus.UPLOADING;
  const isComplete = batch?.status === BatchStatus.COMPLETED;
  const isFailed = batch?.status === BatchStatus.FAILED || !!error;

  // Status badge color
  const statusColors = batch
    ? BATCH_STATUS_COLORS[batch.status as BatchStatus]
    : { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Reconciliation Progress</CardTitle>
            <CardDescription>
              {batch?.filename || 'Processing your file...'}
            </CardDescription>
          </div>
          {batch && (
            <Badge
              className={cn(
                'border',
                statusColors.bg,
                statusColors.text,
                statusColors.border
              )}
            >
              {BATCH_STATUS_LABELS[batch.status as BatchStatus] || batch.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{statusText}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-3',
              isComplete && '[&>div]:bg-emerald-500',
              isFailed && '[&>div]:bg-destructive'
            )}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col gap-3 rounded-md bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <svg
                className="h-4 w-4 flex-shrink-0"
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
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Count breakdown - only show when we have data */}
        {batch && batch.totalTransactions > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {/* Auto-matched */}
            <div
              className={cn(
                'rounded-lg border p-4 text-center',
                MATCH_STATUS_COLORS[MatchStatus.AUTO_MATCHED].bg,
                MATCH_STATUS_COLORS[MatchStatus.AUTO_MATCHED].border
              )}
            >
              <div
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  MATCH_STATUS_COLORS[MatchStatus.AUTO_MATCHED].text
                )}
              >
                {batch.autoMatchedCount.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Auto Matched</div>
            </div>

            {/* Needs review */}
            <div
              className={cn(
                'rounded-lg border p-4 text-center',
                MATCH_STATUS_COLORS[MatchStatus.NEEDS_REVIEW].bg,
                MATCH_STATUS_COLORS[MatchStatus.NEEDS_REVIEW].border
              )}
            >
              <div
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  MATCH_STATUS_COLORS[MatchStatus.NEEDS_REVIEW].text
                )}
              >
                {batch.needsReviewCount.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Needs Review</div>
            </div>

            {/* Unmatched */}
            <div
              className={cn(
                'rounded-lg border p-4 text-center',
                MATCH_STATUS_COLORS[MatchStatus.UNMATCHED].bg,
                MATCH_STATUS_COLORS[MatchStatus.UNMATCHED].border
              )}
            >
              <div
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  MATCH_STATUS_COLORS[MatchStatus.UNMATCHED].text
                )}
              >
                {batch.unmatchedCount.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Unmatched</div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <span>Updating every {POLLING_INTERVALS.BATCH_PROGRESS / 1000} seconds...</span>
          </div>
        )}

        {/* Completion message */}
        {isComplete && (
          <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Redirecting to results...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReconciliationProgress;
