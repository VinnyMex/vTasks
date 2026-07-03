import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppState } from './types';
import { MessageCircle, X, Send, Bot, User, ChevronDown, Loader2, Sparkles, Key, AlertCircle, Trash2, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ElenaAssistantProps {
  state: AppState;
}

const STORAGE_KEY_MESSAGES = 'elena_chat_history_v1';
const STORAGE_KEY_API_KEY = 'elena_gemini_api_key_v1';

function buildSystemContext(state: AppState): string {
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

  return `Você é Elena, uma assistente especializada em imigração e organização de viagens internacionais. Você é empática, encorajadora, direta e especialista. Use um tom amigável mas profissional, em português do Brasil.

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

---
Você tem acesso completo ao contexto acima. Responda de forma personalizada com base nessas informações. Ajude com: documentação de imigração, passaportes, vistos, prazos, planejamento financeiro da viagem, dicas do destino, e quaisquer dúvidas relacionadas. Se o usuário perguntar algo não relacionado a viagens ou imigração, gentilmente redirecione-o.

Importante: seja CONCISA nas respostas (máximo 3-4 parágrafos curtos). Use emojis moderadamente. Formate usando markdown.`;
}

export default function ElenaAssistant({ state }: ElenaAssistantProps) {
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
      content: `Olá! 👋 Sou a **Elena**, sua assistente pessoal de imigração e viagens!\n\nEstou conectada ao seu planner e posso te ajudar com:\n- 📋 Status dos seus documentos\n- 🛂 Dicas de passaporte, vistos e regularização\n- 📅 Prazos e planejamento da viagem\n- 💡 Qualquer dúvida sobre imigração\n\nComo posso te ajudar hoje?`,
      timestamp: new Date()
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_API_KEY) || ''; } catch { return ''; }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');
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
      const ai = new GoogleGenAI({ apiKey });
      const systemCtx = buildSystemContext(state);

      // Build history for multi-turn
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));

      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: { systemInstruction: systemCtx },
        history
      });

      const result = await chat.sendMessage({ message: userMsg.content });
      const text = result.text || 'Não consegui gerar uma resposta. Tente novamente.';

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes('API_KEY') || errMsg.includes('401') || errMsg.includes('403')) {
        setError('Chave de API inválida. Verifique e tente novamente.');
        setShowKeyInput(true);
      } else {
        setError('Erro ao conectar à IA. Verifique sua chave e conexão.');
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

  const handleSaveKey = () => {
    if (!tempKey.trim()) return;
    const clean = tempKey.trim();
    setApiKey(clean);
    try { localStorage.setItem(STORAGE_KEY_API_KEY, clean); } catch {}
    setShowKeyInput(false);
    setTempKey('');
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer group"
          style={{ background: 'var(--gradient-primary)', minHeight: '52px', boxShadow: 'var(--shadow-accent)' }}
          title="Falar com Elena (Assistente IA)"
        >
          <Sparkles className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
          <span className="text-sm font-bold">Elena</span>
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
                <p className="text-xs font-bold text-white">Elena</p>
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
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                title="Configurar API Key"
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
                  className="px-4 py-3 flex-shrink-0"
                  style={{ background: 'var(--bg-warning)', borderBottom: '1px solid var(--border)' }}
                >
                  <p className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                    <Key className="w-3 h-3" /> Configure sua Gemini API Key
                  </p>
                  <p className="text-[9px] mb-2" style={{ color: 'var(--color-warning)' }}>
                    Obtenha grátis em <span className="font-bold">aistudio.google.com</span> → "Get API Key"
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AIza..."
                      value={tempKey}
                      onChange={e => setTempKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="text-white text-[10px] font-bold px-3 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'var(--color-warning)' }}
                    >
                      Salvar
                    </button>
                  </div>
                  {apiKey && (
                    <p className="text-[9px] mt-1 flex items-center gap-1" style={{ color: 'var(--color-done)' }}>
                      ✅ API Key configurada
                    </p>
                  )}
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div
                  className="px-4 py-2 flex items-center gap-2 flex-shrink-0"
                  style={{ background: 'var(--bg-danger)', borderBottom: '1px solid var(--border)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
                  <p className="text-[10px]" style={{ color: 'var(--color-danger)' }}>{error}</p>
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
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      msg.role === 'assistant'
                        ? ''
                        : ''
                    }`}
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
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--accent)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Elena está pensando...</span>
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
                    placeholder="Pergunte à Elena..."
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
