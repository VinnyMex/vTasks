'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import FinancialPlanner from '@/components/travel-docs/FinancialPlanner';

function CustosContent() {
  const { extendedState, profile, exchangeRate, handleFinancialExpensesChange, updateExtendedState } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <FinancialPlanner
        expenses={extendedState.financialExpenses || []}
        onChangeExpenses={handleFinancialExpensesChange}
        currency={extendedState.currency || 'BRL'}
        currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
        exchangeRate={exchangeRate}
        onUpdateExchangeRate={() => {}}
        onChangeCurrency={(c: any) => updateExtendedState({ ...extendedState, currency: c })}
        destinationCountry={profile.destination_country}
        travelYear="2026"
      />
    </div>
  );
}

export default function CustosImigracaoPage() {
  return (
    <ImigracaoShell>
      <CustosContent />
    </ImigracaoShell>
  );
}
