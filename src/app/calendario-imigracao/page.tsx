'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';
import TourManager from '@/components/travel-docs/TourManager';

function CalendarioContent() {
  const {
    extendedState, profile, exchangeRate, handleToursChange,
    handleAddEvent, handleUpdateEvent, handleDeleteEvent,
    handleTriggerTodoistSync, handleDisconnectTodoist, handleConnectTodoistSimulated,
    todoistToken, setTodoistToken, isTodoistConnected, isTodoistSimulated, todoistSyncLogs
  } = useImigracao();

  return (
    <div className="space-y-6 animate-fadeIn">
      <TourManager
        tours={extendedState.tours || []}
        onChangeTours={handleToursChange}
        events={extendedState.events || []}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        currency={extendedState.currency || 'BRL'}
        currencySymbol={CURRENCY_SYMBOLS[extendedState.currency || 'BRL']}
        exchangeRate={exchangeRate}
        destinationCountry={profile.destination_country}
        todoistToken={todoistToken}
        onChangeTodoistToken={setTodoistToken}
        onTriggerTodoistSync={handleTriggerTodoistSync}
        onDisconnectTodoist={handleDisconnectTodoist}
        todoistSyncLogs={todoistSyncLogs}
        isTodoistConnected={isTodoistConnected}
        isTodoistSimulated={isTodoistSimulated}
        onConnectTodoistSimulated={handleConnectTodoistSimulated}
      />
    </div>
  );
}

export default function CalendarioImigracaoPage() {
  return (
    <ImigracaoShell>
      <CalendarioContent />
    </ImigracaoShell>
  );
}
