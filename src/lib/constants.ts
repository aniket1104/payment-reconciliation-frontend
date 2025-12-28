/**
 * Frontend Constants
 *
 * Centralized constants for status labels, colors, and configuration.
 * Keep in sync with backend status values.
 */

import { MatchStatus, BatchStatus, InvoiceStatus } from './types';

// =============================================================================
// Match Status Configuration
// =============================================================================

/**
 * Human-readable labels for match statuses
 */
export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  [MatchStatus.AUTO_MATCHED]: 'Auto Matched',
  [MatchStatus.NEEDS_REVIEW]: 'Needs Review',
  [MatchStatus.UNMATCHED]: 'Unmatched',
  [MatchStatus.CONFIRMED]: 'Confirmed',
  [MatchStatus.EXTERNAL]: 'External',
} as const;

/**
 * Tailwind color classes for match status badges
 * Uses semantic colors: green=success, yellow=warning, red=error, blue=info, gray=neutral
 */
export const MATCH_STATUS_COLORS: Record<
  MatchStatus,
  { bg: string; text: string; border: string }
> = {
  [MatchStatus.AUTO_MATCHED]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [MatchStatus.NEEDS_REVIEW]: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  [MatchStatus.UNMATCHED]: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  [MatchStatus.CONFIRMED]: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  [MatchStatus.EXTERNAL]: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
} as const;

// =============================================================================
// Batch Status Configuration
// =============================================================================

/**
 * Human-readable labels for batch statuses
 */
export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  [BatchStatus.UPLOADING]: 'Uploading',
  [BatchStatus.PROCESSING]: 'Processing',
  [BatchStatus.COMPLETED]: 'Completed',
  [BatchStatus.FAILED]: 'Failed',
} as const;

/**
 * Tailwind color classes for batch status badges
 */
export const BATCH_STATUS_COLORS: Record<
  BatchStatus,
  { bg: string; text: string; border: string }
> = {
  [BatchStatus.UPLOADING]: {
    bg: 'bg-sky-50 dark:bg-sky-950',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  [BatchStatus.PROCESSING]: {
    bg: 'bg-violet-50 dark:bg-violet-950',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  [BatchStatus.COMPLETED]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [BatchStatus.FAILED]: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
} as const;

// =============================================================================
// Invoice Status Configuration
// =============================================================================

/**
 * Human-readable labels for invoice statuses
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: 'Pending',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
} as const;

/**
 * Tailwind color classes for invoice status badges
 */
export const INVOICE_STATUS_COLORS: Record<
  InvoiceStatus,
  { bg: string; text: string; border: string }
> = {
  [InvoiceStatus.PENDING]: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  [InvoiceStatus.PAID]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [InvoiceStatus.OVERDUE]: {
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  [InvoiceStatus.CANCELLED]: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
} as const;

// =============================================================================
// Polling Configuration
// =============================================================================

/**
 * Polling intervals in milliseconds
 */
export const POLLING_INTERVALS = {
  /** Interval for batch progress updates during processing */
  BATCH_PROGRESS: 2000,
  /** Interval for refreshing batch list */
  BATCH_LIST: 5000,
  /** Default polling interval */
  DEFAULT: 3000,
} as const;

// =============================================================================
// Confidence Thresholds
// =============================================================================

/**
 * Confidence score thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence for auto-match */
  AUTO_MATCH: 85,
  /** Confidence below this triggers needs review */
  NEEDS_REVIEW: 70,
  /** High confidence indicator */
  HIGH: 90,
  /** Medium confidence indicator */
  MEDIUM: 75,
} as const;

/**
 * Get confidence level category
 */
export function getConfidenceLevel(
  score: number
): 'high' | 'medium' | 'low' | 'none' {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  if (score > 0) return 'low';
  return 'none';
}

/**
 * Confidence level colors
 */
export const CONFIDENCE_COLORS: Record<
  'high' | 'medium' | 'low' | 'none',
  string
> = {
  high: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-red-600 dark:text-red-400',
  none: 'text-slate-400 dark:text-slate-600',
} as const;

// =============================================================================
// UI Configuration
// =============================================================================

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * Desktop breakpoint (minimum supported width)
 */
export const DESKTOP_BREAKPOINT = 1024;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

