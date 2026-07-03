"use client";

import React from "react";
import {
  Zap, CheckSquare, FileText,
  Calendar, DollarSign, BarChart2, Users, Share2,
  PanelLeftClose, PanelLeftOpen, X,
  User, Home, TrendingUp, MapPin, Coffee, CalendarDays, ClipboardCheck, Phone, FileArchive, Luggage, Plane
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

const NAV = [
  { icon: Zap,           label: "Home",              href: "/"                     },
  { icon: CheckSquare,   label: "Tarefas",            href: "/tasks"               },
  { icon: FileText,      label: "Notas",              href: "/notes"               },
  { icon: Calendar,      label: "Calendário",         href: "/calendar"            },
  { icon: DollarSign,    label: "Gastos",             href: "/expenses"            },
  { icon: Share2,        label: "Compartilhados",     href: "/shared"              },
  { icon: BarChart2,     label: "Relatórios",         href: "/reports"             },
  { icon: Users,         label: "Membros",            href: "/members"             },
];

const IMIGRACAO_NAV = [
  { icon: User,          label: "Visão Geral",        href: "/visao-geral"          },
  { icon: Home,          label: "Família",            href: "/familia-imigracao"    },
  { icon: Luggage,       label: "Checklists",         href: "/checklists-viagem"    },
  { icon: TrendingUp,    label: "Custos Imigração",   href: "/custos-imigracao"     },
  { icon: MapPin,        label: "Timeline",           href: "/timeline-imigracao"   },
  { icon: Coffee,        label: "Passeios",           href: "/passeios"             },
  { icon: CalendarDays,  label: "Cal. Imigração",     href: "/calendario-imigracao" },
  { icon: ClipboardCheck,label: "Regularização",      href: "/regularizacao"        },
  { icon: Phone,         label: "Contatos",           href: "/contatos-imigracao"   },
  { icon: FileArchive,   label: "Documentos",         href: "/documentos-imigracao" },
];

const STORAGE_KEY = "vtasks-sidebar-collapsed";

function NavItem({ icon: Icon, label, href, active, collapsed, closeM, small }: {
  icon: any; label: string; href: string; active: boolean; collapsed: boolean; closeM: () => void; small?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={closeM}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-xl font-semibold transition-all ${
        collapsed ? "justify-center w-full h-10" : `gap-3 px-3 ${small ? "py-2" : "py-2.5"}`
      }`}
      style={active
        ? { background: "var(--accent)", color: "#ffffff", boxShadow: "var(--shadow-accent)" }
        : { color: "var(--sidebar-text)" }
      }
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-active)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "";
          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
        }
      }}
    >
      <Icon className={`${small ? "w-3.5 h-3.5" : "w-4 h-4"} flex-shrink-0`} />
      {!collapsed && <span className={`truncate ${small ? "text-xs" : "text-sm"}`}>{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname   = usePathname();
  const { theme }  = useTheme();
  const navRef     = useRef<HTMLElement>(null);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const closeM = () => setMobileOpen(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    const nav = navRef.current;
    if (!nav) return;
    e.preventDefault();
    nav.scrollTop += e.deltaY;
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.addEventListener("wheel", handleWheel, { passive: false });
    return () => nav.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Menu"
        className="md:hidden fixed bottom-4 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--card-shadow-lg)",
        }}
      >
        {mobileOpen
          ? <X className="w-5 h-5" style={{ color: "var(--text)" }} />
          : <PanelLeftOpen className="w-5 h-5" style={{ color: "var(--text)" }} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={closeM} className="fixed inset-0 z-30 md:hidden modal-overlay" />
      )}

      {/* Sidebar */}
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
        <div className="flex items-center pt-2 pb-1 px-1.5">
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
                <Image src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"} alt="vTasks" fill sizes="20px" className="object-contain" />
              </div>
            </Link>
          ) : (
            <Link href="/" onClick={closeM} className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 rounded-xl"
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <div className="w-7 h-7 relative flex-shrink-0">
                <Image src={theme === "dark" ? "/vtasks-dark.png" : "/vtasks-light.png"} alt="vTasks" fill sizes="28px" className="object-contain" />
              </div>
              <span className="font-black text-sm tracking-tight truncate" style={{ color: "var(--sidebar-text-active)" }}>
                vTasks<span style={{ color: "var(--accent)" }}>Pro</span>
              </span>
            </Link>
          )}
        </div>

        <div className="mx-2 h-px" style={{ background: "var(--border-subtle)" }} />

        {/* Nav */}
        <nav ref={navRef} className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5 scrollbar-none">
          {NAV.map(({ icon, label, href }) => (
            <NavItem key={href} icon={icon} label={label} href={href} active={pathname === href} collapsed={collapsed} closeM={closeM} />
          ))}

          {/* Divisor ImigraPro */}
          <div className="pt-1.5 pb-0.5">
            <div className="mx-1 h-px" style={{ background: "var(--border-subtle)" }} />
            {!collapsed && (
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                <Plane className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>ImigraPro</span>
              </div>
            )}
          </div>

          {IMIGRACAO_NAV.map(({ icon, label, href }) => (
            <NavItem key={href} icon={icon} label={label} href={href} active={pathname === href} collapsed={collapsed} closeM={closeM} small />
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
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
