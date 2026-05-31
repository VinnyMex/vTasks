"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type Expense, type Task } from "@/lib/supabase";
import { BarChart2, TrendingUp, TrendingDown, DollarSign, CheckSquare, Loader2 } from "lucide-react";

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

type YM = { year: number; month: number };

function ym(dateStr: string): YM {
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""));
  return { year: d.getFullYear(), month: d.getMonth() };
}

// ── Bar simples ─────────────────────────────────────────────────────────────
function Bar({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-[10px] font-black text-[var(--text-faint)] uppercase text-right flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-[var(--surface-2)] rounded-full h-5 overflow-hidden border border-[var(--border-subtle)]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
        />
      </div>
      <span className="w-28 text-xs font-bold text-[var(--text-muted)] text-right flex-shrink-0 tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ── Donut SVG ────────────────────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-[var(--text-faint)] text-xs font-bold">
      Sem dados
    </div>
  );

  const r = 50; const cx = 60; const cy = 60;
  let offset = 0;
  const arcs = slices.map(s => {
    const pct = s.value / total;
    const arc = { ...s, pct, offset };
    offset += pct;
    return arc;
  });

  function polarToXY(pct: number) {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
        {arcs.map((arc, i) => {
          if (arc.pct === 0) return null;
          const start = polarToXY(arc.offset);
          const end = polarToXY(arc.offset + arc.pct);
          const large = arc.pct > 0.5 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`}
              className={arc.color}
            />
          );
        })}
        <circle cx={cx} cy={cy} r="28" className="fill-[var(--surface)]" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-[var(--text)] font-black text-[9px]" fontSize="9">
          Total
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-[var(--text-muted)]" fontSize="7">
          {slices.length} cats.
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {arcs.filter(a => a.value > 0).map((arc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${arc.color}`} />
            <span className="text-xs text-[var(--text-muted)] truncate flex-1">{arc.label}</span>
            <span className="text-xs font-bold text-[var(--text)] tabular-nums">
              {(arc.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CAT_COLORS = [
  "fill-blue-500","fill-emerald-500","fill-amber-500","fill-rose-500",
  "fill-purple-500","fill-cyan-500","fill-orange-500","fill-teal-500",
  "fill-pink-500","fill-indigo-500",
];

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "year">("month");
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState(new Date().getMonth());

  const fetchAll = useCallback(async () => {
    const [er, tr] = await Promise.all([
      supabase.from("expenses").select("*"),
      supabase.from("tasks").select("*"),
    ]);
    setExpenses(er.data || []);
    setTasks(tr.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("reports_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  // ── Anos disponíveis ──────────────────────────────────────────────────────
  const years = Array.from(new Set([
    ...expenses.map(e => new Date(e.date + "T12:00:00").getFullYear()),
    new Date().getFullYear(),
  ])).sort((a, b) => b - a);

  // ── Filtragem ─────────────────────────────────────────────────────────────
  const filteredExp = view === "month"
    ? expenses.filter(e => { const d = ym(e.date); return d.year === selYear && d.month === selMonth; })
    : expenses.filter(e => ym(e.date).year === selYear);

  const filteredTasks = view === "month"
    ? tasks.filter(t => { const d = ym(t.created_at); return d.year === selYear && d.month === selMonth; })
    : tasks.filter(t => ym(t.created_at).year === selYear);

  // ── Totais ────────────────────────────────────────────────────────────────
  const totBRL = filteredExp.filter(e => e.currency === "BRL").reduce((s, e) => s + (e.amount_brl || 0), 0);
  const totEUR = filteredExp.filter(e => e.currency === "EUR").reduce((s, e) => s + (e.amount_eur || 0), 0);
  const totUSD = filteredExp.filter(e => e.currency === "USD").reduce((s, e) => s + (e.amount_usd || 0), 0);

  const taskDone  = filteredTasks.filter(t => t.status === "done").length;
  const taskTodo  = filteredTasks.filter(t => t.status === "todo").length;
  const taskDoing = filteredTasks.filter(t => t.status === "doing").length;
  const taskTotal = filteredTasks.length;

  // ── Por mês (para gráfico anual BRL) ─────────────────────────────────────
  const monthlyBRL = Array.from({ length: 12 }, (_, m) => {
    const sum = expenses
      .filter(e => { const d = ym(e.date); return d.year === selYear && d.month === m && e.currency === "BRL"; })
      .reduce((s, e) => s + (e.amount_brl || 0), 0);
    return { month: m, sum };
  });
  const maxMonthly = Math.max(...monthlyBRL.map(x => x.sum), 1);

  // ── Por categoria ─────────────────────────────────────────────────────────
  const catMap = filteredExp.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Outro";
    const val = e.amount_brl || e.amount_eur || e.amount_usd || 0;
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {});
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(c => c[1]), 1);

  const donutSlices = cats.map(([label, value], i) => ({
    label,
    value,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  // ── Comparativo tarefas por status ────────────────────────────────────────
  const taskSlices = [
    { label: "A Fazer",      value: taskTodo,  color: "fill-zinc-400" },
    { label: "Em Andamento", value: taskDoing, color: "fill-blue-500" },
    { label: "Concluídas",   value: taskDone,  color: "fill-emerald-500" },
  ];

  function fmtBRL(v: number) {
    return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
            <BarChart2 className="text-rose-500 w-7 h-7" />
            Relatórios & Gráficos
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Visão analítica de gastos e produtividade.</p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mensal / Anual */}
          <div className="flex bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1">
            {(["month", "year"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  view === v ? "bg-blue-600 text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {v === "month" ? "Mensal" : "Anual"}
              </button>
            ))}
          </div>

          {/* Ano */}
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] focus:outline-none"
          >
            {years.map(y => <option key={y}>{y}</option>)}
          </select>

          {/* Mês (só mensal) */}
          {view === "month" && (
            <select
              value={selMonth}
              onChange={e => setSelMonth(Number(e.target.value))}
              className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] focus:outline-none"
            >
              {MONTHS_PT.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── KPIs ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: DollarSign,  label: "Total BRL",       value: fmtBRL(totBRL),     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { icon: DollarSign,  label: "Total EUR",       value: `€ ${totEUR.toLocaleString("pt-BR",{minimumFractionDigits:2})}`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { icon: CheckSquare, label: "Tarefas Feitas",  value: `${taskDone} / ${taskTotal}`, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { icon: TrendingUp,  label: "Taxa Conclusão",  value: taskTotal ? `${Math.round((taskDone/taskTotal)*100)}%` : "—", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-5 border border-[var(--border)]`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">{label}</p>
                </div>
                <p className={`text-xl font-black ${color} tabular-nums`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Gráfico mensal BRL (só no modo anual) ─────────────────────── */}
          {view === "year" && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest mb-5">
                Gastos BRL por Mês — {selYear}
              </h2>
              <div className="space-y-2">
                {monthlyBRL.map(({ month, sum }) => (
                  <Bar
                    key={month}
                    label={MONTHS_PT[month]}
                    pct={(sum / maxMonthly) * 100}
                    color="bg-emerald-500"
                    value={sum > 0 ? fmtBRL(sum) : "—"}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Grid: Categorias + Tarefas ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gastos por categoria */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest mb-5">
                Gastos por Categoria
              </h2>
              {cats.length === 0 ? (
                <p className="text-xs text-[var(--text-faint)] text-center py-8 font-bold uppercase tracking-widest">
                  Sem dados
                </p>
              ) : (
                <>
                  <div className="mb-5">
                    <DonutChart slices={donutSlices} />
                  </div>
                  <div className="space-y-2 mt-4">
                    {cats.map(([cat, val], i) => (
                      <Bar
                        key={cat}
                        label={cat.slice(0, 4)}
                        pct={(val / maxCat) * 100}
                        color={`bg-${["blue","emerald","amber","rose","purple","cyan","orange","teal"][i % 8]}-500`}
                        value={`${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Tarefas */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest mb-5">
                Status das Tarefas
              </h2>

              <div className="mb-5">
                <DonutChart slices={taskSlices} />
              </div>

              <div className="space-y-3 mt-4">
                {[
                  { label: "Concluídas", value: taskDone,  color: "bg-emerald-500", pct: taskTotal ? (taskDone/taskTotal)*100 : 0 },
                  { label: "Andamento",  value: taskDoing, color: "bg-blue-500",    pct: taskTotal ? (taskDoing/taskTotal)*100 : 0 },
                  { label: "A Fazer",    value: taskTodo,  color: "bg-zinc-400",    pct: taskTotal ? (taskTodo/taskTotal)*100 : 0 },
                ].map(({ label, value, color, pct }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-bold text-[var(--text-muted)]">{label}</span>
                    <div className="flex-1 bg-[var(--surface-2)] rounded-full h-4 border border-[var(--border-subtle)] overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-black text-[var(--text)] tabular-nums">{value}</span>
                  </div>
                ))}
              </div>

              {taskTotal > 0 && (
                <div className="mt-5 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--text-faint)] uppercase tracking-widest">Produtividade</span>
                    <span className={`text-lg font-black ${
                      taskDone/taskTotal >= 0.7 ? "text-emerald-600 dark:text-emerald-400" :
                      taskDone/taskTotal >= 0.4 ? "text-amber-600 dark:text-amber-400" :
                      "text-rose-600 dark:text-rose-400"
                    }`}>
                      {Math.round((taskDone / taskTotal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[var(--border)] rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        taskDone/taskTotal >= 0.7 ? "bg-emerald-500" :
                        taskDone/taskTotal >= 0.4 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${(taskDone / taskTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Top gastos ─────────────────────────────────────────────────── */}
          {filteredExp.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest mb-5 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                Maiores Gastos
              </h2>
              <div className="space-y-3">
                {[...filteredExp]
                  .sort((a, b) => {
                    const va = a.amount_brl || a.amount_eur || a.amount_usd || 0;
                    const vb = b.amount_brl || b.amount_eur || b.amount_usd || 0;
                    return vb - va;
                  })
                  .slice(0, 5)
                  .map(e => {
                    const sym = e.currency === "BRL" ? "R$" : e.currency === "EUR" ? "€" : "$";
                    const val = e.amount_brl || e.amount_eur || e.amount_usd || 0;
                    const maxVal = filteredExp.reduce((m, x) => Math.max(m, x.amount_brl || x.amount_eur || x.amount_usd || 0), 0);
                    return (
                      <div key={e.id} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--text)] truncate">{e.title}</p>
                          <p className="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-wider">{e.category} · {new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="w-32">
                          <div className="bg-[var(--surface-2)] rounded-full h-2 border border-[var(--border-subtle)]">
                            <div
                              className="h-2 rounded-full bg-rose-500 transition-all"
                              style={{ width: `${(val / maxVal) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums w-24 text-right">
                          {sym} {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
