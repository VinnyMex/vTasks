import React, { useState } from 'react';
import { ChecklistItem } from './types';
import DynamicIcon from './DynamicIcon';
import { Check, Plus, Trash2, Search, Filter, BookOpen, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Info } from 'lucide-react';
import { interpolateText } from './data';

interface ChecklistManagerProps {
  checklists: { [key: string]: ChecklistItem[] };
  onChangeChecklists: (categoryId: string, items: ChecklistItem[]) => void;
  destinationCountry: string;
  travelYear: string;
}

export default function ChecklistManager({ checklists, onChangeChecklists, destinationCountry, travelYear }: ChecklistManagerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('documentos_brasil');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newItemText, setNewItemText] = useState<string>('');
  const [newItemPriority, setNewItemPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState<boolean>(false);

  // Hover states
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
  const [hoveredCheckboxId, setHoveredCheckboxId] = useState<string | null>(null);

  const dest = destinationCountry?.trim() || 'Destino';
  const y = travelYear?.trim() || 'Ano da Viagem';

  const categories = [
    { id: 'documentos_brasil', name: 'Documentos na Origem', desc: 'Identidade, certidões civis e certidões criminais da origem.', icon: 'FileText' },
    { id: 'apostila_haia', name: 'Apostila de Haia', desc: `Apostilamento de documentos para ter validade legal em ${dest}.`, icon: 'Award' },
    { id: 'traducao_juramentada', name: 'Tradução Juramentada', desc: `Tradução oficial juramentada recomendada para ${dest}.`, icon: 'Languages' },
    { id: 'bagagem_mao', name: 'Bagagem de Mão', desc: 'Documentos originais impressos e valores físicos para o voo.', icon: 'Briefcase' },
    { id: 'empadronamiento', name: 'Registro de Residência', desc: `Inscrição ou registro oficial de residência em ${dest}.`, icon: 'Home' },
    { id: 'escola', name: 'Matrícula Escolar', desc: `Inscrição obrigatória no sistema escolar ou estudos em ${dest}.`, icon: 'GraduationCap' },
    { id: 'regularizacao_2026', name: 'Regularização / Visto', desc: `Permanência contínua, vistos e vias de legalização em ${dest}.`, icon: 'Scale' }
  ];

  const handleToggleItem = (itemId: string) => {
    const currentItems = checklists[activeCategory] || [];
    const updated = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onChangeChecklists(activeCategory, updated);
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    const currentItems = checklists[activeCategory] || [];
    const updated = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, notes };
      }
      return item;
    });
    onChangeChecklists(activeCategory, updated);
  };

  const handleUpdateText = (itemId: string, text: string) => {
    const currentItems = checklists[activeCategory] || [];
    const updated = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, text };
      }
      return item;
    });
    onChangeChecklists(activeCategory, updated);
  };

  const handleUpdatePriority = (itemId: string, priority: 'high' | 'medium' | 'low') => {
    const currentItems = checklists[activeCategory] || [];
    const updated = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, priority };
      }
      return item;
    });
    onChangeChecklists(activeCategory, updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const currentItems = checklists[activeCategory] || [];
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      text: newItemText,
      completed: false,
      notes: '',
      priority: newItemPriority,
    };

    onChangeChecklists(activeCategory, [...currentItems, newItem]);
    setNewItemText('');
    setNewItemPriority('medium');
  };

  const handleRemoveItem = (itemId: string) => {
    const currentItems = checklists[activeCategory] || [];
    onChangeChecklists(activeCategory, currentItems.filter(i => i.id !== itemId));
  };

  // Calculations for current category progress
  const currentItems = checklists[activeCategory] || [];
  const completedCount = currentItems.filter(i => i.completed).length;
  const totalCount = currentItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered items based on search query and status filter
  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'pending') {
      return matchesSearch && !item.completed;
    }
    if (statusFilter === 'completed') {
      return matchesSearch && item.completed;
    }
    return matchesSearch;
  });

  // Calculate overall global progress across all categories
  const allCategoryMetrics = Object.keys(checklists).reduce(
    (acc, catKey) => {
      const list = checklists[catKey] || [];
      acc.total += list.length;
      acc.completed += list.filter(i => i.completed).length;
      return acc;
    },
    { total: 0, completed: 0 }
  );
  const globalProgressPercent = allCategoryMetrics.total > 0
    ? Math.round((allCategoryMetrics.completed / allCategoryMetrics.total) * 100)
    : 0;

  const toggleExpandNotes = (id: string) => {
    setExpandedNotesId(expandedNotesId === id ? null : id);
  };

  const documentTips = [
    { title: "Apostila de Haia", text: `Para que seus documentos tenham validade legal em ${dest}, eles devem receber o selo da Apostila de Haia em cartórios credenciados na origem.` },
    { title: "Tradução Juramentada", text: `Muitos trâmites exigem tradução juramentada de documentos para o idioma oficial de ${dest}. Busque profissionais autorizados ou credenciados.` },
    { title: "Validade das Certidões", text: "Certidões civis e certidões de antecedentes criminais possuem validade estrita para fins imigratórios (geralmente de 90 a 180 dias). Planeje com cuidado." },
    { title: "Leis de Imigração", text: `Verifique sempre as regras oficiais de residência, vistos e permanência contínua vigentes para ${dest} no ano de ${y}.` }
  ];

  return (
    <div className="space-y-6">
      {/* Collapsible Document Tips */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2" style={{ color: "var(--accent)" }}>
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Dicas e Regras de Documentação ({dest} {y})</h4>
          </div>
          <button className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>

        {showTips && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: "var(--border)" }}>
            {documentTips.map((tip, idx) => (
              <div key={idx} className="p-3 rounded-xl space-y-1" style={{ background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)" }}>
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "var(--text)" }}>
                  <Info className="w-3 h-3" style={{ color: "var(--accent)" }} />
                  {tip.title}
                </span>
                <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{tip.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Progress Dashboard */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Progresso Geral de Documentos</h3>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Total acumulado de requisitos concluídos nas {categories.length} seções.</p>
          </div>
          <span className="text-lg font-extrabold font-display" style={{ color: "var(--accent)" }}>{globalProgressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${globalProgressPercent}%`, background: "var(--accent)" }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] mt-1.5 font-semibold" style={{ color: "var(--text-muted)" }}>
          <span>{allCategoryMetrics.completed} concluídos</span>
          <span>{allCategoryMetrics.total} no total</span>
        </div>

      </div>

      {/* Main Checklist UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Navigation - Left Panel */}
        <div className="lg:col-span-4 space-y-2 no-print">
          <span className="block text-[11px] font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-muted)" }}>Categorias do Processo</span>
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {categories.map((cat) => {
              const itemsList = checklists[cat.id] || [];
              const done = itemsList.filter(i => i.completed).length;
              const total = itemsList.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isActive = activeCategory === cat.id;
              const isHovered = hoveredCatId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setExpandedNotesId(null);
                  }}
                  onMouseEnter={() => setHoveredCatId(cat.id)}
                  onMouseLeave={() => setHoveredCatId(null)}
                  className={`text-left p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 w-64 lg:w-full flex items-start gap-3 relative overflow-hidden ${
                    isActive
                      ? 'shadow-md'
                      : ''
                  }`}
                  style={{
                    minHeight: '64px',
                    ...(isActive
                      ? { background: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-accent)' }
                      : { background: isHovered ? 'var(--surface-2)' : 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                    )
                  }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={isActive
                      ? { background: 'rgba(255,255,255,0.15)', color: 'white' }
                      : { background: 'var(--surface-3)', color: 'var(--text-secondary)' }
                    }
                  >
                    <DynamicIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block truncate">{cat.name}</span>
                    <span className="text-[10px] block mt-0.5 truncate" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                      {cat.desc}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.2)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: isActive ? 'var(--color-done)' : 'var(--accent)' }}
                        />
                      </div>
                      <span className="text-[9px] font-bold font-mono">{done}/{total}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist Content - Right Panel */}
        <div className="lg:col-span-8 p-5 rounded-2xl shadow-xs print-card flex flex-col" style={{ background: "var(--surface)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)" }}>
          {/* Active Category Title */}
          <div className="pb-3 mb-4" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <DynamicIcon name={categories.find(c => c.id === activeCategory)?.icon || 'FileText'} className="text-brand-primary w-5 h-5" />
                <span>{categories.find(c => c.id === activeCategory)?.name}</span>
              </h2>
              {/* Category progress badge */}
              <div className="font-bold font-mono text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "var(--bg-done)", color: "var(--accent)" }}>
                <span>{progressPercent}% Concluído</span>
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {categories.find(c => c.id === activeCategory)?.desc}
            </p>
          </div>

          {/* Controls: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 no-print">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -tranzinc-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por termo ou anotação..."
                className="w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                style={{ minHeight: '40px', background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)" }}
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl self-start sm:self-auto" style={{ background: "var(--surface-3)" }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'shadow-xs' : ''
                }`}
                style={{
                  minHeight: '32px',
                  ...(statusFilter === 'all'
                    ? { background: "var(--surface)", color: "var(--text)" }
                    : { color: "var(--text-muted)" }
                  )
                }}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending' ? 'shadow-xs' : ''
                }`}
                style={{
                  minHeight: '32px',
                  ...(statusFilter === 'pending'
                    ? { background: "var(--surface)", color: "var(--text)" }
                    : { color: "var(--text-muted)" }
                  )
                }}
              >
                Pendentes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'completed' ? 'shadow-xs' : ''
                }`}
                style={{
                  minHeight: '32px',
                  ...(statusFilter === 'completed'
                    ? { background: "var(--surface)", color: "var(--text)" }
                    : { color: "var(--text-muted)" }
                  )
                }}
              >
                Concluídos
              </button>
            </div>
          </div>

          {/* Active List Render */}
          <div className="space-y-2 flex-1">
            {filteredItems.map((item) => {
              const isCompleted = item.completed;
              const isExpanded = expandedNotesId === item.id;
              const isItemHovered = hoveredItemId === item.id;

              // 1. COMPACT COLLAPSED VIEW FOR COMPLETED CHECKLIST ITEMS
              if (isCompleted && !isExpanded) {
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 opacity-60 hover:opacity-95 shadow-sm transition-all flex items-center justify-between gap-2"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleToggleItem(item.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleItem(item.id); }}
                        className="w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center flex-shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="text-xs font-bold line-through text-zinc-400 dark:text-zinc-500 truncate select-none">
                        {interpolateText(item.text, destinationCountry, travelYear)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpandNotes(item.id)}
                        title="Expandir detalhes"
                        className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // 2. EXPANDED VIEW FOR COMPLETED CHECKLIST ITEMS
              if (isCompleted && isExpanded) {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 opacity-90 shadow-sm transition-all space-y-3"
                    style={{ background: "var(--surface)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0" onClick={() => handleToggleItem(item.id)}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleItem(item.id); }}
                          className="mt-0.5 w-5 h-5 rounded-md bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center flex-shrink-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold line-through text-zinc-400 dark:text-zinc-500 block select-none">
                            {interpolateText(item.text, destinationCountry, travelYear)}
                          </span>
                          <span className={`inline-block text-[9px] font-bold rounded-md px-1.5 py-0.5 uppercase tracking-wide mt-1.5 ${
                            item.priority === 'high'
                              ? 'bg-red-50 text-red-600'
                              : item.priority === 'medium'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {item.priority === 'high' ? 'Alta prioridade' : item.priority === 'medium' ? 'Prioridade Média' : 'Baixa Prioridade'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleExpandNotes(item.id)}
                          title="Recolher detalhes"
                          className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        {item.id.startsWith('item_') && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Notes & Title edit */}
                    <div className="pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-zinc-400">Título / Requisito:</label>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleUpdateText(item.id, e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text)" }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-zinc-400">Anotações:</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          placeholder="Adicionar anotação..."
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text)" }}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. UNCOMPLETED CHECKLIST ITEM VIEW
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl transition-all duration-200"
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    background: isItemHovered ? "var(--surface-2)" : "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      onMouseEnter={() => setHoveredCheckboxId(item.id)}
                      onMouseLeave={() => setHoveredCheckboxId(null)}
                      className="rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                      style={{
                        minWidth: '24px', minHeight: '24px', width: '22px', height: '22px',
                        borderWidth: '1px', borderStyle: 'solid',
                        borderColor: hoveredCheckboxId === item.id ? 'var(--accent)' : "var(--text-faint)",
                        background: "var(--surface)"
                      }}
                    >
                    </button>

                    <div className="flex-1 min-w-0" onClick={() => handleToggleItem(item.id)}>
                      <p className="text-xs font-medium leading-relaxed cursor-pointer select-none flex items-center gap-2 flex-wrap" style={{ color: "var(--text)" }}>
                        <span>{interpolateText(item.text, destinationCountry, travelYear)}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[9px] font-bold rounded-md px-1.5 py-0.5 uppercase tracking-wide ${
                          item.priority === 'high'
                            ? 'bg-red-50 text-red-600'
                            : item.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600'
                            : ''
                        }`} style={item.priority === 'low' ? { background: "var(--surface-3)", color: "var(--text-muted)" } : undefined}>
                          {item.priority === 'high' ? 'Alta prioridade' : item.priority === 'medium' ? 'Prioridade Média' : 'Baixa Prioridade'}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleExpandNotes(item.id)}
                          className="text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          style={{ color: item.notes ? "var(--accent)" : "var(--text-muted)" }}
                        >
                          <span>{item.notes ? 'Ver anotação' : 'Adicionar anotação'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {item.id.startsWith('item_') && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        onMouseEnter={() => setHoveredDeleteId(item.id)}
                        onMouseLeave={() => setHoveredDeleteId(null)}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0 no-print"
                        style={{
                          minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          color: hoveredDeleteId === item.id ? 'var(--color-error, #ef4444)' : "var(--text-faint)",
                          background: hoveredDeleteId === item.id ? "var(--surface-3)" : 'transparent'
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Título / Requisito do Documento:</label>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleUpdateText(item.id, e.target.value)}
                          placeholder="Ex: Certidão de Nascimento..."
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          style={{ minHeight: '38px', background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Prioridade:</label>
                        <select
                          value={item.priority || 'medium'}
                          onChange={(e) => handleUpdatePriority(item.id, e.target.value as any)}
                          className="w-full rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          style={{ minHeight: '38px', background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          <option value="high">Alta Prioridade</option>
                          <option value="medium">Média Prioridade</option>
                          <option value="low">Baixa Prioridade</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>Minhas anotações para este documento:</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          placeholder="Ex: Pedido no cartório dia 10, aguardando envio do tradutor..."
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          style={{ background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text)" }}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Always print notes if they exist */}
                  {!isExpanded && item.notes && (
                    <div className="hidden print:block mt-1 p-2 rounded-lg font-serif italic text-[10px]" style={{ background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      <strong>Nota:</strong> {item.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-12 text-center rounded-2xl" style={{ color: "var(--text-muted)", borderWidth: '1px', borderStyle: 'dashed', borderColor: "var(--border)" }}>
                <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                <p className="text-xs">Nenhum documento encontrado.</p>
                {searchQuery && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Tente limpar os filtros de busca.</p>}
              </div>
            )}
          </div>

          {/* Form to add custom checklist items to the active category */}
          <form onSubmit={handleAddItem} className="mt-6 pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 no-print" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: "var(--border)" }}>
            <div className="md:col-span-8">
              <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Adicionar Item Personalizado nesta categoria</label>
              <input
                type="text"
                required
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Ex: Procuração apostilada para os avós no Brasil..."
                className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                style={{ minHeight: '40px', background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)" }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Prioridade</label>
              <select
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(e.target.value as any)}
                className="w-full rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                style={{ minHeight: '40px', background: "var(--surface-2)", borderWidth: '1px', borderStyle: 'solid', borderColor: "var(--border)" }}
              >
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="low">Baixa Prioridade</option>
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full active:bg-blue-800 text-white rounded-xl py-2 flex items-center justify-center cursor-pointer font-bold text-sm"
                style={{ minHeight: '40px', background: "var(--accent)" }}
                title="Adicionar"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
