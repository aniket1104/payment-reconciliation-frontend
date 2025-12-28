'use client';

/**
 * CSV Upload Card Component
 *
 * Provides a dropzone-style file upload UI for bank transaction CSV files.
 * Features:
 * - File type validation (.csv only)
 * - Visual feedback during selection
 * - Loading state during upload
 * - Error display for validation failures
 */

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CsvUploadCardProps {
  /** Called when upload should begin */
  onUpload: (file: File) => Promise<void>;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Error message to display */
  error: string | null;
  /** Callback to clear error */
  onClearError: () => void;
}

/**
 * Validates that the file is a CSV
 */
function isValidCsvFile(file: File): boolean {
  // Check by extension
  const hasValidExtension = file.name.toLowerCase().endsWith('.csv');

  // Check by MIME type (browsers can be inconsistent)
  const validMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  const hasValidMimeType = validMimeTypes.includes(file.type) || file.type === '';

  return hasValidExtension && hasValidMimeType;
}

export function CsvUploadCard({
  onUpload,
  isUploading,
  error,
  onClearError,
}: CsvUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection from input or drop
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      // Clear previous errors
      setValidationError(null);
      onClearError();

      // Validate file type
      if (!isValidCsvFile(file)) {
        setValidationError('Please select a CSV file (.csv)');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    [onClearError]
  );

  /**
   * Handle input change event
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle upload button click
   */
  const handleUploadClick = async () => {
    if (selectedFile && !isUploading) {
      await onUpload(selectedFile);
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    onClearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combine validation error and API error
  const displayError = validationError || error;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Upload Bank Transactions</CardTitle>
        <CardDescription>
          Upload a CSV file containing bank transactions to start reconciliation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/csv"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Drop zone */}
        <div
          onClick={!isUploading ? handleBrowseClick : undefined}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            isUploading && 'cursor-not-allowed opacity-60',
            displayError && 'border-destructive/50'
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
              selectedFile ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'
            )}
          >
            {selectedFile ? (
              // Checkmark icon
              <svg
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              // Upload icon
              <svg
                className="h-8 w-8 text-muted-foreground"
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
            )}
          </div>

          {/* Text */}
          {selectedFile ? (
            <div className="text-center">
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="mt-2 text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Choose a different file
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Click to browse</span> or drag
                and drop
              </p>
              <p className="mt-1 text-sm text-muted-foreground">CSV files only</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
            <span>{displayError}</span>
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
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
              Uploading...
            </>
          ) : (
            'Start Reconciliation'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default CsvUploadCard;

