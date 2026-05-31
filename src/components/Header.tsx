"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Plus, CheckSquare, FileText, DollarSign, LayoutDashboard, X, StickyNote } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const CREATE_ACTIONS = [
  {
    icon: CheckSquare,
    label: "Nova Tarefa",
    desc: "Adicionar ao quadro de tarefas",
    href: "/tasks",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    icon: StickyNote,
    label: "Nova Nota",
    desc: "Criar nota no editor",
    href: "/notes",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  {
    icon: LayoutDashboard,
    label: "Novo Card Kanban",
    desc: "Adicionar ao Board",
    href: "/board",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/30",
  },
  {
    icon: DollarSign,
    label: "Novo Gasto",
    desc: "Registrar despesa financeira",
    href: "/expenses",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
  },
  {
    icon: FileText,
    label: "Novo Relatório",
    desc: "Ver gráficos e relatórios",
    href: "/reports",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/30",
  },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Fecha ao pressionar Esc
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-[var(--border)] px-5 h-14 flex items-center justify-between">
      {/* Esquerda — logo mobile */}
      <div className="md:hidden flex items-center gap-2">
        <Image
          src="/logo-dark.png"
          alt="vTasks"
          width={28}
          height={28}
          className={theme === "dark" ? "brightness-0 invert" : ""}
        />
        <span className="font-black text-base text-[var(--text)]">
          vTasks<span className="text-blue-600">Pro</span>
        </span>
      </div>

      {/* Esquerda — label desktop */}
      <p className="hidden md:block text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-widest">
        vWeb Pro System
      </p>

      {/* Direita */}
      <div className="flex items-center gap-2" ref={menuRef}>
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark"
            ? <Sun className="w-4.5 h-4.5" />
            : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Botão Criar */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20 ${
              open
                ? "bg-blue-700 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Criar</span>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden fade-up">
              <div className="p-2">
                <p className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest px-3 py-2">
                  Criação Rápida
                </p>
                {CREATE_ACTIONS.map(({ icon: Icon, label, desc, href, color, bg }) => (
                  <button
                    key={href}
                    onClick={() => go(href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors group text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text)] leading-tight">{label}</p>
                      <p className="text-[11px] text-[var(--text-faint)] truncate">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
