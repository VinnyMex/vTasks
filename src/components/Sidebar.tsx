"use client";

import {
  Zap,
  CheckSquare,
  LayoutDashboard,
  FileText,
  Calendar as CalendarIcon,
  DollarSign,
  BarChart2,
  Settings,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

const NAV = [
  { icon: Zap,             label: "Home",        href: "/",          color: "text-amber-500" },
  { icon: CheckSquare,     label: "Tarefas",      href: "/tasks",     color: "text-blue-500" },
  { icon: LayoutDashboard, label: "Board",        href: "/board",     color: "text-purple-500" },
  { icon: FileText,        label: "Notas",        href: "/notes",     color: "text-amber-500" },
  { icon: CalendarIcon,    label: "Calendário",   href: "/calendar",  color: "text-green-500" },
  { icon: DollarSign,      label: "Gastos",       href: "/expenses",  color: "text-emerald-500" },
  { icon: BarChart2,       label: "Relatórios",   href: "/reports",   color: "text-rose-500" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="md:hidden fixed top-3.5 right-4 z-50 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen
        w-60 flex flex-col
        bg-[var(--sidebar-bg)] border-r border-[var(--border)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-3">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/logo-dark.png"
                alt="vTasks Logo"
                fill
                className={`object-contain ${theme === "dark" ? "brightness-0 invert" : ""}`}
              />
            </div>
            <span className="font-black text-lg tracking-tight text-[var(--text)]">
              vTasks<span className="text-blue-600">Pro</span>
            </span>
          </Link>
        </div>

        {/* Divisor */}
        <div className="mx-4 h-px bg-[var(--border-subtle)]" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map(({ icon: Icon, label, href, color }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }
                `}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : color}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-[10px] flex-shrink-0">
              VM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[var(--text)] truncate">vWeb Marketing</p>
              <p className="text-[10px] text-[var(--text-faint)] truncate">Equipe</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-[var(--text-faint)] flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </>
  );
}
