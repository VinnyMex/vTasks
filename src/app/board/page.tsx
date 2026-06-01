"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutDashboard, Plus, Trash2, Loader2, GripVertical } from "lucide-react";

type ColId = Task["status"];
type Col = { id: ColId; title: string; dot: string; colBg: string; colBorder: string };

const COLS: Col[] = [
  { id: "todo",  title: "A Fazer",      dot: "#94a3b8", colBg: "var(--surface-2)",         colBorder: "var(--border)"              },
  { id: "doing", title: "Em Andamento", dot: "#3b82f6", colBg: "rgba(59,130,246,0.05)",    colBorder: "rgba(59,130,246,0.25)"      },
  { id: "done",  title: "Concluído",    dot: "#22c55e", colBg: "rgba(34,197,94,0.05)",     colBorder: "rgba(34,197,94,0.25)"       },
];

/* ── Coluna droppable ───────────────────────────────────────────────── */
function DroppableColumn({
  col, tasks, addingIn, newText,
  onSetAdding, onTextChange, onAdd, onMove, onDelete,
  isOver,
}: {
  col: Col;
  tasks: Task[];
  addingIn: string | null;
  newText: Record<string, string>;
  onSetAdding: (id: string | null) => void;
  onTextChange: (colId: string, val: string) => void;
  onAdd: (colId: ColId) => void;
  onMove: (task: Task, status: ColId) => void;
  onDelete: (id: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col w-72 md:flex-1 min-w-[280px] max-w-sm">
      {/* Header da coluna */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.dot }} />
        <h3 className="text-xs font-black uppercase tracking-wider flex-1" style={{ color: "var(--text-muted)" }}>
          {col.title}
        </h3>
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Área droppable */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto rounded-2xl p-3 space-y-3 transition-colors"
          style={{
            background: isOver ? (col.id === "todo" ? "rgba(148,163,184,0.12)" : col.id === "doing" ? "rgba(59,130,246,0.12)" : "rgba(34,197,94,0.12)") : col.colBg,
            border: `2px solid ${isOver ? col.dot : col.colBorder}`,
          }}
        >
          {tasks.map(task => (
            <SortableCard key={task.id} task={task} onMove={onMove} onDelete={onDelete} />
          ))}

          {/* Adicionar card */}
          {addingIn === col.id ? (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <textarea
                autoFocus
                rows={2}
                value={newText[col.id] || ""}
                onChange={e => onTextChange(col.id, e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAdd(col.id); }
                  if (e.key === "Escape") onSetAdding(null);
                }}
                placeholder="Descreva a tarefa..."
                className="w-full text-sm resize-none focus:outline-none min-h-[56px]"
                style={{ background: "transparent", color: "var(--text)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onAdd(col.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "#2563eb" }}
                >
                  Adicionar
                </button>
                <button
                  onClick={() => onSetAdding(null)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--text-muted)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSetAdding(col.id)}
              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{ border: "2px dashed var(--border)", color: "var(--text-faint)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--text-faint)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";      e.currentTarget.style.color = "var(--text-faint)"; }}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ── Card sortável ──────────────────────────────────────────────────── */
function SortableCard({
  task, onMove, onDelete,
}: {
  task: Task;
  onMove: (task: Task, status: ColId) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <div
        className="group rounded-xl p-3.5 transition-shadow"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-start gap-2">
          {/* Handle de drag */}
          <span
            {...listeners}
            {...attributes}
            className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ color: "var(--text-faint)" }}
          >
            <GripVertical className="w-4 h-4" />
          </span>

          <p className="flex-1 text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
            {task.content}
          </p>

          <button
            onClick={() => onDelete(task.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
            style={{ color: "var(--text-faint)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botões de mover */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {COLS.filter(c => c.id !== task.status).map(c => (
            <button
              key={c.id}
              onClick={() => onMove(task, c.id)}
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-all"
              style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.borderColor = col.dot; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-faint)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              → {c.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function col() { return COLS.find(c => c.id === task.status)!; }
}

/* ── Card do overlay (fantasma durante drag) ────────────────────────── */
function OverlayCard({ task }: { task: Task }) {
  return (
    <div
      className="rounded-xl p-3.5 rotate-2 shadow-2xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", width: 280, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{task.content}</p>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function BoardPage() {
  const { user } = useAuth();
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [addingIn, setAddingIn]     = useState<string | null>(null);
  const [newText, setNewText]       = useState<Record<string, string>>({});
  const [online, setOnline]         = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColId, setOverColId]   = useState<ColId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 10 } }),
  );

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("board_rt", { config: { presence: { key: crypto.randomUUID() } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .on("presence", { event: "sync" }, () => setOnline(Object.keys(ch.presenceState()).length))
      .subscribe(async s => { if (s === "SUBSCRIBED") await ch.track({ at: Date.now() }); });
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  /* ── Optimistic ─────────────────────────────────────────────────── */
  async function addCard(colId: ColId) {
    const text = newText[colId]?.trim();
    if (!text) return;
    const temp: Task = {
      id: `temp-${Date.now()}`, content: text, status: colId,
      project_id: null, priority: null, due_date: null, position: null,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, temp]);
    setNewText(p => ({ ...p, [colId]: "" }));
    setAddingIn(null);
    const { data } = await supabase.from("tasks").insert([{ content: text, status: colId, user_id: user!.id }]).select().single();
    if (data) setTasks(prev => prev.map(t => t.id === temp.id ? data : t));
  }

  async function moveTask(task: Task, newStatus: ColId) {
    if (task.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  /* ── DnD handlers ───────────────────────────────────────────────── */
  function onDragStart(e: DragStartEvent) {
    setActiveTask(tasks.find(t => t.id === e.active.id) ?? null);
    setOverColId(null);
  }

  function onDragOver(e: DragOverEvent) {
    const { over } = e;
    if (!over) { setOverColId(null); return; }

    // over pode ser um colId ou um taskId
    const colId = COLS.find(c => c.id === over.id)?.id
      ?? tasks.find(t => t.id === over.id)?.status
      ?? null;
    setOverColId(colId as ColId | null);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    setOverColId(null);

    if (!over) return;

    const srcTask = tasks.find(t => t.id === active.id);
    if (!srcTask) return;

    // Determina coluna destino: pode ser colId direto ou via task sobre a qual soltou
    const destColId: ColId | undefined =
      (COLS.find(c => c.id === over.id)?.id as ColId | undefined)
      ?? tasks.find(t => t.id === over.id)?.status;

    if (destColId && destColId !== srcTask.status) {
      await moveTask(srcTask, destColId);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div
          className="px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
              <LayoutDashboard className="w-5 h-5" style={{ color: "#8b5cf6" }} />
              Board Kanban
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Arraste os cartões entre colunas ou use os botões.
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {online} online
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8b5cf6" }} />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 h-full p-4 min-w-max md:min-w-0">
              {COLS.map(col => (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  tasks={tasks.filter(t => t.status === col.id)}
                  addingIn={addingIn}
                  newText={newText}
                  isOver={overColId === col.id}
                  onSetAdding={setAddingIn}
                  onTextChange={(id, val) => setNewText(p => ({ ...p, [id]: val }))}
                  onAdd={addCard}
                  onMove={moveTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {activeTask ? <OverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
