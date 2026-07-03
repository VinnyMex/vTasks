"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Task, type Expense } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, X, ExternalLink } from "lucide-react";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS    = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const SYM: Record<string, string>    = { BRL: "R$", EUR: "€", USD: "$", GBP: "£" };
const FLAG: Record<string, string>   = { BRL: "🇧🇷", EUR: "🇪🇺", USD: "🇺🇸", GBP: "🇬🇧" };
const CUR_COLOR: Record<string, string> = {
  BRL: "var(--currency-brl)",
  EUR: "var(--currency-eur)",
  USD: "var(--currency-usd)",
};
const CUR_BG: Record<string, string> = {
  BRL: "var(--bg-done)",
  EUR: "var(--bg-doing)",
  USD: "var(--bg-warning)",
};

const getCurrencyColor = (cur: string) => CUR_COLOR[cur] || "var(--accent)";
const getCurrencyBg = (cur: string) => {
  return CUR_BG[cur] || "var(--accent-muted)"; // ~12% opacity
};
const getFlag = (cur: string) => FLAG[cur] || "💰";
const getSymbol = (cur: string) => SYM[cur] || cur;

/**
 * Retorna o valor original do gasto na sua moeda de origem.
 */
function getOriginalExpenseValue(e: Expense): number {
  const qty = e.quantity ?? 1;
  const unit = e.currency === "BRL" ? (e.amount_brl ?? 0)
             : e.currency === "EUR" ? (e.amount_eur ?? 0)
             :                        (e.amount_usd ?? 0);
  return unit * qty;
}

/**
 * Converte um valor de uma moeda para outra usando a taxa de câmbio informada.
 * Assume que a taxa é: 1 Secondary = X Primary.
 */
function convertValue(
  amount: number,
  from: string,
  to: string,
  primary: string,
  secondary: string,
  rate: number
): number {
  if (from === to) return amount;

  // 1. Converte de 'from' para Primary (base)
  let valueInPrimary = 0;
  if (from === primary) {
    valueInPrimary = amount;
  } else if (from === secondary) {
    valueInPrimary = amount * rate;
  } else {
    // Se não for nem primary nem secondary, não temos como converter dinamicamente
    // sem saber a relação. Retornamos o original como fallback.
    return amount; 
  }

  // 2. Converte de Primary para 'to'
  if (to === primary) return valueInPrimary;
  if (to === secondary) return valueInPrimary / rate;

  return valueInPrimary;
}

/**
 * Obtém o valor de um gasto convertido para a moeda alvo.
 */
function getConvertedExpenseValue(
  e: Expense,
  targetCurrency: string,
  primary: string,
  secondary: string,
  rate: number
): number {
  const qty = e.quantity ?? 1;
  
  // Se a moeda alvo for uma das colunas fixas do banco, usamos direto para maior precisão
  if (targetCurrency === "BRL" && e.amount_brl !== null) return e.amount_brl * qty;
  if (targetCurrency === "EUR" && e.amount_eur !== null) return e.amount_eur * qty;
  if (targetCurrency === "USD" && e.amount_usd !== null) return e.amount_usd * qty;

  const originalVal = getOriginalExpenseValue(e);
  if (e.currency === targetCurrency) return originalVal;

  // Caso contrário, usa a taxa de conversão do provider
  return convertValue(originalVal, e.currency, targetCurrency, primary, secondary, rate);
}

function fmtVal(v: number, currency: string, compact = false) {
  const symbol = getSymbol(currency);
  const formatted = v.toLocaleString("pt-BR", { 
    minimumFractionDigits: compact ? 0 : 2, 
    maximumFractionDigits: 2 
  });
  return `${symbol} ${formatted}`;
}

// Agrupa gastos por moeda e retorna totais originais
function groupByCurrency(expenses: Expense[]) {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.currency] = (totals[e.currency] ?? 0) + getOriginalExpenseValue(e);
  }
  return totals;
}

/* ── Popup detalhes do dia ─────────────────────────────────────────────── */
function DayDetailPopup({
  day, month, year,
  tasks, expenses,
  onClose, onAddTask,
}: {
  day: number; month: number; year: number;
  tasks: Task[]; expenses: Expense[];
  onClose: () => void;
  onAddTask: (text: string) => void;
}) {
  const [newText, setNewText] = useState("");
  const { activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();
  
  const targetCurrency = activeCurrency === "primary" ? primaryCurrency : secondaryCurrency;
  
  const totals = groupByCurrency(expenses);
  const totalInActiveCurrency = expenses.reduce((acc, e) => {
    return acc + getConvertedExpenseValue(e, targetCurrency, primaryCurrency, secondaryCurrency, exchangeRate);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-overlay" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl fade-up overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header popup */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="font-black text-base" style={{ color: "var(--text)" }}>
              {day} de {MONTHS[month]}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{year}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={ev => (ev.currentTarget.style.background = "")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* ── Gastos do dia ─────────────────────────────────────────── */}
          {expenses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  Gastos · {expenses.length}
                </p>
                <p className="text-[11px] font-black" style={{ color: getCurrencyColor(targetCurrency) }}>
                  Total: {fmtVal(totalInActiveCurrency, targetCurrency)}
                </p>
              </div>

              {/* Totais por moeda original */}
              <div className="flex gap-2 flex-wrap mb-3">
                {Object.entries(totals).map(([cur, total]) => (
                  <div
                    key={cur}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: getCurrencyBg(cur), border: `1px solid ${getCurrencyColor(cur)}30` }}
                  >
                    <span className="text-base leading-none">{getFlag(cur)}</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: getCurrencyColor(cur) }}>
                      {fmtVal(total, cur)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Lista de gastos */}
              <div className="space-y-2">
                {expenses.map(e => {
                  const valOriginal = getOriginalExpenseValue(e);
                  const valConverted = getConvertedExpenseValue(e, targetCurrency, primaryCurrency, secondaryCurrency, exchangeRate);
                  
                  return (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: getCurrencyBg(e.currency) }}
                      >
                        {getFlag(e.currency)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{e.title}</p>
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-black tabular-nums block leading-tight" style={{ color: getCurrencyColor(targetCurrency) }}>
                              {fmtVal(valConverted, targetCurrency)}
                            </span>
                            {e.currency !== targetCurrency && (
                              <span className="text-[9px] font-bold opacity-60 block" style={{ color: "var(--text-faint)" }}>
                                {fmtVal(valOriginal, e.currency)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {e.description && (
                            <span className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{e.description}</span>
                          )}
                          {e.recipient && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>
                              {e.recipient}
                            </span>
                          )}
                          {(e.quantity ?? 1) > 1 && (
                            <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>×{e.quantity}</span>
                          )}
                          {e.category && (
                            <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{e.category}</span>
                          )}
                        </div>
                      </div>
                      {e.link && (
                        <a href={e.link} target="_blank" rel="noreferrer" className="flex-shrink-0" style={{ color: "var(--color-doing)" }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tarefas do dia ─────────────────────────────────────────── */}
          {tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>
                Tarefas · {tasks.length}
              </p>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: t.status === "done" ? "var(--color-done)" : t.status === "doing" ? "var(--color-doing)" : "var(--color-pending)" }}
                    />
                    <span
                      className="text-sm font-semibold flex-1 truncate"
                      style={{
                        color: t.status === "done" ? "var(--text-faint)" : "var(--text)",
                        textDecoration: t.status === "done" ? "line-through" : "none",
                      }}
                    >
                      {t.content}
                    </span>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                      style={
                        t.status === "done"  ? { background: "var(--bg-done)", color: "var(--color-done)" } :
                        t.status === "doing" ? { background: "var(--bg-doing)", color: "var(--color-doing)" } :
                                               { background: "var(--surface)",          color: "var(--text-faint)", border: "1px solid var(--border)" }
                      }
                    >
                      {t.status === "done" ? "Feito" : t.status === "doing" ? "Andamento" : "A fazer"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expenses.length === 0 && tasks.length === 0 && (
            <p className="text-xs text-center py-4 font-bold" style={{ color: "var(--text-faint)" }}>
              Nenhum evento neste dia.
            </p>
          )}

          {/* ── Adicionar tarefa rápida ────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Nova tarefa</p>
            <div className="flex gap-2">
              <input
                autoFocus={expenses.length === 0 && tasks.length === 0}
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newText.trim()) { onAddTask(newText.trim()); setNewText(""); }
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Descreva a tarefa..."
                className="flex-1 px-3 py-2.5 text-sm rounded-xl outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <button
                onClick={() => { if (newText.trim()) { onAddTask(newText.trim()); setNewText(""); } }}
                disabled={!newText.trim()}
                className="px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
                style={{ background: "var(--accent)" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function CalendarPage() {
  const { user } = useAuth();
  const { activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();
  const todayDate = new Date();
  const [current, setCurrent]     = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const targetCurrency = activeCurrency === "primary" ? primaryCurrency : secondaryCurrency;

  const fetchData = useCallback(async () => {
    if (!user) return;
    const y = current.year;
    const m = current.month;
    const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;

    const lastDay = new Date(y, m + 1, 0).getDate();

    const [taskRes, expRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", new Date(y, m, 1).toISOString())
        .lte("due_date", new Date(y, m + 1, 0, 23, 59, 59).toISOString()),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", `${monthStr}-01`)
        .lte("date", `${monthStr}-${lastDay}`),
    ]);

    setTasks(taskRes.data || []);
    setExpenses(expRes.data || []);
    setIsLoading(false);
  }, [current, user]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const ch = supabase
      .channel("calendar_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" },    fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const firstDay    = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells       = Array.from({ length: 42 }, (_, i) => {
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

  function getExpensesForDay(day: number) {
    const padDay = String(day).padStart(2, "0");
    const padMonth = String(current.month + 1).padStart(2, "0");
    const dateStr = `${current.year}-${padMonth}-${padDay}`;
    return expenses.filter(e => e.date === dateStr);
  }

  const isToday = (day: number) =>
    day === todayDate.getDate() &&
    current.month === todayDate.getMonth() &&
    current.year  === todayDate.getFullYear();

  async function addTaskOnDay(text: string) {
    if (!selectedDay) return;
    const dueDate = new Date(current.year, current.month, selectedDay, 12).toISOString();
    // optimistic
    const temp: Task = {
      id: `temp-${Date.now()}`, content: text, status: "todo",
      project_id: null, priority: null, position: null,
      due_date: dueDate, created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, temp]);
    const { data } = await supabase
      .from("tasks")
      .insert([{ content: text, status: "todo", due_date: dueDate, user_id: user!.id }])
      .select().single();
    if (data) setTasks(prev => prev.map(t => t.id === temp.id ? data : t));
  }

  const selTasks    = selectedDay ? getTasksForDay(selectedDay) : [];
  const selExpenses = selectedDay ? getExpensesForDay(selectedDay) : [];

  return (
    <>
      {selectedDay && (
        <DayDetailPopup
          day={selectedDay}
          month={current.month}
          year={current.year}
          tasks={selTasks}
          expenses={selExpenses}
          onClose={() => setSelectedDay(null)}
          onAddTask={text => addTaskOnDay(text)}
        />
      )}

      <div className="p-4 md:p-6 flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
        {/* Header */}
        <header className="mb-4 flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
              <CalendarIcon className="w-6 h-6" style={{ color: "var(--color-done)" }} />
              Calendário
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Tarefas e gastos por data.</p>
          </div>
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setCurrent(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })}
              className="p-2.5 transition-colors"
              style={{ borderRight: "1px solid var(--border)" }}
              onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={ev => (ev.currentTarget.style.background = "")}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
            <span className="px-5 font-black text-sm" style={{ color: "var(--text)" }}>
              {MONTHS[current.month]} {current.year}
            </span>
            <button
              onClick={() => setCurrent(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })}
              className="p-2.5 transition-colors"
              style={{ borderLeft: "1px solid var(--border)" }}
              onMouseEnter={ev => (ev.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={ev => (ev.currentTarget.style.background = "")}
            >
              <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </header>

        {/* Legenda moedas */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
          {([primaryCurrency, secondaryCurrency] as const).map(cur => (
            <div key={cur} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center text-[9px]"
                style={{ background: getCurrencyBg(cur), border: `1px solid ${getCurrencyColor(cur)}40` }}
              >
                {getFlag(cur)}
              </span>
              {cur} ({getSymbol(cur)})
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-doing)" }} />
            Tarefa
          </div>
        </div>

        {/* Grid */}
        <div
          className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Cabeçalho dias da semana */}
          <div
            className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
          >
            {WEEK_DAYS.map(d => (
              <div key={d} className="p-2 md:p-3 text-center text-[9px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-done)" }} />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 overflow-hidden" style={{ gridTemplateRows: "repeat(6, 1fr)" }}>
              {cells.map((day, i) => {
                const dayTasks    = day ? getTasksForDay(day) : [];
                const dayExpenses = day ? getExpensesForDay(day) : [];
                const hasEvents   = dayTasks.length > 0 || dayExpenses.length > 0;

                const dayTotalActive = dayExpenses.reduce((acc, e) => {
                    return acc + getConvertedExpenseValue(e, targetCurrency, primaryCurrency, secondaryCurrency, exchangeRate);
                }, 0);

                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day)}
                    className={`relative p-1.5 md:p-2 transition-colors min-h-0 ${!day ? "pointer-events-none" : "cursor-pointer"}`}
                    style={{
                      borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border-subtle)" : undefined,
                      borderBottom: i < 35 ? "1px solid var(--border-subtle)" : undefined,
                      background: !day
                        ? "var(--surface-2)"
                        : isToday(day)
                          ? "var(--accent-muted)"
                          : undefined,
                      opacity: !day ? 0.3 : 1,
                    }}
                    onMouseEnter={ev => { if (day && !isToday(day)) ev.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={ev => { if (day && !isToday(day)) ev.currentTarget.style.background = ""; }}
                  >
                    {day && (
                      <>
                        {/* Número do dia */}
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-[10px] md:text-xs font-black rounded-full mb-1"
                          style={isToday(day)
                            ? { background: "var(--accent)", color: "#fff", boxShadow: "0 1px 6px var(--accent-shadow)" }
                            : { color: "var(--text-muted)" }
                          }
                        >
                          {day}
                        </span>

                        {/* Total do dia na moeda ativa */}
                        {dayExpenses.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mb-1">
                            <div
                              className="flex items-center gap-0.5 px-1 py-0.5 rounded-md"
                              style={{ background: getCurrencyBg(targetCurrency), border: `1px solid ${getCurrencyColor(targetCurrency)}35` }}
                              title={`Gasto Total: ${fmtVal(dayTotalActive, targetCurrency)}`}
                            >
                              <span className="text-[8px] leading-none">{getFlag(targetCurrency)}</span>
                              <span className="text-[7px] md:text-[8px] font-black tabular-nums" style={{ color: getCurrencyColor(targetCurrency) }}>
                                {fmtVal(dayTotalActive, targetCurrency, true)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Chips de tarefas */}
                        <div className="space-y-0.5 overflow-hidden">
                          {dayTasks.slice(0, 1).map(t => (
                            <div
                              key={t.id}
                              className="text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded truncate"
                              style={
                                t.status === "done"  ? { background: "var(--bg-done)", color: "var(--color-done)" } :
                                t.status === "doing" ? { background: "var(--bg-doing)", color: "var(--accent)" } :
                                                       { background: "var(--surface-2)",       color: "var(--text-faint)", border: "1px solid var(--border)" }
                              }
                            >
                              {t.content}
                            </div>
                          ))}
                          {(dayTasks.length > 1 || (dayTasks.length > 0 && dayExpenses.length > 0)) && (
                            <p className="text-[8px] font-bold px-1" style={{ color: "var(--text-faint)" }}>
                              +{dayTasks.length - 1 + (dayExpenses.length > 0 ? 1 : 0)} mais
                            </p>
                          )}
                        </div>

                        {/* Dot de evento (apenas em mobile onde não cabe texto) */}
                        {hasEvents && (
                          <span
                            className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full md:hidden"
                            style={{ background: dayExpenses.length > 0 ? getCurrencyColor(targetCurrency) : "var(--accent)" }}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
