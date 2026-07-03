"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, type Task } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { logActivity } from "@/lib/useActivityLog";
import { ShareItemModal } from "@/components/ShareItemModal";
import { Plus, CheckCircle2, Trash2, Calendar, Loader2, CheckSquare, Share2, Lock, Pencil, X, Save, AlertTriangle } from "lucide-react";
import { useRoleMap, resolveRole, canEdit, canDelete } from "@/lib/useMyRole";
import { useEmailById } from "@/lib/useEmailById";

/* ── Mini popup de confirmação ─────────────────────────────────────────── */
function ConfirmPopup({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 modal-overlay" onClick={onCancel} />
      <div
        className="relative rounded-2xl px-6 py-5 shadow-2xl w-full max-w-xs fade-up"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-bold mb-4 text-center" style={{ color: "var(--text)" }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95"
            style={{ background: "var(--accent)" }}
          >
            Sim
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal de edição ────────────────────────────────────────────────────── */
function EditModal({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (id: string, content: string, due_date: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [content, setContent] = useState(task.content);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(task.id, content.trim(), dueDate || null);
    setSaving(false);
    onClose();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 modal-overlay" onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 shadow-2xl w-full max-w-md fade-up"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Pencil className="w-4 h-4" style={{ color: "var(--color-doing)" }} />
            Editar Tarefa
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campo texto */}
        <div className="mb-4">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>
            Descrição
          </label>
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Descreva a tarefa..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Campo prazo */}
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>
            Prazo <span style={{ color: "var(--text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: dueDate ? "var(--text)" : "var(--text-faint)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-all"
                style={{ color: "var(--text-faint)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-faint)")}
                title="Remover prazo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {!dueDate && (
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-faint)" }}>
              Sem prazo — tarefa fica em aberto até ser concluída.
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers de prazo ───────────────────────────────────────────────────── */
function getDueDateState(due_date: string | null | undefined, status: Task["status"]) {
  if (!due_date || status === "done") return null;
  // Compara só a data (sem hora) em horário local
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(due_date + "T00:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return "overdue";   // vencida
  if (diff === 0) return "today";    // vence hoje
  if (diff === 1) return "tomorrow"; // vence amanhã
  return "future";                   // data futura
}

function DueBadge({ due_date, status }: { due_date: string | null | undefined; status: Task["status"] }) {
  const state = getDueDateState(due_date, status);
  if (!state || !due_date) return null;

  const fmt = new Date(due_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (state === "overdue") return (
    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse"
      style={{ background: "var(--bg-danger)", color: "var(--color-danger)", border: "1px solid var(--color-danger)" }}>
      <AlertTriangle className="w-2.5 h-2.5" />
      Vencida · {fmt}
    </span>
  );

  if (state === "today") return (
    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: "var(--bg-warning)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" }}>
      <Calendar className="w-2.5 h-2.5" />
      Hoje · {fmt}
    </span>
  );

  if (state === "tomorrow") return (
    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: "var(--bg-doing)", color: "var(--color-doing)", border: "1px solid var(--color-doing)" }}>
      <Calendar className="w-2.5 h-2.5" />
      Amanhã · {fmt}
    </span>
  );

  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: "var(--surface-2)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>
      <Calendar className="w-2.5 h-2.5" />
      {fmt}
    </span>
  );
}

/* ── STATUS ─────────────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<Task["status"], string> = {
  todo:  "A Fazer",
  doing: "Em Andamento",
  done:  "Concluído",
};
const STATUS_NEXT: Record<Task["status"], Task["status"]> = {
  todo: "doing", doing: "done", done: "todo",
};

/* ── TaskCard ────────────────────────────────────────────────────────────── */
function TaskCard({ task, onToggle, onDelete, onShare, onEdit, role, emailById }: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  onShare: (t: Task) => void;
  onEdit: (t: Task) => void;
  role: import("@/lib/useMyRole").Role | null;
  emailById: Record<string, string>;
}) {
  const allowEdit   = canEdit(role);
  const allowDelete = canDelete(role);
  const isViewer    = role === "viewer";
  const editorEmail = task.updated_by ? emailById[task.updated_by] : undefined;
  const isOverdue   = getDueDateState(task.due_date, task.status) === "overdue";

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all"
      style={{
        background: "var(--surface)",
        border: isOverdue ? "1px solid var(--color-danger)" : "1px solid var(--border)",
        boxShadow: isOverdue ? "0 0 0 1px var(--bg-danger), var(--card-shadow)" : "var(--card-shadow)",
        opacity: task.status === "done" ? 0.6 : 1,
      }}
    >
      {/* Botão status */}
      <button
        onClick={() => allowEdit ? onToggle(task) : undefined}
        className={`flex-shrink-0 transition-transform ${allowEdit ? "active:scale-75" : "cursor-not-allowed opacity-50"}`}
        title={allowEdit ? `Mover para ${STATUS_LABEL[STATUS_NEXT[task.status]]}` : "Sem permissão para alterar status"}
      >
        {task.status === "done" ? (
          <CheckCircle2 className="w-6 h-6" style={{ color: "var(--color-done)" }} />
        ) : task.status === "doing" ? (
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "var(--color-doing)", background: "var(--bg-doing)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-doing)" }} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 transition-colors" style={{ borderColor: isOverdue ? "var(--color-danger)" : "var(--border)" }} />
        )}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: task.status === "done" ? "var(--text-faint)" : isOverdue ? "var(--color-danger)" : "var(--text)", textDecoration: task.status === "done" ? "line-through" : "none" }}>
          {task.content}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Data de criação */}
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            <Calendar className="w-3 h-3" />
            {new Date(task.created_at).toLocaleDateString("pt-BR")}
          </span>

          {/* Prazo */}
          <DueBadge due_date={task.due_date} status={task.status} />

          {/* Quem editou */}
          {task.updated_at && task.updated_at !== task.created_at && (
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              · editado {editorEmail ? <strong style={{ color: "var(--text-muted)" }}>{editorEmail}</strong> : ""}{" "}
              {new Date(task.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {/* Prioridade */}
          {task.priority && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={task.priority === "high" ? { background: "var(--bg-danger)", color: "var(--color-danger)" } :
                     task.priority === "medium" ? { background: "var(--bg-warning)", color: "var(--color-warning)" } :
                     { background: "var(--surface-2)", color: "var(--text-faint)" }}>
              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
            </span>
          )}

          {/* Badge viewer */}
          {isViewer && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "rgba(142,142,147,0.1)", color: "var(--text-muted)" }}>
              <Lock className="w-2.5 h-2.5" />Visualização
            </span>
          )}
        </div>
      </div>

      {/* Botão editar — só quem pode editar */}
      {allowEdit && (
        <button onClick={() => onEdit(task)}
          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{ color: "var(--text-faint)" }}
          title="Editar"
          onMouseEnter={ev => { ev.currentTarget.style.background = "var(--bg-doing)"; ev.currentTarget.style.color = "var(--color-doing)"; }}
          onMouseLeave={ev => { ev.currentTarget.style.background = ""; ev.currentTarget.style.color = "var(--text-faint)"; }}>
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Botão compartilhar — só owner/admin */}
      {(role === "owner" || role === "admin") && (
        <button onClick={() => onShare(task)}
          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{ color: "var(--text-faint)" }}
          title="Compartilhar"
          onMouseEnter={ev => { ev.currentTarget.style.background = "var(--accent-muted)"; ev.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={ev => { ev.currentTarget.style.background = ""; ev.currentTarget.style.color = "var(--text-faint)"; }}>
          <Share2 className="w-4 h-4" />
        </button>
      )}

      {/* Botão excluir — owner/admin */}
      {allowDelete && (
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{ color: "var(--text-faint)" }}
          onMouseEnter={ev => (ev.currentTarget.style.background = "var(--bg-danger)")}
          onMouseLeave={ev => (ev.currentTarget.style.background = "")}>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function TasksPage() {
  const { user } = useAuth();
  const roleMap  = useRoleMap();
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [shareTarget, setShareTarget]   = useState<Task | null>(null);
  const [editTarget, setEditTarget]     = useState<Task | null>(null);
  const emailById = useEmailById(tasks.map(t => t.updated_by ?? null));
  const [newTask, setNewTask]           = useState("");
  const [isLoading, setIsLoading]       = useState(true);
  const [isAdding, setIsAdding]         = useState(false);
  const [onlineCount, setOnlineCount]   = useState(0);
  const [confirm, setConfirm]           = useState<{ task: Task; next: Task["status"] } | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("id, user_id, content, status, priority, due_date, position, created_at, updated_at, updated_by, project_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setTasks(data || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("tasks_realtime", { config: { presence: { key: Math.random().toString(36).slice(2) } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .on("presence", { event: "sync" }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .subscribe(async status => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setIsAdding(true);
    const temp: Task = {
      id: `temp-${Date.now()}`, content: newTask.trim(), status: "todo",
      project_id: null, priority: null, due_date: null, position: null,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [temp, ...prev]);
    setNewTask("");
    const { data } = await supabase.from("tasks").insert([{ content: temp.content, status: "todo", user_id: user!.id }]).select().single();
    if (data) {
      setTasks(prev => prev.map(t => t.id === temp.id ? data : t));
      logActivity(user!.id, user!.id, "create", "task", temp.content, data.id);
    }
    setIsAdding(false);
  }

  async function saveEdit(id: string, content: string, due_date: string | null) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, content, due_date } : t));
    await supabase.from("tasks").update({ content, due_date }).eq("id", id);
  }

  function requestToggle(task: Task) {
    const role = resolveRole(user?.id, task.user_id, roleMap);
    if (!canEdit(role)) return;
    setConfirm({ task, next: STATUS_NEXT[task.status] });
  }

  async function confirmToggle() {
    if (!confirm) return;
    const { task, next } = confirm;
    setConfirm(null);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await supabase.from("tasks").update({ status: next }).eq("id", task.id);
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  const myTasks = tasks.filter(t => !t.user_id || t.user_id === user?.id);

  // Ordena: vencidas primeiro (dentro de cada grupo), depois por due_date asc, depois sem prazo
  function sortByDue(list: Task[]) {
    return [...list].sort((a, b) => {
      const stateA = getDueDateState(a.due_date, a.status);
      const stateB = getDueDateState(b.due_date, b.status);
      // vencidas no topo
      if (stateA === "overdue" && stateB !== "overdue") return -1;
      if (stateB === "overdue" && stateA !== "overdue") return 1;
      // depois por data asc
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      return 0;
    });
  }

  function makeGroups(list: Task[]) {
    return [
      { label: "A Fazer",      dot: "var(--color-pending)", items: sortByDue(list.filter(t => t.status === "todo"))  },
      { label: "Em Andamento", dot: "var(--color-doing)", items: sortByDue(list.filter(t => t.status === "doing")) },
      { label: "Concluído",    dot: "var(--color-done)", items: list.filter(t => t.status === "done")             },
    ];
  }

  return (
    <>
      {confirm && (
        <ConfirmPopup
          message={`Mover tarefa para "${STATUS_LABEL[confirm.next]}"?`}
          onConfirm={confirmToggle}
          onCancel={() => setConfirm(null)}
        />
      )}

      {editTarget && (
        <EditModal
          task={editTarget}
          onSave={saveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
              <CheckSquare className="w-6 h-6" style={{ color: "var(--color-doing)" }} />
              Tarefas
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Foco no que realmente importa.</p>
          </div>
          <div
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: "var(--bg-done)", color: "var(--color-done)", border: "1px solid var(--color-done)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--color-done)" }} />
            {onlineCount} online
          </div>
        </header>

        {/* Adicionar tarefa */}
        <form onSubmit={addTask} className="mb-8">
          <div
            className="relative flex items-center rounded-2xl p-2"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
          >
            <Plus className="w-5 h-5 ml-3 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Nova tarefa..."
              className="flex-1 bg-transparent px-4 py-3 text-base outline-none"
              style={{ color: "var(--text)" }}
            />
            <button
              type="submit"
              disabled={isAdding || !newTask.trim()}
              className="w-11 h-11 rounded-xl text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--color-doing)" }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ border: "2px dashed var(--border)" }}>
            <CheckSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border)" }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Nenhuma tarefa ainda</p>
          </div>
        ) : (
          <div className="space-y-8">
            {makeGroups(myTasks).map(({ label, dot, items }) =>
              items.length > 0 && (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                    <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                      {label} · {items.length}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {items.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={requestToggle}
                        onDelete={deleteTask}
                        onShare={setShareTarget}
                        onEdit={setEditTarget}
                        role={resolveRole(user?.id, task.user_id, roleMap)}
                        emailById={emailById}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {shareTarget && (
          <ShareItemModal
            resourceType="task"
            resourceId={shareTarget.id}
            resourceLabel={shareTarget.content}
            onClose={() => setShareTarget(null)}
          />
        )}
      </div>
    </>
  );
}
