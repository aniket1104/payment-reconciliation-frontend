/**
 * Invoices Slice
 *
 * Redux state management for invoice search.
 * Used primarily for manual matching workflow.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, ApiClientError } from '@/lib/api';
import type { Invoice, ApiResponse } from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

interface InvoicesState {
  /** Search results */
  searchResults: Invoice[];
  /** Number of results found */
  searchCount: number;
  /** Searching state */
  searching: boolean;
  /** Search error */
  searchError: string | null;
  /** Last search params for reference */
  lastSearchParams: SearchInvoicesParams | null;
}

export interface SearchInvoicesParams {
  q?: string;
  amount?: number;
  status?: string;
  includePaid?: boolean;
  limit?: number;
}

interface InvoiceSearchResponse {
  invoices: Invoice[];
  count: number;
  searchParams: Record<string, unknown>;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: InvoicesState = {
  searchResults: [],
  searchCount: 0,
  searching: false,
  searchError: null,
  lastSearchParams: null,
};

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Search invoices for manual matching
 */
export const searchInvoices = createAsyncThunk<
  InvoiceSearchResponse,
  SearchInvoicesParams,
  { rejectValue: string }
>('invoices/search', async (params, { rejectWithValue }) => {
  try {
    const queryParams: Record<string, string | number | boolean> = {};
    
    if (params.q) queryParams.q = params.q;
    if (params.amount !== undefined) queryParams.amount = params.amount;
    if (params.status) queryParams.status = params.status;
    if (params.includePaid) queryParams.includePaid = params.includePaid;
    if (params.limit) queryParams.limit = params.limit;

    const response = await api.get<ApiResponse<InvoiceSearchResponse>>(
      '/invoices/search',
      { params: queryParams }
    );
    return response.data;
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to search invoices';
    return rejectWithValue(message);
  }
});

// =============================================================================
// Slice
// =============================================================================

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    /** Clear search results */
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchCount = 0;
      state.searchError = null;
      state.lastSearchParams = null;
    },
    /** Clear search error */
    clearSearchError: (state) => {
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchInvoices.pending, (state, action) => {
        state.searching = true;
        state.searchError = null;
        state.lastSearchParams = action.meta.arg;
      })
      .addCase(searchInvoices.fulfilled, (state, action) => {
        state.searching = false;
        state.searchResults = action.payload.invoices;
        state.searchCount = action.payload.count;
      })
      .addCase(searchInvoices.rejected, (state, action) => {
        state.searching = false;
        state.searchError = action.payload || 'Search failed';
      });
  },
});

// Export actions
export const { clearSearchResults, clearSearchError } = invoicesSlice.actions;

// Export reducer
export default invoicesSlice.reducer;
