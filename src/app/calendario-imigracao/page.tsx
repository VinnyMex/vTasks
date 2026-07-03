'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';
import CalendarView from '@/components/travel-docs/CalendarView';

function CalendarioContent() {
  const {
    extendedState, updateExtendedState,
    handleAddEvent, handleUpdateEvent, handleDeleteEvent,
    handleTriggerGeneralSync, handleDisconnectGoogle, handleConnectSimulated,
    syncLogs, isGoogleConnected, isSimulatedConnection,
  } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <CalendarView
        events={extendedState.events || []}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        googleClientId={extendedState.googleClientId || ''}
        onChangeClientId={(id) => updateExtendedState({ ...extendedState, googleClientId: id })}
        googleSyncEnabled={extendedState.googleSyncEnabled || false}
        onToggleSync={(enabled) => updateExtendedState({ ...extendedState, googleSyncEnabled: enabled })}
        googleCalendarId={extendedState.googleCalendarId || ''}
        onTriggerSync={handleTriggerGeneralSync}
        onDisconnectGoogle={handleDisconnectGoogle}
        syncLogs={syncLogs}
        isGoogleConnected={isGoogleConnected}
        isSimulatedConnection={isSimulatedConnection}
        onConnectSimulated={handleConnectSimulated}
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
