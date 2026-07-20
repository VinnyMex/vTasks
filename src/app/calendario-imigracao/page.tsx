'use client';

import React from 'react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';
import CalendarView from '@/components/travel-docs/CalendarView';

function CalendarioContent() {
  const {
    extendedState,
    handleAddEvent, handleUpdateEvent, handleDeleteEvent,
    handleTriggerTodoistSync, handleDisconnectTodoist, handleConnectTodoistSimulated,
    todoistToken, setTodoistToken, isTodoistConnected, isTodoistSimulated, todoistSyncLogs
  } = useImigracao();
  return (
    <div className="space-y-6 animate-fadeIn">
      <CalendarView
        events={extendedState.events || []}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
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
