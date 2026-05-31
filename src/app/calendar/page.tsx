"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function CalendarPage() {
  const todayDate = new Date();
  const [current, setCurrent] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newTaskText, setNewTaskText] = useState("");

  const fetchTasks = useCallback(async () => {
    const start = new Date(current.year, current.month, 1).toISOString();
    const end   = new Date(current.year, current.month + 1, 0, 23, 59, 59).toISOString();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("due_date", start)
      .lte("due_date", end);
    if (!error) setTasks(data || []);
    setIsLoading(false);
  }, [current]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("calendar_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells       = Array.from({ length: 35 }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  function getTasksForDay(day: number) {
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getDate() === day && d.getMonth() === current.month && d.getFullYear() === current.year;
    });
  }

  const isToday = (day: number) =>
    day === todayDate.getDate() &&
    current.month === todayDate.getMonth() &&
    current.year  === todayDate.getFullYear();

  async function addTaskOnDay(day: number) {
    if (!newTaskText.trim()) return;
    const dueDate = new Date(current.year, current.month, day, 12).toISOString();
    await supabase.from("tasks").insert([{ content: newTaskText.trim(), status: "todo", due_date: dueDate }]);
    setNewTaskText("");
    setSelectedDay(null);
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
            <CalendarIcon className="text-green-600 w-6 h-6" />
            Calendário
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Tarefas com data de entrega.</p>
        </div>
        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setCurrent(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
            className="p-2.5 hover:bg-[var(--surface-2)] border-r border-[var(--border)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <span className="px-5 font-black text-sm text-[var(--text)]">
            {MONTHS[current.month]} {current.year}
          </span>
          <button
            onClick={() => setCurrent(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
            className="p-2.5 hover:bg-[var(--surface-2)] border-l border-[var(--border)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col shadow-sm">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)] flex-shrink-0">
          {WEEK_DAYS.map(d => (
            <div key={d} className="p-3 text-center text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 grid-rows-5 divide-x divide-y divide-[var(--border-subtle)] overflow-hidden">
            {cells.map((day, i) => {
              const dayTasks = day ? getTasksForDay(day) : [];
              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(selectedDay === day ? null : day)}
                  className={`p-2 min-h-0 transition-colors group cursor-pointer relative ${
                    !day
                      ? "opacity-25 pointer-events-none"
                      : isToday(day)
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {day && (
                    <>
                      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-black rounded-full mb-1 ${
                        isToday(day)
                          ? "bg-blue-600 text-white shadow shadow-blue-500/30"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text)]"
                      }`}>
                        {day}
                      </span>

                      <div className="space-y-0.5 overflow-hidden">
                        {dayTasks.slice(0, 2).map(t => (
                          <div key={t.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                            t.status === "done"  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                            t.status === "doing" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                            "bg-[var(--surface-2)] text-[var(--text-muted)]"
                          }`}>
                            {t.content}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <p className="text-[9px] font-bold text-[var(--text-faint)] px-1">
                            +{dayTasks.length - 2}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); setSelectedDay(day); }}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 bg-blue-600 text-white rounded-md flex items-center justify-center transition-all hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm fade-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-black text-[var(--text)] mb-1">Nova tarefa</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4 font-medium">
              {selectedDay} de {MONTHS[current.month]} de {current.year}
            </p>
            <input
              autoFocus
              type="text"
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter")  addTaskOnDay(selectedDay);
                if (e.key === "Escape") setSelectedDay(null);
              }}
              placeholder="Descreva a tarefa..."
              className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => addTaskOnDay(selectedDay)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
              >
                Adicionar
              </button>
              <button
                onClick={() => setSelectedDay(null)}
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--border)] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
