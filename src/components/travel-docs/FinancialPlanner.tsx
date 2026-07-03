import React, { useState } from 'react';
import { FinancialExpense } from './types';
import { DollarSign, Plus, Trash2, Check, TrendingUp, AlertCircle, RefreshCw, Lightbulb, Info, Pencil, X } from 'lucide-react';

interface FinancialPlannerProps {
  expenses: FinancialExpense[];
  onChangeExpenses: (updated: FinancialExpense[]) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
  exchangeRate: number;
  onUpdateExchangeRate: (rate: number) => void;
  onChangeCurrency: (c: 'BRL' | 'EUR' | 'USD') => void;
  destinationCountry?: string;
  travelYear?: string;
}

export default function FinancialPlanner({ 
  expenses, 
  onChangeExpenses, 
  currency, 
  currencySymbol, 
  exchangeRate, 
  onUpdateExchangeRate,
  onChangeCurrency,
  destinationCountry,
  travelYear
}: FinancialPlannerProps) {
  
  // Custom new expense state
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<FinancialExpense['category']>('documentos');
  const [newEst, setNewEst] = useState('');
  const [showTips, setShowTips] = useState<boolean>(true);

  const startEditExpense = (expense: FinancialExpense) => {
    setEditingExpenseId(expense.id);
    setNewDesc(expense.description);
    setNewCategory(expense.category);
    setNewEst(getDisplayValue(expense.estimated));
  };

  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setNewDesc('');
    setNewCategory('documentos');
    setNewEst('');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const categoryLabels: Record<FinancialExpense['category'], string> = {
      documentos: 'Documentos',
      passagens: 'Passagens',
      moradia: 'Moradia / Instalação',
      reserva: 'Fundo de Reserva',
      outros: 'Outros Custos'
    };

    const parsedEst = parseFloat(newEst) || 0;

    if (editingExpenseId) {
      const updated = expenses.map(exp => {
        if (exp.id === editingExpenseId) {
          return {
            ...exp,
            description: newDesc.trim(),
            category: newCategory,
            categoryLabel: categoryLabels[newCategory],
            estimated: parsedEst * exchangeRate
          };
        }
        return exp;
      });
      onChangeExpenses(updated);
      cancelEditExpense();
    } else {
      const newItem: FinancialExpense = {
        id: `exp_${Date.now()}`,
        description: newDesc.trim(),
        category: newCategory,
        categoryLabel: categoryLabels[newCategory],
        estimated: parsedEst * exchangeRate,
        real: 0,
        paid: false
      };

      onChangeExpenses([...expenses, newItem]);
      setNewDesc('');
      setNewEst('');
    }
  };

  const handleRemoveExpense = (id: string) => {
    onChangeExpenses(expenses.filter(e => e.id !== id));
    if (editingExpenseId === id) {
      cancelEditExpense();
    }
  };

  const handleUpdateCost = (id: string, field: 'estimated' | 'real', displayValue: number) => {
    // Store internally as base BRL
    const adjustedValue = displayValue * exchangeRate;
    onChangeExpenses(
      expenses.map(exp => {
        if (exp.id === id) {
          return { ...exp, [field]: adjustedValue };
        }
        return exp;
      })
    );
  };

  const handleTogglePaid = (id: string) => {
    onChangeExpenses(
      expenses.map(exp => {
        if (exp.id === id) {
          return { ...exp, paid: !exp.paid };
        }
        return exp;
      })
    );
  };

  // Calculations (internal storage is always in BRL)
  const totalEstimatedBRL = expenses.reduce((sum, e) => sum + e.estimated, 0);
  const totalRealBRL = expenses.reduce((sum, e) => sum + e.real, 0);
  const totalPaidBRL = expenses.reduce((sum, e) => sum + (e.paid ? (e.real || e.estimated) : 0), 0);
  const totalPendingBRL = Math.max(0, totalEstimatedBRL - totalPaidBRL);

  // Conversion helpers
  const formatValue = (valueInBRL: number) => {
    const converted = valueInBRL / exchangeRate;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  const getDisplayValue = (valInBRL: number) => {
    const converted = valInBRL / exchangeRate;
    return converted === 0 ? '' : Math.round(converted).toString();
  };

  const financeTips = [
    { 
      title: "Fundo de Reserva Requerido", 
      text: `Para uma imigração ou viagem segura em família, recomenda-se ter um fundo de reserva líquido equivalente a pelo menos 6 meses de aluguel e custos de manutenção no seu destino (${destinationCountry || 'o país de destino'}) para evitar contratempos.` 
    },
    { 
      title: "Aluguel e Fiança Legal", 
      text: `Geralmente os proprietários no destino (${destinationCountry || 'exterior'}) exigem de 1 a 2 meses de fiança como garantia de locação. Pela falta de histórico de crédito local imediato, podem pedir depósitos ou garantias adicionais.` 
    },
    { 
      title: "Envio Inteligente de Euros/Moedas", 
      text: `Não utilize cartões de crédito brasileiros diretamente para transações diárias no destino (${destinationCountry || 'exterior'}) devido ao IOF alto de 4.38% e spreads elevados. Prefira contas globais digitais multimoedas.` 
    },
    { 
      title: "Declaração de Valores", 
      text: "Ao viajar por aeroportos internacionais, portar quantias em espécie equivalentes a US$ 10.000 ou mais por pessoa exige obrigatoriamente o preenchimento de declaração de bens junto à alfândega dos países de origem e destino." 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Collapsible Finance Tips */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Dicas e Regras Financeiras ({destinationCountry || 'Destino'}{travelYear ? ` ${travelYear}` : ''})
            </h4>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 text-xs font-semibold">
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>
        
        {showTips && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {financeTips.map((tip, idx) => (
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

      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <DollarSign className="text-brand-primary w-5 h-5" />
              <span>2. Planejador Financeiro</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Estime e controle os custos da sua viagem e mudança para {destinationCountry || 'o destino'}. O controle está unificado na moeda selecionada.
            </p>
          </div>
          
          {/* Currency Configuration */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start sm:self-auto no-print">
            <button
              type="button"
              onClick={() => onChangeCurrency('BRL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currency === 'BRL'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
              }`}
              style={{ minHeight: '36px' }}
            >
              R$ (BRL)
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('EUR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currency === 'EUR'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
              }`}
              style={{ minHeight: '36px' }}
            >
              € (EUR)
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200'
              }`}
              style={{ minHeight: '36px' }}
            >
              $ (USD)
            </button>
          </div>
        </div>

        {/* Exchange Rate Adjustment */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-350">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Taxa de câmbio editável:</span>
            {currency === 'BRL' ? (
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Moeda base (Sem conversão)</span>
            ) : (
              <>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">1 {currencySymbol} = </span>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => onUpdateExchangeRate(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-0.5 text-xs font-semibold text-center focus:ring-1 focus:ring-blue-500"
                />
                <span>Reais (BRL)</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-zinc-400">
            Todos os valores salvos internamente serão atualizados proporcionalmente nas conversões.
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <span className="block text-[11px] font-medium text-blue-600 uppercase tracking-wider">Total Estimado ({currency})</span>
            <span className="text-base sm:text-lg font-bold text-blue-900 block mt-0.5">{formatValue(totalEstimatedBRL)}</span>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="block text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Total Realizado ({currency})</span>
            <span className="text-base sm:text-lg font-bold text-emerald-900 block mt-0.5">{formatValue(totalRealBRL)}</span>
          </div>
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <span className="block text-[11px] font-medium text-indigo-600 uppercase tracking-wider">Total Pago ({currency})</span>
            <span className="text-base sm:text-lg font-bold text-indigo-900 block mt-0.5">{formatValue(totalPaidBRL)}</span>
          </div>
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pendente / Poupar ({currency})</span>
            <span className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 block mt-0.5">{formatValue(totalPendingBRL)}</span>
          </div>
        </div>

        {/* Add custom expense form */}
        <form onSubmit={handleAddExpense} className={`grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl mb-6 no-print transition-all ${
          editingExpenseId 
            ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 shadow-xs' 
            : 'bg-zinc-50 dark:bg-zinc-900/40'
        }`}>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
              {editingExpenseId ? '📌 EDITANDO: Descrição do Custo' : 'Descrição do Custo'}
            </label>
            <input
              type="text"
              required
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Ex: Aluguel de malas, assessoria legal..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
              style={{ minHeight: '40px' }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Categoria</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
              style={{ minHeight: '40px' }}
            >
              <option value="documentos">Documentos</option>
              <option value="passagens">Passagens</option>
              <option value="moradia">Moradia</option>
              <option value="reserva">Reserva</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Estimado ({currency})</label>
              <input
                type="number"
                value={newEst}
                onChange={(e) => setNewEst(e.target.value)}
                placeholder="Ex: 500"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
                style={{ minHeight: '40px' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {editingExpenseId && (
                <button
                  type="button"
                  onClick={cancelEditExpense}
                  className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition-all animate-fade-in"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                  title="Cancelar edição"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
              <button
                type="submit"
                className={`${editingExpenseId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'} text-white p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition-all`}
                style={{ minWidth: '40px', minHeight: '40px' }}
                title={editingExpenseId ? "Salvar alterações" : "Adicionar custo"}
              >
                {editingExpenseId ? <Check className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </form>

        {/* Expenses List */}
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Pago</th>
                <th className="py-2.5 px-3">Descrição / Categoria</th>
                <th className="py-2.5 px-3">Estimado ({currency})</th>
                <th className="py-2.5 px-3">Realizado ({currency})</th>
                <th className="py-2.5 px-3 text-right no-print">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 text-xs">
              {expenses.map((expense) => (
                <tr 
                  key={expense.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 transition-colors ${expense.paid ? 'bg-emerald-50/10 text-zinc-500 dark:text-zinc-400' : ''}`}
                >
                  {/* Paid switch */}
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(expense.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        expense.paid 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-zinc-300 hover:border-emerald-500'
                      }`}
                      style={{ minWidth: '24px', minHeight: '24px' }}
                    >
                      {expense.paid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Description / Category */}
                  <td className="py-3 px-3 max-w-xs">
                    <span className={`font-medium block ${expense.paid ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {expense.description}
                    </span>
                    <span className="inline-block text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md px-1.5 py-0.5 mt-0.5 uppercase tracking-wider font-semibold">
                      {expense.categoryLabel}
                    </span>
                  </td>

                  {/* Estimated cost input */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400 font-mono text-[10px]">{currencySymbol}</span>
                      <input
                        type="number"
                        value={getDisplayValue(expense.estimated)}
                        onChange={(e) => handleUpdateCost(expense.id, 'estimated', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 focus:bg-white dark:bg-zinc-900 border-0 hover:border focus:border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-semibold"
                        placeholder="0"
                      />
                    </div>
                  </td>

                  {/* Real cost input */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400 font-mono text-[10px]">{currencySymbol}</span>
                      <input
                        type="number"
                        value={getDisplayValue(expense.real)}
                        onChange={(e) => handleUpdateCost(expense.id, 'real', parseFloat(e.target.value) || 0)}
                        className={`w-20 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 focus:bg-white dark:bg-zinc-900 border-0 hover:border focus:border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-bold ${
                          expense.real > 0 ? 'text-emerald-700' : 'text-zinc-400'
                        }`}
                        placeholder="Ex: 450"
                      />
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="py-3 px-3 text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditExpense(expense)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          editingExpenseId === expense.id ? 'text-blue-600 bg-blue-50' : 'text-zinc-300 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800'
                        }`}
                        style={{ minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Editar descrição/categoria"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="text-zinc-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 transition-colors cursor-pointer"
                        style={{ minWidth: '32px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    Nenhum custo registrado. Use o formulário acima para adicionar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
