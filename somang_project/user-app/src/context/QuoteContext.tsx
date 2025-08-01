// /src/context/QuoteContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { QuoteRequestDetails } from '@/types/quote';

interface QuoteContextType {
  quoteData: Partial<QuoteRequestDetails>;
  updateQuoteData: (data: Partial<QuoteRequestDetails>) => void;
  resetQuoteData: () => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quoteData, setQuoteData] = useState<Partial<QuoteRequestDetails>>({});

  const updateQuoteData = (newData: Partial<QuoteRequestDetails>) => {
    setQuoteData(prev => ({ ...prev, ...newData }));
  };

  const resetQuoteData = () => {
    setQuoteData({});
  };

  return (
    <QuoteContext.Provider value={{ quoteData, updateQuoteData, resetQuoteData }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}