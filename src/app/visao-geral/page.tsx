'use client';

import React from 'react';
import { Plus, Trash2, Plane, User, X } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';

const InputPair = ({ label, brValue, eurValue, onChange }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} value={brValue} onChange={(e) => onChange('br', e.target.value)} className="input font-mono w-full text-xs" placeholder="0" />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>R$</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} value={eurValue} onChange={(e) => onChange('eur', e.target.value)} className="input font-mono w-full text-xs" placeholder="0" />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>€</span>
      </div>
    </div>
  </div>
);

const InputPairEur = ({ label, eurValue, onChange, exchange }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} value={(eurValue * exchange).toFixed(0)} onChange={(e) => onChange('br', e.target.value)} className="input font-mono w-full text-xs" placeholder="0" />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>R$</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" onWheel={(e) => (e.target as HTMLInputElement).blur()} value={eurValue} onChange={(e) => onChange('eur', e.target.value)} className="input font-mono w-full text-xs" placeholder="0" />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>€</span>
      </div>
    </div>
  </div>
);

function VisaoGeralContent() {
  const {
    profile, updateProfileField, handleSyncIdeias,
    isSyncingAI, handleAISync,
    completionPercentage, completedTasks, totalTasks,
    scenarios, showAddScenario, setShowAddScenario, editingScenarioId, setEditingScenarioId,
    scenarioName, setScenarioName, author, setAuthor,
    handleDeleteScenario, handleLoadScenario, handleSaveScenario,
    formData, budget, setBudget, exchangeRate, handleInputChange,
    initialPackageBRL, monthlyExpensesBRL, extraIncomeBRL, months,
    formatValue,
  } = useImigracao();

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
                    <div className="text-[9px] text-zinc-400">R$ {sc.budget.toLocaleString()} • {sc.createdAt}</div>
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
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cotação atual: <strong>1 € = R$ {exchangeRate.toFixed(2)}</strong></p>
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

          <div className="mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)' }}>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Orçamento Total Disponível</h4>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sua reserva financeira para a transição</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={budget} onChange={(e) => setBudget(parseFloat(e.target.value) || 0)} className="input font-mono font-bold text-sm w-44" placeholder="0" />
              <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>R$</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>Custos Iniciais (10 dias)</h3>
              <InputPair label="Passagens Aéreas" brValue={formData.flights} eurValue={(formData.flights / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('flights', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <InputPair label="Hospedagem provisória" brValue={formData.stay} eurValue={(formData.stay / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('stay', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <InputPair label="Alimentação" brValue={formData.food} eurValue={(formData.food / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('food', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <InputPair label="Transporte inicial" brValue={formData.transport} eurValue={(formData.transport / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('transport', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <InputPair label="Passeios / Lazer" brValue={formData.tours} eurValue={(formData.tours / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('tours', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <InputPair label="Reserva de Emergência" brValue={formData.emergencyInitial} eurValue={(formData.emergencyInitial / exchangeRate).toFixed(0)} onChange={(type: string, val: string) => handleInputChange('emergencyInitial', type === 'br' ? val : (parseFloat(val) * exchangeRate).toString())} />
              <div className="p-3 rounded-xl mt-4 flex justify-between items-center text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <span className="font-bold">Total Inicial:</span>
                <span className="font-mono font-bold" style={{ color: 'var(--color-danger)' }}>{formatValue(initialPackageBRL)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>Custo de Vida Mensal (Fixo)</h3>
              <InputPairEur label="Aluguel de Moradia" eurValue={formData.rent} onChange={(type: string, val: string) => handleInputChange('rent', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Contas (Luz, Internet, Água)" eurValue={formData.bills} onChange={(type: string, val: string) => handleInputChange('bills', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Mercado / Compras" eurValue={formData.market} onChange={(type: string, val: string) => handleInputChange('market', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Transporte Mensal" eurValue={formData.transportMonthly} onChange={(type: string, val: string) => handleInputChange('transportMonthly', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Saúde (Seguro/Farmácia)" eurValue={formData.health} onChange={(type: string, val: string) => handleInputChange('health', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Crianças / Educação" eurValue={formData.kids} onChange={(type: string, val: string) => handleInputChange('kids', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Reserva de caixa mensal" eurValue={formData.monthlyReserve} onChange={(type: string, val: string) => handleInputChange('monthlyReserve', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <InputPairEur label="Renda Extra Esperada" eurValue={formData.extraIncome} onChange={(type: string, val: string) => handleInputChange('extraIncome', type === 'eur' ? val : (parseFloat(val) / exchangeRate).toString())} exchange={exchangeRate} />
              <div className="p-3 rounded-xl mt-4 flex justify-between items-center text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <span className="font-bold">Total Mensal Líquido:</span>
                <span className="font-mono font-bold" style={{ color: 'var(--color-warning)' }}>{formatValue(monthlyExpensesBRL - extraIncomeBRL)} / mês</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 pb-1.5 border-b" style={{ borderColor: 'var(--border)' }}>Projeção de Sobrevivência (12 Meses)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-2.5 font-bold uppercase text-[10px]">Mês</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Saldo Inicial</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Despesa</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Renda Extra</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-right">Saldo Final</th>
                    <th className="py-2.5 font-bold uppercase text-[10px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map(m => (
                    <tr key={m.month} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2.5 font-bold">Mês {m.month}</td>
                      <td className="py-2.5 text-right font-mono">{formatValue(m.initialBalance)}</td>
                      <td className="py-2.5 text-right font-mono" style={{ color: 'var(--color-danger)' }}>-{formatValue(m.monthlyExpense)}</td>
                      <td className="py-2.5 text-right font-mono" style={{ color: 'var(--color-done)' }}>+{formatValue(m.extraIncome)}</td>
                      <td className="py-2.5 text-right font-mono font-bold" style={{ color: m.healthy ? 'var(--color-done)' : 'var(--color-danger)' }}>{formatValue(m.endBalance)}</td>
                      <td className="py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: m.healthy ? 'var(--bg-done)' : 'var(--bg-danger)', color: m.healthy ? 'var(--color-done)' : 'var(--color-danger)' }}>
                          {m.healthy ? 'Saudável' : 'Crítico'}
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
