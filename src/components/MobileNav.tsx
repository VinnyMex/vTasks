"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, CheckSquare, ClipboardCheck, DollarSign, Menu, X, Search,
  FileText, Calendar, Share2, BarChart2, Users, User, Home, TrendingUp,
  Coffee, CalendarDays, Phone, FileArchive, Luggage, ChevronRight
} from "lucide-react";

const NAV_MAIN = [
  { icon: Zap, label: "Home", href: "/" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: ClipboardCheck, label: "Kanban", href: "/regularizacao" },
  { icon: DollarSign, label: "Gastos", href: "/expenses" },
];

const ALL_LINKS = [
  // Produtividade & Gestão
  { icon: Zap, label: "Home", desc: "Painel principal vTasks", href: "/", category: "⚡ Produtividade" },
  { icon: CheckSquare, label: "Tarefas", desc: "Listas de tarefas diárias", href: "/tasks", category: "⚡ Produtividade" },
  { icon: FileText, label: "Notas", desc: "Editor de notas e documentos", href: "/notes", category: "⚡ Produtividade" },
  { icon: Calendar, label: "Calendário Geral", desc: "Compromissos e eventos", href: "/calendar", category: "⚡ Produtividade" },
  { icon: DollarSign, label: "Controle de Gastos", desc: "Lançamentos financeiros", href: "/expenses", category: "⚡ Produtividade" },
  { icon: Share2, label: "Compartilhados", desc: "Arquivos em equipe", href: "/shared", category: "⚡ Produtividade" },
  { icon: BarChart2, label: "Relatórios", desc: "Métricas e estatísticas", href: "/reports", category: "⚡ Produtividade" },
  { icon: Users, label: "Membros", desc: "Equipe e permissões", href: "/members", category: "⚡ Produtividade" },

  // Imigração & Viagem
  { icon: User, label: "Visão Geral Imigração", desc: "Resumo da jornada de imigração", href: "/visao-geral", category: "✈️ ImigraPro (Espanha)" },
  { icon: Home, label: "Família Imigração", desc: "Dados da família e passaportes", href: "/familia-imigracao", category: "✈️ ImigraPro (Espanha)" },
  { icon: Luggage, label: "Checklists Viagem", desc: "Malas e malas de mão", href: "/checklists-viagem", category: "✈️ ImigraPro (Espanha)" },
  { icon: TrendingUp, label: "Custos Imigração", desc: "Planejamento orçamentário", href: "/custos-imigracao", category: "✈️ ImigraPro (Espanha)" },
  { icon: CalendarDays, label: "Passeios & Agenda", desc: "Roteiro turístico, atrações e calendário de eventos", href: "/passeios", category: "✈️ ImigraPro (Espanha)" },
  { icon: ClipboardCheck, label: "Regularização (Kanban)", desc: "8 trimestres de legalidade", href: "/regularizacao", category: "✈️ ImigraPro (Espanha)" },
  { icon: Phone, label: "Contatos Importantes", desc: "Órgãos, consulados e utilidades", href: "/contatos-imigracao", category: "✈️ ImigraPro (Espanha)" },
  { icon: FileArchive, label: "Cópia de Documentos", desc: "Arquivos e comprovantes", href: "/documentos-imigracao", category: "✈️ ImigraPro (Espanha)" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'prod' | 'imigra'>('all');

  const filteredLinks = ALL_LINKS.filter(l => {
    const matchesSearch = l.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'prod' && l.category.includes('Produtividade')) ||
                      (activeTab === 'imigra' && l.category.includes('ImigraPro'));
    return matchesSearch && matchesTab;
  });

  return (
    <>
      {/* ── MENU INFERIOR SUSPENSO (FLOATING SUSPENDED DOCK) ── */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl backdrop-blur-2xl px-3 py-1.5 flex items-center justify-around">
        {NAV_MAIN.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-bold scale-105"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
              <span className="text-[9px] font-bold tracking-tight mt-0.5">{label}</span>
            </Link>
          );
        })}

        {/* BOTÃO SUSPENSO DO MENU COMPLETO */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all ${
            menuOpen
              ? "text-amber-500 font-bold scale-105"
              : "text-amber-500 hover:text-amber-600"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight mt-0.5">Menu</span>
        </button>
      </div>

      {/* ── MODAL SHEET DE NAVEGAÇÃO LIMPO E ESPAÇOSO ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setMenuOpen(false)} />

          {/* Bottom Sheet Container */}
          <div
            className="w-full max-h-[82vh] rounded-t-3xl border-t p-5 flex flex-col space-y-4 shadow-2xl overflow-hidden animate-slideUp"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Sheet Handle Indicator & Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Navegação do App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Pesquisar módulo ou página..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all ${activeTab === 'all' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                Tudo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prod')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all ${activeTab === 'prod' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                ⚡ Produtividade
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('imigra')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all ${activeTab === 'imigra' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                ✈️ Imigração
              </button>
            </div>

            {/* Clean Vertical Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin pb-8">
              {filteredLinks.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Nenhuma página encontrada para "{searchQuery}"
                </div>
              ) : (
                filteredLinks.map(({ icon: Icon, label, desc, href, category }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-amber-500/10 border-amber-500/60 text-amber-500 font-bold"
                          : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-amber-500 text-white" : "bg-zinc-200/60 dark:bg-zinc-800 text-amber-500"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight truncate">{label}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
