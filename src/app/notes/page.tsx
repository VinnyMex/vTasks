"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, type Note } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { logActivity } from "@/lib/useActivityLog";
import { useRoleMap, resolveRole, canEdit, canDelete } from "@/lib/useMyRole";
import { useEmailById } from "@/lib/useEmailById";
import { ShareItemModal } from "@/components/ShareItemModal";
import {
  FileText, Plus, Search, Trash2, Loader2, Save, X,
  Bold, Italic, Strikethrough, Link2, Image as ImageIcon,
  List, ListOrdered, Minus, Share2, Lock,
} from "lucide-react";

/* ── Barra de ferramentas do editor ─────────────────────────────────── */
const TOOLS = [
  { cmd: "bold",          icon: Bold,           title: "Negrito (Ctrl+B)",    group: 1 },
  { cmd: "italic",        icon: Italic,         title: "Itálico (Ctrl+I)",    group: 1 },
  { cmd: "strikeThrough", icon: Strikethrough,  title: "Riscado",             group: 1 },
  { cmd: "insertUnorderedList", icon: List,      title: "Lista",               group: 2 },
  { cmd: "insertOrderedList",   icon: ListOrdered,title: "Lista numerada",    group: 2 },
];

function ToolButton({
  icon: Icon, title, active, onClick,
}: { icon: React.ElementType; title: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
      style={{
        background: active ? "rgba(37,99,235,0.15)" : "transparent",
        color: active ? "#2563eb" : "var(--text-muted)",
        border: active ? "1px solid rgba(37,99,235,0.3)" : "1px solid transparent",
      }}
      onMouseEnter={ev => { if (!active) ev.currentTarget.style.background = "var(--surface-2)"; }}
      onMouseLeave={ev => { if (!active) ev.currentTarget.style.background = "transparent"; }}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

/* ── Editor rico (contenteditable) ──────────────────────────────────── */
function RichEditor({
  initialHtml,
  onChange,
  readOnly = false,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const lastHtml   = useRef(initialHtml);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [linkModal, setLinkModal]         = useState(false);
  const [linkUrl, setLinkUrl]             = useState("https://");
  const savedRange = useRef<Range | null>(null);

  // Inicializa conteúdo sem disparar onChange
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
      lastHtml.current = initialHtml;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateActiveFormats() {
    setActiveFormats({
      bold:          document.queryCommandState("bold"),
      italic:        document.queryCommandState("italic"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
    });
  }

  function handleInput() {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
    updateActiveFormats();
  }

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  }

  // Colar imagem do clipboard
  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(i => i.type.startsWith("image/"));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const src = ev.target?.result as string;
        exec("insertHTML", `<img src="${src}" style="max-width:100%;border-radius:8px;margin:4px 0" />`);
      };
      reader.readAsDataURL(file);
      return;
    }
    // Colar texto puro sem formatação externa
    const plain = e.clipboardData.getData("text/plain");
    if (plain) {
      e.preventDefault();
      exec("insertText", plain);
    }
  }

  function openLinkModal() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
    setLinkUrl("https://");
    setLinkModal(true);
  }

  function insertLink() {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    editorRef.current?.focus();
    const text = savedRange.current.toString() || linkUrl;
    exec("insertHTML", `<a href="${linkUrl}" target="_blank" rel="noreferrer" style="color:#3b82f6;text-decoration:underline">${text}</a>`);
    setLinkModal(false);
  }

  function insertDivider() {
    exec("insertHTML", "<hr style='border:none;border-top:1px solid var(--border);margin:12px 0' /><br>");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — oculta no modo somente leitura */}
      {!readOnly && <div
        className="flex items-center gap-1 px-4 py-2 flex-shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface)" }}
      >
        {TOOLS.map((t, i) => {
          const prev = TOOLS[i - 1];
          const showSep = prev && prev.group !== t.group;
          return (
            <span key={t.cmd} className="flex items-center gap-1">
              {showSep && <span className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />}
              <ToolButton
                icon={t.icon}
                title={t.title}
                active={activeFormats[t.cmd]}
                onClick={() => exec(t.cmd)}
              />
            </span>
          );
        })}

        <span className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />

        {/* Link */}
        <ToolButton icon={Link2} title="Inserir link" onClick={openLinkModal} />

        {/* Imagem */}
        <ToolButton
          icon={ImageIcon}
          title="Inserir imagem (URL ou cole do clipboard)"
          onClick={() => {
            const url = prompt("URL da imagem:");
            if (url) exec("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:4px 0" />`);
          }}
        />

        {/* Divisor */}
        <ToolButton icon={Minus} title="Inserir linha divisória" onClick={insertDivider} />
      </div>}

      {/* Modal de link */}
      {linkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setLinkModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-black text-sm mb-3" style={{ color: "var(--text)" }}>Inserir link</p>
            <input
              autoFocus
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") insertLink(); if (e.key === "Escape") setLinkModal(false); }}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none mb-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="https://..."
            />
            <div className="flex gap-2">
              <button
                onClick={insertLink}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "#2563eb" }}
              >
                Inserir
              </button>
              <button
                onClick={() => setLinkModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Área editável */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--bg)" }}
      >
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={readOnly ? undefined : handleInput}
          onKeyUp={readOnly ? undefined : updateActiveFormats}
          onMouseUp={readOnly ? undefined : updateActiveFormats}
          onPaste={readOnly ? undefined : handlePaste}
          data-placeholder={readOnly ? "" : "Comece a escrever, cole uma imagem ou link..."}
          className="rich-editor outline-none min-h-full p-6 md:p-10 max-w-3xl mx-auto text-base leading-relaxed"
          style={{ color: "var(--text)", background: "transparent", cursor: readOnly ? "default" : "text" }}
        />
      </div>
    </div>
  );
}

/* ── NoteItem ───────────────────────────────────────────────────────── */
function NoteItem({ note, selected, onSelect, onDelete, onShare, role, emailById }: {
  note: Note;
  selected: Note | null;
  onSelect: (n: Note) => void;
  onDelete: (id: string) => void;
  onShare?: (n: Note) => void;
  role: import("@/lib/useMyRole").Role | null;
  emailById?: Record<string, string>;
}) {
  const isActive    = selected?.id === note.id;
  const allowDelete = canDelete(role);
  const isViewer    = role === "viewer";

  return (
    <div
      onClick={() => onSelect(note)}
      className="group p-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: isActive ? "var(--surface-2)" : "transparent",
        border: isActive ? "1px solid var(--border)" : "1px solid transparent",
      }}
      onMouseEnter={ev => { if (!isActive) ev.currentTarget.style.background = "var(--surface-2)"; }}
      onMouseLeave={ev => { if (!isActive) ev.currentTarget.style.background = "transparent"; }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm truncate flex-1" style={{ color: note.title ? "var(--text)" : "var(--text-faint)" }}>
          {note.title || "Sem título"}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {/* Compartilhar — só owner/admin */}
          {onShare && (role === "owner" || role === "admin") && (
            <button
              onClick={ev => { ev.stopPropagation(); onShare(note); }}
              className="p-1 rounded-lg transition-all flex-shrink-0"
              style={{ color: "var(--text-faint)" }}
              title="Compartilhar"
              onMouseEnter={ev => (ev.currentTarget.style.color = "#2563eb")}
              onMouseLeave={ev => (ev.currentTarget.style.color = "var(--text-faint)")}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Excluir — só owner/admin */}
          {allowDelete && (
            <button
              onClick={ev => { ev.stopPropagation(); onDelete(note.id); }}
              className="p-1 rounded-lg transition-all flex-shrink-0"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={ev => (ev.currentTarget.style.color = "#ef4444")}
              onMouseLeave={ev => (ev.currentTarget.style.color = "var(--text-faint)")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-faint)" }}>
        {note.content?.replace(/<[^>]+>/g, " ").trim() || "Vazia..."}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--text-faint)" }}>
          {new Date(note.created_at).toLocaleDateString("pt-BR")}
        </span>
        <div className="flex items-center gap-2">
          {isViewer && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: "#6b7280" }}>
              <Lock className="w-2.5 h-2.5" />Leitura
            </span>
          )}
          {note.updated_at && note.updated_at !== note.created_at && (
            <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>
              ✎{note.updated_by && emailById?.[note.updated_by] ? <strong style={{ color: "var(--text-muted)" }}> {emailById[note.updated_by]}</strong> : ""}{" "}
              {new Date(note.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function NotesPage() {
  const { user } = useAuth();
  const roleMap  = useRoleMap();
  const [notes, setNotes]             = useState<Note[]>([]);
  const emailById = useEmailById(notes.map(n => n.updated_by ?? null));
  const [shareTarget, setShareTarget] = useState<Note | null>(null);
  const [selected, setSelected]       = useState<Note | null>(null);
  const [title, setTitle]             = useState("");
  const [search, setSearch]           = useState("");
  const [isLoading, setIsLoading]     = useState(true);
  const [isSaving, setIsSaving]       = useState(false);
  const [lastSaved, setLastSaved]     = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editorKey, setEditorKey]     = useState(0); // força re-mount ao trocar nota
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentContent = useRef("");

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes")
      .select("id, user_id, title, content, created_at, updated_at, updated_by, project_id, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setNotes(data as Note[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
    const ch = supabase
      .channel("notes_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, fetchNotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchNotes]);

  function selectNote(note: Note) {
    setSelected(note);
    setTitle(note.title || "");
    currentContent.current = note.content || "";
    setLastSaved(null);
    setEditorKey(k => k + 1); // força re-mount do editor com novo conteúdo
    if (window.innerWidth < 768) setShowSidebar(false);
  }

  function scheduleAutoSave(noteId: string, newTitle: string, newContent: string, noteOwnerId?: string | null) {
    // Bloqueia save se viewer
    const role = resolveRole(user?.id, noteOwnerId, roleMap);
    if (!canEdit(role)) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      await supabase.from("notes").update({ title: newTitle, content: newContent }).eq("id", noteId);
      setLastSaved(new Date().toLocaleTimeString("pt-BR"));
      setIsSaving(false);
    }, 900);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (selected) {
      setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, title: val } : n));
      scheduleAutoSave(selected.id, val, currentContent.current, selected.user_id);
    }
  }

  function handleContentChange(html: string) {
    currentContent.current = html;
    // preview no sidebar: strip HTML para texto puro
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (selected) {
      setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, content: plain } : n));
      scheduleAutoSave(selected.id, title, html, selected.user_id);
    }
  }

  async function createNote() {
    const newNote = { title: "", content: "" };
    const temp: Note = {
      id: `temp-${Date.now()}`, ...newNote,
      project_id: null, type: null,
      created_at: new Date().toISOString(),
    };
    setNotes(prev => [temp, ...prev]);
    selectNote(temp);

    const { data, error } = await supabase
      .from("notes")
      .insert([{ ...newNote, user_id: user!.id }])
      .select("id, user_id, title, content, created_at, updated_at, updated_by, project_id, type")
      .single();
    if (!error && data) {
      setNotes(prev => prev.map(n => n.id === temp.id ? data as Note : n));
      setSelected(data as Note);
      logActivity(user!.id, user!.id, "create", "note", "Nova nota", data.id);
    }
  }

  async function deleteNote(id: string) {
    const note = notes.find(n => n.id === id);
    const role = resolveRole(user?.id, note?.user_id, roleMap);
    if (!canDelete(role)) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) {
      const remaining = notes.filter(n => n.id !== id);
      if (remaining.length > 0) selectNote(remaining[0]);
      else { setSelected(null); setTitle(""); currentContent.current = ""; }
    }
    await supabase.from("notes").delete().eq("id", id);
  }

  const filtered = notes.filter(n =>
    (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedRole = selected ? resolveRole(user?.id, selected.user_id, roleMap) : null;
  const selectedCanEdit = canEdit(selectedRole);

  return (
    <>
      {shareTarget && (
        <ShareItemModal
          resourceType="note"
          resourceId={shareTarget.id}
          resourceLabel={shareTarget.title || "Sem título"}
          onClose={() => setShareTarget(null)}
        />
      )}
      {/* CSS do editor rico */}
      <style>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text-faint);
          pointer-events: none;
          position: absolute;
        }
        .rich-editor { position: relative; }
        .rich-editor ul { list-style: disc; padding-left: 1.5rem; margin: 4px 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 4px 0; }
        .rich-editor li { margin: 2px 0; }
        .rich-editor a  { color: #3b82f6; text-decoration: underline; }
        .rich-editor img { max-width: 100%; border-radius: 8px; margin: 4px 0; display: block; cursor: pointer; }
        .rich-editor b, .rich-editor strong { font-weight: 700; }
        .rich-editor i, .rich-editor em { font-style: italic; }
        .rich-editor s, .rich-editor strike { text-decoration: line-through; }
        .rich-editor hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
        .rich-editor p  { margin: 0 0 4px 0; }
      `}</style>

      <div className="flex overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div
          className={`flex-shrink-0 flex flex-col transition-all duration-200 ${showSidebar ? "w-64" : "w-0 overflow-hidden"}`}
          style={{ borderRight: "1px solid var(--border)", background: "var(--sidebar-bg)" }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest" style={{ color: "var(--text)" }}>
              <FileText className="w-4 h-4" style={{ color: "#f59e0b" }} />
              Notas
            </h2>
            <button
              onClick={createNote}
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all active:scale-95"
              style={{ background: "#f59e0b", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}
              title="Nova nota"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Busca */}
          <div className="p-3 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar notas..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#f59e0b" }} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-10 text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                Nenhuma nota
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    selected={selected}
                    onSelect={selectNote}
                    onDelete={deleteNote}
                    onShare={setShareTarget}
                    role={resolveRole(user?.id, note.user_id, roleMap)}
                    emailById={emailById}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Editor ──────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "var(--bg)" }}>

          {/* Topbar do editor */}
          <div
            className="px-4 py-2.5 flex items-center justify-between flex-shrink-0 gap-3"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <button
              onClick={() => setShowSidebar(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={ev => (ev.currentTarget.style.background = "")}
              title={showSidebar ? "Ocultar painel" : "Mostrar painel"}
            >
              {showSidebar ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </button>

            <span className="text-xs italic flex items-center gap-1.5 flex-1" style={{ color: "var(--text-faint)" }}>
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</>
              ) : lastSaved ? (
                <><Save className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />Salvo às {lastSaved}</>
              ) : selected ? (
                "Auto-save ativo"
              ) : ""}
            </span>

            {!showSidebar && (
              <button
                onClick={createNote}
                className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0"
                style={{ background: "#f59e0b" }}
              >
                <Plus className="w-3.5 h-3.5" />Nova nota
              </button>
            )}
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Badge de somente leitura */}
              {selectedRole === "viewer" && (
                <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold flex-shrink-0" style={{ background: "rgba(107,114,128,0.08)", borderBottom: "1px solid var(--border)", color: "#6b7280" }}>
                  <Lock className="w-3 h-3" />
                  Somente visualização — você não tem permissão para editar esta nota
                </div>
              )}
              {/* Campo título */}
              <div className="px-6 md:px-10 pt-8 pb-2 flex-shrink-0 max-w-3xl mx-auto w-full">
                <input
                  type="text"
                  value={title}
                  onChange={e => selectedCanEdit ? handleTitleChange(e.target.value) : undefined}
                  readOnly={!selectedCanEdit}
                  placeholder="Título"
                  className="text-2xl md:text-3xl font-black w-full focus:outline-none"
                  style={{ background: "transparent", color: "var(--text)", cursor: selectedCanEdit ? "text" : "default" }}
                />
                <div className="mt-3 mb-0 h-px" style={{ background: "var(--border-subtle)" }} />
              </div>

              {/* Editor rico */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <RichEditor
                  key={editorKey}
                  initialHtml={selected.content || ""}
                  onChange={selectedCanEdit ? handleContentChange : () => undefined}
                  readOnly={!selectedCanEdit}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--border)" }} />
                <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-faint)" }}>
                  Nenhuma nota selecionada
                </p>
                <button
                  onClick={createNote}
                  className="text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: "#f59e0b", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}
                >
                  Criar primeira nota
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
