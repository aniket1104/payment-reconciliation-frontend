import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { DesktopOnlyGuard } from '@/components/DesktopOnlyGuard';
import { ReduxProvider } from '@/store/provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Payment Reconciliation Engine',
    template: '%s | Payment Reconciliation',
  },
  description:
    'Admin dashboard for payment reconciliation. Match bank transactions with invoices automatically.',
  keywords: [
    'payment reconciliation',
    'invoice matching',
    'bank transactions',
    'admin dashboard',
    'fintech',
  ],
  authors: [{ name: 'ScanPay Team' }],
  robots: {
    index: false, // Admin dashboard should not be indexed
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ReduxProvider>
          <DesktopOnlyGuard>{children}</DesktopOnlyGuard>
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}

