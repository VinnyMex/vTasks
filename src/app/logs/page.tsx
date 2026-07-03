"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Activity, Trash2, PenLine, Plus, Loader2, RefreshCw } from "lucide-react";

type Log = {
  id: string;
  user_id: string;
  owner_id: string;
  action: "create" | "update" | "delete";
  resource: "task" | "note" | "expense";
  resource_id: string | null;
  description: string | null;
  created_at: string;
  user_email?: string;
};

const ACTION_ICON: Record<string, React.ElementType> = {
  create: Plus,
  update: PenLine,
  delete: Trash2,
};
const ACTION_COLOR: Record<string, { color: string; bg: string }> = {
  create: { color: "var(--color-done)",   bg: "var(--bg-done)"   },
  update: { color: "var(--color-doing)",  bg: "var(--bg-doing)"  },
  delete: { color: "var(--color-danger)", bg: "var(--bg-danger)" },
};
const ACTION_LABEL: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Excluiu",
};
const RESOURCE_LABEL: Record<string, string> = {
  task:    "tarefa",
  note:    "nota",
  expense: "gasto",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs]         = useState<Log[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "task" | "note" | "expense">("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as Log[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime: escuta novos logs
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("logs-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "activity_logs",
        filter: `owner_id=eq.${user.id}`,
      }, payload => {
        setLogs(prev => [payload.new as Log, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.resource === filter);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-danger)" }}>
            <Activity className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
          </div>
          <div>
            <h1 className="text-lg font-black" style={{ color: "var(--text)" }}>Log de Atividades</h1>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>Monitoramento em tempo real de todas as ações</p>
          </div>
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
          style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all","task","note","expense"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: filter === f ? "var(--accent)" : "var(--surface-2)",
              color: filter === f ? "#fff" : "var(--text-muted)",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {{ all: "Todos", task: "Tarefas", note: "Notas", expense: "Gastos" }[f]}
          </button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: "var(--text-faint)" }}>
          {filtered.length} registros
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Activity className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-faint)" }}>Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const Icon = ACTION_ICON[log.action] ?? Activity;
            const tokens = ACTION_COLOR[log.action] ?? { color: "var(--text-muted)", bg: "var(--surface-2)" };
            const isSelf = log.user_id === user?.id;
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: tokens.bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: tokens.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {isSelf ? "Você" : (log.user_email ?? "Membro")}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: tokens.color }}>
                      {ACTION_LABEL[log.action]}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {RESOURCE_LABEL[log.resource] ?? log.resource}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>
                      {log.description}
                    </p>
                  )}
                </div>
                <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {fmtDate(log.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
