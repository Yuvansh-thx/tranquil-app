import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { FocusProvider } from '@/lib/context/FocusContext';
import { QuickAddProvider } from '@/lib/context/QuickAddContext';
import { AppShell } from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tranquil — An All-in-One Productivity System',
  description:
    'A unified workspace combining Obsidian markdown knowledge graphs, Google Keep color notes, Todoist task management, and Pomodoro focus timers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('tranquil_theme');
                  var root = document.documentElement;
                  if (theme === 'light') {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  } else if (theme === 'dark') {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  } else {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <AuthProvider>
          <FocusProvider>
            <QuickAddProvider>
              <Suspense fallback={null}>
                <AppShell>{children}</AppShell>
              </Suspense>
            </QuickAddProvider>
          </FocusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
