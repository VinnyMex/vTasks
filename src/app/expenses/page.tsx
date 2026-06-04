"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase, type Expense } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { logActivity } from "@/lib/useActivityLog";
import { useRoleMap, resolveRole, canEdit, canDelete } from "@/lib/useMyRole";
import { ShareItemModal } from "@/components/ShareItemModal";
import {
  DollarSign, Plus, Trash2, Pencil, Check, X, Loader2,
  ChevronDown, ExternalLink, Search, SlidersHorizontal, ChevronUp, Share2, Lock,
  RefreshCw, Camera, FileImage, Eye, Paperclip
} from "lucide-react";

const CATEGORIES = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Viagem","Trabalho","Outro"];
const PAGE_SIZE = 10;

type Form = {
  title: string; description: string; recipient: string;
  quantity: string; amount: string; currency: string;
  category: string; date: string; link: string;
  receipt_url: string | null;
};

const EMPTY: Form = {
  title: "", description: "", recipient: "", quantity: "1",
  amount: "", currency: "BRL", category: "Outro",
  date: new Date().toISOString().split("T")[0], link: "",
  receipt_url: null,
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>
      {label}{required && " *"}
    </label>
  );
}

// Colunas fixas para alinhar header e rows
const COL_WIDTHS = "grid-cols-[90px_1fr_120px_100px_60px_80px_110px_90px]";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();
  const roleMap = useRoleMap();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [shareTarget, setShareTarget] = useState<Expense | null>(null);
  const [rows, setRows]           = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Form>({ ...EMPTY, currency: primaryCurrency });
  const [editId, setEditId]       = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
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

  /** 
   * Converte um gasto para um valor numérico na moeda base (Primary) 
   */
  const getAmountInPrimary = useCallback((e: Expense) => {
    const qty = e.quantity ?? 1;
    // Pega o valor original baseado no campo preenchido
    const amount = e.currency === "BRL" ? (e.amount_brl ?? 0)
                 : e.currency === "EUR" ? (e.amount_eur ?? 0)
                 : (e.amount_usd ?? 0);
    const totalOrig = amount * qty;

    if (e.currency === primaryCurrency) return totalOrig;
    if (e.currency === secondaryCurrency) return totalOrig * exchangeRate;
    
    // Fallback: se não for nenhuma das duas, assume-se que primaryCurrency lida com o valor original
    return e.currency === primaryCurrency ? totalOrig : totalOrig * exchangeRate;
  }, [primaryCurrency, secondaryCurrency, exchangeRate]);

  /** Formata o valor para a moeda ativa */
  const formatActive = useCallback((valInPrimary: number) => {
    const isPrimary = activeCurrency === 'primary';
    const currency = isPrimary ? primaryCurrency : secondaryCurrency;
    const value = isPrimary ? valInPrimary : valInPrimary / exchangeRate;
    
    const symbol = currency === "BRL" ? "R$" : (currency === "EUR" ? "€" : (currency === "USD" ? "$" : currency));
    return `${symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }, [activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
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

  const totalPrimary = useMemo(() => {
    return filtered.reduce((acc, e) => acc + getAmountInPrimary(e), 0);
  }, [filtered, getAmountInPrimary]);

  // ── Upload de Comprovante ────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      setForm(p => ({ ...p, receipt_url: publicUrl }));
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Falha ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(e: Expense) {
    const role = resolveRole(user?.id, e.user_id, roleMap);
    if (!canEdit(role)) return;
    const cur = e.currency;
    const val = cur === "BRL" ? e.amount_brl : (cur === "EUR" ? e.amount_eur : e.amount_usd);
    setForm({
      title: e.title, description: e.description || "", recipient: e.recipient || "",
      quantity: (e.quantity ?? 1).toString(), amount: val?.toString() || "",
      currency: cur, category: e.category || "Outro", date: e.date, link: e.link || "",
      receipt_url: e.receipt_url || null,
    });
    setEditId(e.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() { 
    setForm({ ...EMPTY, currency: primaryCurrency }); 
    setEditId(null); 
    setShowForm(false); 
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
      receipt_url: form.receipt_url,
      amount_brl: form.currency === "BRL" ? val : null,
      amount_eur: form.currency === "EUR" ? val : null,
      amount_usd: form.currency === "USD" ? val : null,
      updated_by: user!.id,
    };

    if (editId) {
      const { error } = await supabase.from("expenses").update(payload).eq("id", editId);
      if (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao salvar alterações.');
      }
    } else {
      const { data, error } = await supabase.from("expenses").insert([{ ...payload, user_id: user!.id }]).select().single();
      if (error) {
        console.error('Erro ao inserir:', error);
        alert('Erro ao criar gasto.');
      } else if (data) {
        logActivity(user!.id, user!.id, "create", "expense", payload.title, data.id);
      }
    }
    resetForm();
    setSaving(false);
    load(); // Recarrega para garantir sincronia
  }

  async function del(id: string) {
    const row = rows.find(r => r.id === id);
    const role = resolveRole(user?.id, row?.user_id, roleMap);
    if (!canDelete(role)) return;
    if (!confirm("Excluir este gasto permanentemente?")) return;
    
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao excluir.');
    } else {
      if (row) logActivity(user!.id, user!.id, "delete", "expense", row.title, id);
      load();
    }
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
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{primaryCurrency} · {secondaryCurrency} — conversão automática.</p>
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
                    <option value={primaryCurrency}>{primaryCurrency}</option>
                    <option value={secondaryCurrency}>{secondaryCurrency}</option>
                    <option value="USD">USD</option>
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
              <FieldLabel label="Comprovante" />
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: form.receipt_url ? "#10b981" : "var(--text-muted)" }}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (form.receipt_url ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />)}
                  {form.receipt_url ? "Comprovante Anexado" : "Anexar Foto/Arquivo"}
                </button>
                {form.receipt_url && (
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, receipt_url: null }))}
                    className="px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <FieldLabel label="Link Adicional" />
              <input type="url" className={inputCls} style={inputStyle} value={form.link} onChange={F("link")} placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || uploading || !form.title.trim() || !form.amount}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#10b981" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editId ? "Salvar Alterações" : "Adicionar Gasto"}
            </button>
            <button onClick={resetForm} className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Totais ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex flex-col justify-center" style={{ background: "rgba(37,99,235,0.05)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Total Acumulado ({activeCurrency === 'primary' ? primaryCurrency : secondaryCurrency})</p>
          <p className="text-3xl font-black tabular-nums" style={{ color: "#2563eb" }}>{formatActive(totalPrimary)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex flex-col justify-center" style={{ background: "var(--surface)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Total {primaryCurrency}</p>
            <p className="text-lg font-black tabular-nums" style={{ color: "var(--text)" }}>
              {primaryCurrency === 'BRL' ? 'R$' : primaryCurrency} {totalPrimary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4 flex flex-col justify-center" style={{ background: "var(--surface)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Total {secondaryCurrency}</p>
            <p className="text-lg font-black tabular-nums" style={{ color: "var(--text)" }}>
              {secondaryCurrency === 'EUR' ? '€' : secondaryCurrency} {(totalPrimary / exchangeRate).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Pesquisar gastos..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
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
          </button>
        </div>

        {showFilter && (
          <div className="rounded-2xl p-4 fade-up grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Moeda</p>
              <select value={fCurrency} onChange={e => setFCurrency(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl" style={inputStyle}>
                <option>Todas</option>
                <option value={primaryCurrency}>{primaryCurrency}</option>
                <option value={secondaryCurrency}>{secondaryCurrency}</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Categoria</p>
              <select value={fCategory} onChange={e => setFCategory(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl" style={inputStyle}>
                <option>Todas</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>De</p>
              <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl" style={inputStyle} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>Até</p>
              <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl" style={inputStyle} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className={`hidden md:grid ${COL_WIDTHS} gap-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest`} style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", color: "var(--text-faint)" }}>
          <div>Data</div>
          <div>Título</div>
          <div>Recebedor</div>
          <div>Categ.</div>
          <div className="text-right">Qtd.</div>
          <div>Origem</div>
          <div className="text-right">Valor ({activeCurrency === 'primary' ? primaryCurrency : secondaryCurrency})</div>
          <div />
        </div>

        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Nenhum gasto encontrado</div>
        ) : (
          visible.map(e => {
            const valInPrimary = getAmountInPrimary(e);
            const role = resolveRole(user?.id, e.user_id, roleMap);
            return (
              <div key={e.id} className="group border-b last:border-0 p-4 md:px-4 md:py-3" style={{ borderColor: "var(--border-subtle)" }}>
                {/* Mobile */}
                <div className="md:hidden space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{e.title}</p>
                      <p className="text-[10px] uppercase font-black" style={{ color: "var(--text-faint)" }}>{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")} · {e.category}</p>
                    </div>
                    <span className="font-black text-sm text-emerald-500">{formatActive(valInPrimary)}</span>
                  </div>
                  <div className="flex gap-2">
                    {e.receipt_url && (
                      <a href={e.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                        <Eye className="w-3 h-3" /> Ver Comprovante
                      </a>
                    )}
                    <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg border border-[var(--border)]"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(e.id)} className="p-1.5 rounded-lg border border-red-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Desktop */}
                <div className={`hidden md:grid ${COL_WIDTHS} gap-x-3 items-center px-0`}>
                  <span className="text-xs font-bold text-[var(--text-muted)]">{new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{e.title}</p>
                  <span className="text-xs text-[var(--text-muted)] truncate">{e.recipient || "—"}</span>
                  <span className="text-xs font-bold uppercase" style={{ color: "var(--text-faint)" }}>{e.category}</span>
                  <span className="text-xs font-bold text-right text-[var(--text-muted)]">{e.quantity}</span>
                  <span className="text-xs font-black" style={{ color: "var(--text-faint)" }}>{e.currency}</span>
                  <span className="text-sm font-black text-right text-emerald-500">{formatActive(valInPrimary)}</span>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {e.receipt_url && (
                      <a href={e.receipt_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50" title="Ver Comprovante"><Eye className="w-4 h-4" /></a>
                    )}
                    <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {hasMore && (
          <div className="p-4 flex justify-center border-t border-[var(--border)]">
            <button onClick={() => setPage(p => p + 1)} className="text-xs font-black uppercase tracking-widest text-[var(--text-faint)] hover:text-[var(--text)] transition-colors">Carregar Mais</button>
          </div>
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
