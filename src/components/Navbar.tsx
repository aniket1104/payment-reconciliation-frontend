'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="border-border/40 bg-card/30 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        {/* Logo / Brand - Home Link */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <svg
              className="text-primary h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-foreground/80 text-sm font-medium">
            Reconciliation
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* New Reconciliation Button */}
          <Button
            asChild
            size="sm"
            className="h-8 w-8 p-0"
            title="New Reconciliation"
          >
            <Link href="/reconciliation/new">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="sr-only">New Reconciliation</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
