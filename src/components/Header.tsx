"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useCurrency, CURRENCY_SYMBOLS, CURRENCY_LABELS, CurrencyCode } from "@/components/CurrencyProvider";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";
import {
  Moon, Sun, Plus, CheckSquare,
  DollarSign, X, StickyNote, Settings, LogOut, Activity,
  ChevronDown, Pencil, Check,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  { icon: CheckSquare, label: "Nova Tarefa",  desc: "Adicionar à lista de tarefas",  href: "/tasks",    color: "var(--color-doing)",   bg: "var(--bg-doing)"   },
  { icon: StickyNote,  label: "Nova Nota",    desc: "Criar nota no editor",           href: "/notes",    color: "var(--color-warning)", bg: "var(--bg-warning)" },
  { icon: DollarSign,  label: "Novo Gasto",   desc: "Registrar despesa financeira",   href: "/expenses", color: "var(--color-teal)",    bg: "var(--bg-teal)"    },
];

const CURRENCIES: CurrencyCode[] = ["BRL", "EUR", "USD"];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const {
    activeCurrency, exchangeRates, currencySymbol,
    setActiveCurrency, setExchangeRate,
  } = useCurrency();
  const { user }               = useAuth();
  const [open, setOpen]        = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const menuRef     = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router      = useRouter();

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userName  = (user?.user_metadata?.full_name ?? user?.email ?? "Usuário") as string;
  const userEmail = user?.email ?? "";
  const initials  = userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  // Fecha menus ao clicar fora
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
      {/* ── Esquerda ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 md:hidden" />

        {/* Logo mobile */}
        <div className="md:hidden flex items-center gap-2">
          <Image
            src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"}
            alt="vTasks"
            width={26}
            height={26}
          />
          <span className="font-black text-sm" style={{ color: "var(--text)" }}>
            vTasks<span style={{ color: "var(--accent)" }}>Pro</span>
          </span>
        </div>

        <p className="hidden md:block text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          vWeb Pro System
        </p>
      </div>

      {/* ── Direita ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* ── Seletor de Moeda Global Exposto Diretamente ──────── */}
        <div className="flex items-center gap-1.5 no-print">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
            {CURRENCIES.map(c => {
              const isActive = activeCurrency === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCurrency(c)}
                  className={`h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                  style={{ minHeight: '28px' }}
                >
                  <span className="font-extrabold">{CURRENCY_SYMBOLS[c]}</span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>

          {activeCurrency !== "BRL" && (
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/40 px-2 py-1 rounded-lg text-[10px] font-bold border border-zinc-200 dark:border-zinc-800/60 h-9">
              <span className="text-zinc-500 dark:text-zinc-400">1 {currencySymbol} = </span>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={exchangeRates[activeCurrency]}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    setExchangeRate(activeCurrency, val);
                  }
                }}
                className="w-11 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1 py-0.5 text-center font-mono font-bold focus:outline-none focus:border-blue-500 h-6"
                style={{ color: "var(--text)" }}
              />
              <span className="text-zinc-500 dark:text-zinc-400">BRL</span>
            </div>
          )}
        </div>

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

        {/* Botão Criar */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95 btn-primary"
            style={{ padding: "0.5rem 0.875rem" }}
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
                boxShadow: "var(--card-shadow-lg)",
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
            style={avatarUrl ? {} : {
              background: "var(--accent)",
              boxShadow: "var(--shadow-accent)",
            }}
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
                boxShadow: "var(--card-shadow-lg)",
                zIndex: 100,
              }}
            >
              {/* Info do usuário */}
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm text-white"
                  style={avatarUrl ? {} : { background: "var(--accent)" }}
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
                  <Activity className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Log de Atividades</span>
                </button>

                <button
                  onClick={async () => { setUserMenu(false); await signOut(); router.replace("/login"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                  onMouseEnter={e => { (e.currentTarget.style.background = "var(--bg-danger)"); }}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-danger)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
