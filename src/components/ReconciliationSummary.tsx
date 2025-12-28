'use client';

/**
 * Reconciliation Summary Component
 *
 * Displays high-level statistics for a reconciliation batch.
 * Shows counts for each transaction status category.
 */

import { Card, CardContent } from '@/components/ui/card';
import { MatchStatus, type ReconciliationBatch } from '@/lib/types';
import { MATCH_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ReconciliationSummaryProps {
  /** The reconciliation batch data */
  batch: ReconciliationBatch;
}

/**
 * Individual stat card configuration
 */
interface StatCard {
  label: string;
  value: number;
  colorClasses: { bg: string; text: string; border: string };
  icon: React.ReactNode;
}

/**
 * Icon components for each stat type
 */
const icons = {
  total: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
      />
    </svg>
  ),
  autoMatched: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  needsReview: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  ),
  unmatched: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  confirmed: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  ),
  external: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  ),
};

export function ReconciliationSummary({ batch }: ReconciliationSummaryProps) {
  // Build stat cards configuration
  // Note: Confirmed and External counts are not in batch summary
  // They need to be derived from actual transactions or assumed 0 for now
  const statCards: StatCard[] = [
    {
      label: 'Total Transactions',
      value: batch.totalTransactions,
      colorClasses: {
        bg: 'bg-slate-50 dark:bg-slate-900',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      },
      icon: icons.total,
    },
    {
      label: 'Auto Matched',
      value: batch.autoMatchedCount,
      colorClasses: MATCH_STATUS_COLORS[MatchStatus.AUTO_MATCHED],
      icon: icons.autoMatched,
    },
    {
      label: 'Needs Review',
      value: batch.needsReviewCount,
      colorClasses: MATCH_STATUS_COLORS[MatchStatus.NEEDS_REVIEW],
      icon: icons.needsReview,
    },
    {
      label: 'Unmatched',
      value: batch.unmatchedCount,
      colorClasses: MATCH_STATUS_COLORS[MatchStatus.UNMATCHED],
      icon: icons.unmatched,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card
          key={card.label}
          className={cn(
            'border transition-shadow hover:shadow-md',
            card.colorClasses.border
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{card.label}</p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-bold tabular-nums',
                    card.colorClasses.text
                  )}
                >
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  card.colorClasses.bg,
                  card.colorClasses.text
                )}
              >
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ReconciliationSummary;
