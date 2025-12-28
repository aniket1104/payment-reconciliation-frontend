'use client';

/**
 * New Reconciliation Page
 *
 * Entry point for starting a new reconciliation run.
 * Flow:
 * 1. User uploads a CSV file
 * 2. Backend returns batchId immediately
 * 3. Page transitions to progress tracking mode
 * 4. Progress is polled every 2 seconds
 * 5. On completion, user is redirected to batch dashboard
 *
 * State management:
 * - Uses Redux for upload and batch state
 * - Local state for UI-only concerns
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { CsvUploadCard } from '@/components/CsvUploadCard';
import { ReconciliationProgress } from '@/components/ReconciliationProgress';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  uploadCsv,
  resetUploadState,
  updateCurrentBatch,
  clearError,
} from '@/store/slices/batchesSlice';
import type { ReconciliationBatch } from '@/lib/types';
import { BatchStatus } from '@/lib/types';

export default function NewReconciliationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const { uploadStatus, uploadedBatchId, currentBatch, error } = useAppSelector(
    (state) => state.batches
  );

  // Derived state
  const isUploading = uploadStatus === 'uploading';
  const isProcessing = uploadStatus === 'processing' || uploadStatus === 'complete';

  /**
   * Handle CSV file upload via Redux thunk
   */
  const handleUpload = useCallback(
    async (file: File) => {
      dispatch(uploadCsv(file));
    },
    [dispatch]
  );

  /**
   * Clear upload error
   */
  const handleClearUploadError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Handle batch progress update from polling
   */
  const handleBatchUpdate = useCallback(
    (updatedBatch: ReconciliationBatch) => {
      dispatch(updateCurrentBatch(updatedBatch));
    },
    [dispatch]
  );

  /**
   * Handle reconciliation completion
   * Redirect to batch dashboard after a brief delay
   */
  const handleComplete = useCallback(
    (completedBatch: ReconciliationBatch) => {
      dispatch(updateCurrentBatch(completedBatch));

      // Small delay to show completion state before redirect
      setTimeout(() => {
        router.push(`/reconciliation/${completedBatch.id}` as Route);
      }, 1000);
    },
    [router, dispatch]
  );

  /**
   * Handle progress tracking error - already handled by Redux
   */
  const handleProgressError = useCallback(() => {
    // Error already in Redux state
  }, []);

  /**
   * Reset to allow retry after error
   */
  const handleRetry = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Reset everything to start a new upload
   */
  const handleStartNew = useCallback(() => {
    dispatch(resetUploadState());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Optionally reset state when leaving the page
    };
  }, []);

  // Determine progress error from Redux error when in processing state
  const progressError =
    isProcessing && currentBatch?.status === BatchStatus.FAILED
      ? 'Reconciliation failed. Please try again.'
      : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">
            New Reconciliation
          </h1>
          {isProcessing && (
            <button
              onClick={handleStartNew}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Start New Upload
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="flex justify-center">
          {/* Upload state */}
          {!isProcessing && (
            <CsvUploadCard
              onUpload={handleUpload}
              isUploading={isUploading}
              error={uploadStatus === 'error' ? error : null}
              onClearError={handleClearUploadError}
            />
          )}

          {/* Processing state */}
          {isProcessing && uploadedBatchId && (
            <ReconciliationProgress
              batchId={uploadedBatchId}
              batch={currentBatch}
              onBatchUpdate={handleBatchUpdate}
              onComplete={handleComplete}
              onError={handleProgressError}
              error={progressError}
              onRetry={handleRetry}
            />
          )}
        </div>

        {/* Helpful information */}
        <div className="mt-12 flex justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            {!isProcessing ? (
              <p>
                Upload a CSV file containing bank transactions. The file should include
                columns for transaction date, description, and amount.
              </p>
            ) : (
              <p>
                Your file is being processed. You&apos;ll be automatically redirected
                to the results page when reconciliation is complete.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
