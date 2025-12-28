'use client';

/**
 * Export Button Component
 *
 * Client-side CSV export functionality for transactions.
 * Allows admins to export unmatched transactions for offline review.
 *
 * Features:
 * - Client-side CSV generation (no server roundtrip)
 * - Proper CSV escaping for special characters
 * - Automatic filename with timestamp
 * - Loading state during export
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type BankTransaction } from '@/lib/types';
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  /** Transactions to export */
  transactions: BankTransaction[];
  /** Filename prefix (timestamp will be appended) */
  filenamePrefix?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Additional className */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Doubles any internal quotes
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if escaping is needed
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Double quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generate CSV content from transactions
 */
function generateCSV(transactions: BankTransaction[]): string {
  // CSV headers
  const headers = ['Date', 'Description', 'Amount', 'Status', 'Matched Invoice', 'Confidence'];

  // Map transactions to CSV rows
  const rows = transactions.map((txn) => [
    escapeCSVValue(formatDate(txn.transactionDate)),
    escapeCSVValue(txn.description),
    escapeCSVValue(txn.amount.toFixed(2)),
    escapeCSVValue(txn.status),
    escapeCSVValue(txn.matchedInvoice?.invoiceNumber || ''),
    escapeCSVValue(
      txn.confidenceScore !== null ? `${txn.confidenceScore.toFixed(1)}%` : ''
    ),
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  );

  return csvContent;
}

/**
 * Trigger browser download of CSV file
 */
function downloadCSV(content: string, filename: string): void {
  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
function generateFilename(prefix: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${prefix}_${timestamp}.csv`;
}

export function ExportButton({
  transactions,
  filenamePrefix = 'unmatched_transactions',
  variant = 'outline',
  size = 'default',
  className,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    setIsExporting(true);

    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate CSV
      const csvContent = generateCSV(transactions);
      const filename = generateFilename(filenamePrefix);

      // Trigger download
      downloadCSV(csvContent, filename);

      toast.success(`Exported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || isExporting || transactions.length === 0;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isDisabled}
      className={cn(className)}
    >
      {isExporting ? (
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
          Exporting...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </>
      )}
    </Button>
  );
}

export default ExportButton;

