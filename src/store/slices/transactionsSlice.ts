/**
 * Transactions Slice
 *
 * Redux state management for bank transactions.
 * Handles transaction listing, details, and admin actions.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, ApiClientError } from '@/lib/api';
import type {
  BankTransaction,
  ApiResponse,
  CursorPaginatedResponse,
  MatchStatus,
} from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

interface TransactionsState {
  /** List of transactions for current batch */
  transactions: BankTransaction[];
  /** Currently selected transaction for detail view */
  currentTransaction: BankTransaction | null;
  /** Loading state for transaction list */
  loading: boolean;
  /** Loading state for loading more transactions */
  loadingMore: boolean;
  /** Loading state for current transaction */
  currentTransactionLoading: boolean;
  /** Error message */
  error: string | null;
  /** Cursor for next page */
  nextCursor: string | undefined;
  /** Whether more transactions exist */
  hasMore: boolean;
  /** Current filter status */
  filterStatus: MatchStatus | null;
  /** Current batch ID being viewed */
  currentBatchId: string | null;
  /** Action in progress */
  actionLoading: { id: string; type: ActionType } | null;
  /** Bulk confirm in progress */
  bulkConfirmLoading: boolean;
  /** Pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ActionType = 'confirm' | 'reject' | 'match' | 'external';

interface FetchTransactionsParams {
  batchId: string;
  status?: string;
  cursor?: string;
  limit?: number;
  append?: boolean;
  page?: number;
}

interface TransactionApiItem {
  id: string;
  uploadBatchId: string;
  transactionDate: string;
  description: string;
  amount: string | number;
  referenceNumber: string | null;
  status: string;
  matchedInvoiceId: string | null;
  confidenceScore: string | number | null;
  matchDetails: Record<string, unknown> | null;
  createdAt: string;
  matchedInvoice: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    amount: string | number;
  } | null;
}

interface ActionResponse {
  transaction: TransactionApiItem;
  auditLogId: string;
}

interface BulkConfirmResponse {
  confirmedCount: number;
  transactionIds: string[];
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Map backend status to frontend enum
 */
function mapStatusToEnum(status: string): MatchStatus {
  const statusMap: Record<string, MatchStatus> = {
    auto_matched: 'AUTO_MATCHED' as MatchStatus,
    needs_review: 'NEEDS_REVIEW' as MatchStatus,
    unmatched: 'UNMATCHED' as MatchStatus,
    confirmed: 'CONFIRMED' as MatchStatus,
    external: 'EXTERNAL' as MatchStatus,
    pending: 'NEEDS_REVIEW' as MatchStatus,
  };
  return statusMap[status.toLowerCase()] || ('UNMATCHED' as MatchStatus);
}

/**
 * Transform API transaction to frontend type
 */
function transformTransaction(item: TransactionApiItem): BankTransaction {
  return {
    id: item.id,
    transactionDate: item.transactionDate,
    description: item.description,
    amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
    status: mapStatusToEnum(item.status),
    confidenceScore:
      item.confidenceScore !== null
        ? typeof item.confidenceScore === 'string'
          ? parseFloat(item.confidenceScore)
          : item.confidenceScore
        : null,
    matchedInvoice: item.matchedInvoice
      ? {
          id: item.matchedInvoice.id,
          invoiceNumber: item.matchedInvoice.invoiceNumber,
          customerName: item.matchedInvoice.customerName,
          amount:
            typeof item.matchedInvoice.amount === 'string'
              ? parseFloat(item.matchedInvoice.amount)
              : item.matchedInvoice.amount,
        }
      : null,
    matchDetails: item.matchDetails as BankTransaction['matchDetails'],
    batchId: item.uploadBatchId,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: TransactionsState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  loadingMore: false,
  currentTransactionLoading: false,
  error: null,
  nextCursor: undefined,
  hasMore: false,
  filterStatus: null,
  currentBatchId: null,
  actionLoading: null,
  bulkConfirmLoading: false,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
};

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch transactions for a batch with cursor pagination
 */
export const fetchBatchTransactions = createAsyncThunk<
  { 
    data: BankTransaction[]; 
    nextCursor?: string; 
    hasMore?: boolean; 
    append: boolean;
    pagination?: { page: number; limit: number; total: number; totalPages: number }
  },
  FetchTransactionsParams,
  { rejectValue: string }
>('transactions/fetchBatch', async (params, { rejectWithValue }) => {
  try {
    const queryParams: Record<string, string | number> = {
      limit: params.limit || 50,
    };
    if (params.cursor) queryParams.cursor = params.cursor;
    if (params.status) queryParams.status = params.status;
    if (params.page) queryParams.page = params.page;

    // Use different type depending on pagination mode
    if (params.page) {
       const response = await api.get<ApiResponse<{ transactions: TransactionApiItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(
        `/api/v1/reconciliation/${params.batchId}/transactions`,
        { params: queryParams }
      );
      
      return {
        data: response.data.transactions.map(transformTransaction),
        pagination: response.data.pagination,
        append: false, // Offset pagination always replaces
      };
    } else {
      const response = await api.get<ApiResponse<CursorPaginatedResponse<TransactionApiItem>>>(
        `/api/v1/reconciliation/${params.batchId}/transactions`,
        { params: queryParams }
      );

      return {
        data: response.data.data.map(transformTransaction),
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
        append: params.append || false,
      };
    }
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to fetch transactions';
    return rejectWithValue(message);
  }
});

/**
 * Fetch a single transaction by ID
 */
export const fetchTransactionById = createAsyncThunk<
  BankTransaction,
  string,
  { rejectValue: string }
>('transactions/fetchById', async (transactionId, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<TransactionApiItem>>(
      `/api/v1/transactions/${transactionId}`
    );
    return transformTransaction(response.data);
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to fetch transaction';
    return rejectWithValue(message);
  }
});

/**
 * Confirm a match
 */
export const confirmMatch = createAsyncThunk<
  BankTransaction,
  string,
  { rejectValue: string }
>('transactions/confirm', async (transactionId, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<ActionResponse>>(
      `/api/v1/transactions/${transactionId}/confirm`
    );
    return transformTransaction(response.data.transaction);
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to confirm match';
    return rejectWithValue(message);
  }
});

/**
 * Reject a match
 */
export const rejectMatch = createAsyncThunk<
  BankTransaction,
  { transactionId: string; reason?: string },
  { rejectValue: string }
>('transactions/reject', async ({ transactionId, reason }, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<ActionResponse>>(
      `/api/v1/transactions/${transactionId}/reject`,
      { reason }
    );
    return transformTransaction(response.data.transaction);
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to reject match';
    return rejectWithValue(message);
  }
});

/**
 * Manual match a transaction to an invoice
 */
export const manualMatch = createAsyncThunk<
  BankTransaction,
  { transactionId: string; invoiceId: string; reason?: string },
  { rejectValue: string }
>('transactions/manualMatch', async ({ transactionId, invoiceId, reason }, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<ActionResponse>>(
      `/api/v1/transactions/${transactionId}/match`,
      { invoiceId, reason }
    );
    return transformTransaction(response.data.transaction);
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to match transaction';
    return rejectWithValue(message);
  }
});

/**
 * Mark transaction as external
 */
export const markExternal = createAsyncThunk<
  BankTransaction,
  { transactionId: string; reason?: string },
  { rejectValue: string }
>('transactions/markExternal', async ({ transactionId, reason }, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<ActionResponse>>(
      `/api/v1/transactions/${transactionId}/external`,
      { reason }
    );
    return transformTransaction(response.data.transaction);
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to mark as external';
    return rejectWithValue(message);
  }
});

/**
 * Bulk confirm all auto-matched transactions in a batch
 */
export const bulkConfirm = createAsyncThunk<
  BulkConfirmResponse,
  string,
  { rejectValue: string }
>('transactions/bulkConfirm', async (batchId, { rejectWithValue }) => {
  try {
    const response = await api.post<ApiResponse<BulkConfirmResponse>>(
      '/api/v1/transactions/bulk-confirm',
      { batchId }
    );
    return response.data;
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to bulk confirm';
    return rejectWithValue(message);
  }
});

// =============================================================================
// Slice
// =============================================================================

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    /** Clear transactions list */
    clearTransactions: (state) => {
      state.transactions = [];
      state.nextCursor = undefined;
      state.hasMore = false;
      state.currentBatchId = null;
    },
    /** Clear current transaction */
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
      state.currentTransactionLoading = false;
    },
    /** Set filter status */
    setFilterStatus: (state, action: PayloadAction<MatchStatus | null>) => {
      state.filterStatus = action.payload;
      // Clear transactions when filter changes
      state.transactions = [];
      state.nextCursor = undefined;
      state.hasMore = false;
    },
    /** Set current batch ID */
    setCurrentBatchId: (state, action: PayloadAction<string>) => {
      if (state.currentBatchId !== action.payload) {
        state.currentBatchId = action.payload;
        state.transactions = [];
        state.nextCursor = undefined;
        state.hasMore = false;
      }
    },
    /** Clear error */
    clearError: (state) => {
      state.error = null;
    },
    /** Update a transaction in the list */
    updateTransaction: (state, action: PayloadAction<BankTransaction>) => {
      const index = state.transactions.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
      if (state.currentTransaction?.id === action.payload.id) {
        state.currentTransaction = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch batch transactions
    builder
      .addCase(fetchBatchTransactions.pending, (state, action) => {
        if (action.meta.arg.append) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchBatchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        if (action.payload.append) {
          state.transactions = [...state.transactions, ...action.payload.data];
        } else {
          state.transactions = action.payload.data;
        }
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
          state.hasMore = action.payload.pagination.page < action.payload.pagination.totalPages;
        } else {
           state.nextCursor = action.payload.nextCursor;
           state.hasMore = !!action.payload.hasMore;
        }
      })
      .addCase(fetchBatchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload || 'Failed to fetch transactions';
      });

    // Fetch transaction by ID
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.currentTransactionLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.currentTransactionLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.currentTransactionLoading = false;
        state.error = action.payload || 'Failed to fetch transaction';
      });

    // Confirm match
    builder
      .addCase(confirmMatch.pending, (state, action) => {
        state.actionLoading = { id: action.meta.arg, type: 'confirm' };
      })
      .addCase(confirmMatch.fulfilled, (state, action) => {
        state.actionLoading = null;
        // Update transaction in list
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(confirmMatch.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload || 'Failed to confirm';
      });

    // Reject match
    builder
      .addCase(rejectMatch.pending, (state, action) => {
        state.actionLoading = { id: action.meta.arg.transactionId, type: 'reject' };
      })
      .addCase(rejectMatch.fulfilled, (state, action) => {
        state.actionLoading = null;
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(rejectMatch.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload || 'Failed to reject';
      });

    // Manual match
    builder
      .addCase(manualMatch.pending, (state, action) => {
        state.actionLoading = { id: action.meta.arg.transactionId, type: 'match' };
      })
      .addCase(manualMatch.fulfilled, (state, action) => {
        state.actionLoading = null;
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(manualMatch.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload || 'Failed to match';
      });

    // Mark external
    builder
      .addCase(markExternal.pending, (state, action) => {
        state.actionLoading = { id: action.meta.arg.transactionId, type: 'external' };
      })
      .addCase(markExternal.fulfilled, (state, action) => {
        state.actionLoading = null;
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(markExternal.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload || 'Failed to mark external';
      });

    // Bulk confirm
    builder
      .addCase(bulkConfirm.pending, (state) => {
        state.bulkConfirmLoading = true;
      })
      .addCase(bulkConfirm.fulfilled, (state) => {
        state.bulkConfirmLoading = false;
      })
      .addCase(bulkConfirm.rejected, (state, action) => {
        state.bulkConfirmLoading = false;
        state.error = action.payload || 'Failed to bulk confirm';
      });
  },
});

// Export actions
export const {
  clearTransactions,
  clearCurrentTransaction,
  setFilterStatus,
  setCurrentBatchId,
  clearError,
  updateTransaction,
} = transactionsSlice.actions;

// Export reducer
export default transactionsSlice.reducer;
