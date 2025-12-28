'use client';

/**
 * Match Explanation Card
 *
 * Core explainability component for the Transaction Detail Page.
 * Renders match_details in a human-readable format to help admins
 * understand why a transaction was matched or flagged for review.
 *
 * Displays:
 * - Overall confidence score with visual indicator
 * - Name similarity score with explanation
 * - Date proximity score with explanation
 * - Amount match indicator
 * - Ambiguity penalty (if applied)
 * - Final weighted score breakdown
 *
 * This component is critical for audit and trust requirements.
 * All values come directly from the backend - no recalculation.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type MatchDetails } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MatchExplanationCardProps {
  /** Match details from the backend, or null if no match data */
  matchDetails: MatchDetails | null;
  /** Overall confidence score (may differ from matchDetails.confidence) */
  confidenceScore: number | null;
}

/**
 * Score indicator component with progress bar
 */
function ScoreIndicator({
  label,
  score,
  maxScore = 100,
  tooltip,
  showPercentage = true,
}: {
  label: string;
  score: number | undefined | null;
  maxScore?: number;
  tooltip?: string;
  showPercentage?: boolean;
}) {
  // Safely handle undefined/null score
  const safeScore = score ?? 0;
  
  // Normalize score to percentage
  const percentage = Math.min(100, (safeScore / maxScore) * 100);

  // Determine color based on score
  const getColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-sm tabular-nums">
          {showPercentage ? `${safeScore.toFixed(1)}%` : safeScore.toFixed(2)}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', getColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * Info row component for simple key-value display
 */
function InfoRow({
  label,
  value,
  valueColor,
  tooltip,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn('text-sm font-medium', valueColor)}>{value}</span>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

/**
 * Empty state when no match details available
 */
function EmptyMatchExplanation() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Match Explanation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {/* Info icon */}
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
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">
            No matching analysis available for this transaction.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            This may be an unmatched or manually marked external transaction.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MatchExplanationCard({
  matchDetails,
  confidenceScore,
}: MatchExplanationCardProps) {
  // Show empty state if no match details
  if (!matchDetails && confidenceScore === null) {
    return <EmptyMatchExplanation />;
  }

  // Use confidence from matchDetails if available, otherwise use prop
  const displayConfidence = matchDetails?.confidence ?? confidenceScore ?? 0;

  // Determine confidence level for visual indicator
  const getConfidenceLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'High Confidence', color: 'text-emerald-600' };
    if (score >= 60) return { label: 'Medium Confidence', color: 'text-amber-600' };
    return { label: 'Low Confidence', color: 'text-red-600' };
  };

  const confidenceLevel = getConfidenceLevel(displayConfidence);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Match Explanation</CardTitle>
          <Badge
            variant="outline"
            className={cn('font-medium', confidenceLevel.color)}
          >
            {confidenceLevel.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Confidence Score - Primary Visual */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-semibold">
              Overall Match Score
            </span>
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                confidenceLevel.color
              )}
            >
              {displayConfidence.toFixed(1)}%
            </span>
          </div>
          <Progress value={displayConfidence} className="h-3" />
          <p className="text-muted-foreground text-xs">
            This score represents how confident the system is that this transaction
            matches the linked invoice. Scores above 80% are auto-matched, while
            lower scores require manual review.
          </p>
        </div>

        <Separator />

        {/* Score Breakdown - Only show if matchDetails available */}
        {matchDetails && (
          <>
            <div className="space-y-4">
              <h4 className="text-foreground text-sm font-semibold">
                Score Breakdown
              </h4>

              {/* Name Similarity */}
              <ScoreIndicator
                label="Name Similarity"
                score={matchDetails.breakdown?.rawNameSimilarity ?? matchDetails.nameSimilarity}
                tooltip="How closely the transaction description matches the customer name. Higher scores indicate stronger name matches using fuzzy matching algorithms."
              />

              {/* Date Proximity */}
              <ScoreIndicator
                label="Date Proximity"
                score={matchDetails.breakdown?.dateScore ?? matchDetails.dateProximity}
                tooltip="How close the transaction date is to the invoice due date. Transactions closer to due dates score higher."
              />
            </div>

            <Separator />

            {/* Additional Factors */}
            <div className="space-y-1">
              <h4 className="text-foreground mb-3 text-sm font-semibold">
                Additional Factors
              </h4>

              {/* Amount Match */}
              <InfoRow
                label="Amount Match"
                value={
                  matchDetails.amountMatch ? (
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4 text-emerald-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Exact Match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Not Exact
                    </span>
                  )
                }
                valueColor={matchDetails.amountMatch ? 'text-emerald-600' : 'text-amber-600'}
                tooltip="Whether the transaction amount exactly matches the invoice amount. Exact matches significantly boost confidence."
              />

              {/* Ambiguity Penalty */}
              <InfoRow
                label="Ambiguity Penalty"
                value={
                  (matchDetails.breakdown?.ambiguityPenalty ?? matchDetails.ambiguityPenalty ?? 0) > 0 ? (
                    <span className="text-red-600">
                      -{(matchDetails.breakdown?.ambiguityPenalty ?? matchDetails.ambiguityPenalty ?? 0).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-emerald-600">None</span>
                  )
                }
                tooltip="Penalty applied when multiple invoices could match this transaction. Higher penalties indicate more ambiguous matches that need review."
              />
            </div>

            {/* Explanation Text */}
            {matchDetails.explanation && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-foreground text-sm font-semibold">
                    System Explanation
                  </h4>
                  <p className="bg-muted text-foreground rounded-md p-3 text-sm leading-relaxed">
                    {matchDetails.explanation}
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div className="border-muted-foreground/20 border-t pt-4">
          <p className="text-muted-foreground text-xs">
            These scores are computed by the reconciliation engine and reflect the
            analysis at the time of processing. Scores are not recalculated on
            viewing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MatchExplanationCard;

