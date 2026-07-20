'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type CurrencyCode = 'BRL' | 'EUR' | 'USD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BRL: 'R$',
  EUR: '€',
  USD: '$',
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  BRL: 'Real (BRL)',
  EUR: 'Euro (EUR)',
  USD: 'Dólar (USD)',
};

// Taxa de câmbio de cada moeda estrangeira EM RELAÇÃO AO BRL
// BRL é a moeda base, então sua taxa é sempre 1
export type ExchangeRates = Record<CurrencyCode, number>;

const DEFAULT_RATES: ExchangeRates = {
  BRL: 1,
  EUR: 6.20,
  USD: 5.70,
};

type CurrencyState = {
  activeCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
};

type CurrencyContextType = CurrencyState & {
  // Getters de conveniência
  primaryCurrency: string;   // alias para compat. com código antigo
  secondaryCurrency: string; // alias para compat.
  exchangeRate: number;      // taxa da moeda ativa em relação ao BRL
  currencySymbol: string;    // símbolo da moeda ativa

  setActiveCurrency: (c: CurrencyCode) => void;
  setExchangeRate: (currency: CurrencyCode, rate: number) => void;

  // Mantido para compatibilidade com Header antigo
  toggleActiveCurrency: () => void;
};

const CURRENCIES: CurrencyCode[] = ['BRL', 'EUR', 'USD'];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CurrencyState>({
    activeCurrency: 'BRL',
    exchangeRates: DEFAULT_RATES,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vtasks_currency_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Garante que todos os campos existam (migração)
        setState({
          activeCurrency: parsed.activeCurrency || 'BRL',
          exchangeRates: { ...DEFAULT_RATES, ...parsed.exchangeRates },
        });
      } else {
        // Migração do formato antigo
        const oldSaved = localStorage.getItem('vtasks_currency_settings');
        if (oldSaved) {
          const old = JSON.parse(oldSaved);
          const migrated: CurrencyState = {
            activeCurrency: old.activeCurrency === 'secondary' ? (old.secondaryCurrency as CurrencyCode) : (old.primaryCurrency as CurrencyCode) || 'BRL',
            exchangeRates: { ...DEFAULT_RATES, EUR: old.exchangeRate || 6.20 },
          };
          setState(migrated);
          localStorage.setItem('vtasks_currency_v2', JSON.stringify(migrated));
        }
      }
    } catch (e) {
      console.error('Failed to load currency settings', e);
    }
    setMounted(true);
  }, []);

  const saveState = (newState: CurrencyState) => {
    setState(newState);
    try {
      localStorage.setItem('vtasks_currency_v2', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save currency settings', e);
    }
  };

  const setActiveCurrency = (c: CurrencyCode) => saveState({ ...state, activeCurrency: c });

  const setExchangeRate = (currency: CurrencyCode, rate: number) => {
    if (rate <= 0 || isNaN(rate)) return;
    saveState({ ...state, exchangeRates: { ...state.exchangeRates, [currency]: rate } });
  };

  const toggleActiveCurrency = () => {
    const idx = CURRENCIES.indexOf(state.activeCurrency);
    const next = CURRENCIES[(idx + 1) % CURRENCIES.length];
    saveState({ ...state, activeCurrency: next });
  };

  // Aliases de conveniência
  const exchangeRate = state.activeCurrency === 'BRL' ? 1 : state.exchangeRates[state.activeCurrency];
  const currencySymbol = CURRENCY_SYMBOLS[state.activeCurrency];

  if (!mounted) return null;

  return (
    <CurrencyContext.Provider value={{
      ...state,
      primaryCurrency: 'BRL',
      secondaryCurrency: state.activeCurrency !== 'BRL' ? state.activeCurrency : 'EUR',
      exchangeRate,
      currencySymbol,
      setActiveCurrency,
      setExchangeRate,
      toggleActiveCurrency,
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
