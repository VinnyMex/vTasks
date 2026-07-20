import React, { useState, useRef, useEffect } from 'react';
import { AppState } from './types';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Key, AlertCircle, Trash2, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ElenaAssistantProps {
  state: AppState;
}

const STORAGE_KEY_MESSAGES = 'vtask_chat_history_v2';
const STORAGE_KEY_API_KEY = 'vtask_openrouter_api_key_v2';
const STORAGE_KEY_MODEL = 'vtask_openrouter_model_v2';

function buildSystemContext(state: AppState, dbExpenses: any[]): string {
  const members = (state.familyMembers || []).map(m =>
    `- ${m.name || 'Membro sem nome'} (${m.role || '?'}), nascimento: ${m.birthDate || 'N/A'}, passaporte válido até: ${m.passportExpiry || 'N/A'}`
  ).join('\n');

  const allDocs = Object.values(state.checklists || {}).flat();
  const docDone = allDocs.filter(d => d.completed).length;
  const docPct = allDocs.length > 0 ? Math.round((docDone / allDocs.length) * 100) : 0;

  const upcomingEvents = (state.events || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map(e => `- ${e.date}: ${e.title}`)
    .join('\n');

  const tours = (state.tours || []).slice(0, 5).map(t => `- ${t.title} (${t.day})`).join('\n');

  const destination = state.destinationCountry || 'não definido';
  const year = state.travelYear || 'não definido';

  // 1. Gastos de Imigração (Planejador de Custos)
  const immigrationExpenses = (state.financialExpenses || []).map(e =>
    `- ${e.description} (${e.categoryLabel}): Estimado: R$ ${e.estimated.toFixed(2)} | Real: R$ ${e.real.toFixed(2)} | Pago: ${e.paid ? 'Sim' : 'Não'}`
  ).join('\n');

  // 2. Custos dos itens concluídos dos checklists
  const checklistCosts = Object.entries(state.checklists || {})
    .flatMap(([catId, items]) => items.filter(item => item.completed && (item.cost || 0) > 0))
    .map(item => `- [Checklist] ${item.text}: R$ ${(item.cost || 0).toFixed(2)}`)
    .join('\n');

  // 3. Gastos do Controle de Gastos Geral (Supabase)
  const generalExpenses = (dbExpenses || []).map(e => {
    const amount = e.currency === 'BRL' ? e.amount_brl : e.currency === 'EUR' ? e.amount_eur : e.amount_usd;
    const qty = e.quantity || 1;
    const total = (amount || 0) * qty;
    return `- ${e.date} | ${e.title} (${e.category || 'Outro'}): ${e.currency} ${total.toFixed(2)} (Recebedor: ${e.recipient || 'N/A'})`;
  }).join('\n');

  return `Você é o vTask Agent, um assistente especializado em imigração e organização de viagens internacionais. Você é empático, encorajador, direta e especialista. Use um tom amigável mas profissional, em português do Brasil.

## Contexto atual do usuário no app "My Travel Docs":
- **Destino:** ${destination}
- **Data planejada:** ${year}

### Família:
${members || 'Nenhum membro cadastrado ainda.'}

### Progresso de Documentos:
${docPct}% concluído (${docDone}/${allDocs.length} tarefas)

### Próximos Eventos no Calendário:
${upcomingEvents || 'Nenhum evento próximo.'}

### Passeios Planejados:
${tours || 'Nenhum passeio cadastrado.'}

### Relatórios e Dados Financeiros (Gastos) do Usuário Logado:
Estas são as despesas reais e estimadas cadastradas pelo usuário. Use estas informações para responder com precisão matemática sobre gastos acumulados, despesas pagas/pendentes, conversões e categorias.

1. Controle de Gastos Geral (Lançamentos Diários/Contabilidade):
${generalExpenses || 'Nenhum lançamento no controle de gastos geral.'}

2. Custos de Emissão/Cartórios em Checklists (Tarefas Concluídas):
${checklistCosts || 'Nenhum custo registrado em tarefas concluídas.'}

3. Planejamento Financeiro de Imigração (Estimativas da Viagem):
${immigrationExpenses || 'Nenhuma estimativa financeira de imigração registrada.'}

---
Você tem acesso completo ao contexto acima. Responda de forma personalizada com base nessas informações. Ajude com: documentação de imigração, passaportes, vistos, prazos, planejamento financeiro da viagem, dicas do destino, e quaisquer dúvidas relacionadas. Se o usuário perguntar algo não relacionado a viagens ou imigração, gentilmente redirecione-o.

Importante: seja CONCISA nas respostas (máximo 3-4 parágrafos curtos). Use emojis moderadamente. Formate usando markdown.`;
}

export default function ElenaAssistant({ state }: ElenaAssistantProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}
    return [{
      id: 'welcome',
      role: 'assistant',
      content: `Olá! 👋 Sou o **vTask Agent**, seu assistente pessoal de imigração e viagens!\n\nEstou conectado ao seu planner e posso te ajudar com:\n- 📋 Status dos seus documentos\n- 🛂 Dicas de passaporte, vistos e regularização\n- 📅 Prazos e planejamento da viagem\n- 💡 Qualquer dúvida sobre imigração\n\nComo posso te ajudar hoje?`,
      timestamp: new Date()
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_API_KEY) || ''; } catch { return ''; }
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_MODEL) || 'google/gemini-2.5-flash:free'; } catch { return 'google/gemini-2.5-flash:free'; }
  });

  const [dbExpenses, setDbExpenses] = useState<any[]>([]);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState('');
  const [error, setError] = useState('');
  const [hoveredQuickPrompt, setHoveredQuickPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const toSave = messages.slice(-50); // keep last 50 messages
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Load database expenses in real time when chat is opened and user is authenticated
  useEffect(() => {
    if (!user || !open) return;
    const loadExpenses = async () => {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (data) {
        setDbExpenses(data);
      }
    };
    loadExpenses();
  }, [user, open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const systemCtx = buildSystemContext(state, dbExpenses);

      // Build history for multi-turn (OpenAI / OpenRouter style)
      const history = messages
        .filter(m => m.id !== 'welcome' && m.id !== 'welcome_new')
        .map(m => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content
        }));

      const payload = {
        model: selectedModel || 'google/gemini-2.5-flash:free',
        messages: [
          { role: 'system', content: systemCtx },
          ...history,
          { role: 'user', content: userMsg.content }
        ]
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vtasks-pro.local',
          'X-Title': 'vTask Agent'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'Não consegui gerar uma resposta. Tente novamente.';

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('Unauthorized') || errMsg.includes('key')) {
        setError('Chave de API inválida ou expirada. Verifique e tente novamente.');
        setShowKeyInput(true);
      } else {
        setError(`Erro ao conectar à IA: ${errMsg}`);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveConfig = () => {
    const cleanKey = tempKey.trim() || apiKey;
    const cleanModel = tempModel.trim() || selectedModel;

    setApiKey(cleanKey);
    setSelectedModel(cleanModel);

    try {
      localStorage.setItem(STORAGE_KEY_API_KEY, cleanKey);
      localStorage.setItem(STORAGE_KEY_MODEL, cleanModel);
    } catch {}

    setShowKeyInput(false);
    setTempKey('');
    setTempModel('');
    setError('');
  };

  const handleClearChat = () => {
    setMessages([{
      id: 'welcome_new',
      role: 'assistant',
      content: `Chat limpo! ✨ Como posso te ajudar?`,
      timestamp: new Date()
    }]);
  };

  // Escape HTML entities before injection (prevents XSS from AI-generated content)
  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  // Apply safe markdown transforms on already-escaped text
  const applyMarkdown = (escaped: string): string =>
    escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--surface-3);padding:0 0.25rem;border-radius:0.25rem;font-size:10px;font-family:monospace;">$1</code>');

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('###')) {
        return <h4 key={i} className="text-xs font-bold mt-2 mb-1" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: applyMarkdown(escapeHtml(line.replace(/^###\s*/, ''))) }} />;
      } else if (line.startsWith('##')) {
        return <h3 key={i} className="text-xs font-bold mt-2 mb-1" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: applyMarkdown(escapeHtml(line.replace(/^##\s*/, ''))) }} />;
      } else if (line.startsWith('- ')) {
        return <li key={i} className="text-xs ml-3" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: applyMarkdown(escapeHtml(line.replace(/^- /, ''))) }} />;
      } else if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: applyMarkdown(escapeHtml(line)) }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          type="button"
          id="elena-chat-button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer group animate-scaleUp"
          style={{ background: 'var(--gradient-primary)', minHeight: '52px', boxShadow: 'var(--shadow-accent)' }}
          title="Falar com vTask Agent"
        >
          <Sparkles className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
          <span className="text-sm font-bold">vTask Agent</span>
          <MessageCircle className="w-4 h-4" />
          {messages.length > 1 && (
            <span
              className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
              style={{ background: 'var(--color-danger)' }}
            >
              {messages.length - 1}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          id="elena-chat-panel"
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl transition-all duration-300 ${
            minimized ? 'w-72 h-14' : 'w-80 sm:w-96 h-[560px]'
          }`}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-2xl"
            style={{ background: 'var(--gradient-primary)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">vTask Agent</p>
                <p className="text-[9px] text-blue-200">Assistente de Imigração IA</p>
              </div>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-done)' }} />
                <span className="text-[9px] text-blue-100">Online</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTempKey(apiKey);
                  setTempModel(selectedModel);
                  setShowKeyInput(!showKeyInput);
                }}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title="Configurar API Key e Modelo"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title="Limpar conversa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title={minimized ? 'Expandir' : 'Minimizar'}
              >
                {minimized ? <MessageCircle className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setMinimized(false); }}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* API Key Setup */}
              {(showKeyInput || !apiKey) && (
                <div
                  className="px-4 py-3 flex-shrink-0 space-y-2.5 overflow-y-auto max-h-[300px]"
                  style={{ background: 'var(--accent-subtle)', borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <Key className="w-3.5 h-3.5" /> Configuração do vTask Agent
                  </p>
                  
                  {/* Tutorial de ajuda de fácil leitura */}
                  <div className="text-[10px] space-y-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>1. Obter a chave:</strong> Crie uma conta em <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400">openrouter.ai</a> e em <strong>Keys</strong> gere uma nova chave de API.
                    </p>
                    <p>
                      <strong>2. Modelos Gratuitos:</strong> Para usar sem custos, insira o modelo grátis padrão abaixo ou pesquise mais em <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400">openrouter.ai/models</a> (procure por modelos com o sufixo <strong>:free</strong>).
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>OpenRouter API Key</label>
                      <input
                        type="password"
                        placeholder="sk-or-v1-..."
                        value={tempKey}
                        onChange={e => setTempKey(e.target.value)}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Modelo Desejado</label>
                      <input
                        type="text"
                        placeholder="Ex: google/gemini-2.5-flash:free"
                        value={tempModel}
                        onChange={e => setTempModel(e.target.value)}
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 font-mono"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'var(--accent)' }}
                    >
                      Salvar Configuração
                    </button>
                  </div>
                  {apiKey && (
                    <p className="text-[9px] flex items-center gap-1 font-semibold" style={{ color: 'var(--color-done)' }}>
                      ✅ Configurado · Modelo: {selectedModel}
                    </p>
                  )}
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div
                  className="px-4 py-2 flex items-center gap-2 flex-shrink-0 animate-fadeIn"
                  style={{ background: 'var(--bg-danger)', borderBottom: '1px solid var(--border)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
                  <p className="text-[10px] flex-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
                  <button type="button" onClick={() => setError('')} className="ml-auto cursor-pointer" style={{ color: 'var(--color-danger)' }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{
                        background: msg.role === 'assistant'
                          ? 'var(--gradient-primary)'
                          : 'var(--surface-3)'
                      }}
                    >
                      {msg.role === 'assistant'
                        ? <Bot className="w-3 h-3 text-white" />
                        : <User className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'text-white rounded-tr-sm'
                          : 'rounded-tl-sm'
                      }`}
                      style={msg.role === 'user'
                        ? { background: 'var(--gradient-primary)' }
                        : { background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }
                      }
                    >
                      {msg.role === 'user'
                        ? <p className="text-xs text-white leading-relaxed">{msg.content}</p>
                        : <div className="space-y-0.5">{renderContent(msg.content)}</div>
                      }
                      <p
                        className="text-[9px] mt-1"
                        style={{
                          color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-faint)',
                          textAlign: msg.role === 'user' ? 'right' : undefined,
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2 animate-fadeIn">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--accent)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vTask Agent está thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts */}
              <div
                className="px-4 pb-2 flex gap-1.5 flex-wrap flex-shrink-0 pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                {[
                  '📋 Status dos docs',
                  '🛂 Dicas de visto',
                  '📅 Próximos prazos',
                  '✈️ Checklist viagem'
                ].map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                    onMouseEnter={() => setHoveredQuickPrompt(prompt)}
                    onMouseLeave={() => setHoveredQuickPrompt(null)}
                    className="text-[9px] px-2 py-1 rounded-lg cursor-pointer transition-colors font-medium"
                    style={{
                      background: hoveredQuickPrompt === prompt ? 'var(--accent-muted)' : 'var(--surface-3)',
                      color: hoveredQuickPrompt === prompt ? 'var(--accent)' : 'var(--text-muted)',
                      border: `1px solid ${hoveredQuickPrompt === prompt ? 'var(--accent-border)' : 'var(--border)'}`,
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input area */}
              <div className="px-4 pb-4 flex-shrink-0">
                <div
                  className="flex gap-2 items-end rounded-xl px-3 py-2 transition-all"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao vTask Agent..."
                    className="flex-1 bg-transparent text-xs resize-none focus:outline-none leading-relaxed"
                    style={{ color: 'var(--text)' }}
                    rows={1}
                    maxLength={undefined}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-7 h-7 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center cursor-pointer transition-all"
                    style={{ background: 'var(--gradient-primary)' }}
                    title="Enviar mensagem"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] mt-1 text-center" style={{ color: 'var(--text-faint)' }}>Enter para enviar · Shift+Enter para nova linha</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
