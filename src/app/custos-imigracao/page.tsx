'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';
import FinancialPlanner from '@/components/travel-docs/FinancialPlanner';

function CustosContent() {
  const { extendedState, profile, handleFinancialExpensesChange } = useImigracao();

  return (
    <div className="space-y-6 animate-fadeIn">
      <FinancialPlanner
        expenses={extendedState.financialExpenses || []}
        onChangeExpenses={handleFinancialExpensesChange}
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
