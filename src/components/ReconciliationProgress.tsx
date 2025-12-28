'use client';

/**
 * Reconciliation Progress Component
 *
 * Displays real-time progress of a reconciliation batch.
 * Simplified version: Loader + status message.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { fetchBatchById, updateCurrentBatch } from '@/store/slices/batchesSlice';
import { BatchStatus, type ReconciliationBatch } from '@/lib/types';
import { POLLING_INTERVALS } from '@/lib/constants';

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

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      {/* Loader */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute h-full w-full animate-ping rounded-full bg-primary/20 opacity-75 duration-1000" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 border-primary/30 shadow-sm">
          <svg 
            className="h-6 w-6 animate-spin text-primary" 
            xmlns="http://www.w3.org/2000/svg" 
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
        </div>
      </div>

      {/* Message */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-medium text-foreground">
          Sit tight, we are processing
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {batch?.filename 
            ? `Analyzing ${batch.filename}...` 
            : 'Analyzing your transactions...'}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 flex flex-col items-center gap-2 text-destructive">
          <p className="text-sm font-medium">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default ReconciliationProgress;
