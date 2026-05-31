"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Expense } from "@/lib/supabase";
import {
  DollarSign, Plus, Trash2, Pencil, Check, X,
  Loader2, ChevronDown, Tag
} from "lucide-react";

const CURRENCIES = ["BRL", "EUR", "USD"] as const;
const CATEGORIES = ["Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Viagem","Trabalho","Outro"];

const CURRENCY_SYMBOL: Record<string, string> = { BRL: "R$", EUR: "€", USD: "$" };
const CURRENCY_FLAG:   Record<string, string> = { BRL: "🇧🇷", EUR: "🇪🇺", USD: "🇺🇸" };

type FormState = {
  title: string;
  description: string;
  amount: string;
  currency: "BRL" | "EUR" | "USD";
  category: string;
  date: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  amount: "",
  currency: "BRL",
  category: "Outro",
  date: new Date().toISOString().split("T")[0],
};

function fmt(val: number | null | undefined, symbol: string) {
  if (val == null) return "—";
  return `${symbol} ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const ch = supabase
      .channel("expenses_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const filtered = expenses.filter(e => e.date.startsWith(filterMonth));

  const totals = filtered.reduce(
    (acc, e) => {
      if (e.amount_brl) acc.brl += e.amount_brl;
      if (e.amount_eur) acc.eur += e.amount_eur;
      if (e.amount_usd) acc.usd += e.amount_usd;
      return acc;
    },
    { brl: 0, eur: 0, usd: 0 }
  );

  function startEdit(e: Expense) {
    setEditId(e.id);
    const cur = e.currency as "BRL" | "EUR" | "USD";
    const amount = cur === "BRL" ? e.amount_brl : cur === "EUR" ? e.amount_eur : e.amount_usd;
    setForm({
      title: e.title,
      description: e.description || "",
      amount: amount?.toString() || "",
      currency: cur,
      category: e.category || "Outro",
      date: e.date,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  async function save() {
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    const val = parseFloat(form.amount.replace(",", "."));
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      currency: form.currency,
      category: form.category,
      date: form.date,
      amount_brl: form.currency === "BRL" ? val : null,
      amount_eur: form.currency === "EUR" ? val : null,
      amount_usd: form.currency === "USD" ? val : null,
    };

    if (editId) {
      await supabase.from("expenses").update(payload).eq("id", editId);
    } else {
      await supabase.from("expenses").insert([payload]);
    }
    resetForm();
    setSaving(false);
  }

  async function del(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
  }

  // Meses disponíveis
  const months = Array.from(
    new Set(expenses.map(e => e.date.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  function monthLabel(ym: string) {
    const [y, m] = ym.split("-");
    const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${names[parseInt(m) - 1]} ${y}`;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
            <DollarSign className="text-emerald-500 w-7 h-7" />
            Controle de Gastos
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Registre despesas em BRL, EUR ou USD.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Gasto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 fade-up shadow-xl shadow-black/5">
          <h2 className="font-black text-[var(--text)] mb-5 text-base">
            {editId ? "Editar Gasto" : "Novo Gasto"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Supermercado Extra"
                className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detalhes opcionais"
                className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Valor + Moeda */}
            <div>
              <label className="block text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                Valor *
              </label>
              <div className="flex gap-2">
                {/* Moeda */}
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value as "BRL"|"EUR"|"USD" }))}
                    className="appearance-none h-full pl-3 pr-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{CURRENCY_FLAG[c]} {c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                </div>
                {/* Número */}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0,00"
                  className="flex-1 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                Data *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1.5">
                Categoria
              </label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full appearance-none px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !form.title.trim() || !form.amount}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editId ? "Salvar Alterações" : "Adicionar Gasto"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-all border border-[var(--border)]"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Totais do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total BRL", value: totals.brl, symbol: "R$", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Total EUR", value: totals.eur, symbol: "€",  color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Total USD", value: totals.usd, symbol: "$",  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map(({ label, value, symbol, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-[var(--border)]`}>
            <p className="text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>
              {symbol} {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Filtro de mês */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[11px] font-black text-[var(--text-faint)] uppercase tracking-widest">Mês:</p>
        <div className="flex flex-wrap gap-2">
          {months.length === 0 && (
            <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white">
              {monthLabel(filterMonth)}
            </button>
          )}
          {months.map(m => (
            <button
              key={m}
              onClick={() => setFilterMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                m === filterMonth
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] border border-[var(--border)]"
              }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
          {["Título / Descrição", "Categoria", "Data", "Valor", ""].map((h, i) => (
            <div key={i} className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
            <p className="text-xs font-black text-[var(--text-faint)] uppercase tracking-widest">Nenhum gasto neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map(e => {
              const sym = CURRENCY_SYMBOL[e.currency];
              const val = e.currency === "BRL" ? e.amount_brl : e.currency === "EUR" ? e.amount_eur : e.amount_usd;
              return (
                <div
                  key={e.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[var(--surface-2)] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text)] truncate">{e.title}</p>
                    {e.description && (
                      <p className="text-xs text-[var(--text-faint)] truncate mt-0.5">{e.description}</p>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 rounded-lg whitespace-nowrap">
                    <Tag className="w-3 h-3" /> {e.category || "Outro"}
                  </span>

                  <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>

                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {fmt(val, sym)}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(e)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[var(--text-faint)] hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => del(e.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-faint)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
