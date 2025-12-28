'use client';

/**
 * Manual Match Modal Component
 *
 * Modal dialog for manually matching a transaction to an invoice.
 * Uses Redux for invoice search state management.
 * Features:
 * - Search invoices by customer name, amount, or invoice number
 * - Debounced search input (300ms)
 * - Invoice results list with selection
 * - Confirmation before matching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchInvoices, clearSearchResults } from '@/store/slices/invoicesSlice';
import type { BankTransaction, Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface ManualMatchModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The transaction to match */
  transaction: BankTransaction | null;
  /** Callback when a match is confirmed */
  onMatch: (transactionId: string, invoiceId: string) => void;
  /** Whether matching is in progress */
  isMatching: boolean;
}

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 300;

export function ManualMatchModal({
  open,
  onClose,
  transaction,
  onMatch,
  isMatching,
}: ManualMatchModalProps) {
  const dispatch = useAppDispatch();

  // Redux state - invoices
  const {
    searchResults: invoices,
    searching: isSearching,
    searchError,
  } = useAppSelector((state) => state.invoices);

  // Local search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Selection state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Search invoices by amount (for initial load)
   */
  const searchByAmount = useCallback(
    (amount: number) => {
      setHasSearched(true);
      dispatch(searchInvoices({ amount, limit: 20 }));
    },
    [dispatch]
  );

  /**
   * Search invoices by query
   */
  const doSearchInvoices = useCallback(
    (query: string) => {
      setHasSearched(true);

      // If query looks like a number, search by amount
      const numericQuery = parseFloat(query);
      if (!isNaN(numericQuery) && query.trim() === String(numericQuery)) {
        dispatch(searchInvoices({ amount: numericQuery, limit: 20 }));
      } else if (query.trim()) {
        // Otherwise search by customer name
        dispatch(searchInvoices({ q: query.trim(), limit: 20 }));
      } else {
        // Empty query - search by transaction amount if available
        if (transaction) {
          dispatch(searchInvoices({ amount: transaction.amount, limit: 20 }));
        }
      }
    },
    [dispatch, transaction]
  );

  // Reset state when modal opens/closes or transaction changes
  useEffect(() => {
    if (open && transaction) {
      // Reset local state
      setSearchQuery('');
      setDebouncedQuery('');
      setSelectedInvoice(null);
      setHasSearched(false);

      // Clear Redux search results
      dispatch(clearSearchResults());

      // Auto-search by amount when modal opens
      searchByAmount(transaction.amount);
    }
  }, [open, transaction, dispatch, searchByAmount]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery || hasSearched) {
      doSearchInvoices(debouncedQuery);
    }
  }, [debouncedQuery, doSearchInvoices, hasSearched]);

  /**
   * Handle invoice selection
   */
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setConfirmDialogOpen(true);
  };

  /**
   * Handle match confirmation
   */
  const handleConfirmMatch = () => {
    if (transaction && selectedInvoice) {
      setConfirmDialogOpen(false);
      onMatch(transaction.id, selectedInvoice.id);
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    if (transaction) {
      searchByAmount(transaction.amount);
    }
  };

  if (!transaction) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Find Matching Invoice</DialogTitle>
            <DialogDescription>
              Search for an invoice to match with this transaction.
            </DialogDescription>
          </DialogHeader>

          {/* Transaction summary */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="font-medium">{transaction.description}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium tabular-nums">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(transaction.transactionDate)}</p>
              </div>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by customer name or amount..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[300px] min-h-[200px] overflow-y-auto rounded-lg border border-border">
            {/* Loading state */}
            {isSearching && invoices.length === 0 && (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {searchError && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="mb-2 text-sm text-destructive">{searchError}</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!isSearching && !searchError && invoices.length === 0 && hasSearched && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No invoices found matching your search.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term or amount.
                </p>
              </div>
            )}

            {/* Invoice list */}
            {!searchError && invoices.length > 0 && (
              <div className="divide-y divide-border">
                {invoices.map((invoice) => {
                  const amountMatch = Math.abs(invoice.amount - transaction.amount) < 0.01;

                  return (
                    <button
                      key={invoice.id}
                      onClick={() => handleSelectInvoice(invoice)}
                      disabled={isMatching}
                      className={cn(
                        'flex w-full items-center justify-between p-4 text-left transition-colors',
                        'hover:bg-muted/50 focus:bg-muted/50 focus:outline-none',
                        'disabled:pointer-events-none disabled:opacity-50'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {invoice.invoiceNumber}
                          </p>
                          {amountMatch && (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              Amount match
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {invoice.customerName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-medium tabular-nums text-foreground">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {invoice.status}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isMatching}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm manual match?</AlertDialogTitle>
            <AlertDialogDescription>
              Match this transaction to invoice{' '}
              <strong>{selectedInvoice?.invoiceNumber}</strong> (
              {selectedInvoice && formatCurrency(selectedInvoice.amount)}) from{' '}
              <strong>{selectedInvoice?.customerName}</strong>?
              <br />
              <br />
              This action will be recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMatching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmMatch}
              disabled={isMatching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isMatching ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Matching...
                </>
              ) : (
                'Confirm Match'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ManualMatchModal;
