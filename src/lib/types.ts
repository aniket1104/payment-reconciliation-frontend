/**
 * Frontend Type Definitions
 *
 * DTOs that mirror backend API responses.
 * These types define the shape of data exchanged between frontend and backend.
 */

// =============================================================================
// Enums
// =============================================================================

/**
 * Match status for bank transactions
 */
export enum MatchStatus {
  /** Transaction was automatically matched with high confidence */
  AUTO_MATCHED = 'AUTO_MATCHED',
  /** Transaction needs manual review due to ambiguity */
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  /** No matching invoice found */
  UNMATCHED = 'UNMATCHED',
  /** Match was manually confirmed by user */
  CONFIRMED = 'CONFIRMED',
  /** Transaction matched to external/non-invoice source */
  EXTERNAL = 'EXTERNAL',
}

/**
 * Status of a reconciliation batch
 */
export enum BatchStatus {
  /** File is being uploaded */
  UPLOADING = 'uploading',
  /** Transactions are being processed */
  PROCESSING = 'processing',
  /** All transactions have been processed */
  COMPLETED = 'completed',
  /** Processing failed */
  FAILED = 'failed',
}

/**
 * Invoice payment status
 */
export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// =============================================================================
// Core Entities
// =============================================================================

/**
 * Reconciliation batch summary
 */
export interface ReconciliationBatch {
  /** Unique batch identifier */
  id: string;
  /** Original filename of uploaded CSV */
  filename: string;
  /** Total number of transactions in batch */
  totalTransactions: number;
  /** Number of transactions processed so far */
  processedCount: number;
  /** Number of auto-matched transactions */
  autoMatchedCount: number;
  /** Number of transactions requiring review */
  needsReviewCount: number;
  /** Number of unmatched transactions */
  unmatchedCount: number;
  /** Current batch status */
  status: BatchStatus;
  /** When processing started */
  startedAt: string | null;
  /** When processing completed */
  completedAt: string | null;
  /** When the batch was created */
  createdAt: string;
}

/**
 * Match details for a transaction
 */
export interface MatchDetails {
  breakdown?: {
    rawTotal: number;
    rawNameSimilarity: number;
    weightedNameScore: number;
    dateScore: number;
    ambiguityPenalty: number;
  };
  explanation?: string;
  candidateCount?: number;
  normalizedDescription?: string;
  normalizedCustomerName?: string;
  
  // Legacy fields (may be missing in new API response)
  confidence?: number;
  nameSimilarity?: number;
  dateProximity?: number;
  amountMatch?: boolean;
  ambiguityPenalty?: number;
}

/**
 * Matched invoice summary (embedded in transaction)
 */
export interface MatchedInvoiceSummary {
  /** Invoice ID */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Customer name */
  customerName: string;
  /** Invoice amount */
  amount: number;
}

/**
 * Bank transaction with match information
 */
export interface BankTransaction {
  /** Unique transaction identifier */
  id: string;
  /** Date of the transaction */
  transactionDate: string;
  /** Transaction description from bank */
  description: string;
  /** Transaction amount */
  amount: number;
  /** Current match status */
  status: MatchStatus;
  /** Confidence score (0-100), null if unmatched */
  confidenceScore: number | null;
  /** Matched invoice summary, if any */
  matchedInvoice: MatchedInvoiceSummary | null;
  /** Detailed match information */
  matchDetails: MatchDetails | null;
  /** Batch this transaction belongs to */
  batchId: string;
  /** When the transaction was created */
  createdAt: string;
  /** When the transaction was last updated */
  updatedAt: string;
}

/**
 * Full invoice details
 */
export interface Invoice {
  /** Unique invoice identifier */
  id: string;
  /** Human-readable invoice number */
  invoiceNumber: string;
  /** Customer name */
  customerName: string;
  /** Invoice amount */
  amount: number;
  /** Invoice status */
  status: InvoiceStatus;
  /** Payment due date */
  dueDate: string;
  /** When the invoice was created */
  createdAt: string;
  /** When the invoice was last updated */
  updatedAt: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Cursor-based pagination response
 * Used for efficient pagination of large datasets
 */
export interface CursorPaginatedResponse<T> {
  success: boolean;
  data: T[];
  /** Base64-encoded cursor for next page, undefined if no more data */
  nextCursor?: string;
  /** Whether more data exists beyond this page */
  hasMore: boolean;
}

// =============================================================================
// Batch Progress Types
// =============================================================================

/**
 * Real-time batch progress update
 */
export interface BatchProgress {
  /** Batch identifier */
  batchId: string;
  /** Current status */
  status: BatchStatus;
  /** Number of processed transactions */
  processedCount: number;
  /** Total transactions to process */
  totalTransactions: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * Request to confirm a match
 */
export interface ConfirmMatchRequest {
  transactionId: string;
  invoiceId: string;
}

/**
 * Request to mark transaction as external
 */
export interface MarkExternalRequest {
  transactionId: string;
  reason?: string;
}

/**
 * Invoice search result
 */
export interface InvoiceSearchResult {
  invoice: Invoice;
  /** Similarity score to search query */
  score: number;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Type guard for checking if a value is a MatchStatus
 */
export function isMatchStatus(value: string): value is MatchStatus {
  return Object.values(MatchStatus).includes(value as MatchStatus);
}

/**
 * Type guard for checking if a value is a BatchStatus
 */
export function isBatchStatus(value: string): value is BatchStatus {
  return Object.values(BatchStatus).includes(value as BatchStatus);
}

