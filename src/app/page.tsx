"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { 
  ListTodo, FileText, Calendar as CalendarIcon, Zap, ArrowRight,
  Plane, TrendingUp, Users, Luggage, FileArchive, Phone, Coffee, ClipboardCheck,
  CheckSquare, DollarSign
} from "lucide-react";
import Link from "next/link";
import { STATUS } from "@/lib/tokens";
import { ImigracaoProvider, useImigracao, CURRENCY_SYMBOLS } from "@/lib/imigracao-context";

interface Stats {
  tasks: number; notes: number; doing: number; done: number;
}
interface Activity {
  id: string; content: string; type: "task" | "note";
  created_at: string; status?: string;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "agora";
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function activityTokens(item: Activity) {
  if (item.type === "note")          return { ...STATUS.pending, label: "Nota",         color: "var(--color-warning)" };
  if (item.status === "done")        return { ...STATUS.done,    label: "Concluída",     color: "var(--color-done)"    };
  if (item.status === "doing")       return { ...STATUS.doing,   label: "Em andamento",  color: "var(--color-doing)"   };
  return { color: "var(--border)", bg: "var(--surface-3)", label: "A fazer" };
}

function HomeInner() {
  const { user } = useAuth();
  const { 
    extendedState, 
    profile, 
    contacts: officialContacts, 
    documents: officialDocuments, 
    loading: imigracaoLoading 
  } = useImigracao();

  const [stats, setStats]     = useState<Stats>({ tasks: 0, notes: 0, doing: 0, done: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userName = (user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuário") as string;
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("home_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const [taskRes, noteRes] = await Promise.all([
      supabase.from("tasks").select("id, content, status, created_at").order("created_at", { ascending: false }),
      supabase.from("notes").select("id, title, content, created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const tasks = taskRes.data || [];
    const notes = noteRes.data || [];

    setStats({
      tasks: tasks.filter(t => t.status !== "done").length,
      notes: notes.length,
      doing: tasks.filter(t => t.status === "doing").length,
      done:  tasks.filter(t => t.status === "done").length,
    });

    const combined: Activity[] = [
      ...tasks.slice(0, 4).map(t => ({ id: t.id, content: t.content, type: "task" as const, created_at: t.created_at, status: t.status })),
      ...notes.slice(0, 2).map(n => ({ id: n.id, content: n.title || n.content?.slice(0, 60) || "Nota sem título", type: "note" as const, created_at: n.created_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    setActivity(combined);
    setIsLoading(false);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Moeda e Câmbio do Módulo de Imigração
  const activeCurrency = extendedState.currency || 'BRL';
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || 'R$';
  const currentRates = extendedState.exchangeRates || { EUR: 6.20, USD: 5.50 };
  const currentExchangeRate = activeCurrency === 'BRL'
    ? 1
    : activeCurrency === 'EUR'
      ? currentRates.EUR
      : currentRates.USD;

  const formatMoney = (valBRL: number) => {
    const val = valBRL / currentExchangeRate;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Cálculos de Documentos
  const allDocs = Object.values(extendedState.checklists || {}).flat();
  const totalDocs = allDocs.length;
  const completedDocs = allDocs.filter(d => d.completed).length;
  const docsPct = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
  const docsCostBRL = allDocs.reduce((sum, d) => sum + (d.cost || 0), 0);

  // 2. Cálculos de Custos Imigração
  const totalEstBRL = (extendedState.financialExpenses || []).reduce((sum, e) => sum + e.estimated, 0);
  const totalRealBRL = (extendedState.financialExpenses || []).reduce((sum, e) => sum + e.real, 0);

  // 3. Cálculos de Timeline
  const totalTimeline = (extendedState.timelineTasks || []).length;
  const completedTimeline = (extendedState.timelineTasks || []).filter(t => t.completed).length;
  const timelinePct = totalTimeline > 0 ? Math.round((completedTimeline / totalTimeline) * 100) : 0;

  // 4. Cálculos de Malas
  const allPacking = Object.values(extendedState.packingChecklists || {}).flat();
  const totalPacking = allPacking.length;
  const completedPacking = allPacking.filter(p => p.completed).length;
  const packingPct = totalPacking > 0 ? Math.round((completedPacking / totalPacking) * 100) : 0;

  // 5. Cálculos de Família
  const familyCount = (extendedState.familyMembers || []).length;
  const principalName = (extendedState.familyMembers || []).find(m => m.role === 'principal')?.name || "Não informado";

  // 6. Outros
  const docsCount = (officialDocuments || []).length;
  const contactsCount = (officialContacts || []).length;
  const toursCount = (extendedState.tours || []).length;

  const statCards = [
    { icon: ListTodo,     label: "Tarefas Ativas", value: stats.tasks, color: "var(--color-doing)",   bg: "var(--bg-doing)",   href: "/tasks" },
    { icon: FileText,     label: "Notas",           value: stats.notes, color: "var(--color-warning)", bg: "var(--bg-warning)", href: "/notes" },
    { icon: Zap,          label: "Concluídas",      value: stats.done,  color: "var(--color-done)",    bg: "var(--bg-done)",    href: "/tasks" },
  ];

  const destCountry = profile.destination_country || "Espanha";
  const destCity = profile.destination_city || "Menasalbas / Toledo";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {greeting}, {firstName}!
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: "var(--text-muted)" }}>
            vTasks Pro · Sincronizado em tempo real · Rumo a <span style={{ color: "var(--accent)" }}>{destCountry} ({destCity})</span>
          </p>
        </div>
      </header>

      {/* Grid de Estatísticas Básicas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, bg, href }) => (
          <Link key={label} href={href}>
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black" style={{ color: "var(--text)" }}>
                    {isLoading
                      ? <span className="inline-block w-8 h-6 rounded animate-pulse" style={{ background: "var(--border)" }} />
                      : value
                    }
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: "var(--text-faint)" }}>{label}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Divisor ImigraPro */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Plane className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <span>Jornada de Imigração (ImigraPro)</span>
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
            {destCountry} 2026
          </span>
        </div>

        {/* Grid de Módulos da Imigração */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Checklists */}
          <Link href="/checklists-viagem">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                    <ListTodo className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full">{docsPct}%</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Checklists</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {completedDocs} de {totalDocs} documentos prontos.<br />
                  Custo acumulado: <span className="font-bold">{formatMoney(docsCostBRL)}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-blue-500 transition-colors">Ver Documentos</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Custos Imigração */}
          <Link href="/custos-imigracao">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">Orçamento</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Planejador de Custos</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Estimado: <span className="font-bold">{formatMoney(totalEstBRL)}</span><br />
                  Realizado: <span className="font-bold text-emerald-600">{formatMoney(totalRealBRL)}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-emerald-500 transition-colors">Ajustar Finanças</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Regularização */}
          <Link href="/regularizacao">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-amber-600 font-mono bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full">{timelinePct}%</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Regularização</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Acompanhe as etapas de regularização migratória e o processo de arraigo.<br />
                  Concluídas: <span className="font-bold">{completedTimeline}/{totalTimeline}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-amber-500 transition-colors">Ver Regularização</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Malas */}
          <Link href="/checklists-viagem">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                    <Luggage className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-purple-600 font-mono bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded-full">{packingPct}%</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Preparativo de Malas</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Organização e vestuários divididos em malas e itens de mão.<br />
                  Prontos: <span className="font-bold">{completedPacking}/{totalPacking}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-purple-500 transition-colors">Arrumar Bagagens</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Família */}
          <Link href="/familia-imigracao">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-pink-600 font-mono bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400 px-2 py-0.5 rounded-full">{familyCount} membros</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Dados da Família</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Cadastro de RG, CPF, passaporte e datas para notificação em tempo real.<br />
                  Principal: <span className="font-bold">{principalName}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-pink-500 transition-colors">Ver Familiares</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Documentos */}
          <Link href="/documentos-imigracao">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9" }}>
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-sky-600 font-mono bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 px-2 py-0.5 rounded-full">{docsCount} arquivos</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Pasta de Documentos</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Upload seguro de arquivos digitais para manter cópias e alertas de validade.<br />
                  Sincronizado na nuvem.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-sky-500 transition-colors">Abrir Repositório</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Contatos */}
          <Link href="/contatos-imigracao">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" }}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-teal-600 font-mono bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400 px-2 py-0.5 rounded-full">{contactsCount} contatos</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Contatos Oficiais</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Telefones, e-mails, endereços e sedes eletrônicas de órgãos e ONGs no destino.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-teal-500 transition-colors">Visualizar Agenda</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Passeios */}
          <Link href="/passeios">
            <div className="card rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-full group" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                    <Coffee className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-red-600 font-mono bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full">{toursCount} passeios</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "var(--text)" }}>Lazer e Passeios</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Cronograma de atrações turísticas e integração local planejados para a chegada.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <span className="group-hover:text-red-500 transition-colors">Gerenciar Lazer</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* Atividade + Acesso Rápido de Produtividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Atividade Recente */}
        <section className="card rounded-2xl p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black" style={{ color: "var(--text)" }}>Atividade Recente</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--color-done)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tempo real
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-center py-10 text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
              Nenhuma atividade ainda
            </p>
          ) : (
            <div className="space-y-3">
              {activity.map(item => {
                const tokens = activityTokens(item);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: tokens.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{item.content}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {tokens.label}
                      </p>
                    </div>
                    <span className="text-[10px] font-black flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Acesso Rápido */}
        <section className="card rounded-2xl p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-black mb-5" style={{ color: "var(--text)" }}>Navegação Rápida</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            
            <Link href="/tasks">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Tarefas Gerais</h4>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Kanban de Produtividade</p>
                </div>
              </div>
            </Link>

            <Link href="/notes">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Minhas Notas</h4>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Anotações Autossave</p>
                </div>
              </div>
            </Link>

            <Link href="/calendar">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Calendário Produtivo</h4>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Agendamentos Gerais</p>
                </div>
              </div>
            </Link>

            <Link href="/expenses">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Controle de Gastos</h4>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Fluxo Financeiro Diário</p>
                </div>
              </div>
            </Link>

            <Link href="/regularizacao">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all col-span-1 sm:col-span-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>Processo de Regularização</h4>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Vistos, Arraigo e Documentação no Destino</p>
                </div>
              </div>
            </Link>

          </div>
        </section>
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <ImigracaoProvider>
      <HomeInner />
    </ImigracaoProvider>
  );
}
