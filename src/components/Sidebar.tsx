"use client";

import {
  Zap, CheckSquare, LayoutDashboard, FileText,
  Calendar, DollarSign, BarChart2, Users, Share2,
  PanelLeftClose, PanelLeftOpen, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

const NAV = [
  { icon: Zap,             label: "Home",          href: "/",          accent: "#f59e0b" },
  { icon: CheckSquare,     label: "Tarefas",       href: "/tasks",     accent: "#3b82f6" },
  { icon: LayoutDashboard, label: "Board",         href: "/board",     accent: "#8b5cf6" },
  { icon: FileText,        label: "Notas",         href: "/notes",     accent: "#f59e0b" },
  { icon: Calendar,        label: "Calendário",    href: "/calendar",  accent: "#22c55e" },
  { icon: DollarSign,      label: "Gastos",        href: "/expenses",  accent: "#10b981" },
  { icon: Share2,          label: "Compartilhados",href: "/shared",    accent: "#8b5cf6" },
  { icon: BarChart2,       label: "Relatórios",    href: "/reports",   accent: "#f43f5e" },
  { icon: Users,           label: "Membros",       href: "/members",   accent: "#8b5cf6" },
];

const STORAGE_KEY = "vtasks-sidebar-collapsed";

export function Sidebar() {
  const pathname   = usePathname();
  const { theme }  = useTheme();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Persiste a escolha
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const closeM = () => setMobileOpen(false);

  return (
    <>
      {/* ── Mobile toggle ─────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Menu"
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-xl shadow-lg"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {mobileOpen
          ? <X className="w-4 h-4" style={{ color: "var(--text)" }} />
          : <PanelLeftOpen className="w-4 h-4" style={{ color: "var(--text)" }} />}
      </button>

      {/* ── Overlay mobile ────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={closeM}
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40
          h-screen flex flex-col
          transition-all duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "w-[60px]" : "w-52"}
        `}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className={`flex items-center pt-2 pb-1 ${collapsed ? "px-1.5" : "px-1.5"}`}>
          {collapsed ? (
            <Link
              href="/"
              onClick={closeM}
              title="vTasksPro"
              className="flex items-center justify-center w-full h-10 rounded-xl"
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <div className="w-5 h-5 relative flex-shrink-0">
                <Image
                  src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"}
                  alt="vTasks"
                  fill
                  sizes="20px"
                  className="object-contain"
                />
              </div>
            </Link>
          ) : (
            <Link href="/" onClick={closeM} className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 relative flex-shrink-0">
                <Image
                  src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"}
                  alt="vTasks"
                  fill
                  sizes="28px"
                  className="object-contain"
                />
              </div>
              <span className="font-black text-sm tracking-tight truncate" style={{ color: "var(--text)" }}>
                vTasks<span style={{ color: "#2563eb" }}>Pro</span>
              </span>
            </Link>
          )}
        </div>

        <div className="mx-2 h-px" style={{ background: "var(--border-subtle)" }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
          {NAV.map(({ icon: Icon, label, href, accent }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeM}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-xl text-sm font-semibold transition-all ${collapsed ? "justify-center w-full h-10" : "gap-3 px-3 py-2.5"}`}
                style={active
                  ? { background: "#2563eb", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }
                  : { color: "var(--text-muted)" }
                }
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? "#fff" : accent }}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button - FINAL DO MENU */}
        <div className="p-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
          >
            {collapsed
              ? <PanelLeftOpen  className="w-4 h-4 flex-shrink-0" />
              : <PanelLeftClose className="w-4 h-4 flex-shrink-0" />}
            {!collapsed && <span>Retrair menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
