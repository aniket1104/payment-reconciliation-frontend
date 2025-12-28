'use client';

/**
 * Invoice Details Card
 *
 * Read-only card displaying matched invoice information.
 * Part of the Transaction Detail Page for explainability.
 *
 * Displays:
 * - Invoice number
 * - Customer name
 * - Invoice amount
 * - Due date
 * - Invoice status
 *
 * Shows a neutral message when no invoice is matched.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type Invoice, InvoiceStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface InvoiceDetailsCardProps {
  /** The matched invoice, or null if unmatched */
  invoice: Invoice | null;
}

/**
 * Color configuration for invoice statuses
 */
const INVOICE_STATUS_COLORS: Record<
  InvoiceStatus,
  { bg: string; text: string; border: string }
> = {
  [InvoiceStatus.PENDING]: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  [InvoiceStatus.PAID]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  [InvoiceStatus.OVERDUE]: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  [InvoiceStatus.CANCELLED]: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

/**
 * Labels for invoice statuses
 */
const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: 'Pending',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
};

/**
 * Empty state component when no invoice is matched
 */
function EmptyInvoiceState() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Matched Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {/* Invoice icon */}
          <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <svg
              className="text-muted-foreground h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">
            No invoice is currently linked to this transaction.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceDetailsCard({ invoice }: InvoiceDetailsCardProps) {
  // Show empty state if no invoice
  if (!invoice) {
    return <EmptyInvoiceState />;
  }

  // Get status colors for badge
  const statusColors = INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Matched Invoice</CardTitle>
          <Badge
            className={cn(
              'border font-medium',
              statusColors.bg,
              statusColors.text,
              statusColors.border
            )}
          >
            {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invoice Number */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Invoice Number
          </p>
          <p className="text-foreground text-lg font-semibold">
            {invoice.invoiceNumber}
          </p>
        </div>

        <Separator />

        {/* Customer Name */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Customer
          </p>
          <p className="text-foreground text-sm font-medium">
            {invoice.customerName}
          </p>
        </div>

        <Separator />

        {/* Amount and Due Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Invoice Amount
            </p>
            <p className="text-foreground text-lg font-semibold tabular-nums">
              {formatCurrency(invoice.amount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Due Date
            </p>
            <p className="text-foreground text-sm font-medium">
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        {/* Invoice ID (less prominent) */}
        <div className="space-y-1 pt-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Invoice ID
          </p>
          <p
            className="text-muted-foreground font-mono text-xs"
            title={invoice.id}
          >
            {invoice.id.length > 12
              ? `${invoice.id.slice(0, 8)}...${invoice.id.slice(-4)}`
              : invoice.id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvoiceDetailsCard;

