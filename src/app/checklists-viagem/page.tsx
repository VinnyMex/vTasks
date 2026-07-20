'use client';

import React, { useState } from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import ChecklistManager from '@/components/travel-docs/ChecklistManager';
import PackingManager from '@/components/travel-docs/PackingManager';
import { DEFAULT_PACKING_CHECKLISTS } from '@/components/travel-docs/data';

function ChecklistsContent() {
  const [subTab, setSubTab] = useState<'docs' | 'malas'>('docs');
  const { extendedState, profile, handleChecklistsChange, handlePackingChecklistsChange } = useImigracao();

  const activeCurrency = extendedState.currency || 'BRL';
  const currentRates = extendedState.exchangeRates || { EUR: 6.20, USD: 5.50 };

  const currentExchangeRate = activeCurrency === 'BRL'
    ? 1
    : activeCurrency === 'EUR'
      ? currentRates.EUR
      : currentRates.USD;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-2)' }}>
        <button
          onClick={() => setSubTab('docs')}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={subTab === 'docs' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-muted)' }}
        >
          📄 Documentos & Trâmites (Brasil)
        </button>
        <button
          onClick={() => setSubTab('malas')}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={subTab === 'malas' ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--text-muted)' }}
        >
          🎒 Preparativos de Malas
        </button>
      </div>

      {subTab === 'docs' ? (
        <ChecklistManager
          checklists={extendedState.checklists || {}}
          onChangeChecklists={handleChecklistsChange}
          currency={activeCurrency}
          currencySymbol={CURRENCY_SYMBOLS[activeCurrency]}
          exchangeRate={currentExchangeRate}
          destinationCountry={profile.destination_country}
          travelYear="2026"
        />
      ) : (
        <PackingManager
          checklists={extendedState.packingChecklists || DEFAULT_PACKING_CHECKLISTS}
          onChangeChecklists={handlePackingChecklistsChange}
          currency={activeCurrency}
          currencySymbol={CURRENCY_SYMBOLS[activeCurrency]}
          exchangeRate={currentExchangeRate}
          destinationCountry={profile.destination_country}
          travelYear="2026"
        />
      )}
    </div>
  );
}

export default function ChecklistsViagem() {
  return (
    <ImigracaoShell>
      <ChecklistsContent />
    </ImigracaoShell>
  );
}
