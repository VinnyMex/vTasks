import React, { useState } from 'react';
import { TourActivity } from './types';
import { CalendarRange, Plus, Trash2, Check, MapPin, DollarSign, Clock, FileText, CheckCircle2, Ticket, Search, Filter, HelpCircle, Pencil, Calendar } from 'lucide-react';

interface TourManagerProps {
  tours: TourActivity[] | undefined;
  onChangeTours: (tours: TourActivity[]) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
  exchangeRate: number;
  destinationCountry: string;
}

export default function TourManager({ tours = [], onChangeTours, currency, currencySymbol, exchangeRate, destinationCountry }: TourManagerProps) {
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planejado' | 'pago' | 'concluido'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Get list of unique days for filtering
  const uniqueDays = Array.from(new Set(tours.map(t => t.day))).sort((a, b) => {
    // Simple alphabetical or numerical sorting
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
              <span>Cronograma de Passeios {destinationCountry ? `em ${destinationCountry}` : ''}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Crie roteiros diários, controle o status de ingressos, agendamentos e custos de atrações.</p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Progresso dos Passeios:</span>
            <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-mono">{progressPercent}% Concluído</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3.5">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Financial Tour Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total de Atividades</span>
            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{totalCount} passeios</span>
          </div>
          <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/30">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">Investimento Estimado</span>
            <span className="text-sm font-extrabold text-blue-700">
              {currencySymbol} {Math.round(totalCostBRL / exchangeRate).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/30">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Pago / Liquidado</span>
            <span className="text-sm font-extrabold text-emerald-700">
              {currencySymbol} {Math.round(paidCostBRL / exchangeRate).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form and Filters panel (no-print) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          {/* Add Activity Form */}
          <div className={`p-5 rounded-2xl border shadow-xs transition-all ${
            editingTourId 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' 
              : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 ${
              editingTourId ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-400'
            }`}>
              {editingTourId ? <Pencil className="w-4 h-4 text-blue-500 animate-pulse" /> : <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
              <span>{editingTourId ? '📌 EDITANDO: Passeio / Atração' : 'Novo Passeio / Atração'}</span>
            </h3>

            <form onSubmit={handleAddTour} className="space-y-4">
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
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
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
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                    style={{ minHeight: '38px' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Custo ({currency})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 font-mono text-xs">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Ex: 25"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                      style={{ minHeight: '38px' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Título do Passeio</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Visita ao Museu de História"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
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
                {editingTourId && (
                  <button
                    type="button"
                    onClick={cancelEditTour}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    style={{ minHeight: '40px' }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingTourId ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs`}
                  style={{ minHeight: '40px' }}
                >
                  {editingTourId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTourId ? 'Salvar Alterações' : 'Adicionar ao Roteiro'}</span>
                </button>
              </div>
            </form>
          </div>
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
          <div className="flex-1 space-y-4 max-h-[580px] overflow-y-auto pr-1 no-scrollbar">
            {sortedTours.length > 0 ? (
              // Group items by Day for clean scheduling layout
              Array.from(new Set(sortedTours.map(t => t.day))).map(day => {
                const dayTours = sortedTours.filter(t => t.day === day);
                return (
                  <div key={day} className="space-y-2 border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                    <span className="inline-block text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {day}
                    </span>

                    <div className="space-y-2">
                      {dayTours.map((tour) => (
                        <div 
                          key={tour.id}
                          className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            tour.status === 'concluido'
                              ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800'
                              : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Toggle status icon click */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(tour.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5 transition-all ${
                                tour.status === 'concluido'
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : tour.status === 'pago'
                                  ? 'bg-blue-600 border-blue-600 text-white animate-pulse-once'
                                  : 'border-zinc-300 bg-white dark:bg-zinc-900 hover:border-blue-500'
                              }`}
                              style={{ minWidth: '20px', minHeight: '20px' }}
                              title="Alterar status de visita"
                            >
                              {tour.status === 'concluido' ? (
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              ) : tour.status === 'pago' ? (
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
                                <h4 className={`text-xs font-bold truncate ${tour.status === 'concluido' ? 'text-zinc-400 line-through font-normal' : 'text-zinc-800 dark:text-zinc-200'}`}>
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
                                      : 'bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  <Ticket className="w-2.5 h-2.5" />
                                  <span>{tour.ticketAttached ? 'Ingresso OK' : 'Sem ingresso'}</span>
                                </button>
                              </div>

                              {/* Notes */}
                              {tour.notes && (
                                <p className={`text-[10px] italic leading-relaxed mt-1.5 font-serif border-l-2 pl-2 bg-zinc-50 dark:bg-zinc-800/40 p-1 rounded-r-md ${
                                  tour.status === 'concluido' ? 'text-zinc-300 border-zinc-200 dark:border-zinc-800' : 'text-zinc-500 dark:text-zinc-400 border-zinc-300'
                                }`}>
                                  {tour.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tour Status Actions / Delete */}
                          <div className="flex items-center justify-end gap-2.5 no-print">
                            {/* Badges */}
                            <span 
                              onClick={() => handleToggleStatus(tour.id)}
                              className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md cursor-pointer select-none ${
                                tour.status === 'concluido'
                                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                  : tour.status === 'pago'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {tour.status === 'concluido' ? 'Concluído' : tour.status === 'pago' ? 'Reservado' : 'Planejado'}
                            </span>

                            <button
                              type="button"
                              onClick={() => startEditTour(tour)}
                              className={`p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 transition-colors cursor-pointer ${
                                editingTourId === tour.id ? 'text-blue-600 bg-blue-50/50' : 'text-zinc-300 hover:text-blue-500'
                              }`}
                              style={{ minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Editar passeio"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveTour(tour.id)}
                              className="text-zinc-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 transition-colors cursor-pointer"
                              style={{ minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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
              <div className="py-16 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <CalendarRange className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nenhum passeio planejado</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">Comece a construir o seu itinerário informando as atividades e custos no formulário lateral.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
