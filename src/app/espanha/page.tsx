'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Edit2, Check, Plane, Info, Loader2 } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

// Componentes reutilizáveis para inputs com os estilos do projeto (Tailwind + Globals)
const InputPair = ({ label, brValue, eurValue, onChange }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label}
    </label>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={brValue}
          onChange={(e) => onChange('br', e.target.value)}
          className="input font-mono w-full"
          placeholder="0"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>R$</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={eurValue}
          onChange={(e) => onChange('eur', e.target.value)}
          className="input font-mono w-full"
          placeholder="0"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>€</span>
      </div>
    </div>
  </div>
);

const InputPairEur = ({ label, eurValue, onChange, exchange }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label}
    </label>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={(eurValue * exchange).toFixed(0)}
          onChange={(e) => onChange('br', e.target.value)}
          className="input font-mono w-full"
          placeholder="0"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>R$</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          value={eurValue}
          onChange={(e) => onChange('eur', e.target.value)}
          className="input font-mono w-full"
          placeholder="0"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>€</span>
      </div>
    </div>
  </div>
);

export default function EspanhaApp() {
  const { user } = useAuth();
  const { activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();

  const [formData, setFormData] = useState({
    flights: 15000,
    stay: 1655,
    food: 1754,
    transport: 372,
    tours: 558,
    emergencyInitial: 1550,
    rent: 500,
    bills: 150,
    market: 700,
    transportMonthly: 200,
    health: 100,
    kids: 150,
    monthlyReserve: 700,
    extraIncome: 1000,
  });

  const [budget, setBudget] = useState(60000);
  const [scenarioName, setScenarioName] = useState('Cenário Principal');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [author, setAuthor] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Carregar cenários do Supabase
  useEffect(() => {
    async function loadScenarios() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('espanha_scenarios')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Mapear form_data do banco para o formato esperado pelo frontend se necessário
        const mappedScenarios = data.map(s => ({
          ...s,
          formData: s.form_data, // Ajuste para manter compatibilidade com o código existente
          createdAt: new Date(s.created_at).toLocaleDateString('pt-BR'),
        }));
        
        setScenarios(mappedScenarios);
      } catch (error) {
        console.error('Erro ao carregar cenários:', error);
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [user]);

  const formatValue = (valueInPrimary: number) => {
    if (activeCurrency === 'primary') {
      return `${primaryCurrency === 'BRL' ? 'R$' : primaryCurrency} ${Math.round(valueInPrimary).toLocaleString('pt-BR')}`;
    } else {
      const valueInSecondary = valueInPrimary / exchangeRate;
      return `${secondaryCurrency === 'EUR' ? '€' : secondaryCurrency} ${valueInSecondary.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  const formatCurrency = formatValue;

  const formatDirect = (value: number, currency: string) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : currency;
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const initialPackageBRL = formData.flights + formData.stay + formData.food + 
                           formData.transport + formData.tours + formData.emergencyInitial;
  
  const monthlyExpensesSecondary = formData.rent + formData.bills + formData.market + 
                                  formData.transportMonthly + formData.health + formData.kids + formData.monthlyReserve;
  
  const monthlyExpensesBRL = monthlyExpensesSecondary * exchangeRate;
  const extraIncomeBRL = formData.extraIncome * exchangeRate;
  const netMonthlyBRL = monthlyExpensesBRL - extraIncomeBRL;
  
  const remainingAfterInitialBRL = budget - initialPackageBRL;

  const calculateMonths = () => {
    const months = [];
    let balance = remainingAfterInitialBRL;
    
    for (let i = 1; i <= 12; i++) {
      const monthlyExpense = monthlyExpensesBRL;
      const hasExtraIncome = i >= 2;
      const extraIncome = hasExtraIncome ? extraIncomeBRL : 0;
      const netExpense = monthlyExpense - extraIncome;
      const initialBalance = balance;
      const endBalance = balance - netExpense;
      
      months.push({
        month: i,
        initialBalance,
        monthlyExpense,
        extraIncome,
        netExpense,
        endBalance,
        healthy: endBalance >= 0
      });
      
      balance = endBalance;
    }
    return months;
  };

  const months = calculateMonths();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleBudgetChange = (value: string) => {
    setBudget(parseFloat(value) || 0);
  };

  const getDateString = () => new Date().toLocaleDateString('pt-BR');

  const generatePDF = (scenario: any) => {
    const scExch = scenario.formData.exchange || exchangeRate;
    const scInitialPkg = scenario.formData.flights + scenario.formData.stay + scenario.formData.food + 
                        scenario.formData.transport + scenario.formData.tours + scenario.formData.emergencyInitial;
    const scMonthlyExpSec = scenario.formData.rent + scenario.formData.bills + scenario.formData.market + 
                           scenario.formData.transportMonthly + scenario.formData.health + scenario.formData.kids + scenario.formData.monthlyReserve;
    const scMonthlyExpBRL = scMonthlyExpSec * scExch;
    const scExtraIncBRL = scenario.formData.extraIncome * scExch;
    const scNetMonthlyBRL = scMonthlyExpBRL - scExtraIncBRL;
    const scRemaining = scenario.budget - scInitialPkg;

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${scenario.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0; color: #555; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { font-size: 16px; color: #111; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ccc; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .kpi { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
          .kpi-value { font-size: 20px; font-weight: bold; color: #059669; }
          .kpi-label { color: #555; font-size: 12px; }
          .highlight { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #059669; margin: 15px 0; }
          td { font-size: 13px; }
          th { font-size: 12px; }
          .text-right { text-align: right; font-family: monospace; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 ${scenario.name}</h1>
          <p>Criado por: <strong>${scenario.author}</strong> em ${scenario.createdAt}</p>
          <p>Orçamento Total: <strong>${formatCurrency(scenario.budget)}</strong></p>
        </div>

        <div class="section">
          <h2>📈 RESUMO FINANCEIRO</h2>
          <div class="grid">
            <div class="kpi">
              <div class="kpi-label">Pacote Inicial</div>
              <div class="kpi-value">${formatCurrency(scInitialPkg)}</div>
              <div class="kpi-label">€ ${(scInitialPkg / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Custo Mensal</div>
              <div class="kpi-value">€ ${scMonthlyExpSec.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div class="kpi-label">${formatCurrency(scMonthlyExpBRL)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Remanescente</div>
              <div class="kpi-value" style="color: ${scRemaining >= 0 ? '#059669' : '#dc2626'}">${formatCurrency(scRemaining)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Gasto Líquido Mensal (mês 2+)</div>
              <div class="kpi-value">${formatCurrency(scNetMonthlyBRL)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>💰 PACOTE INICIAL (10 DIAS)</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">BRL</th>
                <th class="text-right">EUR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Passagens Aéreas</td>
                <td class="text-right">${formatCurrency(scenario.formData.flights)}</td>
                <td class="text-right">€ ${(scenario.formData.flights / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td>Hospedagem 10 dias</td>
                <td class="text-right">${formatCurrency(scenario.formData.stay)}</td>
                <td class="text-right">€ ${(scenario.formData.stay / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td>Alimentação 10 dias</td>
                <td class="text-right">${formatCurrency(scenario.formData.food)}</td>
                <td class="text-right">€ ${(scenario.formData.food / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td>Transporte 10 dias</td>
                <td class="text-right">${formatCurrency(scenario.formData.transport)}</td>
                <td class="text-right">€ ${(scenario.formData.transport / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td>Passeios Básicos</td>
                <td class="text-right">${formatCurrency(scenario.formData.tours)}</td>
                <td class="text-right">€ ${(scenario.formData.tours / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td>Reserva Emergencial Inicial</td>
                <td class="text-right">${formatCurrency(scenario.formData.emergencyInitial)}</td>
                <td class="text-right">€ ${(scenario.formData.emergencyInitial / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr style="font-weight: bold; background: #f5f5f5;">
                <td>TOTAL INICIAL</td>
                <td class="text-right">${formatCurrency(scInitialPkg)}</td>
                <td class="text-right">€ ${(scInitialPkg / scExch).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏠 CUSTO MENSAL (EUR)</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">EUR</th>
                <th class="text-right">BRL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aluguel</td>
                <td class="text-right">€ ${scenario.formData.rent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.rent * scExch)}</td>
              </tr>
              <tr>
                <td>Contas e Internet</td>
                <td class="text-right">€ ${scenario.formData.bills.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.bills * scExch)}</td>
              </tr>
              <tr>
                <td>Mercado/Alimentação</td>
                <td class="text-right">€ ${scenario.formData.market.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.market * scExch)}</td>
              </tr>
              <tr>
                <td>Transporte</td>
                <td class="text-right">€ ${scenario.formData.transportMonthly.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.transportMonthly * scExch)}</td>
              </tr>
              <tr>
                <td>Saúde/Farmácia</td>
                <td class="text-right">€ ${scenario.formData.health.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.health * scExch)}</td>
              </tr>
              <tr>
                <td>Criança/Itens</td>
                <td class="text-right">€ ${scenario.formData.kids.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.kids * scExch)}</td>
              </tr>
              <tr>
                <td>Reserva Emergência</td>
                <td class="text-right">€ ${scenario.formData.monthlyReserve.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scenario.formData.monthlyReserve * scExch)}</td>
              </tr>
              <tr style="font-weight: bold; background: #f5f5f5;">
                <td>TOTAL MENSAL</td>
                <td class="text-right">€ ${scMonthlyExpSec.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                <td class="text-right">${formatCurrency(scMonthlyExpBRL)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>📅 SALDO MÊS A MÊS</h2>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th class="text-right">Saldo Inicial</th>
                <th class="text-right">Despesa</th>
                <th class="text-right">Renda Extra</th>
                <th class="text-right">Gasto Líquido</th>
                <th class="text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              ${months.slice(0, 6).map(m => `
                <tr style="background: ${m.healthy ? '#fff' : '#fef2f2'}">
                  <td>Mês ${m.month}</td>
                  <td class="text-right">${formatCurrency(m.initialBalance)}</td>
                  <td class="text-right">${formatCurrency(m.monthlyExpense)}</td>
                  <td class="text-right" style="color: #059669">+ ${formatCurrency(m.extraIncome)}</td>
                  <td class="text-right">${formatCurrency(m.netExpense)}</td>
                  <td class="text-right" style="font-weight: bold; color: ${m.healthy ? '#059669' : '#dc2626'}">${formatCurrency(m.endBalance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>⚙️ CONFIGURAÇÕES</h2>
          <div class="highlight">
            <p><strong>Taxa de Câmbio:</strong> R$ ${scExch.toFixed(2)} = 1 Euro</p>
            <p><strong>Renda Extra:</strong> € ${scenario.formData.extraIncome.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} por mês (a partir do mês 2)</p>
            <p><strong>Equivalente:</strong> ${formatCurrency(scExtraIncBRL)} por mês</p>
          </div>
        </div>

        <div class="section" style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ccc; color: #777; font-size: 12px;">
          <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Projeto Espanha • Planejador Familiar</p>
        </div>
      </body>
      </html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      setTimeout(() => newWindow.print(), 250);
    }
  };

  const saveScenario = async () => {
    if (!newScenarioName.trim() || !author.trim()) {
      alert('Preencha nome do cenário e seu nome!');
      return;
    }
    
    if (!user) {
      alert('Você precisa estar logado para salvar cenários.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('espanha_scenarios')
        .insert({
          user_id: user.id,
          name: newScenarioName,
          author: author,
          budget,
          form_data: { ...formData },
        })
        .select()
        .single();

      if (error) throw error;

      const newScenario = {
        ...data,
        formData: data.form_data,
        createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
      };
      
      setScenarios(prev => [newScenario, ...prev]);
      generatePDF(newScenario);
      setNewScenarioName('');
      setAuthor('');
      setShowAddScenario(false);
    } catch (error) {
      console.error('Erro ao salvar cenário:', error);
      alert('Erro ao salvar cenário. Tente novamente.');
    }
  };

  const updateScenario = async (id: string) => {
    if (!editingData.name.trim() || !editingData.author.trim()) {
      alert('Preencha nome do cenário e seu nome!');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('espanha_scenarios')
        .update({
          name: editingData.name,
          author: editingData.author,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setScenarios(prev => prev.map(s => 
        s.id === id 
          ? {
              ...s,
              name: data.name,
              author: data.author,
            }
          : s
      ));
      setEditingScenarioId(null);
      setEditingData(null);
    } catch (error) {
      console.error('Erro ao atualizar cenário:', error);
      alert('Erro ao atualizar cenário.');
    }
  };

  const loadScenario = (scenario: any) => {
    setBudget(Number(scenario.budget));
    setFormData({ ...scenario.formData });
    setScenarioName(scenario.name);
  };

  const deleteScenario = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cenário?')) {
      try {
        const { error } = await supabase
          .from('espanha_scenarios')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setScenarios(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error('Erro ao deletar cenário:', error);
        alert('Erro ao deletar cenário.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-50 glass border-b p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Plane className="w-6 h-6 text-rose-500" />
            Projeto Espanha
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {scenarioName}
          </p>
        </div>
        
        {/* ABAS */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto">
          {['overview', 'editar', 'meses', 'cenarios'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={activeTab !== tab ? { color: 'var(--text-muted)' } : {}}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 fade-up">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-6 flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Orçamento Total</span>
                <span className="text-3xl font-black tracking-tight">{formatValue(budget)}</span>
              </div>
              <div className="card p-6 flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Pacote Inicial</span>
                <span className="text-3xl font-black tracking-tight">{formatValue(initialPackageBRL)}</span>
                <span className="text-sm font-medium mt-1" style={{ color: 'var(--text-faint)' }}>
                  {activeCurrency === 'primary' 
                    ? formatDirect(initialPackageBRL / exchangeRate, secondaryCurrency)
                    : formatDirect(initialPackageBRL, primaryCurrency)
                  }
                </span>
              </div>
              <div className="card p-6 flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Custo Mensal</span>
                <span className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                  {activeCurrency === 'primary'
                    ? formatDirect(monthlyExpensesBRL, primaryCurrency)
                    : formatDirect(monthlyExpensesSecondary, secondaryCurrency)
                  }
                </span>
                <span className="text-sm font-medium mt-1" style={{ color: 'var(--text-faint)' }}>
                  {activeCurrency === 'primary'
                    ? formatDirect(monthlyExpensesSecondary, secondaryCurrency)
                    : formatDirect(monthlyExpensesBRL, primaryCurrency)
                  }
                </span>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4">Análise Rápida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Após pacote inicial sobram</p>
                  <p className={`text-2xl font-black tracking-tight ${remainingAfterInitialBRL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {remainingAfterInitialBRL >= 0 ? '✅' : '❌'} {formatValue(remainingAfterInitialBRL)}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Gasto líquido mensal (a partir do mês 2)</p>
                  <p className="text-2xl font-black tracking-tight">{formatValue(netMonthlyBRL)}</p>
                </div>
              </div>
            </div>

            {/* Dicas de Turismo integradas na Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Eventos e Festas Famosas
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><strong style={{ color: 'var(--text)' }}>Semana Santa:</strong> Procissões impressionantes em todo o país (especialmente Sevilha e Málaga).</li>
                  <li><strong style={{ color: 'var(--text)' }}>Feria de Abril:</strong> A maior festa de Sevilha, com danças, cavalos e trajes típicos.</li>
                  <li><strong style={{ color: 'var(--text)' }}>Las Fallas (Valencia):</strong> Esculturas gigantes que são queimadas em um espetáculo de fogos.</li>
                  <li><strong style={{ color: 'var(--text)' }}>San Fermín (Pamplona):</strong> O famoso "encierro" (corrida de touros) em julho.</li>
                  <li><strong style={{ color: 'var(--text)' }}>La Tomatina (Buñol):</strong> A gigantesca batalha de tomates em agosto.</li>
                </ul>
              </div>
              <div className="card p-6" style={{ background: 'rgba(244, 63, 94, 0.05)' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-rose-500" />
                  Dicas para Viajar pela Espanha
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><strong style={{ color: 'var(--text)' }}>Transporte:</strong> Use o trem de alta velocidade (AVE) para conectar grandes cidades rapidamente.</li>
                  <li><strong style={{ color: 'var(--text)' }}>Horários:</strong> O almoço costuma ser entre 14h e 16h, e o jantar após as 21h.</li>
                  <li><strong style={{ color: 'var(--text)' }}>Siesta:</strong> Muitas lojas menores fecham entre 14h e 17h. Planeje suas compras.</li>
                  <li><strong style={{ color: 'var(--text)' }}>Reservas:</strong> Atrações como a Alhambra ou Sagrada Família exigem reserva com meses de antecedência.</li>
                  <li><strong style={{ color: 'var(--text)' }}>Tapashipping:</strong> Explore os mercados municipais (como o de San Miguel) para provar a gastronomia local.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* EDITAR NÚMEROS */}
        {activeTab === 'editar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Coluna 1 */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">💰 Orçamento Total</h3>
                <div className="flex gap-3 items-center">
                  <span className="font-bold" style={{ color: 'var(--text-muted)' }}>R$</span>
                  <input
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={budget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    className="input font-mono text-lg"
                  />
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">✈️ Pacote Inicial</h3>
                <InputPair
                  label="Passagens Aéreas"
                  brValue={formData.flights}
                  eurValue={(formData.flights / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('flights', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
                <InputPair
                  label="Hospedagem"
                  brValue={formData.stay}
                  eurValue={(formData.stay / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('stay', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
                <InputPair
                  label="Alimentação"
                  brValue={formData.food}
                  eurValue={(formData.food / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('food', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
                <InputPair
                  label="Transporte"
                  brValue={formData.transport}
                  eurValue={(formData.transport / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('transport', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
                <InputPair
                  label="Passeios"
                  brValue={formData.tours}
                  eurValue={(formData.tours / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('tours', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
                <InputPair
                  label="Emergência Inicial"
                  brValue={formData.emergencyInitial}
                  eurValue={(formData.emergencyInitial / exchangeRate).toFixed(0)}
                  onChange={(type: string, val: string) => handleInputChange('emergencyInitial', type === 'br' ? val : String(parseFloat(val) * exchangeRate))}
                />
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-6">
              
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🏠 Custo Mensal</h3>
                <InputPairEur exchange={exchangeRate}
                  label="Aluguel"
                  eurValue={formData.rent}
                  onChange={(type: string, val: string) => handleInputChange('rent', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Contas (Luz, Internet, Água)"
                  eurValue={formData.bills}
                  onChange={(type: string, val: string) => handleInputChange('bills', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Mercado / Alimentação"
                  eurValue={formData.market}
                  onChange={(type: string, val: string) => handleInputChange('market', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Transporte"
                  eurValue={formData.transportMonthly}
                  onChange={(type: string, val: string) => handleInputChange('transportMonthly', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Saúde / Farmácia"
                  eurValue={formData.health}
                  onChange={(type: string, val: string) => handleInputChange('health', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Criança / Extras"
                  eurValue={formData.kids}
                  onChange={(type: string, val: string) => handleInputChange('kids', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
                <InputPairEur exchange={exchangeRate}
                  label="Reserva de Emergência"
                  eurValue={formData.monthlyReserve}
                  onChange={(type: string, val: string) => handleInputChange('monthlyReserve', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📈 Renda Extra</h3>
                <InputPairEur exchange={exchangeRate}
                  label="Renda esperada por mês (a partir do mês 2)"
                  eurValue={formData.extraIncome}
                  onChange={(type: string, val: string) => handleInputChange('extraIncome', type === 'eur' ? val : String(parseFloat(val) / exchangeRate))}
                />
              </div>

            </div>
          </div>
        )}

        {/* MESES / FLUXO DE CAIXA */}
        {activeTab === 'meses' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr>
                  <th className="p-4 font-bold border-b" style={{ borderColor: 'var(--border)' }}>Mês</th>
                  <th className="p-4 font-bold border-b text-right" style={{ borderColor: 'var(--border)' }}>Saldo Inicial</th>
                  <th className="p-4 font-bold border-b text-right" style={{ borderColor: 'var(--border)' }}>Despesa</th>
                  <th className="p-4 font-bold border-b text-right" style={{ borderColor: 'var(--border)' }}>Renda Extra</th>
                  <th className="p-4 font-bold border-b text-right" style={{ borderColor: 'var(--border)' }}>Gasto Líquido</th>
                  <th className="p-4 font-bold border-b text-right" style={{ borderColor: 'var(--border)' }}>Saldo Final</th>
                  <th className="p-4 font-bold border-b text-center" style={{ borderColor: 'var(--border)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {months.slice(0, 12).map((m, idx) => (
                  <tr 
                    key={m.month}
                    className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={!m.healthy ? { background: 'rgba(239, 68, 68, 0.1)' } : {}}
                  >
                    <td className="p-4 font-bold">M{m.month}</td>
                    <td className="p-4 text-right font-mono text-xs md:text-sm">{formatCurrency(m.initialBalance)}</td>
                    <td className="p-4 text-right font-mono text-xs md:text-sm">{formatCurrency(m.monthlyExpense)}</td>
                    <td className="p-4 text-right font-mono text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(m.extraIncome)}</td>
                    <td className="p-4 text-right font-mono text-xs md:text-sm">{formatCurrency(m.netExpense)}</td>
                    <td className={`p-4 text-right font-mono text-xs md:text-sm font-bold ${m.endBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(m.endBalance)}
                    </td>
                    <td className="p-4 text-center">
                      {m.healthy ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CENÁRIOS */}
        {activeTab === 'cenarios' && (
          <div className="space-y-4 max-w-4xl">
            {showAddScenario && (
              <div className="card p-6 fade-up">
                <h3 className="text-lg font-bold mb-4">Salvar Novo Cenário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nome do Cenário</label>
                    <input
                      type="text"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      className="input"
                      placeholder="Ex: Família Econômico..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Autor/Responsável</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="input"
                      placeholder="Seu nome..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveScenario}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
                  >
                    <Check className="w-5 h-5" /> Salvar + Gerar PDF
                  </button>
                  <button
                    onClick={() => setShowAddScenario(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {!showAddScenario && (
              <button
                onClick={() => setShowAddScenario(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5" /> Novo Cenário
              </button>
            )}

            {scenarios.length === 0 ? (
              <div className="card p-12 text-center mt-4">
                <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Nenhum cenário salvo ainda.</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-faint)' }}>Crie um cenário para testar diferentes orçamentos sem perder o original.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mt-4">
                {scenarios.map(scenario => (
                  <div key={scenario.id} className="card p-5 fade-up">
                    {editingScenarioId === scenario.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editingData.name}
                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                            className="input"
                          />
                          <input
                            type="text"
                            value={editingData.author}
                            onChange={(e) => setEditingData({ ...editingData, author: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateScenario(scenario.id)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingScenarioId(null)}
                            className="px-4 py-2 rounded-lg text-sm font-bold border"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold">{scenario.name}</h4>
                          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                            👤 {scenario.author} • 📅 {scenario.createdAt}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => loadScenario(scenario)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            <Download className="w-4 h-4" /> Carregar
                          </button>
                          <button
                            onClick={() => { setEditingScenarioId(scenario.id); setEditingData({ name: scenario.name, author: scenario.author }); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                          >
                            <Edit2 className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => generatePDF(scenario)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                          >
                            <Download className="w-4 h-4" /> PDF
                          </button>
                          <button
                            onClick={() => deleteScenario(scenario.id)}
                            className="flex items-center justify-center p-2 rounded-lg transition-colors bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
