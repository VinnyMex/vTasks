import React, { useState, useEffect } from 'react';
import { AppEvent } from './types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Link, Link2Off, Terminal, Bell, Play, X, Check, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  events: AppEvent[];
  onAddEvent: (event: AppEvent) => void;
  onUpdateEvent: (event: AppEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  todoistToken: string;
  onChangeTodoistToken: (token: string) => void;
  onTriggerTodoistSync: (token?: string) => void;
  onDisconnectTodoist: () => void;
  todoistSyncLogs: string[];
  isTodoistConnected: boolean;
  isTodoistSimulated: boolean;
  onConnectTodoistSimulated: () => void;
}

export default function CalendarView({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  todoistToken,
  onChangeTodoistToken,
  onTriggerTodoistSync,
  onDisconnectTodoist,
  todoistSyncLogs,
  isTodoistConnected,
  isTodoistSimulated,
  onConnectTodoistSimulated
}: CalendarViewProps) {
  // Calendar View states — initialized to real local today (timezone-safe)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  
  // Event Form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [notifyOneDayBefore, setNotifyOneDayBefore] = useState(false);

  // Timezone-safe local date string helper — avoids UTC offset shifting the date
  const localDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Sync date when date is selected (using local helper)
  const selectedDateStr = localDateStr(selectedDate);

  // Helper to generate days of the month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week of the first day (0-6)
    const startDayOfWeek = firstDay.getDay();
    
    // Total days in the current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in the previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Padding from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Padding for next month to complete 42 days grid (6 weeks)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const daysGrid = getDaysInMonth(currentDate);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  // Get events on selected date
  const eventsForSelectedDate = events.filter(e => e.date === selectedDateStr).sort((a, b) => {
    const timeA = a.time || '23:59';
    const timeB = b.time || '23:59';
    return timeA.localeCompare(timeB);
  });

  // Get event indicators for calendar grid (timezone-safe)
  const getEventsForDate = (d: Date) => {
    const dStr = localDateStr(d);
    return events.filter(e => e.date === dStr);
  };

  const handleOpenNewForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventTime('');
    setEventDescription('');
    setNotifyOneDayBefore(false);
    setShowEventForm(true);
  };

  const handleStartEdit = (event: AppEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventTime(event.time || '');
    setEventDescription(event.description || '');
    setNotifyOneDayBefore(event.notifyOneDayBefore);
    setShowEventForm(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (editingEventId) {
      const existing = events.find(ev => ev.id === editingEventId);
      onUpdateEvent({
        ...existing,
        id: editingEventId,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        date: selectedDateStr,
        time: eventTime || undefined,
        notifyOneDayBefore,
        sourceType: existing?.sourceType || 'custom',
        sourceId: existing?.sourceId
      });
    } else {
      onAddEvent({
        id: `ev_${Date.now()}`,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        date: selectedDateStr,
        time: eventTime || undefined,
        notifyOneDayBefore,
        sourceType: 'custom'
      });
    }

    setShowEventForm(false);
    setEventTitle('');
    setEventTime('');
    setEventDescription('');
    setNotifyOneDayBefore(false);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="space-y-6">
      {/* Overview & Integrations top row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Todoist Connection Settings */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                <Check className="w-4 h-4 text-orange-500" />
                <span>Integração Todoist</span>
              </h3>
              
              {/* Connection Status badge */}
              {isTodoistConnected ? (
                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Conectado Real
                </span>
              ) : isTodoistSimulated ? (
                <span className="text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-orange-500 text-orange-500" /> Simulado
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                  Desconectado
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              Sincronize suas tarefas e compromissos do Todoist em tempo real direto na sua agenda pessoal.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Todoist API Token</label>
                <input
                  type="password"
                  value={todoistToken}
                  onChange={(e) => onChangeTodoistToken(e.target.value)}
                  placeholder="Insira seu Todoist API Token das configurações..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ minHeight: '38px' }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4 flex flex-wrap gap-2">
            {!isTodoistConnected && !isTodoistSimulated ? (
              <>
                <button
                  type="button"
                  onClick={onConnectTodoistSimulated}
                  className="flex-1 bg-zinc-100 dark:bg-white dark:bg-zinc-900/5 hover:bg-zinc-200 dark:hover:bg-white dark:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  style={{ minHeight: '38px' }}
                >
                  <Play className="w-3.5 h-3.5 text-orange-500" />
                  <span>Modo Simulado</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerTodoistSync(todoistToken)}
                  disabled={!todoistToken}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  style={{ minHeight: '38px' }}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Conectar Todoist</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onTriggerTodoistSync(todoistToken)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  style={{ minHeight: '38px' }}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Sincronizar Agora</span>
                </button>
                <button
                  type="button"
                  onClick={onDisconnectTodoist}
                  className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                  style={{ minWidth: '38px', minHeight: '38px' }}
                  title="Desconectar do Todoist"
                >
                  <Link2Off className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Console Log Panel */}
        <div className="lg:col-span-6 bg-zinc-950 p-4 rounded-2xl border border-zinc-900 shadow-xs flex flex-col">
          <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-900 mb-2">
            <Terminal className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">Sync Console Logs (Todoist/API)</span>
          </div>
          <div className="flex-1 font-mono text-[9px] text-zinc-300 overflow-y-auto no-scrollbar space-y-1 max-h-[148px]" style={{ minHeight: '148px' }}>
            {todoistSyncLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed break-all">
                {log}
              </div>
            ))}
            {todoistSyncLogs.length === 0 && (
              <span className="text-zinc-550 italic">Nenhuma atividade de sincronização registrada. Conecte ou sincronize para iniciar logs...</span>
            )}
          </div>
        </div>

      </div>

      {/* Main Interactive Monthly Calendar & Selected Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid - Left / Center */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="text-brand-primary w-4.5 h-4.5" />
              <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer text-[10px] font-bold uppercase tracking-wider transition-colors"
                style={{ minHeight: '32px' }}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 uppercase mb-2">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((cell, idx) => {
              const cellDateStr = localDateStr(cell.date);
              const isSelected = cellDateStr === selectedDateStr;
              // Today uses local date to match the user's timezone correctly
              const now = new Date();
              const isTodayStr = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
              const isToday = cellDateStr === isTodayStr;
              
              const dayEvents = getEventsForDate(cell.date);
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.date);
                    setShowEventForm(false);
                  }}
                  className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between border cursor-pointer transition-all text-xs relative ${
                    cell.isCurrentMonth
                      ? 'text-zinc-700 dark:text-zinc-300 font-semibold'
                      : 'text-zinc-300 dark:text-zinc-600 dark:text-zinc-350'
                  } ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white dark:text-white shadow-md shadow-blue-500/10'
                      : isToday
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 font-extrabold'
                      : 'bg-zinc-50 dark:bg-zinc-800/40/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:bg-zinc-950/30 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'
                  }`}
                  
                >
                  <span className="self-end mr-0.5 mt-0.5 text-[10px]">{cell.date.getDate()}</span>
                  
                  {/* Indicator dots for events */}
                  <div className="flex flex-wrap gap-0.5 justify-center w-full pb-1 overflow-hidden max-h-3">
                    {dayEvents.slice(0, 3).map((e) => {
                      let dotColor = 'bg-blue-500';
                      if (e.sourceType === 'passport_expiry') dotColor = 'bg-red-500';
                      else if (e.sourceType === 'birthday') dotColor = 'bg-purple-500';
                      else if (e.sourceType === 'tour') dotColor = 'bg-emerald-500';
                      else if (e.sourceType === 'todoist') dotColor = 'bg-orange-500';

                      return (
                        <span 
                          key={e.id} 
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white dark:bg-zinc-900' : dotColor}`}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className={`text-[7px] font-bold leading-none ${isSelected ? 'text-white' : 'text-zinc-400'}`}>+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Events Details - Right Column */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs justify-between" style={{ minHeight: '380px' }}>
          
          {/* Day list section */}
          {!showEventForm ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Compromissos para {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Eventos programados neste dia específico.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewForm}
                    className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                  {eventsForSelectedDate.map((ev) => (
                    <div 
                      key={ev.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-start gap-3 hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-800 transition-colors"
                    >
                      {/* Left color bar based on type */}
                      <span className={`w-1 self-stretch rounded-full ${
                        ev.sourceType === 'passport_expiry' 
                          ? 'bg-red-500' 
                          : ev.sourceType === 'birthday'
                          ? 'bg-purple-500'
                          : ev.sourceType === 'tour'
                          ? 'bg-emerald-500'
                          : ev.sourceType === 'todoist'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{ev.title}</span>
                          
                          {/* Time badge if exists */}
                          {ev.time && (
                            <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded">
                              {ev.time}
                            </span>
                          )}

                          {/* Notify Bell badge */}
                          {ev.notifyOneDayBefore && (
                            <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Notificação 1 dia antes ativa">
                              <Bell className="w-2.5 h-2.5" />
                              <span>1d</span>
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{ev.description}</p>
                        )}
                        
                        {/* Type Label */}
                        <span className="inline-block text-[8px] uppercase tracking-wider font-bold text-zinc-400 mt-1">
                          {ev.sourceType === 'passport_expiry' 
                            ? 'Compromisso Importante' 
                            : ev.sourceType === 'birthday'
                            ? 'Lembrete Pessoal'
                            : ev.sourceType === 'tour'
                            ? 'Tarefa / Afazer'
                            : ev.sourceType === 'todoist'
                            ? 'Todoist Sync'
                            : 'Geral'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ev)}
                          className="p-1 text-zinc-400 hover:text-blue-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-900 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEvent(ev.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-900 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {eventsForSelectedDate.length === 0 && (
                    <div className="py-8 text-center text-zinc-400">
                      <Calendar className="w-6 h-6 text-zinc-300 mx-auto mb-1.5" />
                      <p className="text-xs">Nenhum evento registrado.</p>
                      <button
                        type="button"
                        onClick={handleOpenNewForm}
                        className="text-[10px] text-blue-500 hover:underline mt-1 font-semibold block mx-auto cursor-pointer"
                      >
                        + Criar um evento agora
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Info Banner */}
              {(isTodoistConnected || isTodoistSimulated) && (
                <div className="bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between no-print mt-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 block">Integração Ativa</span>
                    <span className="text-[9px] text-zinc-450 dark:text-zinc-400 block leading-tight">Tarefas importadas com sucesso na sua agenda.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            
            /* Form Area to add/edit event */
            <form onSubmit={handleSaveEvent} className="space-y-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {editingEventId ? 'Editar Evento' : 'Novo Evento'} para o dia {selectedDate.getDate()}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Título do Evento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pegar visto consular..."
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ minHeight: '38px' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Data</label>
                      <input
                        type="text"
                        disabled
                        value={selectedDateStr}
                        className="w-full bg-zinc-100 dark:bg-zinc-950/40 border border-zinc-250 dark:border-zinc-850 text-zinc-400 rounded-xl px-3 py-2 text-xs"
                        style={{ minHeight: '38px' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Horário (Opcional)</label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ minHeight: '38px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Descrição</label>
                    <textarea
                      placeholder="Detalhes adicionais..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>

                  {/* 1 day before alert toggle */}
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="notifyOneDayBefore"
                      checked={notifyOneDayBefore}
                      onChange={(e) => setNotifyOneDayBefore(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label 
                      htmlFor="notifyOneDayBefore" 
                      className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none cursor-pointer flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Notificar 1 dia antes (Lembrete ativo no sistema)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs py-2 rounded-xl cursor-pointer transition-all"
                  style={{ minHeight: '38px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  style={{ minHeight: '38px' }}
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Evento</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
