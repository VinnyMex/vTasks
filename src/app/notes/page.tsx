"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Note } from "@/lib/supabase";
import { FileText, Plus, Search, Trash2, Loader2, Save } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      setNotes(data || []);
      if (!selected && data && data.length > 0) {
        selectNote(data[0]);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
    const channel = supabase
      .channel("notes_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        fetchNotes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotes]);

  function selectNote(note: Note) {
    setSelected(note);
    setTitle(note.title || "");
    setContent(note.content || "");
    setLastSaved(null);
  }

  function scheduleAutoSave(noteId: string, newTitle: string, newContent: string) {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      await supabase.from("notes").update({ title: newTitle, content: newContent }).eq("id", noteId);
      setLastSaved(new Date().toLocaleTimeString("pt-BR"));
      setIsSaving(false);
    }, 1000);
    setSaveTimeout(timeout);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (selected) scheduleAutoSave(selected.id, val, content);
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (selected) scheduleAutoSave(selected.id, title, val);
  }

  async function createNote() {
    const { data, error } = await supabase
      .from("notes")
      .insert([{ title: "Nova Nota", content: "" }])
      .select()
      .single();
    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      selectNote(data);
    }
  }

  async function deleteNote(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) {
      const remaining = notes.filter(n => n.id !== id);
      if (remaining.length > 0) selectNote(remaining[0]);
      else { setSelected(null); setTitle(""); setContent(""); }
    }
  }

  const filtered = notes.filter(n =>
    (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-zinc-950">
      {/* Sidebar de Notas */}
      <div className="w-72 border-r border-zinc-100 dark:border-zinc-900 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 flex-shrink-0">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <h2 className="font-black text-zinc-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
            <FileText className="w-4 h-4 text-amber-500" />
            Notas
          </h2>
          <button
            onClick={createNote}
            className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar notas..."
              className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">Nenhuma nota</p>
            </div>
          ) : (
            filtered.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                  selected?.id === note.id
                    ? "bg-white dark:bg-zinc-800 border-amber-200 dark:border-amber-800 shadow-sm"
                    : "border-transparent hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-100 dark:hover:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate flex-1">
                    {note.title || "Sem título"}
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 rounded-lg transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 line-clamp-1 mt-1">{note.content || "Vazio..."}</p>
                <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-tighter mt-2 block">
                  {new Date(note.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-8 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-zinc-400 dark:text-zinc-600 italic flex items-center gap-2">
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
              ) : lastSaved ? (
                <><Save className="w-3.5 h-3.5 text-green-500" /> Salvo às {lastSaved}</>
              ) : (
                "Edite para salvar automaticamente"
              )}
            </span>
          </header>

          <main className="flex-1 overflow-y-auto p-8 md:p-12 max-w-3xl w-full mx-auto">
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Título da nota..."
              className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white w-full mb-6 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 focus:outline-none bg-transparent"
            />
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Comece a escrever..."
              className="w-full min-h-[60vh] resize-none text-zinc-700 dark:text-zinc-300 leading-relaxed text-base placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none bg-transparent"
            />
          </main>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest text-xs mb-4">Nenhuma nota selecionada</p>
            <button
              onClick={createNote}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            >
              Criar primeira nota
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
