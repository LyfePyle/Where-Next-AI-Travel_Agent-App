'use client';

import { AppProvider } from '@/contexts/AppContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
