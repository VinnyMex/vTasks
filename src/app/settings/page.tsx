"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useCurrency, CURRENCY_SYMBOLS } from "@/components/CurrencyProvider";
import { ImigracaoShell } from "@/components/ImigracaoShell";
import { useImigracao } from "@/lib/imigracao-context";
import { 
  Settings, Moon, Sun, Bell, Shield, Users, Info, Check, ChevronRight, 
  DollarSign, RefreshCw, Play, Link, Link2Off, Terminal, ChevronDown, ChevronUp 
} from "lucide-react";
import Image from "next/image";

/* ── Toggle ──────────────────────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onChange(!value); }}
      onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!value); } }}
      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer select-none"
      style={{ background: value ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
      />
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────── */
function Row({
  icon: Icon, label, desc, right, onClick,
}: {
  icon: React.ElementType; label: string; desc?: string;
  right?: React.ReactNode; onClick?: () => void;
}) {
  const isClickable = !!onClick && !right;
  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e => { if (e.key === "Enter" || e.key === " ") onClick?.(); }) : undefined}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        cursor: isClickable ? "pointer" : "default",
      }}
      onMouseEnter={isClickable ? e => (e.currentTarget.style.background = "var(--surface-2)") : undefined}
      onMouseLeave={isClickable ? e => (e.currentTarget.style.background = "") : undefined}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{desc}</p>}
      </div>
      {right !== undefined ? right : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-faint)" }} />}
    </div>
  );
}

/* ── ThemeRow ────────────────────────────────────────────────────────── */
function ThemeRow({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors cursor-pointer"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {theme === "dark"
          ? <Moon className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
          : <Sun  className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Tema</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
          {theme === "dark" ? "Modo escuro ativo" : "Modo claro ativo"}
        </p>
      </div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
        style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        {theme === "dark" ? "Escuro" : "Claro"}
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{title}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ── Content Inner ───────────────────────────────────────────────────── */
function SettingsContent() {
  const { theme, toggleTheme } = useTheme();
  const { exchangeRates, setExchangeRate } = useCurrency();
  const [notif, setNotif]     = useState(true);
  const [sound, setSound]     = useState(false);
  const [compact, setCompact] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [showSyncLogs, setShowSyncLogs] = useState(false);

  const {
    todoistToken, setTodoistToken,
    isTodoistConnected, isTodoistSimulated, todoistSyncLogs,
    handleTriggerTodoistSync, handleDisconnectTodoist, handleConnectTodoistSimulated
  } = useImigracao();

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
          <Settings className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
          Configurações
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Preferências do sistema vTasks Pro e perfil.</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil">
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            VM
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base" style={{ color: "var(--text)" }}>vWeb Marketing</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Administrador · Equipe</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Login Google em breve</p>
          </div>
        </div>
      </Section>

      {/* Integrações & Sincronização */}
      <Section title="Integrações & Sincronização (Todoist / API)">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Integração Todoist</p>
                <p className="text-xs text-zinc-400">Sincronize tarefas e compromissos em tempo real com a sua agenda.</p>
              </div>
            </div>

            {/* Badge de status */}
            {isTodoistConnected ? (
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Conectado Real
              </span>
            ) : isTodoistSimulated ? (
              <span className="text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Play className="w-3 h-3 fill-orange-500 text-orange-500" /> Simulado
              </span>
            ) : (
              <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg">
                Desconectado
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
              TODOIST API TOKEN
            </label>
            <input
              type="password"
              value={todoistToken}
              onChange={(e) => setTodoistToken(e.target.value)}
              placeholder="Insira seu Todoist API Token..."
              className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {!isTodoistConnected && !isTodoistSimulated ? (
              <>
                <button
                  type="button"
                  onClick={handleConnectTodoistSimulated}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-orange-500" />
                  <span>Modo Simulado</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerTodoistSync(todoistToken)}
                  disabled={!todoistToken}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Conectar Todoist</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleTriggerTodoistSync(todoistToken)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Sincronizar Agora</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectTodoist}
                  className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 font-bold text-xs"
                >
                  <Link2Off className="w-4 h-4" />
                  <span>Desconectar</span>
                </button>
              </>
            )}
          </div>

          {/* Console Log Encolhido por padrão */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowSyncLogs(prev => !prev)}
              className="w-full flex items-center justify-between text-xs font-mono font-bold text-orange-600 dark:text-orange-400 hover:opacity-80 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>Console Logs de Sincronização ({todoistSyncLogs.length})</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span>{showSyncLogs ? "Ocultar" : "Exibir Logs"}</span>
                {showSyncLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showSyncLogs && (
              <div className="mt-2.5 bg-zinc-950 p-3.5 rounded-xl font-mono text-[10px] text-zinc-300 space-y-1 max-h-[160px] overflow-y-auto no-scrollbar border border-zinc-900">
                {todoistSyncLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed break-all">{log}</div>
                ))}
                {todoistSyncLogs.length === 0 && (
                  <span className="text-zinc-500 italic">Nenhuma atividade registrada no momento.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Moeda e Câmbio */}
      <Section title="Moeda e Câmbio">
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Configure as taxas de câmbio abaixo. O seletor de moeda ativa fica no cabeçalho do app e se aplica a todo o sistema em tempo real.
          </p>
          {(["EUR", "USD"] as const).map(c => (
            <div key={c}>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>
                Taxa de Câmbio — {c} (1 {CURRENCY_SYMBOLS[c]} = X BRL)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <input
                  type="number"
                  value={exchangeRates[c]}
                  onChange={(e) => setExchangeRate(c, parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0.01"
                  className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full p-0"
                  style={{ color: "var(--text)" }}
                  placeholder="6.20"
                />
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "var(--text-faint)" }}>BRL</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Aparência */}
      <Section title="Aparência">
        <ThemeRow theme={theme} onToggle={toggleTheme} />
        <div
          className="flex items-center gap-4 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <Settings className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Visualização compacta</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Reduz o espaçamento dos itens</p>
          </div>
          <Toggle value={compact} onChange={setCompact} />
        </div>
      </Section>

      {/* Notificações */}
      <Section title="Notificações">
        <div
          className="flex items-center gap-4 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Notificações</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Alertas sobre tarefas e atualizações</p>
          </div>
          <Toggle value={notif} onChange={setNotif} />
        </div>
        <div
          className="flex items-center gap-4 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Sons</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Reproduzir som ao completar ações</p>
          </div>
          <Toggle value={sound} onChange={setSound} />
        </div>
      </Section>

      {/* Equipe e Acesso */}
      <Section title="Equipe & Acesso">
        <Row icon={Users}  label="Gerenciar Membros" desc="Convidar usuários por e-mail (em breve)" right={null} />
        <Row icon={Shield} label="Permissões"         desc="Controle de acesso por projeto (em breve)" right={null} />
        <Row icon={Users}  label="Login com Google"   desc="Autenticação e projetos compartilhados (em breve)" right={null} />
      </Section>

      {/* Sobre */}
      <Section title="Sobre o App">
        <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"}
              alt="vTasks"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "var(--text)" }}>vTasks Pro</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>v1.0.0 · Next.js 16 · Supabase · vWeb Marketing</p>
          </div>
        </div>
        <Row icon={Info} label="Documentação" desc="Guia de uso e funcionalidades" right={null} />
      </Section>

      {/* Salvar */}
      <button
        onClick={save}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: saved ? "var(--color-done)" : "var(--accent)",
          boxShadow: saved ? "0 2px 8px var(--bg-done)" : "var(--shadow-accent)",
        }}
      >
        {saved ? <><Check className="w-4 h-4" /> Preferências salvas!</> : "Salvar Preferências"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ImigracaoShell>
      <SettingsContent />
    </ImigracaoShell>
  );
}
