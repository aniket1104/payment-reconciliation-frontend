'use client';

/**
 * Reconciliation Tabs Component
 *
 * Provides status-based filtering for transactions.
 * Clicking a tab filters the transaction list by status.
 */

import { MatchStatus, type ReconciliationBatch } from '@/lib/types';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Tab filter options
 * null = "All" (no filter)
 */
export type TabFilter = MatchStatus | null;

interface ReconciliationTabsProps {
  /** Currently selected tab */
  activeTab: TabFilter;
  /** Callback when tab changes */
  onTabChange: (tab: TabFilter) => void;
  /** Batch data for showing counts (optional) */
  batch?: ReconciliationBatch;
  /** Whether tabs are disabled (e.g., during loading) */
  disabled?: boolean;
}

/**
 * Tab configuration
 */
interface TabConfig {
  id: TabFilter;
  label: string;
  count?: number;
  colors?: { bg: string; text: string; border: string };
}

export function ReconciliationTabs({
  activeTab,
  onTabChange,
  batch,
  disabled = false,
}: ReconciliationTabsProps) {
  // Build tabs with counts from batch
  const tabs: TabConfig[] = [
    {
      id: null,
      label: 'All',
      count: batch?.totalTransactions,
    },
    {
      id: MatchStatus.AUTO_MATCHED,
      label: MATCH_STATUS_LABELS[MatchStatus.AUTO_MATCHED],
      count: batch?.autoMatchedCount,
      colors: MATCH_STATUS_COLORS[MatchStatus.AUTO_MATCHED],
    },
    {
      id: MatchStatus.NEEDS_REVIEW,
      label: MATCH_STATUS_LABELS[MatchStatus.NEEDS_REVIEW],
      count: batch?.needsReviewCount,
      colors: MATCH_STATUS_COLORS[MatchStatus.NEEDS_REVIEW],
    },
    {
      id: MatchStatus.UNMATCHED,
      label: MATCH_STATUS_LABELS[MatchStatus.UNMATCHED],
      count: batch?.unmatchedCount,
      colors: MATCH_STATUS_COLORS[MatchStatus.UNMATCHED],
    },
    {
      id: MatchStatus.CONFIRMED,
      label: MATCH_STATUS_LABELS[MatchStatus.CONFIRMED],
      colors: MATCH_STATUS_COLORS[MatchStatus.CONFIRMED],
    },
    {
      id: MatchStatus.EXTERNAL,
      label: MATCH_STATUS_LABELS[MatchStatus.EXTERNAL],
      colors: MATCH_STATUS_COLORS[MatchStatus.EXTERNAL],
    },
  ];

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Transaction status tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id ?? 'all'}
              onClick={() => onTabChange(tab.id)}
              disabled={disabled}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Tab label */}
              <span>{tab.label}</span>

              {/* Count badge */}


              {/* Active indicator */}
              {isActive && (
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-px h-0.5',
                    tab.colors ? tab.colors.text.replace('text-', 'bg-') : 'bg-foreground'
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ReconciliationTabs;

