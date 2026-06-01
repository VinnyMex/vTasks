"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task, type Note, type Expense } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRoleMap } from "@/lib/useMyRole";
import type { Role } from "@/lib/useMyRole";
import {
  Share2, CheckCircle2, FileText, DollarSign,
  Loader2, Calendar, ChevronDown, ChevronRight,
  ArrowDownToLine, ArrowUpFromLine, Clock, Trash2, X, Save, Pencil,
} from "lucide-react";

/* ── Tipos ───────────────────────────────────────────────────────────── */
type PersonInfo = { id: string; email: string; role: string };

/* ── Helpers ─────────────────────────────────────────────────────────── */
const ROLE_COLOR: Record<string, string> = { viewer: "#6b7280", editor: "#3b82f6", admin: "#f59e0b" };
const ROLE_LABEL: Record<string, string> = { viewer: "Visual", editor: "Editor", admin: "Admin" };

function canEdit(role: Role | string | null): boolean {
  return role === "owner" || role === "admin" || role === "editor";
}
function canDelete(role: Role | string | null): boolean {
  return role === "owner" || role === "admin";
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: `${ROLE_COLOR[role] ?? "#6b7280"}22`, color: ROLE_COLOR[role] ?? "#6b7280" }}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "agora mesmo";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ── Seção colapsável ────────────────────────────────────────────────── */
function Section({ icon: Icon, color, label, count, children }: {
  icon: React.ElementType; color: string; label: string; count: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
        onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
        onMouseLeave={ev => (ev.currentTarget.style.background = "")}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="font-black text-sm flex-1" style={{ color: "var(--text)" }}>{label}</span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
          {count}
        </span>
        {open
          ? <ChevronDown  className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
        }
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

/* ── PersonGroup ─────────────────────────────────────────────────────── */
function PersonGroup({ person, accent, lastUpdated, lastUpdatedByEmail, children }: {
  person: PersonInfo;
  accent: string;
  lastUpdated?: string;
  lastUpdatedByEmail?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0"
          style={{ background: `${accent}18`, color: accent }}>
          {person.email[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: "var(--text-muted)" }}>{person.email}</p>
          {lastUpdated && (
            <p className="text-[9px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
              <Clock className="w-2.5 h-2.5" />
              {lastUpdatedByEmail
                ? <><strong style={{ color: "var(--text-muted)" }}>{lastUpdatedByEmail}</strong> · {fmtDate(lastUpdated)}</>
                : timeAgo(lastUpdated)
              }
            </p>
          )}
        </div>
        <RoleBadge role={person.role} />
      </div>
      <div className="pl-8 space-y-2">{children}</div>
    </div>
  );
}

/* ── Cards de item ───────────────────────────────────────────────────── */
function TaskItemCard({ task, role, onToggle, onDelete }: {
  task: Task;
  role: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const STATUS_COLOR: Record<string, string> = { todo: "#94a3b8", doing: "#3b82f6", done: "#22c55e" };
  const STATUS_LABEL: Record<string, string> = { todo: "A fazer", doing: "Em andamento", done: "Concluído" };
  const allowEdit   = canEdit(role);
  const allowDelete = canDelete(role);

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => allowEdit && onToggle(task)}
        className={`flex-shrink-0 transition-transform ${allowEdit ? "active:scale-75" : "cursor-default opacity-50"}`}
        title={allowEdit ? "Alterar status" : "Sem permissão"}
      >
        {task.status === "done"
          ? <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
          : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: STATUS_COLOR[task.status] }} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{
          color: "var(--text)",
          textDecoration: task.status === "done" ? "line-through" : "none",
          opacity: task.status === "done" ? 0.6 : 1,
        }}>{task.content}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] font-bold" style={{ color: STATUS_COLOR[task.status] }}>
            {STATUS_LABEL[task.status]}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
            {new Date(task.created_at).toLocaleDateString("pt-BR")}
          </span>
          {task.updated_at && task.updated_at !== task.created_at && (
            <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
              · editado {fmtDate(task.updated_at)}
            </span>
          )}
        </div>
      </div>
      {allowDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0"
          style={{ color: "var(--text-faint)" }}
          onMouseEnter={ev => (ev.currentTarget.style.color = "#ef4444")}
          onMouseLeave={ev => (ev.currentTarget.style.color = "var(--text-faint)")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function NoteItemCard({ note, role, onClick }: { note: Note; role: string; onClick: () => void }) {
  const preview = (note.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const allowEdit = canEdit(role);
  return (
    <div
      onClick={onClick}
      className="group p-3 rounded-xl cursor-pointer transition-all"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      onMouseEnter={ev => (ev.currentTarget.style.background = "var(--bg)")}
      onMouseLeave={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold truncate flex-1" style={{ color: "var(--text)" }}>{note.title || "Sem título"}</p>
        {allowEdit && <Pencil className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-60" style={{ color: "var(--text-faint)" }} />}
      </div>
      {preview && <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-faint)" }}>{preview}</p>}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
          {new Date(note.created_at).toLocaleDateString("pt-BR")}
        </span>
        {note.updated_at && note.updated_at !== note.created_at && (
          <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
            · editado {fmtDate(note.updated_at)}
          </span>
        )}
      </div>
    </div>
  );
}

function ExpenseItemCard({ expense }: { expense: Expense }) {
  const SYM: Record<string, string> = { BRL: "R$", EUR: "€", USD: "$" };
  const unit  = expense.currency === "BRL" ? (expense.amount_brl ?? 0)
              : expense.currency === "EUR" ? (expense.amount_eur ?? 0)
              : (expense.amount_usd ?? 0);
  const total = unit * (expense.quantity ?? 1);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
            {new Date(expense.date + "T12:00:00").toLocaleDateString("pt-BR")}
            {expense.category ? ` · ${expense.category}` : ""}
          </span>
          {expense.updated_at && expense.updated_at !== expense.created_at && (
            <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
              · editado {fmtDate(expense.updated_at)}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-black flex-shrink-0" style={{ color: "#10b981" }}>
        {SYM[expense.currency]} {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

/* ── Modal de nota ───────────────────────────────────────────────────── */
function NoteModal({ note, role, onClose, onSave }: {
  note: Note;
  role: string;
  onClose: () => void;
  onSave: (updated: Note) => Promise<void>;
}) {
  const [draft, setDraft]   = useState(note);
  const [saving, setSaving] = useState(false);
  const allowEdit = canEdit(role);

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
              Nota Compartilhada
            </span>
            {!allowEdit && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
                Somente leitura
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={ev => (ev.currentTarget.style.background = "")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-8">
          <input
            value={draft.title || ""}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            readOnly={!allowEdit}
            placeholder="Sem título"
            className="text-2xl md:text-3xl font-black w-full outline-none mb-4"
            style={{ background: "transparent", color: "var(--text)", cursor: allowEdit ? "text" : "default" }}
          />
          {note.updated_at && note.updated_at !== note.created_at && (
            <p className="text-[10px] mb-4 flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
              <Clock className="w-3 h-3" />
              Última edição: {fmtDate(note.updated_at)}
            </p>
          )}
          <div className="h-px mb-6" style={{ background: "var(--border-subtle)" }} />
          <textarea
            value={(draft.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
            readOnly={!allowEdit}
            placeholder={allowEdit ? "Conteúdo da nota..." : ""}
            className="w-full min-h-[250px] bg-transparent outline-none text-base leading-relaxed resize-none"
            style={{ color: "var(--text)", cursor: allowEdit ? "text" : "default" }}
          />
        </div>

        {/* Footer — só aparece se pode editar */}
        {allowEdit && (
          <div className="flex justify-end px-5 pb-5 pt-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{ background: "#2563eb" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function SharedPage() {
  const { user }  = useAuth();
  const roleMap   = useRoleMap();
  const [loading, setLoading] = useState(true);

  const [viewNote, setViewNote] = useState<{ note: Note; role: string } | null>(null);

  // Recebidos
  const [recOwners,   setRecOwners]   = useState<PersonInfo[]>([]);
  const [recTasks,    setRecTasks]    = useState<{ ownerId: string; items: Task[] }[]>([]);
  const [recNotes,    setRecNotes]    = useState<{ ownerId: string; items: Note[] }[]>([]);
  const [recExpenses, setRecExpenses] = useState<{ ownerId: string; items: Expense[] }[]>([]);

  // Enviados
  const [sentMembers,  setSentMembers]  = useState<PersonInfo[]>([]);
  const [sentTasks,    setSentTasks]    = useState<Task[]>([]);
  const [sentNotes,    setSentNotes]    = useState<Note[]>([]);
  const [sentExpenses, setSentExpenses] = useState<Expense[]>([]);

  const fetchItems = useCallback(async () => {
    if (!user) return;

    // ── RECEBIDOS ──
    const { data: ownerMemberships } = await supabase
      .from("members")
      .select("owner_id, email, role")
      .eq("member_id", user.id);

    const ownerList: PersonInfo[] = (ownerMemberships ?? []).map(r => ({
      id: r.owner_id, email: r.email, role: r.role,
    }));
    setRecOwners(ownerList);

    if (ownerList.length > 0) {
      const ownerIds = ownerList.map(o => o.id);
      const { data: myShares } = await supabase
        .from("shares")
        .select("resource, resource_id, owner_id")
        .in("owner_id", ownerIds)
        .eq("member_id", user.id);

      const sharedTaskIds    = new Set((myShares ?? []).filter(s => s.resource === "task").map(s => s.resource_id as string));
      const sharedNoteIds    = new Set((myShares ?? []).filter(s => s.resource === "note").map(s => s.resource_id as string));
      const sharedExpenseIds = new Set((myShares ?? []).filter(s => s.resource === "expense").map(s => s.resource_id as string));

      const [{ data: allTasks }, { data: allNotes }, { data: allExpenses }] = await Promise.all([
        sharedTaskIds.size > 0
          ? supabase.from("tasks").select("id, user_id, content, status, priority, due_date, position, created_at, updated_at, updated_by, project_id").in("id", [...sharedTaskIds])
          : Promise.resolve({ data: [] }),
        sharedNoteIds.size > 0
          ? supabase.from("notes").select("id, user_id, title, content, created_at, updated_at, updated_by, project_id, type").in("id", [...sharedNoteIds])
          : Promise.resolve({ data: [] }),
        sharedExpenseIds.size > 0
          ? supabase.from("expenses").select("id, user_id, title, description, recipient, quantity, amount_brl, amount_eur, amount_usd, currency, category, date, link, created_at, updated_at, updated_by").in("id", [...sharedExpenseIds])
          : Promise.resolve({ data: [] }),
      ]);

      setRecTasks(ownerList.map(o => ({
        ownerId: o.id,
        items: ((allTasks ?? []) as Task[]).filter(t => t.user_id === o.id),
      })));
      setRecNotes(ownerList.map(o => ({
        ownerId: o.id,
        items: ((allNotes ?? []) as Note[]).filter(n => n.user_id === o.id),
      })));
      setRecExpenses(ownerList.map(o => ({
        ownerId: o.id,
        items: ((allExpenses ?? []) as Expense[]).filter(e => e.user_id === o.id),
      })));
    }

    // ── ENVIADOS ──
    const { data: myMembers } = await supabase
      .from("members")
      .select("member_id, email, role")
      .eq("owner_id", user.id);

    const memberList: PersonInfo[] = (myMembers ?? []).map(m => ({
      id: m.member_id, email: m.email, role: m.role,
    }));
    setSentMembers(memberList);

    if (memberList.length > 0) {
      const { data: mySentShares } = await supabase
        .from("shares")
        .select("resource, resource_id")
        .eq("owner_id", user.id);

      const sentTaskIds    = (mySentShares ?? []).filter(s => s.resource === "task").map(s => s.resource_id as string);
      const sentNoteIds    = (mySentShares ?? []).filter(s => s.resource === "note").map(s => s.resource_id as string);
      const sentExpenseIds = (mySentShares ?? []).filter(s => s.resource === "expense").map(s => s.resource_id as string);

      const [{ data: sTasks }, { data: sNotes }, { data: sExpenses }] = await Promise.all([
        sentTaskIds.length > 0
          ? supabase.from("tasks").select("id, user_id, content, status, priority, due_date, position, created_at, updated_at, updated_by, project_id").in("id", sentTaskIds)
          : Promise.resolve({ data: [] }),
        sentNoteIds.length > 0
          ? supabase.from("notes").select("id, user_id, title, content, created_at, updated_at, updated_by, project_id, type").in("id", sentNoteIds)
          : Promise.resolve({ data: [] }),
        sentExpenseIds.length > 0
          ? supabase.from("expenses").select("id, user_id, title, description, recipient, quantity, amount_brl, amount_eur, amount_usd, currency, category, date, link, created_at, updated_at, updated_by").in("id", sentExpenseIds)
          : Promise.resolve({ data: [] }),
      ]);

      setSentTasks((sTasks ?? []) as Task[]);
      setSentNotes((sNotes ?? []) as Note[]);
      setSentExpenses((sExpenses ?? []) as Expense[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
    const ch = supabase
      .channel("shared_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, fetchItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchItems]);

  async function toggleTask(task: Task) {
    const next: Task["status"] = task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo";
    // Optimistic
    const update = (prev: { ownerId: string; items: Task[] }[]) =>
      prev.map(g => ({ ...g, items: g.items.map(t => t.id === task.id ? { ...t, status: next } : t) }));
    setRecTasks(update);
    setSentTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await supabase.from("tasks").update({ status: next }).eq("id", task.id);
  }

  async function deleteSharedTask(id: string) {
    // Remove o share (não o item em si)
    await supabase.from("shares").delete().eq("resource", "task").eq("resource_id", id).eq("owner_id", user!.id);
    fetchItems();
  }

  async function saveNote(updated: Note) {
    await supabase.from("notes").update({ title: updated.title, content: updated.content }).eq("id", updated.id);
    // Atualiza local
    setRecNotes(prev => prev.map(g => ({ ...g, items: g.items.map(n => n.id === updated.id ? { ...n, ...updated } : n) })));
    setSentNotes(prev => prev.map(n => n.id === updated.id ? { ...n, ...updated } : n));
    setViewNote(null);
  }

  // Mapa email por ID para mostrar "quem editou" — carrega sob demanda via members
  const [emailById, setEmailById] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!user) return;
    // Coleta todos os IDs únicos de updated_by que precisamos resolver
    const allItems = [
      ...recTasks.flatMap(g => g.items),
      ...recNotes.flatMap(g => g.items),
      ...sentTasks,
      ...sentNotes,
    ];
    const unknownIds = [...new Set(
      allItems
        .map(i => (i as Task | Note).updated_by)
        .filter((id): id is string => !!id && !emailById[id])
    )];
    if (unknownIds.length === 0) return;

    // Busca via members table (email já está lá)
    supabase
      .from("members")
      .select("member_id, email")
      .in("member_id", unknownIds)
      .then(({ data }) => {
        if (!data?.length) return;
        setEmailById(prev => {
          const next = { ...prev };
          for (const row of data) next[row.member_id] = row.email;
          return next;
        });
      });

    // Também verifica se sou eu (user.id)
    if (unknownIds.includes(user.id) && !emailById[user.id]) {
      setEmailById(prev => ({ ...prev, [user.id]: "Você" }));
    }
  }, [recTasks, recNotes, sentTasks, sentNotes, user, emailById]);

  const hasReceived = recTasks.some(g => g.items.length) || recNotes.some(g => g.items.length) || recExpenses.some(g => g.items.length);
  const hasSent     = sentTasks.length > 0 || sentNotes.length > 0 || sentExpenses.length > 0;

  function getLastUpdated(items: (Task | Note | Expense)[]) {
    return items.reduce((a, i) => { const d = i.updated_at ?? i.created_at; return d > a ? d : a; }, "");
  }

  function getLastUpdatedEmail(items: (Task | Note | Expense)[]) {
    const latest = items.reduce<Task | Note | Expense | null>((best, i) => {
      const d = i.updated_at ?? i.created_at;
      const bd = best ? (best.updated_at ?? best.created_at) : "";
      return d > bd ? i : best;
    }, null);
    const updatedBy = latest && (latest as Task).updated_by;
    return updatedBy ? emailById[updatedBy] : undefined;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
          <Share2 className="w-6 h-6" style={{ color: "#8b5cf6" }} />
          Compartilhados
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Itens que você recebeu ou enviou para colaboração.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#8b5cf6" }} />
        </div>
      ) : !hasReceived && !hasSent ? (
        <div className="text-center py-24 rounded-3xl" style={{ border: "2px dashed var(--border)" }}>
          <Share2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--border)" }} />
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Nenhum item compartilhado ainda
          </p>
          <p className="text-xs mt-2 max-w-xs mx-auto" style={{ color: "var(--text-faint)" }}>
            Use o ícone de compartilhar em tarefas, notas ou gastos para enviar a membros cadastrados.
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── RECEBIDOS ── */}
          {hasReceived && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(139,92,246,0.2)" }} />
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <ArrowDownToLine className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#8b5cf6" }}>
                    Recebidos de outros
                  </span>
                </div>
                <div className="h-px flex-1" style={{ background: "rgba(139,92,246,0.2)" }} />
              </div>
              <div className="space-y-4">

                {recTasks.some(g => g.items.length > 0) && (
                  <Section icon={CheckCircle2} color="#3b82f6" label="Tarefas"
                    count={recTasks.reduce((a, g) => a + g.items.length, 0)}>
                    {recTasks.map(g => {
                      if (!g.items.length) return null;
                      const owner = recOwners.find(o => o.id === g.ownerId)!;
                      const role  = roleMap[g.ownerId] ?? "viewer";
                      return (
                        <PersonGroup key={g.ownerId} person={owner} accent="#8b5cf6"
                          lastUpdated={getLastUpdated(g.items) || undefined}
                          lastUpdatedByEmail={getLastUpdatedEmail(g.items)}>
                          {g.items.map(t => (
                            <TaskItemCard key={t.id} task={t} role={role}
                              onToggle={toggleTask}
                              onDelete={deleteSharedTask}
                            />
                          ))}
                        </PersonGroup>
                      );
                    })}
                  </Section>
                )}

                {recNotes.some(g => g.items.length > 0) && (
                  <Section icon={FileText} color="#f59e0b" label="Notas"
                    count={recNotes.reduce((a, g) => a + g.items.length, 0)}>
                    {recNotes.map(g => {
                      if (!g.items.length) return null;
                      const owner = recOwners.find(o => o.id === g.ownerId)!;
                      const role  = roleMap[g.ownerId] ?? "viewer";
                      return (
                        <PersonGroup key={g.ownerId} person={owner} accent="#8b5cf6"
                          lastUpdated={getLastUpdated(g.items) || undefined}
                          lastUpdatedByEmail={getLastUpdatedEmail(g.items)}>
                          {g.items.map(n => (
                            <NoteItemCard key={n.id} note={n} role={role}
                              onClick={() => setViewNote({ note: n, role })}
                            />
                          ))}
                        </PersonGroup>
                      );
                    })}
                  </Section>
                )}

                {recExpenses.some(g => g.items.length > 0) && (
                  <Section icon={DollarSign} color="#10b981" label="Gastos"
                    count={recExpenses.reduce((a, g) => a + g.items.length, 0)}>
                    {recExpenses.map(g => {
                      if (!g.items.length) return null;
                      const owner = recOwners.find(o => o.id === g.ownerId)!;
                      return (
                        <PersonGroup key={g.ownerId} person={owner} accent="#8b5cf6"
                          lastUpdated={getLastUpdated(g.items) || undefined}
                          lastUpdatedByEmail={getLastUpdatedEmail(g.items)}>
                          {g.items.map(e => <ExpenseItemCard key={e.id} expense={e} />)}
                        </PersonGroup>
                      );
                    })}
                  </Section>
                )}
              </div>
            </div>
          )}

          {/* ── ENVIADOS ── */}
          {hasSent && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(37,99,235,0.2)" }} />
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(37,99,235,0.08)" }}>
                  <ArrowUpFromLine className="w-3.5 h-3.5" style={{ color: "#2563eb" }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#2563eb" }}>
                    Enviados por mim
                  </span>
                </div>
                <div className="h-px flex-1" style={{ background: "rgba(37,99,235,0.2)" }} />
              </div>
              <div className="space-y-4">

                {sentTasks.length > 0 && (
                  <Section icon={CheckCircle2} color="#3b82f6" label="Tarefas" count={sentTasks.length}>
                    {sentMembers.map(m => (
                      <PersonGroup key={m.id} person={m} accent="#2563eb"
                        lastUpdated={getLastUpdated(sentTasks) || undefined}
                        lastUpdatedByEmail={getLastUpdatedEmail(sentTasks)}>
                        {sentTasks.map(t => (
                          <TaskItemCard key={t.id} task={t} role="owner"
                            onToggle={toggleTask}
                            onDelete={deleteSharedTask}
                          />
                        ))}
                      </PersonGroup>
                    ))}
                  </Section>
                )}

                {sentNotes.length > 0 && (
                  <Section icon={FileText} color="#f59e0b" label="Notas" count={sentNotes.length}>
                    {sentMembers.map(m => (
                      <PersonGroup key={m.id} person={m} accent="#2563eb"
                        lastUpdated={getLastUpdated(sentNotes) || undefined}
                        lastUpdatedByEmail={getLastUpdatedEmail(sentNotes)}>
                        {sentNotes.map(n => (
                          <NoteItemCard key={n.id} note={n} role="owner"
                            onClick={() => setViewNote({ note: n, role: "owner" })}
                          />
                        ))}
                      </PersonGroup>
                    ))}
                  </Section>
                )}

                {sentExpenses.length > 0 && (
                  <Section icon={DollarSign} color="#10b981" label="Gastos" count={sentExpenses.length}>
                    {sentMembers.map(m => (
                      <PersonGroup key={m.id} person={m} accent="#2563eb"
                        lastUpdated={getLastUpdated(sentExpenses) || undefined}
                        lastUpdatedByEmail={getLastUpdatedEmail(sentExpenses)}>
                        {sentExpenses.map(e => <ExpenseItemCard key={e.id} expense={e} />)}
                      </PersonGroup>
                    ))}
                  </Section>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de nota */}
      {viewNote && (
        <NoteModal
          note={viewNote.note}
          role={viewNote.role}
          onClose={() => setViewNote(null)}
          onSave={saveNote}
        />
      )}
    </div>
  );
}
