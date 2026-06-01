"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";
import {
  Moon, Sun, Plus, CheckSquare,
  DollarSign, LayoutDashboard, X, StickyNote, Settings, LogOut, Activity,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Apenas ações de criação — sem Configurações, sem Relatórios
const ACTIONS = [
  { icon: CheckSquare,     label: "Nova Tarefa",     desc: "Adicionar à lista de tarefas",    href: "/tasks",    color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  { icon: StickyNote,      label: "Nova Nota",        desc: "Criar nota no editor",             href: "/notes",    color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { icon: LayoutDashboard, label: "Novo Card Kanban", desc: "Adicionar ao Board",               href: "/board",    color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  { icon: DollarSign,      label: "Novo Gasto",       desc: "Registrar despesa financeira",     href: "/expenses", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user }               = useAuth();
  const [open, setOpen]        = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef                = useRef<HTMLDivElement>(null);
  const userMenuRef            = useRef<HTMLDivElement>(null);
  const router                 = useRouter();

  const avatarUrl  = user?.user_metadata?.avatar_url as string | undefined;
  const userName   = (user?.user_metadata?.full_name ?? user?.email ?? "Usuário") as string;
  const userEmail  = user?.email ?? "";
  const initials   = userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!userMenu) return;
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [userMenu]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setUserMenu(false); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <header
      className="glass sticky top-0 z-30 h-14 px-4 md:px-5 flex items-center justify-between flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* ── Esquerda ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 md:hidden" /> {/* espaço para botão de menu mobile do Sidebar */}

        {/* Logo mobile */}
        <div className="md:hidden flex items-center gap-2">
          <Image
            src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"}
            alt="vTasks"
            width={26}
            height={26}
          />
          <span className="font-black text-sm" style={{ color: "var(--text)" }}>
            vTasks<span style={{ color: "#2563eb" }}>Pro</span>
          </span>
        </div>

        <p className="hidden md:block text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          vWeb Pro System
        </p>
      </div>

      {/* ── Direita ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2" ref={menuRef}>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Botão Criar + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{
              background: open ? "#1d4ed8" : "#2563eb",
              boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
            }}
          >
            {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Criar</span>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden fade-up"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
                zIndex: 100,
              }}
            >
              <div className="p-2">
                <p className="text-[10px] font-black uppercase tracking-widest px-3 py-2" style={{ color: "var(--text-faint)" }}>
                  Criação Rápida
                </p>
                {ACTIONS.map(({ icon: Icon, label, desc, href, color, bg }) => (
                  <button
                    key={href}
                    onClick={() => { setOpen(false); router.push(href); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>{label}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        {/* Avatar + menu de perfil */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenu(v => !v)}
            aria-label="Perfil"
            className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-black text-xs text-white transition-all active:scale-95 flex-shrink-0"
            style={avatarUrl ? {} : { background: "#2563eb", boxShadow: "0 1px 4px rgba(37,99,235,0.4)" }}
            title={userName}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={userName} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              initials || "?"
            )}
          </button>

          {userMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden fade-up"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
                zIndex: 100,
              }}
            >
              {/* Info do usuário */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm text-white"
                  style={avatarUrl ? {} : { background: "#2563eb" }}
                >
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={userName} width={40} height={40} className="object-cover" />
                    : (initials || "?")
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "var(--text)" }}>{userName}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{userEmail}</p>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { setUserMenu(false); router.push("/settings"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Configurações</span>
                </button>

                <button
                  onClick={() => { setUserMenu(false); router.push("/logs"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Log de Atividades</span>
                </button>

                <button
                  onClick={async () => { setUserMenu(false); await signOut(); router.replace("/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                  onMouseEnter={e => { (e.currentTarget.style.background = "rgba(239,68,68,0.08)"); }}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                  <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
