// /src/app/quote/mobile/layout.tsx
'use client';

import { QuoteProvider } from '@/context/QuoteContext';

export default function MobileQuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuoteProvider>
      {children}
    </QuoteProvider>
  );
}