'use client';

/**
 * Transaction Details Card
 *
 * Read-only card displaying bank transaction information.
 * Part of the Transaction Detail Page for explainability.
 *
 * Displays:
 * - Transaction ID (truncated)
 * - Transaction date
 * - Description
 * - Amount
 * - Current status with colored badge
 * - Confidence score (if available)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MatchStatus, type BankTransaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { MATCH_STATUS_COLORS, MATCH_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TransactionDetailsCardProps {
  /** The bank transaction to display */
  transaction: BankTransaction;
}

/**
 * Format confidence score as a percentage string
 */
function formatConfidence(score: number | null): string {
  if (score === null) return 'N/A';
  return `${score.toFixed(1)}%`;
}

/**
 * Truncate transaction ID for display
 */
function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

export function TransactionDetailsCard({ transaction }: TransactionDetailsCardProps) {
  // Get status colors for badge
  const statusColors = MATCH_STATUS_COLORS[transaction.status as MatchStatus] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
  };

  // Determine confidence color based on score
  const getConfidenceColor = (score: number | null): string => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bank Transaction</CardTitle>
          <Badge
            className={cn(
              'border font-medium',
              statusColors.bg,
              statusColors.text,
              statusColors.border
            )}
          >
            {MATCH_STATUS_LABELS[transaction.status as MatchStatus] || transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction ID */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Transaction ID
          </p>
          <p
            className="text-foreground font-mono text-sm"
            title={transaction.id}
          >
            {truncateId(transaction.id)}
          </p>
        </div>

        <Separator />

        {/* Date and Amount Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Date
            </p>
            <p className="text-foreground text-sm font-medium">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Amount
            </p>
            <p className="text-foreground text-lg font-semibold tabular-nums">
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Description
          </p>
          <p className="text-foreground text-sm leading-relaxed">
            {transaction.description}
          </p>
        </div>

        <Separator />

        {/* Confidence Score */}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Confidence Score
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xl font-bold tabular-nums',
                getConfidenceColor(transaction.confidenceScore)
              )}
            >
              {formatConfidence(transaction.confidenceScore)}
            </span>
            {transaction.confidenceScore !== null && (
              <span className="text-muted-foreground text-xs">
                {transaction.confidenceScore >= 80
                  ? 'High confidence'
                  : transaction.confidenceScore >= 60
                    ? 'Medium confidence'
                    : 'Low confidence'}
              </span>
            )}
          </div>
        </div>

        {/* Batch ID (less prominent) */}
        <div className="space-y-1 pt-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Batch ID
          </p>
          <p
            className="text-muted-foreground font-mono text-xs"
            title={transaction.batchId}
          >
            {truncateId(transaction.batchId)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionDetailsCard;

