'use client';

import React, { useState } from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import ChecklistManager from '@/components/travel-docs/ChecklistManager';
import PackingManager from '@/components/travel-docs/PackingManager';
import { DEFAULT_PACKING_CHECKLISTS } from '@/components/travel-docs/data';

function ChecklistsContent() {
  const [subTab, setSubTab] = useState<'docs' | 'malas'>('docs');
  const { extendedState, profile, exchangeRate, handleChecklistsChange, handlePackingChecklistsChange } = useImigracao();

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
          currency={extendedState.currency || 'BRL'}
          currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
          exchangeRate={exchangeRate}
          destinationCountry={profile.destination_country}
          travelYear="2026"
        />
      ) : (
        <PackingManager
          checklists={extendedState.packingChecklists || DEFAULT_PACKING_CHECKLISTS}
          onChangeChecklists={handlePackingChecklistsChange}
          currency={extendedState.currency || 'BRL'}
          currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
          exchangeRate={exchangeRate}
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
