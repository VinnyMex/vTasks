"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { Plus, CheckCircle2, Trash2, Calendar, Loader2, CheckSquare } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
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

    // Realtime — sincroniza mudanças de qualquer usuário
    const channel = supabase
      .channel("tasks_realtime", { config: { presence: { key: Math.random().toString(36).slice(2) } } })
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

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setIsAdding(true);
    const { error } = await supabase.from("tasks").insert([{ content: newTask.trim(), status: "todo" }]);
    if (!error) setNewTask("");
    setIsAdding(false);
  }

  async function toggleTask(task: Task) {
    const cycle: Record<string, Task["status"]> = { todo: "doing", doing: "done", done: "todo" };
    await supabase.from("tasks").update({ status: cycle[task.status] }).eq("id", task.id);
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
  }

  const todo = tasks.filter(t => t.status === "todo");
  const doing = tasks.filter(t => t.status === "doing");
  const done = tasks.filter(t => t.status === "done");

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <header className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Tarefas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">Foco no que realmente importa.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {onlineCount} online agora
        </div>
      </header>

      <form onSubmit={addTask} className="mb-10">
        <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
          <Plus className="w-5 h-5 ml-3 text-zinc-300 dark:text-zinc-600" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-white px-4 py-3 text-base placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium outline-none"
          />
          <button
            type="submit"
            disabled={isAdding || !newTask.trim()}
            className="bg-blue-600 text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
          <CheckSquare className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest text-xs">Nenhuma tarefa ainda</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { label: "A Fazer", items: todo, color: "text-zinc-500 dark:text-zinc-400" },
            { label: "Em Andamento", items: doing, color: "text-blue-600 dark:text-blue-400" },
            { label: "Concluído", items: done, color: "text-green-600 dark:text-green-400" },
          ].map(({ label, items, color }) =>
            items.length > 0 && (
              <div key={label}>
                <h2 className={cn("text-[10px] font-black uppercase tracking-widest mb-4", color)}>
                  {label} · {items.length}
                </h2>
                <div className="space-y-3">
                  {items.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-center gap-5 p-5 bg-white dark:bg-zinc-900 border rounded-2xl transition-all cursor-pointer",
                        task.status === "done"
                          ? "opacity-50 border-zinc-100 dark:border-zinc-800"
                          : "border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/5"
                      )}
                    >
                      <button onClick={() => toggleTask(task)} className="flex-shrink-0 transition-transform active:scale-75">
                        {task.status === "done" ? (
                          <CheckCircle2 className="w-7 h-7 text-green-500" />
                        ) : task.status === "doing" ? (
                          <div className="w-7 h-7 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-blue-400 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0" onClick={() => toggleTask(task)}>
                        <p className={cn(
                          "text-base font-semibold text-zinc-900 dark:text-white truncate",
                          task.status === "done" && "line-through decoration-zinc-300 dark:decoration-zinc-600 text-zinc-400 dark:text-zinc-600"
                        )}>
                          {task.content}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {task.priority && (
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                              task.priority === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                              task.priority === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                              "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            )}>
                              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
