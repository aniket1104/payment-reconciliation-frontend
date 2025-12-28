'use client';

/**
 * Empty State Component
 *
 * Reusable component for displaying friendly empty state messages.
 * Used across the dashboard for different scenarios:
 * - No transactions in a filter
 * - No auto-matched remaining after bulk confirm
 * - No unmatched transactions
 *
 * Supports:
 * - Custom icon
 * - Title and description
 * - Optional action button
 * - Different visual variants
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Preset icons for common empty states
 */
const presetIcons = {
  /** Generic empty/no data icon */
  empty: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  ),
  /** Success/completed icon */
  success: (
    <svg
      className="h-6 w-6"
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
  /** Search/filter icon */
  search: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  /** Document/invoice icon */
  document: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  ),
  /** Check/done icon */
  check: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  ),
};

/**
 * Visual variants for the empty state
 */
type EmptyStateVariant = 'default' | 'success' | 'muted';

interface EmptyStateProps {
  /** Icon to display - can be a preset key or custom ReactNode */
  icon?: keyof typeof presetIcons | React.ReactNode;
  /** Main title text */
  title: string;
  /** Description text below title */
  description?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button click handler */
  onAction?: () => void;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Additional className for the container */
  className?: string;
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(variant: EmptyStateVariant) {
  switch (variant) {
    case 'success':
      return {
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'muted':
      return {
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
      };
    default:
      return {
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
      };
  }
}

export function EmptyState({
  icon = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const styles = getVariantStyles(variant);

  // Resolve icon - either use preset or custom ReactNode
  const iconElement =
    typeof icon === 'string' ? presetIcons[icon as keyof typeof presetIcons] : icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
          styles.iconBg,
          styles.iconColor
        )}
      >
        {iconElement}
      </div>

      {/* Title */}
      <p className="text-foreground font-medium">{title}</p>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}

      {/* Optional action button */}
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStates = {
  /** No transactions found for current filter */
  noTransactions: (onClearFilter?: () => void) => (
    <EmptyState
      icon="search"
      title="No transactions found"
      description="Try selecting a different status filter or check back later."
      actionLabel={onClearFilter ? 'Clear Filter' : undefined}
      onAction={onClearFilter}
    />
  ),

  /** All auto-matched have been confirmed */
  allConfirmed: () => (
    <EmptyState
      icon="success"
      title="All auto-matched transactions confirmed"
      description="Great work! All high-confidence matches have been confirmed."
      variant="success"
    />
  ),

  /** No unmatched transactions */
  noUnmatched: () => (
    <EmptyState
      icon="check"
      title="No unmatched transactions"
      description="All transactions have been matched or categorized."
      variant="success"
    />
  ),

  /** No needs review transactions */
  noNeedsReview: () => (
    <EmptyState
      icon="success"
      title="No transactions need review"
      description="All ambiguous matches have been resolved."
      variant="success"
    />
  ),

  /** Generic loading complete but empty */
  noData: (title: string, description?: string) => (
    <EmptyState
      icon="document"
      title={title}
      description={description}
      variant="muted"
    />
  ),
};

export default EmptyState;

