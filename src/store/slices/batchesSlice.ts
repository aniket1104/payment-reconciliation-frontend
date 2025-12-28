/**
 * Batches Slice
 *
 * Redux state management for reconciliation batches.
 * Handles batch listing, individual batch details, and CSV upload.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, ApiClientError } from '@/lib/api';
import type { ReconciliationBatch, ApiResponse } from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

interface BatchesState {
  /** List of all batches */
  batches: ReconciliationBatch[];
  /** Currently selected/viewing batch */
  currentBatch: ReconciliationBatch | null;
  /** Loading state for batch list */
  loading: boolean;
  /** Loading state for current batch */
  currentBatchLoading: boolean;
  /** Error message */
  error: string | null;
  /** Upload progress state */
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  /** Batch ID after upload */
  uploadedBatchId: string | null;
  /** Total count for pagination */
  total: number;
}

interface FetchBatchesParams {
  status?: string;
  limit?: number;
  offset?: number;
}

interface FetchBatchesResponse {
  batches: ReconciliationBatch[];
  total: number;
  limit: number;
  offset: number;
}

interface UploadResponse {
  batchId: string;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: BatchesState = {
  batches: [],
  currentBatch: null,
  loading: false,
  currentBatchLoading: false,
  error: null,
  uploadStatus: 'idle',
  uploadedBatchId: null,
  total: 0,
};

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch all reconciliation batches
 */
export const fetchAllBatches = createAsyncThunk<
  FetchBatchesResponse,
  FetchBatchesParams | undefined,
  { rejectValue: string }
>('batches/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const queryParams: Record<string, string | number | undefined> = {
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    };
    
    const response = await api.get<ApiResponse<FetchBatchesResponse>>(
      '/reconciliation',
      { params: queryParams }
    );
    return response.data;
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to fetch batches';
    return rejectWithValue(message);
  }
});

/**
 * Fetch a single batch by ID
 */
export const fetchBatchById = createAsyncThunk<
  ReconciliationBatch,
  string,
  { rejectValue: string }
>('batches/fetchById', async (batchId, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<ReconciliationBatch>>(
      `/reconciliation/${batchId}`
    );
    return response.data;
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Failed to fetch batch';
    return rejectWithValue(message);
  }
});

/**
 * Upload a CSV file for reconciliation
 */
export const uploadCsv = createAsyncThunk<
  string, // Returns batch ID
  File,
  { rejectValue: string }
>('batches/uploadCsv', async (file, { rejectWithValue }) => {
  try {
    const response = await api.upload<ApiResponse<UploadResponse>>(
      '/reconciliation/upload',
      file,
      'file'
    );
    return response.data.batchId;
  } catch (err) {
    const message = err instanceof ApiClientError ? err.message : 'Upload failed';
    return rejectWithValue(message);
  }
});

// =============================================================================
// Slice
// =============================================================================

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    /** Clear current batch */
    clearCurrentBatch: (state) => {
      state.currentBatch = null;
      state.currentBatchLoading = false;
      state.error = null;
    },
    /** Reset upload state */
    resetUploadState: (state) => {
      state.uploadStatus = 'idle';
      state.uploadedBatchId = null;
      state.error = null;
    },
    /** Clear error */
    clearError: (state) => {
      state.error = null;
    },
    /** Update current batch (for polling) */
    updateCurrentBatch: (state, action: PayloadAction<ReconciliationBatch>) => {
      state.currentBatch = action.payload;
      // Also update in the batches list if present
      const index = state.batches.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.batches[index] = action.payload;
      }
    },
    /** Set upload status to processing (after initial upload) */
    setUploadProcessing: (state) => {
      state.uploadStatus = 'processing';
    },
  },
  extraReducers: (builder) => {
    // Fetch all batches
    builder
      .addCase(fetchAllBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload.batches;
        state.total = action.payload.total;
      })
      .addCase(fetchAllBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch batches';
      });

    // Fetch batch by ID
    builder
      .addCase(fetchBatchById.pending, (state) => {
        state.currentBatchLoading = true;
        state.error = null;
      })
      .addCase(fetchBatchById.fulfilled, (state, action) => {
        state.currentBatchLoading = false;
        state.currentBatch = action.payload;
      })
      .addCase(fetchBatchById.rejected, (state, action) => {
        state.currentBatchLoading = false;
        state.error = action.payload || 'Failed to fetch batch';
      });

    // Upload CSV
    builder
      .addCase(uploadCsv.pending, (state) => {
        state.uploadStatus = 'uploading';
        state.uploadedBatchId = null;
        state.error = null;
      })
      .addCase(uploadCsv.fulfilled, (state, action) => {
        state.uploadStatus = 'processing';
        state.uploadedBatchId = action.payload;
      })
      .addCase(uploadCsv.rejected, (state, action) => {
        state.uploadStatus = 'error';
        state.error = action.payload || 'Upload failed';
      });
  },
});

// Export actions
export const {
  clearCurrentBatch,
  resetUploadState,
  clearError,
  updateCurrentBatch,
  setUploadProcessing,
} = batchesSlice.actions;

// Export reducer
export default batchesSlice.reducer;
