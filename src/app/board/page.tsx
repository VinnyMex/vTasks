"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { Layout as LayoutIcon, Plus, Trash2, Loader2 } from "lucide-react";

const COLUMNS: { id: Task["status"]; title: string; color: string; dot: string }[] = [
  { id: "todo",  title: "A Fazer",       color: "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800",    dot: "bg-zinc-400" },
  { id: "doing", title: "Em Andamento",  color: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900",    dot: "bg-blue-500" },
  { id: "done",  title: "Concluído",     color: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900", dot: "bg-green-500" },
];

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCardText, setNewCardText] = useState<Record<string, string>>({});
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setTasks(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("board_realtime", { config: { presence: { key: Math.random().toString(36).slice(2) } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  async function addCard(colId: Task["status"]) {
    const text = newCardText[colId]?.trim();
    if (!text) return;
    await supabase.from("tasks").insert([{ content: text, status: colId }]);
    setNewCardText(p => ({ ...p, [colId]: "" }));
    setAddingIn(null);
  }

  async function moveTask(task: Task, newStatus: Task["status"]) {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-[calc(100vh-4rem)]">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <LayoutIcon className="text-purple-600 w-6 h-6" />
            Quadro Kanban
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Arraste ou mova cartões entre colunas.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {onlineCount} online
        </div>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-5 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-80 flex-shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-black text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    {col.title}
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                      {colTasks.length}
                    </span>
                  </h3>
                </div>

                <div className={`flex-1 rounded-2xl border-2 ${col.color} p-3 space-y-3 overflow-y-auto`}>
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                    >
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug mb-3">{task.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {COLUMNS.filter(c => c.id !== col.id).map(c => (
                            <button
                              key={c.id}
                              onClick={() => moveTask(task, c.id)}
                              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all border border-zinc-100 dark:border-zinc-700"
                            >
                              → {c.title}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {addingIn === col.id ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
                      <textarea
                        autoFocus
                        value={newCardText[col.id] || ""}
                        onChange={e => setNewCardText(p => ({ ...p, [col.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCard(col.id); }
                          if (e.key === "Escape") setAddingIn(null);
                        }}
                        placeholder="Descreva a tarefa..."
                        className="w-full text-sm text-zinc-900 dark:text-white bg-transparent resize-none focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 min-h-[60px]"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => addCard(col.id)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all">
                          Adicionar
                        </button>
                        <button onClick={() => setAddingIn(null)} className="text-zinc-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingIn(col.id)}
                      className="w-full py-2.5 bg-white/60 dark:bg-zinc-900/60 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 dark:text-zinc-600 text-xs font-bold hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Cartão
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
