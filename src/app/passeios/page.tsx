'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import TourManager from '@/components/travel-docs/TourManager';

function PasseiosContent() {
  const { extendedState, profile, exchangeRate, handleToursChange } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <TourManager
        tours={extendedState.tours || []}
        onChangeTours={handleToursChange}
        currency={extendedState.currency || 'BRL'}
        currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
        exchangeRate={exchangeRate}
        destinationCountry={profile.destination_country}
      />
    </div>
  );
}

export default function PasseiosPage() {
  return (
    <ImigracaoShell>
      <PasseiosContent />
    </ImigracaoShell>
  );
}
