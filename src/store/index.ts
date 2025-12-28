/**
 * Redux Store Configuration
 *
 * Central store for application state management.
 * Uses Redux Toolkit for simplified Redux setup.
 */

import { configureStore } from '@reduxjs/toolkit';
import batchesReducer from './slices/batchesSlice';
import transactionsReducer from './slices/transactionsSlice';
import invoicesReducer from './slices/invoicesSlice';

export const store = configureStore({
  reducer: {
    batches: batchesReducer,
    transactions: transactionsReducer,
    invoices: invoicesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['batches/uploadCsv/pending'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.file'],
        // Ignore these paths in the state
        ignoredPaths: [],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
