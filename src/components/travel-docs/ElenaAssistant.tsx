import React, { useState, useRef, useEffect } from 'react';
import { AppState } from './types';
import { useAuth } from '@/components/AuthProvider';
import { useImigracao } from '@/lib/imigracao-context';
import { supabase } from '@/lib/supabase';
import {
  MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Key, AlertCircle,
  Trash2, Minimize2, Maximize2, Copy, Check, Save, History, Plus, ChevronDown, Edit2
} from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  autoSave: boolean;
}

interface ElenaAssistantProps {
  state: AppState;
}

const STORAGE_KEY_SESSIONS = 'vtask_chat_sessions_v3';
const STORAGE_KEY_ACTIVE_ID = 'vtask_chat_active_session_id_v3';
const STORAGE_KEY_AUTOSAVE = 'vtask_chat_autosave_preference_v3';
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

  const immigrationExpenses = (state.financialExpenses || []).map(e =>
    `- ${e.description} (${e.categoryLabel}): Estimado: R$ ${e.estimated.toFixed(2)} | Real: R$ ${e.real.toFixed(2)} | Pago: ${e.paid ? 'Sim' : 'Não'}`
  ).join('\n');

  const checklistCosts = Object.entries(state.checklists || {})
    .flatMap(([catId, items]) => items.filter(item => item.completed && (item.cost || 0) > 0))
    .map(item => `- [Checklist] ${item.text}: R$ ${(item.cost || 0).toFixed(2)}`)
    .join('\n');

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
${generalExpenses || 'Nenhum lançamento no controle de gastos geral.'}

2. Custos de Emissão/Cartórios em Checklists (Tarefas Concluídas):
${checklistCosts || 'Nenhum custo registrado em tarefas concluídas.'}

3. Planejamento Financeiro de Imigração (Estimativas da Viagem):
${immigrationExpenses || 'Nenhuma estimativa financeira de imigração registrada.'}

---
Você tem acesso completo ao contexto acima. Responda de forma personalizada com base nessas informações. Ajude com: documentação de imigração, passaportes, vistos, prazos, planejamento financeiro da viagem, dicas do destino, e quaisquer dúvidas relacionadas.

Importante: seja CONCISA nas respostas (máximo 3-4 parágrafos curtos). Use emojis moderadamente. Formate usando markdown.`;
}

function createWelcomeMessage(): Message {
  return {
    id: `welcome_${Date.now()}`,
    role: 'assistant',
    content: `Olá! 👋 Sou o **vTask Agent**, seu assistente pessoal de imigração e viagens!\n\nEstou conectado ao seu planner e banco de dados Supabase para te ajudar com:\n- 📋 Status dos seus documentos e checklists\n- 🛂 Dicas de passaporte, vistos e regularização\n- 📅 Prazos e planejamento da viagem\n\nComo posso te ajudar hoje?`,
    timestamp: new Date()
  };
}

export default function ElenaAssistant({ state }: ElenaAssistantProps) {
  const { user } = useAuth();
  const { updateOpenRouterConfig, updateExtendedState, extendedState } = useImigracao();

  // Ref sempre atualizado com o extendedState mais recente do contexto,
  // usado no useEffect de auto-save para evitar closure stale.
  const latestExtendedStateRef = useRef(extendedState);
  latestExtendedStateRef.current = extendedState;

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isExpandedMax, setIsExpandedMax] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showUnsavedWarningModal, setShowUnsavedWarningModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Editing Title State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');

  // Auto-save setting (defaults to true)
  const [autoSaveChat, setAutoSaveChat] = useState<boolean>(() => {
    try {
      const savedPref = localStorage.getItem(STORAGE_KEY_AUTOSAVE);
      return savedPref !== 'false';
    } catch {
      return true;
    }
  });

  // Sessions management
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    // 1. Try Supabase cloud state first
    if (state?.chatSessions && Array.isArray(state.chatSessions) && state.chatSessions.length > 0) {
      return state.chatSessions.map((s: any) => ({
        ...s,
        messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      }));
    }

    // 2. Try localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      }
    } catch {}

    // 3. Fallback to default fresh session
    const initialId = `session_${Date.now()}`;
    return [{
      id: initialId,
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [createWelcomeMessage()],
      autoSave: true
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId && sessions.some(s => s.id === savedId)) {
        return savedId;
      }
    } catch {}
    return sessions[0]?.id || `session_${Date.now()}`;
  });

  // Load cloud sessions when state loads
  useEffect(() => {
    if (state?.chatSessions && Array.isArray(state.chatSessions) && state.chatSessions.length > 0) {
      setSessions(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(state.chatSessions)) {
          return (state.chatSessions || []).map((s: any) => ({
            ...s,
            messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          }));
        }
        return prev;
      });
    }
  }, [state?.chatSessions]);

  // Current Active Messages
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [createWelcomeMessage()];

  // API Config
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return state.openrouterApiKey || localStorage.getItem(STORAGE_KEY_API_KEY) || localStorage.getItem('openrouter_api_key') || ''; } catch { return ''; }
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    try { return state.openrouterModel || localStorage.getItem(STORAGE_KEY_MODEL) || localStorage.getItem('openrouter_model') || 'google/gemini-2.5-flash:free'; } catch { return 'google/gemini-2.5-flash:free'; }
  });

  const [dbExpenses, setDbExpenses] = useState<any[]>([]);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState('');
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.openrouterApiKey && state.openrouterApiKey !== apiKey) {
      setApiKey(state.openrouterApiKey);
    }
    if (state?.openrouterModel && state.openrouterModel !== selectedModel) {
      setSelectedModel(state.openrouterModel);
    }
  }, [state?.openrouterApiKey, state?.openrouterModel]);

  // Persist sessions to localStorage AND Supabase database
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTOSAVE, String(autoSaveChat));
    } catch {}
  }, [autoSaveChat]);

  useEffect(() => {
    if (autoSaveChat) {
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
      } catch {}

      // ENVIAR PARA O SUPABASE EM TEMPO REAL
      // Usa latestExtendedStateRef.current (sempre fresco) em vez de 'state' (prop stale)
      // para não sobrescrever checklists ou outros dados que foram atualizados desde o último render.
      if (updateExtendedState) {
        const currentState = latestExtendedStateRef.current;
        if (currentState) {
          updateExtendedState({
            ...currentState,
            chatSessions: sessions
          });
        }
      }
    }
  }, [sessions, activeSessionId, autoSaveChat]);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Load database expenses in real time when chat is opened
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

  // Helper to update active session messages
  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    setSessions(prevSessions => {
      const updated = prevSessions.map(sess => {
        if (sess.id === activeSessionId) {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          const title = (sess.title && sess.title !== 'Nova Conversa')
            ? sess.title
            : firstUserMsg
            ? firstUserMsg.content.slice(0, 32) + (firstUserMsg.content.length > 32 ? '...' : '')
            : 'Nova Conversa';

          return {
            ...sess,
            title,
            updatedAt: new Date().toISOString(),
            messages: newMessages,
            autoSave: autoSaveChat
          };
        }
        return sess;
      });

      if (autoSaveChat && updateExtendedState && state) {
        updateExtendedState({ ...state, chatSessions: updated });
      }

      return updated;
    });
  };

  // Start new conversation
  const handleStartNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [createWelcomeMessage()],
      autoSave: autoSaveChat
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    setShowHistoryDropdown(false);

    if (autoSaveChat && updateExtendedState && state) {
      updateExtendedState({ ...state, chatSessions: updated });
    }
  };

  // Select existing session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryDropdown(false);
  };

  // Title Editing Handlers
  const handleStartEditingTitle = (e: React.MouseEvent, sess: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(sess.id);
    setEditingTitleText(sess.title);
  };

  const handleSaveEditingTitle = (e: React.FormEvent | React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingTitleText.trim()) {
      setEditingSessionId(null);
      return;
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === sessId) {
        return { ...s, title: editingTitleText.trim(), updatedAt: new Date().toISOString() };
      }
      return s;
    });

    setSessions(updatedSessions);
    setEditingSessionId(null);

    if (autoSaveChat && updateExtendedState && state) {
      updateExtendedState({ ...state, chatSessions: updatedSessions });
    }
  };

  // Delete session
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sessionId);
    let finalSessions = filtered;
    if (filtered.length === 0) {
      const freshId = `session_${Date.now()}`;
      setActiveSessionId(freshId);
      finalSessions = [{
        id: freshId,
        title: 'Nova Conversa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [createWelcomeMessage()],
        autoSave: autoSaveChat
      }];
    } else if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }

    setSessions(finalSessions);

    if (autoSaveChat && updateExtendedState && state) {
      updateExtendedState({ ...state, chatSessions: finalSessions });
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Close button clicked with unsaved warning check
  const handleCloseChat = () => {
    const hasUserMessages = messages.some(m => m.role === 'user');
    if (!autoSaveChat && hasUserMessages) {
      setShowUnsavedWarningModal(true);
    } else {
      setOpen(false);
      setMinimized(false);
      setIsExpandedMax(false);
    }
  };

  // Confirm close discarding
  const handleConfirmDiscardClose = () => {
    setShowUnsavedWarningModal(false);
    setOpen(false);
    setMinimized(false);
    setIsExpandedMax(false);
  };

  // Confirm close saving
  const handleConfirmSaveAndClose = () => {
    setAutoSaveChat(true);
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeSessionId);
    } catch {}

    if (updateExtendedState && state) {
      updateExtendedState({ ...state, chatSessions: sessions });
    }

    setShowUnsavedWarningModal(false);
    setOpen(false);
    setMinimized(false);
    setIsExpandedMax(false);
  };

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

    const newMessages = [...messages, userMsg];
    updateCurrentSessionMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const systemCtx = buildSystemContext(state, dbExpenses);
      const history = newMessages
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content
        }));

      const payload = {
        model: selectedModel || 'google/gemini-2.5-flash:free',
        messages: [
          { role: 'system', content: systemCtx },
          ...history
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

      updateCurrentSessionMessages([...newMessages, assistantMsg]);
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
      localStorage.setItem('openrouter_api_key', cleanKey);
      localStorage.setItem(STORAGE_KEY_MODEL, cleanModel);
      localStorage.setItem('openrouter_model', cleanModel);
    } catch {}

    if (updateOpenRouterConfig) {
      updateOpenRouterConfig(cleanKey, cleanModel);
    }

    setShowKeyInput(false);
    setTempKey('');
    setTempModel('');
    setError('');
  };

  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

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

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!open && (
        <button
          type="button"
          id="elena-chat-button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer group animate-scaleUp"
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

      {/* UNSAVED WARNING MODAL */}
      {showUnsavedWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm border rounded-2xl space-y-4 animate-scaleUp shadow-2xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 text-amber-500">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">Atenção: Conversa Não Salva!</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A opção <strong>"Salvar conversa no banco"</strong> não está marcada. Se você fechar o chat agora, este histórico de mensagens será <strong>PERDIDO PERMANENTEMENTE</strong> no Supabase.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSaveAndClose}
                className="w-full py-2 px-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                style={{ background: 'var(--accent)' }}
              >
                <Save className="w-4 h-4" /> Salvar no Supabase e Fechar
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscardClose}
                className="w-full py-2 px-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-1.5 border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Descartar Histórico e Fechar
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedWarningModal(false)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      {open && (
        <div
          id="elena-chat-panel"
          className={`fixed z-50 flex flex-col rounded-2xl shadow-2xl transition-all duration-300 ${
            minimized
              ? 'bottom-6 right-6 w-72 h-14'
              : isExpandedMax
              ? 'top-[75px] bottom-4 right-4 sm:right-6 w-[92vw] sm:w-[540px] md:w-[680px] h-[calc(100vh-95px)] max-h-[calc(100vh-95px)]'
              : 'bottom-6 right-6 w-80 sm:w-96 h-[560px] max-h-[calc(100vh-100px)]'
          }`}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0 rounded-t-2xl relative"
            style={{ background: 'var(--gradient-primary)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{currentSession?.title || 'vTask Agent'}</p>

                  {/* Selector of Past Conversations */}
                  <button
                    type="button"
                    onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                    className="p-0.5 rounded text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                    title="Escolher histórico de conversa guardado"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-blue-200 truncate">Assistente de Imigração IA</p>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Save to Database Toggle */}
              <button
                type="button"
                onClick={() => setAutoSaveChat(!autoSaveChat)}
                className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  autoSaveChat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/10 text-blue-200 hover:text-white'
                }`}
                title={autoSaveChat ? 'Salvar no banco Supabase ativado' : 'Salvar no banco desativado'}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[9px]">{autoSaveChat ? 'Salvar On' : 'Salvar Off'}</span>
              </button>

              {/* API Key Config */}
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

              {/* Expand up to Header Button */}
              <button
                type="button"
                onClick={() => {
                  setIsExpandedMax(!isExpandedMax);
                  setMinimized(false);
                }}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title={isExpandedMax ? 'Restaurar tamanho normal' : 'Aumentar chat até o cabeçalho'}
              >
                {isExpandedMax ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Minimize */}
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title={minimized ? 'Expandir' : 'Minimizar'}
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={handleCloseChat}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DROPDOWN SELECTOR FOR PAST CHATS */}
            {showHistoryDropdown && (
              <div
                className="absolute top-full left-0 right-0 z-50 p-3 shadow-2xl rounded-b-2xl border-b animate-fadeIn space-y-2 max-h-[340px] overflow-y-auto"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1 text-amber-500">
                    <History className="w-3.5 h-3.5" /> Histórico no Supabase ({sessions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg text-white flex items-center gap-1 shadow-sm"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-3 h-3" /> Nova Conversa
                  </button>
                </div>

                <div className="space-y-1.5">
                  {sessions.map(s => {
                    const isSelected = s.id === activeSessionId;
                    const isEditingThis = editingSessionId === s.id;
                    const firstMsg = s.messages.find(m => m.role === 'user')?.content || 'Sem histórico recente';
                    const lastMsg = s.messages[s.messages.length - 1];

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 font-bold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          {isEditingThis ? (
                            <form onSubmit={(e) => handleSaveEditingTitle(e, s.id)} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingTitleText}
                                onChange={(e) => setEditingTitleText(e.target.value)}
                                autoFocus
                                className="input text-xs py-1 px-2 font-bold w-full rounded-lg"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)' }}
                              />
                              <button type="submit" className="p-1 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5 group/item flex-wrap">
                              <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">{s.title}</p>
                              <button
                                type="button"
                                onClick={(e) => handleStartEditingTitle(e, s)}
                                className="p-1 rounded text-zinc-400 hover:text-amber-500 opacity-80 hover:opacity-100 transition-opacity"
                                title="Editar título da conversa"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-2 text-[9px] text-zinc-400">
                            <span>📅 Início: {formatDate(s.createdAt)}</span>
                            {lastMsg && <span>🕒 Última msg: {formatDate(s.updatedAt)}</span>}
                          </div>
                          <p className="text-[9px] text-zinc-400 truncate italic">"{firstMsg}"</p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                          title="Excluir este chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t text-[9px] text-center text-emerald-500 font-semibold flex items-center justify-center gap-1">
                  <span>☁️ Sincronizado automaticamente no Supabase</span>
                </div>
              </div>
            )}
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

                  <div className="text-[10px] space-y-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p>
                      <strong>1. Obter a chave:</strong> Crie uma conta em <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400">openrouter.ai</a> e gere sua API Key.
                    </p>
                    <p>
                      <strong>2. Modelos Gratuitos:</strong> Para usar sem custos, insira <strong>google/gemini-2.5-flash:free</strong>.
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

              {/* Messages Container */}
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
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
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

                      {/* TIMESTAMP & EXACT COPY BUTTON */}
                      <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-black/5 dark:border-white/5 text-[9px]">
                        <span style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-faint)' }}>
                          {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity ml-3"
                          style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'var(--accent)' }}
                          title="Copiar toda a mensagem exatamente como está"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[8px] text-emerald-400 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[8px] font-semibold">Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
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
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vTask Agent está pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
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
