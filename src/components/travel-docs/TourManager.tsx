import React, { useState } from 'react';
import { TourActivity, AppEvent } from './types';
import { CalendarRange, Plus, Trash2, Check, MapPin, DollarSign, Clock, FileText, CheckCircle2, Ticket, Search, Filter, HelpCircle, Pencil, Calendar, ChevronDown, ChevronUp, X, Sparkles, LayoutGrid } from 'lucide-react';
import CalendarView from './CalendarView';

interface TourManagerProps {
  tours: TourActivity[] | undefined;
  onChangeTours: (tours: TourActivity[]) => void;
  events?: AppEvent[];
  onAddEvent?: (event: AppEvent) => void;
  onUpdateEvent?: (event: AppEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
  exchangeRate: number;
  destinationCountry: string;
  todoistToken?: string;
  onChangeTodoistToken?: (token: string) => void;
  onTriggerTodoistSync?: (token?: string) => void;
  onDisconnectTodoist?: () => void;
  todoistSyncLogs?: string[];
  isTodoistConnected?: boolean;
  isTodoistSimulated?: boolean;
  onConnectTodoistSimulated?: () => void;
}

export default function TourManager({
  tours = [],
  onChangeTours,
  events = [],
  onAddEvent = () => {},
  onUpdateEvent = () => {},
  onDeleteEvent = () => {},
  currency,
  currencySymbol,
  exchangeRate,
  destinationCountry,
  todoistToken = '',
  onChangeTodoistToken = () => {},
  onTriggerTodoistSync = () => {},
  onDisconnectTodoist = () => {},
  todoistSyncLogs = [],
  isTodoistConnected = false,
  isTodoistSimulated = false,
  onConnectTodoistSimulated = () => {}
}: TourManagerProps) {
  const [viewMode, setViewMode] = useState<'all' | 'calendar' | 'list'>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planejado' | 'pago' | 'concluido'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCompletedTours, setExpandedCompletedTours] = useState<Record<string, boolean>>({});
  const [showCompletedSection, setShowCompletedSection] = useState<boolean>(false);

  const toggleExpandCompletedTour = (tourId: string) => {
    setExpandedCompletedTours(prev => ({ ...prev, [tourId]: !prev[tourId] }));
  };

  // Form states
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [newDay, setNewDay] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(''); // Data para vincular com o calendário
  const [newTime, setNewTime] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newCost, setNewCost] = useState<string>('');
  const [newStatus, setNewStatus] = useState<TourActivity['status']>('planejado');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newTicket, setNewTicket] = useState<boolean>(false);

  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Get list of unique days for filtering
  const uniqueDays = Array.from(new Set(tours.map(t => t.day))).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  const startEditTour = (tour: TourActivity) => {
    setEditingTourId(tour.id);
    setNewDay(tour.day);
    setNewDate(tour.date || '');
    setNewTime(tour.time || '');
    setNewTitle(tour.title);
    setNewLocation(tour.location || '');
    setNewCost(tour.cost ? (tour.cost / exchangeRate).toFixed(2).replace(/\.00$/, '') : '');
    setNewStatus(tour.status);
    setNewNotes(tour.notes || '');
    setNewTicket(tour.ticketAttached || false);
    setShowAddForm(true);
  };

  const cancelEditTour = () => {
    setEditingTourId(null);
    setNewDay('');
    setNewDate('');
    setNewTime('');
    setNewTitle('');
    setNewLocation('');
    setNewCost('');
    setNewStatus('planejado');
    setNewNotes('');
    setNewTicket(false);
  };

  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedCostInput = parseFloat(newCost) || 0;
    
    if (editingTourId) {
      const updated = tours.map(t => {
        if (t.id === editingTourId) {
          return {
            ...t,
            day: newDay.trim() || 'Geral',
            date: newDate || undefined,
            time: newTime.trim() || undefined,
            title: newTitle.trim(),
            location: newLocation.trim() || undefined,
            cost: parsedCostInput ? parsedCostInput * exchangeRate : undefined,
            status: newStatus,
            notes: newNotes.trim() || undefined,
            ticketAttached: newTicket
          };
        }
        return t;
      });
      onChangeTours(updated);
      cancelEditTour();
    } else {
      const newActivity: TourActivity = {
        id: `tour_${Date.now()}`,
        day: newDay.trim() || 'Geral',
        date: newDate || undefined,
        time: newTime.trim() || undefined,
        title: newTitle.trim(),
        location: newLocation.trim() || undefined,
        cost: parsedCostInput ? parsedCostInput * exchangeRate : undefined,
        status: newStatus,
        notes: newNotes.trim() || undefined,
        ticketAttached: newTicket
      };

      onChangeTours([...tours, newActivity]);

      // Clear form except day for easy batch entry
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewCost('');
      setNewStatus('planejado');
      setNewNotes('');
      setNewTicket(false);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = tours.map(t => {
      if (t.id === id) {
        let nextStatus: TourActivity['status'] = 'planejado';
        if (t.status === 'planejado') nextStatus = 'pago';
        else if (t.status === 'pago') nextStatus = 'concluido';
        else nextStatus = 'planejado';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onChangeTours(updated);
  };

  const handleRemoveTour = (id: string) => {
    onChangeTours(tours.filter(t => t.id !== id));
  };

  const handleToggleTicket = (id: string) => {
    const updated = tours.map(t => {
      if (t.id === id) {
        return { ...t, ticketAttached: !t.ticketAttached };
      }
      return t;
    });
    onChangeTours(updated);
  };

  // Filtered tours
  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (tour.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tour.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDay = dayFilter === 'all' || tour.day === dayFilter;
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;

    return matchesSearch && matchesDay && matchesStatus;
  });

  // Sort filtered tours by Day then Time
  const sortedTours = [...filteredTours].sort((a, b) => {
    const dayCompare = a.day.localeCompare(b.day, undefined, { numeric: true, sensitivity: 'base' });
    if (dayCompare !== 0) return dayCompare;
    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    return timeA.localeCompare(timeB);
  });

  // Calculate stats
  const totalCostBRL = tours.reduce((sum, t) => sum + (t.cost || 0), 0);
  const paidCostBRL = tours.reduce((sum, t) => sum + (t.status === 'pago' || t.status === 'concluido' ? (t.cost || 0) : 0), 0);
  const completedCount = tours.filter(t => t.status === 'concluido').length;
  const totalCount = tours.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview & Stats Dashboard */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <CalendarRange className="text-blue-600 w-5 h-5" />
              <span>Passeios & Agenda Unificada {destinationCountry ? `em ${destinationCountry}` : ''}</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">PRO</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Gerencie seu roteiro turístico, passeios com data no calendário, ingressos e compromissos em um só lugar.</p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Progresso dos Passeios:</span>
            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full font-mono">{progressPercent}% Concluído</span>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 no-print overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Visão Unificada (Calendário + Roteiro)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Apenas Calendário & Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Apenas Lista de Roteiro & Ingressos</span>
          </button>
        </div>

        {/* Financial Tour Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total de Atividades</span>
            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{totalCount} passeios</span>
          </div>
          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100/30 dark:border-blue-900/30">
            <span className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 block">Investimento Estimado</span>
            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
              {currencySymbol} {Math.round(totalCostBRL / exchangeRate).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/30 dark:border-emerald-900/30">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Pago / Liquidado</span>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              {currencySymbol} {Math.round(paidCostBRL / exchangeRate).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO DO CALENDÁRIO UNIFICADO */}
      {(viewMode === 'all' || viewMode === 'calendar') && (
        <div className="no-print animate-fadeIn">
          <CalendarView
            events={events}
            tours={tours}
            onAddEvent={onAddEvent}
            onUpdateEvent={onUpdateEvent}
            onDeleteEvent={onDeleteEvent}
            todoistToken={todoistToken}
            onChangeTodoistToken={onChangeTodoistToken}
            onTriggerTodoistSync={onTriggerTodoistSync}
            onDisconnectTodoist={onDisconnectTodoist}
            todoistSyncLogs={todoistSyncLogs}
            isTodoistConnected={isTodoistConnected}
            isTodoistSimulated={isTodoistSimulated}
            onConnectTodoistSimulated={onConnectTodoistSimulated}
          />
        </div>
      )}

      {/* SEÇÃO DA LISTA DE PASSEIOS E FORMULÁRIO */}
      {(viewMode === 'all' || viewMode === 'list') && (
        <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form and Filters panel (no-print) */}
          <div className="lg:col-span-4 space-y-6 no-print">
          {/* Add Activity Form or Trigger */}
          {!showAddForm && !editingTourId ? (
            <div className="card p-5 rounded-2xl border flex flex-col gap-3 transition-all" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>Novo Passeio / Atração</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">PRO</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Clique no botão abaixo para cadastrar passeios, ingressos, locais e horários do seu roteiro.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
                style={{ minHeight: '42px' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar ao Roteiro</span>
              </button>
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border shadow-xs transition-all ${
              editingTourId 
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' 
                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  editingTourId ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-400'
                }`}>
                  {editingTourId ? <Pencil className="w-4 h-4 text-blue-500 animate-pulse" /> : <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
                  <span>{editingTourId ? '📌 EDITANDO: Passeio / Atração' : 'Novo Passeio / Atração'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    cancelEditTour();
                    setShowAddForm(false);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  title="Ocultar formulário"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => { handleAddTour(e); setShowAddForm(false); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Dia (Ex: Dia 1, Sábado)</label>
                    <input
                      type="text"
                      placeholder="Ex: Dia 1"
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                      style={{ minHeight: '38px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Data Específica</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                      style={{ minHeight: '38px' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Horário (Opcional)</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                      style={{ minHeight: '38px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Custo ({currency})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-xs font-bold text-zinc-400">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 25"
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                        style={{ minHeight: '38px' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Título do Passeio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Visita ao Museu de História"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all font-bold"
                    style={{ minHeight: '38px' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Local / Endereço</label>
                  <input
                    type="text"
                    placeholder="Ex: Praça Central, N° 10"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                    style={{ minHeight: '38px' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Status Inicial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                    style={{ minHeight: '38px' }}
                  >
                    <option value="planejado">Planejado (Sem reserva)</option>
                    <option value="pago">Pago / Reservado</option>
                    <option value="concluido">Concluído / Visitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Anotações / Notas Rápidas</label>
                  <textarea
                    placeholder="Ex: Levar passaporte impresso, proibido entrada com bolsas grandes..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newTicket"
                    checked={newTicket}
                    onChange={(e) => setNewTicket(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="newTicket" className="text-xs font-semibold text-zinc-600 dark:text-zinc-350 select-none cursor-pointer">
                    Ingresso / Confirmação em mãos?
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      cancelEditTour();
                      setShowAddForm(false);
                    }}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    style={{ minHeight: '40px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
                    style={{ minHeight: '40px' }}
                  >
                    {editingTourId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingTourId ? 'Salvar Alterações' : 'Adicionar ao Roteiro'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Schedule List Area */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs print-card flex flex-col">
          {/* List Toolbar / Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4 no-print">
            <div className="flex flex-wrap items-center gap-2">
              {/* Day filter selector */}
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ minHeight: '36px' }}
              >
                <option value="all">Todos os Dias</option>
                {uniqueDays.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              {/* Status filter selector */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ minHeight: '36px' }}
              >
                <option value="all">Todos Status</option>
                <option value="planejado">Planejado</option>
                <option value="pago">Pago / Reservado</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* General Search bar */}
            <div className="relative max-w-xs w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar atrações..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ minHeight: '36px' }}
              />
            </div>
          </div>

          {/* Activities List */}
          <div className="flex-1 space-y-4 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
            {(() => {
              const upcomingTours = sortedTours.filter(t => t.status !== 'concluido');
              const completedTours = sortedTours.filter(t => t.status === 'concluido');
              const upcomingDays = Array.from(new Set(upcomingTours.map(t => t.day)));

              return (
                <div className="space-y-5">
                  {/* Active / Upcoming Tours Grouped by Day */}
                  {upcomingTours.length > 0 ? (
                    upcomingDays.map(day => {
                      const dayTours = upcomingTours.filter(t => t.day === day);
                      return (
                        <div key={day} className="space-y-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-4 last:border-0 last:pb-0">
                          <span className="inline-block text-[10px] font-extrabold text-blue-800 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {day}
                          </span>

                          <div className="space-y-2">
                            {dayTours.map((tour) => (
                              <div 
                                key={tour.id}
                                className="p-3.5 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 shadow-2xs"
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  {/* Toggle status icon click */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(tour.id)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5 transition-all ${
                                      tour.status === 'pago'
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-zinc-300 bg-white dark:bg-zinc-900 hover:border-blue-500'
                                    }`}
                                    title="Marcar como pago/reservado"
                                  >
                                    {tour.status === 'pago' ? (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    ) : null}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {tour.time && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                          <Clock className="w-2.5 h-2.5" />
                                          {tour.time}
                                        </span>
                                      )}
                                      <h4 className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                                        {tour.title}
                                      </h4>
                                    </div>

                                    {/* Details line */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 mt-1 font-semibold">
                                      {tour.date && (
                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                          <Calendar className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                          <span>{tour.date.split('-').reverse().join('/')}</span>
                                        </span>
                                      )}
                                      {tour.location && (
                                        <span className="flex items-center gap-0.5 text-zinc-500 dark:text-zinc-400 font-sans">
                                          <MapPin className="w-3 h-3 text-zinc-400" />
                                          {tour.location}
                                        </span>
                                      )}
                                      
                                      {tour.cost ? (
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center">
                                          <DollarSign className="w-2.5 h-2.5" />
                                          {currencySymbol} {Math.round(tour.cost / exchangeRate).toLocaleString('pt-BR')}
                                        </span>
                                      ) : null}

                                      <button
                                        type="button"
                                        onClick={() => handleToggleTicket(tour.id)}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-colors no-print ${
                                          tour.ticketAttached 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
                                        }`}
                                      >
                                        <Ticket className="w-2.5 h-2.5" />
                                        <span>{tour.ticketAttached ? 'Ingresso OK' : 'Sem ingresso'}</span>
                                      </button>
                                    </div>

                                    {/* Notes */}
                                    {tour.notes && (
                                      <p className="text-[10px] italic leading-relaxed mt-1.5 font-serif border-l-2 pl-2 bg-zinc-50 dark:bg-zinc-800/40 p-1 rounded-r-md text-zinc-500 dark:text-zinc-400 border-zinc-300">
                                        {tour.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center justify-end gap-2.5 no-print">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(tour.id)}
                                    className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md cursor-pointer select-none ${
                                      tour.status === 'pago'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-blue-50'
                                    }`}
                                  >
                                    {tour.status === 'pago' ? 'Reservado' : 'Planejado'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => startEditTour(tour)}
                                    className="p-1.5 text-zinc-400 hover:text-blue-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    title="Editar passeio"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTour(tour.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    title="Excluir passeio"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <CalendarRange className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nenhum próximo passeio pendente</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Cadastre passeios no formulário lateral ou agende datas pelo calendário.</p>
                    </div>
                  )}

                  {/* Section for Completed Tours (Collapsible at bottom) */}
                  {completedTours.length > 0 && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCompletedSection(prev => !prev)}
                        className="w-full flex items-center justify-between p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold text-xs cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Passeios Concluídos ({completedTours.length})</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                          <span>{showCompletedSection ? 'Ocultar concluídos' : 'Visualizar concluídos'}</span>
                          {showCompletedSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {showCompletedSection && (
                        <div className="mt-3 space-y-2.5 animate-fadeIn pl-2 border-l-2 border-emerald-400 dark:border-emerald-500/80">
                          {completedTours.map((tour) => {
                            const isExpanded = !!expandedCompletedTours[tour.id];
                            return (
                              <div
                                key={tour.id}
                                className="p-3 rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 opacity-75 hover:opacity-100 shadow-2xs transition-all space-y-2 bg-white dark:bg-zinc-900"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                    onClick={() => handleToggleStatus(tour.id)}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(tour.id); }}
                                      className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center flex-shrink-0 cursor-pointer"
                                      title="Status: Concluído (Clique para reabrir)"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {tour.time && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                          <Clock className="w-2.5 h-2.5" />
                                          {tour.time}
                                        </span>
                                      )}
                                      <span className="text-xs font-bold line-through text-zinc-500 dark:text-zinc-400 truncate select-none">
                                        {tour.title}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandCompletedTour(tour.id)}
                                      title={isExpanded ? "Ocultar detalhes" : "Expandir detalhes"}
                                      className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer flex-shrink-0"
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEditTour(tour)}
                                      className="p-1 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTour(tour.id)}
                                      className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-350">
                                    {tour.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-400" /> {tour.location}</p>}
                                    {tour.cost ? <p className="font-bold text-emerald-600">Custo: R$ {tour.cost.toLocaleString('pt-BR')}</p> : null}
                                    {tour.notes && <p className="italic text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded">{tour.notes}</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
