"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Settings, Moon, Sun, Bell, Shield, Users, Info, Check, ChevronRight } from "lucide-react";
import Image from "next/image";

/* ── Toggle — nunca é button, evita aninhamento inválido ─────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={e => { e.stopPropagation(); onChange(!value); }}
      onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!value); } }}
      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer select-none"
      style={{ background: value ? "#2563eb" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
      />
    </div>
  );
}

/* ── Row — sempre <div>, nunca <button>, evita aninhamento ───────────── */
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

/* ── Row com tema — row inteiro clicável, sem elemento interativo dentro */
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
          ? <Moon className="w-4 h-4" style={{ color: "#f59e0b" }} />
          : <Sun  className="w-4 h-4" style={{ color: "#f59e0b" }} />
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

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [notif, setNotif]     = useState(true);
  const [sound, setSound]     = useState(false);
  const [compact, setCompact] = useState(false);
  const [saved, setSaved]     = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
          <Settings className="w-6 h-6" style={{ color: "#64748b" }} />
          Configurações
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Preferências do sistema vTasks Pro.</p>
      </div>

      {/* Perfil */}
      <Section title="Perfil">
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
            style={{ background: "#2563eb" }}
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

      {/* Aparência */}
      <Section title="Aparência">
        <ThemeRow theme={theme} onToggle={toggleTheme} />
        {/* Row com toggle: div wrapper, toggle interno não é button aninhado */}
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
          background: saved ? "#10b981" : "#2563eb",
          boxShadow: saved ? "0 2px 8px rgba(16,185,129,0.3)" : "0 2px 8px rgba(37,99,235,0.3)",
        }}
      >
        {saved ? <><Check className="w-4 h-4" /> Preferências salvas!</> : "Salvar Preferências"}
      </button>
    </div>
  );
}
