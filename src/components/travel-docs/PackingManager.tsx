import React, { useState } from 'react';
import { ChecklistItem } from './types';
import DynamicIcon from './DynamicIcon';
import { Check, Plus, Trash2, Search, Filter, BookOpen, AlertTriangle, ChevronDown, ChevronUp, Info, Lightbulb, PackageOpen } from 'lucide-react';
import { interpolateText } from './data';

interface PackingManagerProps {
  checklists: { [key: string]: ChecklistItem[] } | undefined;
  onChangeChecklists: (categoryId: string, items: ChecklistItem[]) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
  exchangeRate: number;
  destinationCountry: string;
  travelYear: string;
}

export default function PackingManager({ checklists = {}, onChangeChecklists, currency, currencySymbol, exchangeRate, destinationCountry, travelYear }: PackingManagerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('malas_roupas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newItemText, setNewItemText] = useState<string>('');
  const [newItemPriority, setNewItemPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newItemCost, setNewItemCost] = useState<string>('');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState<boolean>(false);

  const effectiveRate = currency === 'BRL' ? 1 : exchangeRate;

  const dest = destinationCountry?.trim() || 'Destino';
  const y = travelYear?.trim() || 'Ano da Viagem';

  const categories = [
    { id: 'malas_roupas', name: 'Malas e Roupas', desc: 'Vestuário adequado, calçados e organização interna das bagagens.', icon: 'Shirt' },
    { id: 'eletronicos', name: 'Eletrônicos', desc: 'Dispositivos, adaptadores, carregadores e backups de arquivos.', icon: 'Laptop' },
    { id: 'documentos_valores', name: 'Mão e Valores', desc: 'Documentos essenciais, moeda física, cartões e itens de valor.', icon: 'Briefcase' },
    { id: 'saude_higiene', name: 'Saúde e Higiene', desc: 'Medicamentos, receitas, receitas traduzidas e itens básicos.', icon: 'HeartPulse' },
    { id: 'itens_pessoais', name: 'Objetos Pessoais', desc: 'Lembranças, fotos físicas, passatempos e itens de conforto de viagem.', icon: 'Sparkles' }
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

  const handleUpdateCost = (itemId: string, costInBRL: number) => {
    const currentItems = checklists[activeCategory] || [];
    const updated = currentItems.map(item => {
      if (item.id === itemId) {
        return { ...item, cost: costInBRL };
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
    const parsedCostInput = parseFloat(newItemCost) || 0;
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      text: newItemText,
      completed: false,
      notes: '',
      priority: newItemPriority,
      cost: parsedCostInput * effectiveRate
    };

    onChangeChecklists(activeCategory, [...currentItems, newItem]);
    setNewItemText('');
    setNewItemPriority('medium');
    setNewItemCost('');
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

  // Calculate overall global progress across all packing categories
  const allCategoryMetrics = categories.reduce(
    (acc, cat) => {
      const list = checklists[cat.id] || [];
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

  const currentCategoryCostsBRL = currentItems.reduce((sum, i) => sum + (i.cost || 0), 0);
  const globalChecklistCostsBRL = categories.reduce((sum, cat) => {
    const list = checklists[cat.id] || [];
    return sum + list.reduce((sub, i) => sub + (i.cost || 0), 0);
  }, 0);

  // Informações atualizadas de bagagem e alfândega
  const travelTips = [
    { title: "Limite de Peso e Dimensões", text: `Para voos internacionais com destino a ${dest}, verifique o limite da sua franquia de bagagem (comumente 23kg despachada e 10kg bagagem de mão). O excesso gera taxas pesadas.` },
    { title: "Baterias e Eletrônicos (Regra de Segurança)", text: "Power banks, carregadores portáteis e baterias de lítio soltas DEVEM ser levados estritamente na bagagem de mão. É proibido despachá-los no porão devido ao risco de combustão espontânea." },
    { title: "Líquidos na Bagagem de Mão (Regra de 100ml)", text: "Qualquer líquido, gel ou aerossol deve estar em frascos de até 100ml cada. Todos os frascos devem caber folgadamente em um único saco plástico transparente vedável com capacidade máxima de 1 litro." },
    { title: "Remédios de Uso Contínuo e Receitas", text: "Leve medicamentos de uso contínuo para o período inicial da viagem. Eles devem estar nas caixas originais acompanhados de receita médica (se possível traduzida ou com o nome genérico da substância)." },
    { title: "Tomadas e Voltagem no Destino", text: `Verifique o padrão de tomadas e voltagem de ${dest} antes do embarque. Ter em mãos adaptadores universais de energia evita imprevistos já nas primeiras horas de chegada.` }
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Updated Tips Panel */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Dicas e Regras de Bagagem ({dest})</h4>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 text-xs font-semibold">
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>
        
        {showTips && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {travelTips.map((tip, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 space-y-1">
                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-500" />
                  {tip.title}
                </span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Progress Dashboard */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Organização das Malas para {dest}</h3>
            <p className="text-[11px] text-zinc-400">Progresso total acumulado de itens preparados para levar nas {categories.length} seções de bagagem.</p>
          </div>
          <span className="text-lg font-extrabold text-blue-700 font-display">{globalProgressPercent}%</span>
        </div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${globalProgressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 font-semibold">
          <span>{allCategoryMetrics.completed} preparados</span>
          <span>{allCategoryMetrics.total} no total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Custo nesta Seção ({categories.find(c => c.id === activeCategory)?.name})</span>
            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
              {currencySymbol} {Math.round(currentCategoryCostsBRL / effectiveRate).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100/30 dark:border-blue-900/30">
            <span className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 block">Custo Total de Equipamentos/Itens Adquiridos</span>
            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
              {currencySymbol} {Math.round(globalChecklistCostsBRL / effectiveRate).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Packing UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Navigation - Left Panel */}
        <div className="lg:col-span-4 space-y-2 no-print">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">Seções de Bagagem</span>
          <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {categories.map((cat) => {
              const itemsList = checklists[cat.id] || [];
              const done = itemsList.filter(i => i.completed).length;
              const total = itemsList.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setExpandedNotesId(null);
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex-shrink-0 w-64 lg:w-full flex items-start gap-3 relative overflow-hidden ${
                    isActive 
                      ? 'bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-900/10' 
                      : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                  style={{ minHeight: '64px' }}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white dark:bg-zinc-900/10 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350'}`}>
                    <DynamicIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>{cat.name}</h4>
                    <p className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-blue-100/80' : 'text-zinc-400'}`}>{cat.desc}</p>
                    
                    {/* Linear progress bar in categories list */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full bg-zinc-200/50 dark:bg-white dark:bg-zinc-900/10 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isActive ? 'bg-emerald-400' : 'bg-blue-600'}`} 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold font-mono ${isActive ? 'text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Packing Items List - Right Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs print-card flex flex-col">
          {/* Header of the category list */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                <PackageOpen className="w-4 h-4 text-zinc-400" />
                <span>{categories.find(c => c.id === activeCategory)?.name}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 ml-2">
                  {completedCount}/{totalCount} Concluídos
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">{categories.find(c => c.id === activeCategory)?.desc}</p>
            </div>

            {/* Quick search inside the active list */}
            <div className="relative max-w-xs no-print">
              <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar itens..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                style={{ minHeight: '38px' }}
              />
            </div>
          </div>

          {/* Quick filter toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-50 mb-4 no-print">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
                }`}
              >
                Pendentes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'completed' ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
                }`}
              >
                Preparados
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-400 font-semibold italic flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-300" />
              Mostrando {filteredItems.length} de {totalCount} itens
            </p>
          </div>

          {/* Table list items */}
          <div className="flex-1 space-y-2 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
            {filteredItems.map((item) => {
              const isExpanded = expandedNotesId === item.id;
              return (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col ${
                    item.completed 
                      ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800' 
                      : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40/30 border-zinc-200 dark:border-zinc-800/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
                        item.completed 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-zinc-300 bg-white dark:bg-zinc-900 hover:border-blue-500 hover:shadow-xs'
                      }`}
                      style={{ minWidth: '20px', minHeight: '20px' }}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0" onClick={() => handleToggleItem(item.id)}>
                      <p className={`text-xs font-semibold leading-relaxed cursor-pointer select-none ${
                        item.completed ? 'text-zinc-400 line-through font-normal' : 'text-zinc-800 dark:text-zinc-200'
                      }`}>
                        {interpolateText(item.text, destinationCountry, travelYear)}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 no-print" onClick={(e) => e.stopPropagation()}>
                        {/* Priority Badge */}
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          item.priority === 'high' 
                            ? 'bg-red-50 text-red-600' 
                            : item.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>

                        {/* Cost Badge */}
                        {item.cost ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] px-2 py-0.5 rounded-md font-mono border border-emerald-100 dark:border-emerald-900/30">
                            {currencySymbol} {Math.round(item.cost / effectiveRate).toLocaleString('pt-BR')}
                          </span>
                        ) : null}

                        {/* Expandable trigger for note edits and cost */}
                        <button
                          type="button"
                          onClick={() => toggleExpandNotes(item.id)}
                          className={`text-[10px] font-bold flex items-center gap-1 hover:text-blue-600 cursor-pointer ${
                            item.notes ? 'text-blue-600' : 'text-zinc-400'
                          }`}
                        >
                          <span>{item.notes ? 'Ver anotação' : 'Adicionar anotação'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Delete button (for custom added items) */}
                    {item.id.startsWith('item_') && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0 no-print"
                        style={{ minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Expandable Notes and Cost Input */}
                  {isExpanded && (
                    <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Título / Nome do Item:</label>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleUpdateText(item.id, e.target.value)}
                          placeholder="Ex: Adaptador de Tomada..."
                          className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                          style={{ minHeight: '38px' }}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Prioridade:</label>
                        <select
                          value={item.priority || 'medium'}
                          onChange={(e) => handleUpdatePriority(item.id, e.target.value as any)}
                          className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                          style={{ minHeight: '38px' }}
                        >
                          <option value="high">Alta Prioridade</option>
                          <option value="medium">Média Prioridade</option>
                          <option value="low">Baixa Prioridade</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Custo do Equipamento/Item ({currency}):</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 font-semibold font-mono text-xs">{currencySymbol}</span>
                          <input
                            type="number"
                            value={item.cost ? Math.round(item.cost / effectiveRate) : ''}
                            onChange={(e) => {
                              const typed = parseFloat(e.target.value) || 0;
                              handleUpdateCost(item.id, typed * effectiveRate);
                            }}
                            placeholder="Ex: 150"
                            className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                            style={{ minHeight: '38px' }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Minhas anotações para este item:</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                          placeholder="Ex: Maleta preta pequena despachada, casaco azul escuro..."
                          className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Always print notes if they exist */}
                  {!isExpanded && item.notes && (
                    <div className="hidden print:block mt-1 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-350 font-serif italic">
                      <strong>Nota:</strong> {item.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs">Nenhum item encontrado.</p>
                {searchQuery && <p className="text-[10px] text-zinc-400 mt-0.5">Tente limpar os filtros de busca.</p>}
              </div>
            )}
          </div>

          {/* Form to add custom checklist items to the active category */}
          <form onSubmit={handleAddItem} className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 no-print">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Adicionar Item Personalizado de Bagagem</label>
              <input
                type="text"
                required
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Ex: Carregador extra tipo C reforçado de 3 metros..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                style={{ minHeight: '40px' }}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Prioridade</label>
              <select
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(e.target.value as any)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                style={{ minHeight: '40px' }}
              >
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="low">Baixa Prioridade</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Custo Adicional ({currency})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 font-semibold font-mono text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="Ex: 150"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all"
                  style={{ minHeight: '40px' }}
                />
              </div>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-2 flex items-center justify-center cursor-pointer font-bold text-sm"
                style={{ minHeight: '40px' }}
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
