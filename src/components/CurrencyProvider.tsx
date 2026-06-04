'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type CurrencyState = {
  primaryCurrency: string;
  secondaryCurrency: string;
  exchangeRate: number;
  activeCurrency: 'primary' | 'secondary';
};

type CurrencyContextType = CurrencyState & {
  setPrimaryCurrency: (c: string) => void;
  setSecondaryCurrency: (c: string) => void;
  setExchangeRate: (r: number) => void;
  toggleActiveCurrency: () => void;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CurrencyState>({
    primaryCurrency: 'BRL',
    secondaryCurrency: 'EUR',
    exchangeRate: 6.20,
    activeCurrency: 'primary',
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vtasks_currency_settings');
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load currency settings', e);
    }
    setMounted(true);
  }, []);

  const saveState = (newState: CurrencyState) => {
    setState(newState);
    try {
      localStorage.setItem('vtasks_currency_settings', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save currency settings', e);
    }
  };

  const setPrimaryCurrency = (c: string) => saveState({ ...state, primaryCurrency: c });
  const setSecondaryCurrency = (c: string) => saveState({ ...state, secondaryCurrency: c });
  const setExchangeRate = (r: number) => saveState({ ...state, exchangeRate: r });
  const toggleActiveCurrency = () => saveState({ 
    ...state, 
    activeCurrency: state.activeCurrency === 'primary' ? 'secondary' : 'primary' 
  });

  if (!mounted) {
    return null;
  }

  return (
    <CurrencyContext.Provider value={{
      ...state,
      setPrimaryCurrency,
      setSecondaryCurrency,
      setExchangeRate,
      toggleActiveCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
