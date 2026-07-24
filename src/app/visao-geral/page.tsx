'use client';

import React from 'react';
import { Plus, Trash2, Plane, User, X, DollarSign, Wallet, Calendar, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao, CURRENCY_SYMBOLS } from '@/lib/imigracao-context';

/* ── Componente de Input de Custo Único com Conversão Universal Baseada na Moeda Ativa ──────── */
const UniversalCostInput = ({
  label,
  valueInBRL,
  onChangeBRL,
  activeCurrency,
  exchangeRate
}: {
  label: string;
  valueInBRL: number;
  onChangeBRL: (val: string) => void;
  activeCurrency: string;
  exchangeRate: number;
}) => {
  const rate = activeCurrency === 'BRL' ? 1 : exchangeRate;
  const symbol = CURRENCY_SYMBOLS[activeCurrency] || 'R$';

  // Valor numérico a ser exibido no input convertido para a moeda ativa
  const displayVal = Math.round((valueInBRL || 0) / rate);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedVal = parseFloat(e.target.value) || 0;
    // Converte o valor digitado de volta para BRL para armazenamento no estado
    const newBRL = typedVal * rate;
    onChangeBRL(newBRL.toString());
  };

  return (
    <div className="mb-3.5">
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={displayVal === 0 ? '' : displayVal}
          onChange={handleChange}
          className="input font-mono w-full text-xs"
          placeholder="0"
        />
        <span className="text-xs font-extrabold w-8 text-center flex-shrink-0" style={{ color: 'var(--accent)' }}>
          {symbol}
        </span>
      </div>
    </div>
  );
};

function VisaoGeralContent() {
  const {
    profile, updateProfileField,
    isSyncingAI, handleAISync,
    completionPercentage, completedTasks, totalTasks,
    scenarios, showAddScenario, setShowAddScenario, setEditingScenarioId,
    scenarioName, setScenarioName, author, setAuthor,
    handleDeleteScenario, handleLoadScenario, handleSaveScenario,
    formData, budget, setBudget, exchangeRate, activeCurrency, handleInputChange,
    initialPackageBRL, monthlyExpensesBRL, monthlyIncomeBRL, netMonthlyFlowBRL, months,
    formatValue,
  } = useImigracao();

  const symbol = CURRENCY_SYMBOLS[activeCurrency] || 'R$';
  const rate = activeCurrency === 'BRL' ? 1 : exchangeRate;

  // Valor do Orçamento em exibição na moeda ativa
  const budgetDisplayValue = Math.round((budget || 0) / rate);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedVal = parseFloat(e.target.value) || 0;
    setBudget(typedVal * rate);
  };

  const remainingAfterInitialBRL = budget - initialPackageBRL;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn relative">
      {/* Overlay de Sincronização Inteligente por IA */}
      {isSyncingAI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="card p-8 rounded-3xl max-w-md border border-zinc-200 dark:border-zinc-800/80 shadow-2xl space-y-6 animate-scaleUp" style={{ background: 'var(--surface)' }}>
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Plane className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider" style={{ color: 'var(--text)' }}>Construindo Sua Jornada</h3>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                O <span style={{ color: 'var(--accent)' }}>vTask Agent</span> está utilizando a API do OpenRouter para estruturar todas as regras, passeios, custos, malas e contatos específicos para:
              </p>
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs font-bold space-y-1 text-left">
                <div style={{ color: 'var(--text)' }}>✈️ Destino: {profile.destination_country} ({profile.destination_city})</div>
                <div style={{ color: 'var(--text-faint)' }}>🎯 Visto: {profile.immigration_goal}</div>
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
              Isso pode levar de 15 a 30 segundos...
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 lg:col-span-1">
        <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider">Perfil do Imigrante</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>País de Destino</label>
              <input type="text" value={profile.destination_country} onChange={(e) => updateProfileField('destination_country', e.target.value)} className="input text-xs" placeholder="Ex: Espanha" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Cidade / Região</label>
              <input type="text" value={profile.destination_city} onChange={(e) => updateProfileField('destination_city', e.target.value)} className="input text-xs" placeholder="Ex: Menasalbas / Toledo" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Objetivo / Visto</label>
              <input type="text" value={profile.immigration_goal} onChange={(e) => updateProfileField('immigration_goal', e.target.value)} className="input text-xs" placeholder="Ex: Arraigo Social" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Trimestre Atual</label>
              <select value={profile.current_quarter} onChange={(e) => updateProfileField('current_quarter', parseInt(e.target.value))} className="input text-xs">
                {[1,2,3,4,5,6,7,8].map(q => <option key={q} value={q}>Trimestre {q} ({q * 3}º mês)</option>)}
              </select>
            </div>
            
            <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button type="button" onClick={handleAISync} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md">
                ✨ Sincronizar Jornada com IA
              </button>
              <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
                Requer a API do OpenRouter ativa nas configurações do vTask Agent.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Progresso Geral da Regularização</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs font-black">{completionPercentage}%</span>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{completedTasks} de {totalTasks} tarefas concluídas</div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Foco atual: Trimestre {profile.current_quarter}</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mt-4">
            <div className="h-full transition-all duration-500" style={{ width: `${completionPercentage}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cenários Financeiros</h3>
            {!showAddScenario && (
              <button onClick={() => { setEditingScenarioId(null); setShowAddScenario(true); }} className="hover:underline text-xs flex items-center gap-1 font-bold" style={{ color: 'var(--accent)' }}>
                <Plus className="w-3.5 h-3.5" /> Novo
              </button>
            )}
          </div>
          <div className="space-y-3">
            {scenarios.length === 0 ? (
              <p className="text-[10px] text-zinc-400 text-center py-4">Nenhum cenário salvo ainda.</p>
            ) : (
              scenarios.map(sc => (
                <div key={sc.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <div className="cursor-pointer flex-1" onClick={() => handleLoadScenario(sc)}>
                    <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{sc.name}</div>
                    <div className="text-[9px] text-zinc-400">{formatValue(sc.budget)} • {sc.createdAt}</div>
                  </div>
                  <button onClick={() => handleDeleteScenario(sc.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Plane className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Simulador de Custos de Viagem e Instalação
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Moeda Ativa no Topo: <strong>{activeCurrency} ({symbol})</strong> • Cotação Base: <strong>1 € = R$ {exchangeRate.toFixed(2)}</strong>
              </p>
            </div>
            {showAddScenario && (
              <button onClick={() => setShowAddScenario(false)} className="text-xs font-bold text-zinc-400 hover:text-zinc-500 flex items-center gap-1 border px-2.5 py-1 rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <X className="w-3.5 h-3.5" /> Fechar Editor
              </button>
            )}
          </div>

          {showAddScenario && (
            <div className="p-4 rounded-xl border mb-6 space-y-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nome do Cenário</label>
                  <input type="text" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="input text-xs" placeholder="Ex: Cenário Principal" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Autor</label>
                  <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input text-xs" placeholder="Ex: Vinny" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddScenario(false)} className="btn px-4 py-1.5 text-xs border rounded-lg" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
                <button onClick={handleSaveScenario} className="btn px-4 py-1.5 text-xs text-white rounded-lg font-bold" style={{ background: 'var(--accent)' }}>Salvar Cenário</button>
              </div>
            </div>
          )}

          {/* Orçamento Total Disponível */}
          <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)' }}>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Orçamento Total Disponível (Reserva Inicial)</h4>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sua reserva financeira acumulada para a transição</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetDisplayValue === 0 ? '' : budgetDisplayValue}
                onChange={handleBudgetChange}
                className="input font-mono font-bold text-sm w-44"
                placeholder="0"
              />
              <span className="font-bold text-xs w-6 text-center" style={{ color: 'var(--accent)' }}>
                {symbol}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custos Iniciais (10 dias) - SAÍDAS ÚNICAS */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Custos Iniciais (10 dias)
                </h3>
                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                  Saída Única
                </span>
              </div>
              
              <UniversalCostInput
                label="Passagens Aéreas"
                valueInBRL={formData.flights}
                onChangeBRL={(val) => handleInputChange('flights', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />
              <UniversalCostInput
                label="Hospedagem provisória"
                valueInBRL={formData.stay}
                onChangeBRL={(val) => handleInputChange('stay', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />
              <UniversalCostInput
                label="Alimentação inicial"
                valueInBRL={formData.food}
                onChangeBRL={(val) => handleInputChange('food', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />
              <UniversalCostInput
                label="Transporte inicial"
                valueInBRL={formData.transport}
                onChangeBRL={(val) => handleInputChange('transport', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />
              <UniversalCostInput
                label="Passeios / Lazer inicial"
                valueInBRL={formData.tours}
                onChangeBRL={(val) => handleInputChange('tours', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />
              <UniversalCostInput
                label="Reserva de Emergência Inicial"
                valueInBRL={formData.emergencyInitial}
                onChangeBRL={(val) => handleInputChange('emergencyInitial', val)}
                activeCurrency={activeCurrency}
                exchangeRate={exchangeRate}
              />

              <div className="p-3 rounded-xl mt-4 flex justify-between items-center text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <span className="font-bold text-zinc-600 dark:text-zinc-300">Total Saídas Iniciais (10d):</span>
                <span className="font-mono font-bold text-rose-500">-{formatValue(initialPackageBRL)}</span>
              </div>
            </div>

            {/* Custo de Vida Mensal & Renda — SEPARAÇÃO CLARA ENTRADAS vs SAÍDAS */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Custo Mensal & Renda
                </h3>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  Entradas & Saídas
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-rose-500 mb-1 flex items-center gap-1">
                  🔻 Saídas Mensais (Despesas Fixas)
                </div>

                <UniversalCostInput
                  label="Aluguel de Moradia"
                  valueInBRL={formData.rent}
                  onChangeBRL={(val) => handleInputChange('rent', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Contas (Luz, Internet, Água)"
                  valueInBRL={formData.bills}
                  onChangeBRL={(val) => handleInputChange('bills', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Mercado / Compras"
                  valueInBRL={formData.market}
                  onChangeBRL={(val) => handleInputChange('market', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Transporte Mensal"
                  valueInBRL={formData.transportMonthly}
                  onChangeBRL={(val) => handleInputChange('transportMonthly', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Saúde (Seguro/Farmácia)"
                  valueInBRL={formData.health}
                  onChangeBRL={(val) => handleInputChange('health', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Crianças / Educação"
                  valueInBRL={formData.kids}
                  onChangeBRL={(val) => handleInputChange('kids', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />
                <UniversalCostInput
                  label="Reserva de Caixa Mensal"
                  valueInBRL={formData.monthlyReserve}
                  onChangeBRL={(val) => handleInputChange('monthlyReserve', val)}
                  activeCurrency={activeCurrency}
                  exchangeRate={exchangeRate}
                />

                {/* Seção de Entradas / Renda */}
                <div className="pt-3 border-t border-dashed my-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                    🟢 Entradas Mensais (Renda & Ganhos)
                  </div>
                  <UniversalCostInput
                    label="Renda Extra Esperada (Ganhos)"
                    valueInBRL={formData.extraIncome}
                    onChangeBRL={(val) => handleInputChange('extraIncome', val)}
                    activeCurrency={activeCurrency}
                    exchangeRate={exchangeRate}
                  />
                </div>
              </div>

              {/* Resumo do Balanço Mensal */}
              <div className="space-y-2 mt-4">
                <div className="p-2 rounded-xl flex justify-between items-center text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <span className="font-bold text-zinc-500">Saídas Mensais (Despesas):</span>
                  <span className="font-mono font-bold text-rose-500">-{formatValue(monthlyExpensesBRL)} / mês</span>
                </div>
                <div className="p-2 rounded-xl flex justify-between items-center text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <span className="font-bold text-zinc-500">Entradas Mensais (Ganhos):</span>
                  <span className="font-mono font-bold text-emerald-500">+{formatValue(monthlyIncomeBRL)} / mês</span>
                </div>

                {netMonthlyFlowBRL >= 0 ? (
                  <div className="p-2.5 rounded-xl flex justify-between items-center text-xs border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">Superávit Mensal (Ganho Líquido):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatValue(netMonthlyFlowBRL)} / mês</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl flex justify-between items-center text-xs border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40">
                    <span className="font-bold text-rose-700 dark:text-rose-300">Déficit Mensal (Saída Líquida de Caixa):</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-{formatValue(Math.abs(netMonthlyFlowBRL))} / mês</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cartões de Resumo e Indicadores do Cenário */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Reserva Total</div>
              <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatValue(budget)}</div>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Custos Iniciais (10d)</div>
              <div className="text-sm font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5">-{formatValue(initialPackageBRL)}</div>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Balanço Mensal</div>
              <div className={`text-sm font-mono font-black mt-0.5 ${netMonthlyFlowBRL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netMonthlyFlowBRL >= 0 ? `+${formatValue(netMonthlyFlowBRL)}/mês` : `-${formatValue(Math.abs(netMonthlyFlowBRL))}/mês`}
              </div>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Autonomia Est.</div>
              <div className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {netMonthlyFlowBRL >= 0 ? '∞ (Sustentável)' : `${(remainingAfterInitialBRL / Math.abs(netMonthlyFlowBRL)).toFixed(1)} meses`}
              </div>
            </div>
          </div>

          {/* Projeção de Sobrevivência (12 Meses) */}
          <div className="mt-6">
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
              Projeção de Sobrevivência dos Primeiros 12 Meses
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-2.5 font-bold uppercase text-[10px]">Mês</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Saldo Inicial</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right text-rose-500">Saídas (Despesas)</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right text-emerald-500">Entradas (Renda)</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Fluxo Mensal</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Saldo Final</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map(m => (
                    <tr key={m.month} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2.5 font-bold">Mês {m.month}</td>
                      <td className="py-2.5 text-right font-mono">{formatValue(m.initialBalance)}</td>
                      <td className="py-2.5 text-right font-mono text-rose-500 font-medium">-{formatValue(m.monthlyExpense)}</td>
                      <td className="py-2.5 text-right font-mono text-emerald-500 font-medium">+{formatValue(m.extraIncome)}</td>
                      <td className={`py-2.5 text-right font-mono font-bold ${m.netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.netFlow >= 0 ? `+${formatValue(m.netFlow)}` : `-${formatValue(Math.abs(m.netFlow))}`}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold" style={{ color: m.healthy ? 'var(--color-done)' : 'var(--color-danger)' }}>
                        {formatValue(m.endBalance)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: m.healthy ? 'var(--bg-done)' : 'var(--bg-danger)', color: m.healthy ? 'var(--color-done)' : 'var(--color-danger)' }}>
                          {m.healthy ? (m.netFlow >= 0 ? 'Sustentável' : 'Saudável') : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisaoGeralPage() {
  return (
    <ImigracaoShell>
      <VisaoGeralContent />
    </ImigracaoShell>
  );
}
