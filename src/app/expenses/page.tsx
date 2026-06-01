"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, type Expense } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { logActivity } from "@/lib/useActivityLog";
import { useRoleMap, resolveRole, canEdit, canDelete } from "@/lib/useMyRole";
import { ShareItemModal } from "@/components/ShareItemModal";
import {
  DollarSign, Plus, Trash2, Pencil, Check, X, Loader2,
  ChevronDown, ExternalLink, Search, SlidersHorizontal, ChevronUp, Share2, Lock,
} from "lucide-react";

const CURRENCIES = ["BRL", "EUR", "USD"] as const;
const CATEGORIES = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Viagem","Trabalho","Outro"];
const SYM: Record<string, string>      = { BRL: "R$", EUR: "€", USD: "$" };
const FLAG: Record<string, string>     = { BRL: "🇧🇷", EUR: "🇪🇺", USD: "🇺🇸" };
const CUR_COLOR: Record<string, string> = { BRL: "#10b981", EUR: "#3b82f6", USD: "#f59e0b" };
const PAGE_SIZE = 10;

type Form = {
  title: string; description: string; recipient: string;
  quantity: string; amount: string; currency: "BRL"|"EUR"|"USD";
  category: string; date: string; link: string;
};

const EMPTY: Form = {
  title: "", description: "", recipient: "", quantity: "1",
  amount: "", currency: "BRL", category: "Outro",
  date: new Date().toISOString().split("T")[0], link: "",
};

/** Retorna valor unitário × quantidade */
function calcTotal(e: Expense): number {
  const unit = e.currency === "BRL" ? (e.amount_brl ?? 0)
             : e.currency === "EUR" ? (e.amount_eur ?? 0)
             :                        (e.amount_usd ?? 0);
  return unit * (e.quantity ?? 1);
}

function fmt(v: number | null | undefined, s: string) {
  if (v == null) return "—";
  return `${s} ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>
      {label}{required && " *"}
    </label>
  );
}

// Colunas fixas para alinhar header e rows
const COL_WIDTHS = "grid-cols-[90px_1fr_120px_100px_60px_80px_110px_72px]";

export default function ExpensesPage() {
  const { user } = useAuth();
  const roleMap = useRoleMap();
  const [shareTarget, setShareTarget] = useState<Expense | null>(null);
  const [rows, setRows]           = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Form>(EMPTY);
  const [editId, setEditId]       = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(1);

  // Live search
  const [search, setSearch]       = useState("");

  // Advanced filter
  const [showFilter, setShowFilter] = useState(false);
  const [fCurrency, setFCurrency]   = useState<string>("Todas");
  const [fCategory, setFCategory]   = useState<string>("Todas");
  const [fDateFrom, setFDateFrom]   = useState("");
  const [fDateTo, setFDateTo]       = useState("");

  const F = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("expenses")
      .select("id, user_id, title, description, recipient, quantity, amount_brl, amount_eur, amount_usd, currency, category, date, link, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("expenses_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // ── Filtragem ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(e => {
      if (q && !e.title.toLowerCase().includes(q) &&
              !(e.description || "").toLowerCase().includes(q) &&
              !(e.recipient || "").toLowerCase().includes(q)) return false;
      if (fCurrency !== "Todas" && e.currency !== fCurrency) return false;
      if (fCategory !== "Todas" && e.category !== fCategory) return false;
      if (fDateFrom && e.date < fDateFrom) return false;
      if (fDateTo   && e.date > fDateTo)   return false;
      return true;
    });
  }, [rows, search, fCurrency, fCategory, fDateFrom, fDateTo]);

  const visible   = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = visible.length < filtered.length;

  const totals = filtered.reduce(
    (a, e) => {
      const qty = e.quantity ?? 1;
      return {
        brl: a.brl + (e.amount_brl || 0) * (e.currency === "BRL" ? qty : 1),
        eur: a.eur + (e.amount_eur || 0) * (e.currency === "EUR" ? qty : 1),
        usd: a.usd + (e.amount_usd || 0) * (e.currency === "USD" ? qty : 1),
      };
    },
    { brl: 0, eur: 0, usd: 0 }
  );

  function startEdit(e: Expense) {
    const role = resolveRole(user?.id, e.user_id, roleMap);
    if (!canEdit(role)) return;
    const cur = e.currency as "BRL"|"EUR"|"USD";
    const val = cur === "BRL" ? e.amount_brl : cur === "EUR" ? e.amount_eur : e.amount_usd;
    setForm({
      title: e.title, description: e.description || "", recipient: e.recipient || "",
      quantity: (e.quantity ?? 1).toString(), amount: val?.toString() || "",
      currency: cur, category: e.category || "Outro", date: e.date, link: e.link || "",
    });
    setEditId(e.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() { setForm(EMPTY); setEditId(null); setShowForm(false); }

  async function save() {
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    const val = parseFloat(form.amount.replace(",", "."));
    const qty = parseFloat(form.quantity) || 1;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      recipient: form.recipient.trim() || null,
      quantity: qty,
      currency: form.currency,
      category: form.category,
      date: form.date,
      link: form.link.trim() || null,
      amount_brl: form.currency === "BRL" ? val : null,
      amount_eur: form.currency === "EUR" ? val : null,
      amount_usd: form.currency === "USD" ? val : null,
    };

    if (editId) {
      setRows(prev => prev.map(r => r.id === editId ? { ...r, ...payload, id: editId, created_at: r.created_at } : r));
      await supabase.from("expenses").update(payload).eq("id", editId);
    } else {
      const temp: Expense = { id: `temp-${Date.now()}`, ...payload, created_at: new Date().toISOString() };
      setRows(prev => [temp, ...prev]);
      const { data } = await supabase.from("expenses").insert([{ ...payload, user_id: user!.id }]).select().single();
      if (data) {
        setRows(prev => prev.map(r => r.id === temp.id ? data : r));
        logActivity(user!.id, user!.id, "create", "expense", payload.title, data.id);
      }
    }
    resetForm();
    setSaving(false);
  }

  async function del(id: string) {
    const row = rows.find(r => r.id === id);
    const role = resolveRole(user?.id, row?.user_id, roleMap);
    if (!canDelete(role)) return;
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from("expenses").delete().eq("id", id);
    if (row) logActivity(user!.id, user!.id, "delete", "expense", row.title, id);
  }

  function resetFilters() {
    setSearch(""); setFCurrency("Todas"); setFCategory("Todas");
    setFDateFrom(""); setFDateTo(""); setPage(1);
  }

  const hasActiveFilter = search || fCurrency !== "Todas" || fCategory !== "Todas" || fDateFrom || fDateTo;

  const inputCls   = "w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all";
  const inputStyle = { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
            <DollarSign className="w-6 h-6" style={{ color: "#10b981" }} />
            Controle de Gastos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>BRL · EUR · USD — sincronização em tempo real.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{ background: "#10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}
        >
          <Plus className="w-4 h-4" /> Novo Gasto
        </button>
      </div>

      {/* ── Formulário ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-2xl p-5 fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base" style={{ color: "var(--text)" }}>{editId ? "Editar Gasto" : "Novo Gasto"}</h2>
            <button onClick={resetForm} style={{ color: "var(--text-faint)" }}><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldLabel label="Título" required />
              <input className={inputCls} style={inputStyle} value={form.title} onChange={F("title")} placeholder="Ex: Passagem aérea" />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel label="Descrição" />
              <input className={inputCls} style={inputStyle} value={form.description} onChange={F("description")} placeholder="Detalhes adicionais..." />
            </div>

            <div>
              <FieldLabel label="Recebedor" />
              <input className={inputCls} style={inputStyle} value={form.recipient} onChange={F("recipient")} placeholder="Ex: Latam Airlines" />
            </div>

            <div>
              <FieldLabel label="Data" required />
              <input type="date" className={inputCls} style={inputStyle} value={form.date} onChange={F("date")} />
            </div>

            <div>
              <FieldLabel label="Moeda + Valor" required />
              <div className="flex gap-2">
                <div className="relative flex-shrink-0">
                  <select
                    value={form.currency}
                    onChange={F("currency")}
                    className="appearance-none h-full pl-2 pr-7 text-sm font-bold rounded-xl outline-none cursor-pointer"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{FLAG[c]} {c}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
                <input type="number" step="0.01" min="0" className={`${inputCls} flex-1`} style={inputStyle} value={form.amount} onChange={F("amount")} placeholder="0,00" onWheel={e => e.currentTarget.blur()} />
              </div>
            </div>

            <div>
              <FieldLabel label="Quantidade" />
              <input type="number" step="0.001" min="0" className={inputCls} style={inputStyle} value={form.quantity} onChange={F("quantity")} placeholder="1" onWheel={e => e.currentTarget.blur()} />
            </div>

            <div>
              <FieldLabel label="Categoria" />
              <div className="relative">
                <select value={form.category} onChange={F("category")} className={`${inputCls} appearance-none cursor-pointer`} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel label="Link / Comprovante" />
              <input type="url" className={inputCls} style={inputStyle} value={form.link} onChange={F("link")} placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !form.title.trim() || !form.amount}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#10b981" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editId ? "Salvar" : "Adicionar"}
            </button>
            <button onClick={resetForm} className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Totais ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total BRL", v: totals.brl, s: "R$", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          { label: "Total EUR", v: totals.eur, s: "€",  color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
          { label: "Total USD", v: totals.usd, s: "$",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
        ].map(({ label, v, s, color, bg }) => (
          <div key={label} className="rounded-2xl p-3 md:p-4" style={{ background: bg, border: "1px solid var(--border)" }}>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>{label}</p>
            <p className="text-base md:text-lg font-black tabular-nums" style={{ color }}>{s} {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        ))}
      </div>

      {/* ── Barra de pesquisa + filtro ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* Live search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Pesquisar por título, descrição ou recebedor..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle filtro avançado */}
          <button
            onClick={() => setShowFilter(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
            style={{
              background: showFilter || hasActiveFilter ? "#2563eb" : "var(--surface)",
              color: showFilter || hasActiveFilter ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-white opacity-80" />}
            {showFilter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Painel de filtro avançado */}
        {showFilter && (
          <div className="rounded-2xl p-4 fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Moeda</p>
                <div className="relative">
                  <select value={fCurrency} onChange={e => { setFCurrency(e.target.value); setPage(1); }} className="w-full appearance-none text-sm px-3 py-2 rounded-xl outline-none cursor-pointer" style={inputStyle}>
                    <option>Todas</option>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Categoria</p>
                <div className="relative">
                  <select value={fCategory} onChange={e => { setFCategory(e.target.value); setPage(1); }} className="w-full appearance-none text-sm px-3 py-2 rounded-xl outline-none cursor-pointer" style={inputStyle}>
                    <option>Todas</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Data De</p>
                <input type="date" value={fDateFrom} onChange={e => { setFDateFrom(e.target.value); setPage(1); }} className="w-full text-sm px-3 py-2 rounded-xl outline-none" style={inputStyle} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Data Até</p>
                <input type="date" value={fDateTo} onChange={e => { setFDateTo(e.target.value); setPage(1); }} className="w-full text-sm px-3 py-2 rounded-xl outline-none" style={inputStyle} />
              </div>
            </div>

            {hasActiveFilter && (
              <button onClick={resetFilters} className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Cabeçalho desktop — mesmas colunas que as rows */}
        <div
          className={`hidden md:grid ${COL_WIDTHS} gap-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest`}
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", color: "var(--text-faint)" }}
        >
          <div>Data</div>
          <div>Título / Descrição</div>
          <div>Recebedor</div>
          <div>Categ.</div>
          <div className="text-right">Quant.</div>
          <div>Moeda</div>
          <div className="text-right">Valor</div>
          <div />
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#10b981" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
              {hasActiveFilter ? "Nenhum resultado para os filtros aplicados" : "Nenhum gasto registrado"}
            </p>
          </div>
        ) : (
          <>
            {visible.map(e => {
              const sym  = SYM[e.currency];
              const val  = calcTotal(e);
              const role = resolveRole(user?.id, e.user_id, roleMap);
              const allowEdit   = canEdit(role);
              const allowDelete = canDelete(role);
              const isOwnerOrAdmin = role === "owner" || role === "admin";
              return (
                <div key={e.id} className="group" style={{ borderBottom: "1px solid var(--border-subtle)" }}>

                  {/* Mobile */}
                  <div className="md:hidden p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{e.title}</p>
                        {e.description && <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{e.description}</p>}
                      </div>
                      <span className="font-black text-sm tabular-nums whitespace-nowrap flex-shrink-0" style={{ color: "#10b981" }}>{fmt(val, sym)}
                        {(e.quantity ?? 1) > 1 && <span className="text-[9px] font-bold ml-1 opacity-60">×{e.quantity}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                      <span>{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                      {e.recipient && <span>· {e.recipient}</span>}
                      {e.category && <span>· {e.category}</span>}
                      {e.quantity && e.quantity !== 1 && <span>· ×{e.quantity}</span>}
                      {role === "viewer" && <span className="flex items-center gap-1" style={{ color: "#6b7280" }}><Lock className="w-3 h-3" />Visualização</span>}
                      {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: "#3b82f6" }}><ExternalLink className="w-3 h-3" />Link</a>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      {allowEdit && (
                        <button onClick={() => startEdit(e)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          <Pencil className="w-3 h-3" />Editar
                        </button>
                      )}
                      {allowDelete && (
                        <button onClick={() => del(e.id)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <Trash2 className="w-3 h-3" />Excluir
                        </button>
                      )}
                      {isOwnerOrAdmin && (
                        <button onClick={() => setShareTarget(e)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.15)" }}>
                          <Share2 className="w-3 h-3" />Compartilhar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop — mesmas colunas do header */}
                  <div
                    className={`hidden md:grid ${COL_WIDTHS} gap-x-3 items-center px-4 py-3 transition-colors`}
                    onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                  >
                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{e.title}</p>
                      {e.description && <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{e.description}</p>}
                    </div>
                    <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{e.recipient || "—"}</span>
                    <span className="text-xs px-2 py-1 rounded-lg whitespace-nowrap font-bold text-center" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {e.category || "Outro"}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-right" style={{ color: "var(--text-muted)" }}>{(e.quantity ?? 1).toLocaleString("pt-BR")}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>{FLAG[e.currency]} {e.currency}</span>
                    <div className="text-right">
                      <span className="text-sm font-black tabular-nums whitespace-nowrap block" style={{ color: "#10b981" }}>{fmt(val, sym)}</span>
                      {(e.quantity ?? 1) > 1 && (
                        <span className="text-[9px] font-bold" style={{ color: "var(--text-faint)" }}>
                          {fmt(e.currency === "BRL" ? e.amount_brl : e.currency === "EUR" ? e.amount_eur : e.amount_usd, sym)} × {e.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.link && (
                        <a href={e.link} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: "#3b82f6" }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {role === "viewer" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: "#6b7280", background: "rgba(107,114,128,0.08)" }}>
                          <Lock className="w-3 h-3" />Leitura
                        </span>
                      )}
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => setShareTarget(e)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--text-faint)" }}
                          title="Compartilhar"
                          onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(37,99,235,0.1)")}
                          onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {allowEdit && (
                        <button
                          onClick={() => startEdit(e)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--text-faint)" }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(59,130,246,0.1)")}
                          onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          onClick={() => del(e.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--text-faint)" }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                          onMouseLeave={ev => (ev.currentTarget.style.background = "")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Rodapé */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Mostrando {visible.length} de {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
              </p>
              {hasMore && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Carregar mais 10
                </button>
              )}
            </div>
          </>
        )}

      </div>

      {shareTarget && (
        <ShareItemModal
          resourceType="expense"
          resourceId={shareTarget.id}
          resourceLabel={shareTarget.title}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}
