'use client';

/**
 * Desktop-Only Guard Component
 *
 * This component enforces the desktop-only constraint for the admin dashboard.
 * Screens below 1024px width will see a blocking message instead of the app.
 *
 * Implementation notes:
 * - Uses useState + useEffect to avoid hydration mismatch
 * - Listens for window resize events
 * - Shows children only on desktop (≥1024px)
 */

import { useState, useEffect, type ReactNode } from 'react';
import { DESKTOP_BREAKPOINT } from '@/lib/constants';

interface DesktopOnlyGuardProps {
  /** Content to render on desktop screens */
  children: ReactNode;
}

/**
 * Guard component that blocks non-desktop devices
 */
export function DesktopOnlyGuard({ children }: DesktopOnlyGuardProps) {
  // Start with null to avoid hydration mismatch
  // null = "we don't know yet", true = desktop, false = mobile/tablet
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    // Check viewport width
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Initial check
    checkViewport();

    // Listen for resize events
    window.addEventListener('resize', checkViewport);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  // During SSR and initial hydration, render nothing to prevent flash
  // This is a brief moment before the client-side check runs
  if (isDesktop === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* Minimal loading state - very brief, usually not visible */}
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // Mobile/tablet blocking screen
  if (!isDesktop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
            />
          </svg>
        </div>

        {/* Message */}
        <h1 className="mb-3 text-xl font-semibold text-foreground">
          Desktop Required
        </h1>
        <p className="max-w-md text-muted-foreground">
          This is a desktop application. Please use a laptop or desktop device.
        </p>

        {/* Subtle hint about minimum width */}
        <p className="mt-6 text-xs text-muted-foreground/60">
          Minimum screen width: {DESKTOP_BREAKPOINT}px
        </p>
      </div>
    );
  }

  // Desktop: render children normally
  return <>{children}</>;
}

export default DesktopOnlyGuard;

