"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ListTodo, FileText, Layout, Calendar as CalendarIcon, TrendingUp, Users, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Stats {
  tasks: number;
  notes: number;
  doing: number;
  done: number;
}

interface Activity {
  id: string;
  content: string;
  type: "task" | "note";
  created_at: string;
  status?: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ tasks: 0, notes: 0, doing: 0, done: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("home_realtime", { config: { presence: { key: Math.random().toString(36).slice(2) } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, fetchData)
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const [tasksRes, notesRes] = await Promise.all([
      supabase.from("tasks").select("id, content, status, created_at").order("created_at", { ascending: false }),
      supabase.from("notes").select("id, title, content, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const tasks = tasksRes.data || [];
    const notes = notesRes.data || [];

    setStats({
      tasks: tasks.filter(t => t.status !== "done").length,
      notes: notes.length,
      doing: tasks.filter(t => t.status === "doing").length,
      done: tasks.filter(t => t.status === "done").length,
    });

    const recentTasks: Activity[] = tasks.slice(0, 4).map(t => ({
      id: t.id,
      content: t.content,
      type: "task",
      created_at: t.created_at,
      status: t.status,
    }));

    const recentNotes: Activity[] = notes.slice(0, 2).map(n => ({
      id: n.id,
      content: n.title || n.content?.slice(0, 60) || "Nota sem título",
      type: "note",
      created_at: n.created_at,
    }));

    const combined = [...recentTasks, ...recentNotes]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    setActivity(combined);
    setIsLoading(false);
  }

  function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            {greeting}, Vinny!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            vTasks Pro · sincronizado em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800 w-fit">
          <Users className="w-3.5 h-3.5" />
          {onlineCount} {onlineCount === 1 ? "pessoa" : "pessoas"} online agora
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ListTodo, label: "Tarefas Ativas", value: stats.tasks, color: "bg-blue-600", shadow: "shadow-blue-500/20", href: "/tasks" },
          { icon: Layout,   label: "Em Andamento",  value: stats.doing, color: "bg-purple-600", shadow: "shadow-purple-500/20", href: "/board" },
          { icon: FileText, label: "Notas",          value: stats.notes, color: "bg-amber-500", shadow: "shadow-amber-500/20", href: "/notes" },
          { icon: Zap,      label: "Concluídas",     value: stats.done,  color: "bg-green-600", shadow: "shadow-green-500/20", href: "/tasks" },
        ].map(({ icon: Icon, label, value, color, shadow, href }) => (
          <Link key={label} href={href}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white mb-4 shadow-lg ${shadow}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">
                {isLoading
                  ? <span className="inline-block w-8 h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  : value
                }
              </p>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Atividade + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Atividade Recente</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Tempo real
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">Nenhuma atividade ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    item.type === "note"    ? "bg-amber-500" :
                    item.status === "done" ? "bg-green-500" :
                    item.status === "doing"? "bg-blue-500"  : "bg-zinc-300 dark:bg-zinc-600"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.content}</p>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mt-0.5">
                      {item.type === "note"    ? "Nota"        :
                       item.status === "done" ? "Concluída"   :
                       item.status === "doing"? "Em andamento": "A fazer"}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-wider flex-shrink-0">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight mb-6">Acesso Rápido</h2>
          <div className="space-y-2">
            {[
              { icon: ListTodo,    label: "Gerenciar Tarefas",   desc: "Adicione, complete e organize",       href: "/tasks",    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
              { icon: Layout,      label: "Quadro Kanban",        desc: "Visualize o fluxo de trabalho",       href: "/board",    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
              { icon: FileText,    label: "Minhas Notas",         desc: "Escreva e salve automaticamente",     href: "/notes",    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
              { icon: CalendarIcon,label: "Calendário",           desc: "Tarefas com datas de entrega",        href: "/calendar", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
            ].map(({ icon: Icon, label, desc, href, color }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Barra de Progresso */}
      {!isLoading && (stats.tasks + stats.done) > 0 && (
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-lg tracking-tight">Progresso Geral</h2>
              <p className="text-blue-200 text-sm font-medium mt-0.5">
                {stats.done} de {stats.tasks + stats.done} tarefas concluídas
              </p>
            </div>
            <p className="text-4xl font-black">
              {Math.round((stats.done / (stats.tasks + stats.done)) * 100)}%
            </p>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((stats.done / (stats.tasks + stats.done)) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <TrendingUp className="w-4 h-4 text-blue-200" />
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
              {stats.doing > 0 ? `${stats.doing} em andamento agora` : "Nenhuma tarefa em andamento"}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
