'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import FamilyForm from '@/components/travel-docs/FamilyForm';
import HousingForm from '@/components/travel-docs/HousingForm';

function FamiliaContent() {
  const { extendedState, profile, exchangeRate, handleFamilyMembersChange, handleHousingChange } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <FamilyForm
        familyMembers={extendedState.familyMembers || []}
        onChangeFamilyMembers={handleFamilyMembersChange}
        destinationCountry={profile.destination_country}
        travelYear="2026"
      />
      <HousingForm
        housing={extendedState.housing || { address: '', landlordName: '', landlordDocument: '', proofType: '', rentValue: '', depositValue: '', notes: '' }}
        onChangeHousing={handleHousingChange}
        currency={extendedState.currency || 'BRL'}
        currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
        exchangeRate={exchangeRate}
        destinationCountry={profile.destination_country}
        travelYear="2026"
      />
    </div>
  );
}

export default function FamiliaPage() {
  return (
    <ImigracaoShell>
      <FamiliaContent />
    </ImigracaoShell>
  );
}
