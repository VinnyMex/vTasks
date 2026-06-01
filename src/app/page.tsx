"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { ListTodo, FileText, LayoutDashboard, Calendar as CalendarIcon, Users, Zap, ArrowRight, Plus, TrendingUp, Clock, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<Stats>({ tasks: 0, notes: 0, doing: 0, done: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const userName = (user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Usuário") as string;
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("home_rt", { config: { presence: { key: Math.random().toString(36).slice(2) } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, fetchData)
      .on("presence", { event: "sync" }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .subscribe(async s => { if (s === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() }); });
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

  const statCards = [
    { icon: ListTodo,       label: "Tarefas Ativas", value: stats.tasks, iconColor: "#3b82f6", bg: "rgba(59,130,246,0.1)",  href: "/tasks" },
    { icon: LayoutDashboard,label: "Em Andamento",   value: stats.doing, iconColor: "#8b5cf6", bg: "rgba(139,92,246,0.1)", href: "/board" },
    { icon: FileText,       label: "Notas",           value: stats.notes, iconColor: "#f59e0b", bg: "rgba(245,158,11,0.1)", href: "/notes" },
    { icon: Zap,            label: "Concluídas",      value: stats.done,  iconColor: "#22c55e", bg: "rgba(34,197,94,0.1)",  href: "/tasks" },
  ];

  const quickLinks = [
    { icon: ListTodo,       label: "Gerenciar Tarefas",  desc: "Adicione, complete e organize",   href: "/tasks",    iconColor: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
    { icon: LayoutDashboard,label: "Quadro Kanban",       desc: "Visualize o fluxo de trabalho",   href: "/board",    iconColor: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    { icon: FileText,       label: "Minhas Notas",        desc: "Escreva e salve automaticamente", href: "/notes",    iconColor: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { icon: CalendarIcon,   label: "Calendário",          desc: "Tarefas e gastos por data",       href: "/calendar", iconColor: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {greeting}, {firstName}!
          </h1>

          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>
            vTasks Pro · sincronizado em tempo real
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest w-fit"
          style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <Users className="w-3.5 h-3.5" />
          {onlineCount} {onlineCount === 1 ? "pessoa" : "pessoas"} online
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, iconColor, bg, href }) => (
          <Link key={label} href={href}>
            <div
              className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--card-shadow)")}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <p className="text-3xl font-black" style={{ color: "var(--text)" }}>
                {isLoading
                  ? <span className="inline-block w-8 h-6 rounded animate-pulse" style={{ background: "var(--border)" }} />
                  : value
                }
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: "var(--text-faint)" }}>{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Atividade + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Atividade Recente */}
        <section className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black" style={{ color: "var(--text)" }}>Atividade Recente</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: "#16a34a" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
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
              {activity.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: item.type === "note"     ? "#f59e0b"
                                : item.status === "done"   ? "#22c55e"
                                : item.status === "doing"  ? "#3b82f6"
                                : "var(--border)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{item.content}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {item.type === "note"     ? "Nota"
                       : item.status === "done"  ? "Concluída"
                       : item.status === "doing" ? "Em andamento"
                       : "A fazer"}
                    </p>
                  </div>
                  <span className="text-[10px] font-black flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acesso Rápido */}
        <section className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-base font-black mb-5" style={{ color: "var(--text)" }}>Acesso Rápido</h2>
          <div className="space-y-2">
            {quickLinks.map(({ icon: Icon, label, desc, href, iconColor, bg }) => (
              <Link key={href} href={href}>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ border: "1px solid transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
