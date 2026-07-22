'use client';

import React, { useState } from 'react';
import { PlusCircle, Edit2, Trash2, Globe, CheckSquare, GripVertical, Layers, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';

function RegularizacaoKanbanContent() {
  const {
    checklists,
    toggleChecklistTask,
    reorderOrMoveTask,
    setTaskModal,
    deleteTask,
  } = useImigracao();

  // Mode: 'quarters' (1-8 quarters) or 'status' (Todo, Doing, Done)
  const [viewMode, setViewMode] = useState<'quarters' | 'status'>('quarters');
  const [activeYear, setActiveYear] = useState<1 | 2>(1); // Year 1 (Q1-Q4) vs Year 2 (Q5-Q8)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // State to track expanded completed tasks
  const [expandedCompletedTasks, setExpandedCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleExpandTask = (taskId: string) => {
    setExpandedCompletedTasks(prev => ({ ...prev, [String(taskId)]: !prev[String(taskId)] }));
  };

  // Filter tasks based on search & category
  const filteredChecklists = checklists.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (task.description || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Drag Event Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(String(taskId));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDropQuarter = (e: React.DragEvent, targetQuarter: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedTaskId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      reorderOrMoveTask(taskId, targetQuarter);
    }
  };

  const handleDropStatus = (e: React.DragEvent, statusType: 'todo' | 'done') => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedTaskId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const isDone = statusType === 'done';
      const task = checklists.find(t => String(t.id) === String(taskId));
      if (task) {
        reorderOrMoveTask(taskId, task.quarter, task.position, isDone);
      }
    }
  };

  // Helper component to render a task card
  const renderTaskCard = (task: any) => {
    const isDraggingThis = draggedTaskId === String(task.id);
    const isCompleted = task.is_completed;
    const isExpanded = !!expandedCompletedTasks[String(task.id)];

    // COMPACT COLLAPSED VIEW FOR COMPLETED TASKS
    if (isCompleted && !isExpanded) {
      return (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, String(task.id))}
          onDragEnd={handleDragEnd}
          className={`group p-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 opacity-60 hover:opacity-95 shadow-sm transition-all flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${
            isDraggingThis ? 'opacity-30 scale-95 border-amber-500 ring-2 ring-amber-500/30' : ''
          }`}
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <input
              type="checkbox"
              checked={true}
              onChange={(e) => toggleChecklistTask(task.id, e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-xs font-bold line-through text-zinc-400 dark:text-zinc-500 truncate">
              {task.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleExpandTask(String(task.id))}
            title="Expandir detalhes"
            className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors flex-shrink-0"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // EXPANDED VIEW FOR COMPLETED TASKS
    if (isCompleted && isExpanded) {
      return (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, String(task.id))}
          onDragEnd={handleDragEnd}
          className={`group p-3 rounded-xl border-2 border-emerald-400 dark:border-emerald-500/80 opacity-90 shadow-sm transition-all flex flex-col justify-between space-y-2 cursor-grab active:cursor-grabbing ${
            isDraggingThis ? 'opacity-30 scale-95 border-amber-500 ring-2 ring-amber-500/30' : ''
          }`}
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="mt-1 text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <input
                type="checkbox"
                checked={true}
                onChange={(e) => toggleChecklistTask(task.id, e.target.checked)}
                className="mt-1 accent-emerald-500 rounded cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold line-through text-zinc-400 dark:text-zinc-500 block">
                  {task.title}
                </span>
                {task.description && (
                  <p className="text-[10px] mt-1 line-clamp-3 leading-relaxed text-zinc-400 dark:text-zinc-500">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleExpandTask(String(task.id))}
              title="Recolher detalhes"
              className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors flex-shrink-0"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                CONCLUÍDO
              </span>
              {task.category && (
                <span className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded" style={{
                  background: task.category === 'URGENTE' ? 'var(--bg-danger)' : task.category === 'DOC' ? 'var(--bg-doing)' : task.category === 'LEI' ? 'var(--bg-done)' : 'var(--bg-purple)',
                  color: task.category === 'URGENTE' ? 'var(--color-danger)' : task.category === 'DOC' ? 'var(--color-doing)' : task.category === 'LEI' ? 'var(--color-done)' : 'var(--color-purple)',
                }}>
                  {task.category}
                </span>
              )}
              {task.link && (
                <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[9px] font-semibold hover:underline flex items-center gap-0.5 text-amber-500">
                  <Globe className="w-2.5 h-2.5" /> Link
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => setTaskModal({ open: true, mode: 'edit', data: task })} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-amber-500 transition-colors">
                <Edit2 className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => deleteTask(task.id)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // FULL VIEW FOR ACTIVE / NON-COMPLETED TASKS
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, String(task.id))}
        onDragEnd={handleDragEnd}
        className={`group p-3 rounded-xl flex flex-col justify-between shadow-sm space-y-2 cursor-grab active:cursor-grabbing transition-all duration-150 ${
          isDraggingThis
            ? 'opacity-30 scale-95 border-2 border-amber-500 ring-2 ring-amber-500/30'
            : 'border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 hover:shadow-md'
        }`}
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-1 text-zinc-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <input
            type="checkbox"
            checked={false}
            onChange={(e) => toggleChecklistTask(task.id, e.target.checked)}
            className="mt-1 accent-amber-500 rounded cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold block text-zinc-900 dark:text-zinc-100">
              {task.title}
            </span>
            {task.description && (
              <p className="text-[10px] mt-1 line-clamp-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.category && (
              <span className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded" style={{
                background: task.category === 'URGENTE' ? 'var(--bg-danger)' : task.category === 'DOC' ? 'var(--bg-doing)' : task.category === 'LEI' ? 'var(--bg-done)' : 'var(--bg-purple)',
                color: task.category === 'URGENTE' ? 'var(--color-danger)' : task.category === 'DOC' ? 'var(--color-doing)' : task.category === 'LEI' ? 'var(--color-done)' : 'var(--color-purple)',
              }}>
                {task.category}
              </span>
            )}
            {task.link && (
              <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[9px] font-semibold hover:underline flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
                <Globe className="w-2.5 h-2.5" /> Link
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => setTaskModal({ open: true, mode: 'edit', data: task })} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-amber-500 transition-colors">
              <Edit2 className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => deleteTask(task.id)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Card & Kanban Controls */}
      <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <CheckSquare className="w-4 h-4 text-amber-500" /> Painel de Regularização (Kanban em Tempo Real)
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Arraste e solte (Drag & Drop) qualquer etapa para reorganizar seu cronograma de regularização de 8 trimestres (24 meses).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('quarters')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'quarters' ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Por Trimestres
              </button>
              <button
                type="button"
                onClick={() => setViewMode('status')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'status' ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Por Status
              </button>
            </div>

            <button
              onClick={() => setTaskModal({ open: true, mode: 'add' })}
              className="btn px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              style={{ background: 'var(--accent)' }}
            >
              <PlusCircle className="w-4 h-4" /> Adicionar Etapa
            </button>
          </div>
        </div>

        {/* Filters & Year Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar etapa..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="input text-xs py-1.5 px-3 w-full sm:w-60"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-xs py-1.5 px-2"
            >
              <option value="ALL">Todas as Tags</option>
              <option value="URGENTE">URGENTE</option>
              <option value="DOC">DOC</option>
              <option value="LEI">LEI</option>
              <option value="LINK">LINK</option>
            </select>
          </div>

          {viewMode === 'quarters' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">Ano do Plano:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveYear(1)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${activeYear === 1 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}`}
                >
                  1º Ano (Trimestres 1 a 4)
                </button>
                <button
                  onClick={() => setActiveYear(2)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${activeYear === 2 ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}`}
                >
                  2º Ano (Trimestres 5 a 8)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KANBAN BOARD VIEW (BY QUARTERS) */}
      {viewMode === 'quarters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(activeYear === 1 ? [1, 2, 3, 4] : [5, 6, 7, 8]).map(q => {
            const quarterTasks = filteredChecklists.filter(c => c.quarter === q);
            const completedCount = quarterTasks.filter(c => c.is_completed).length;
            const isOver = dragOverColumn === `quarter_${q}`;

            return (
              <div
                key={q}
                onDragOver={(e) => handleDragOver(e, `quarter_${q}`)}
                onDragLeave={(e) => handleDragLeave(e, `quarter_${q}`)}
                onDrop={(e) => handleDropQuarter(e, q)}
                className={`rounded-2xl border p-4 space-y-3 transition-all duration-200 min-h-[380px] flex flex-col justify-between ${isOver ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 shadow-lg scale-[1.01]' : 'border-zinc-200 dark:border-zinc-800/80'}`}
                style={{ background: isOver ? undefined : 'var(--surface-2)' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b mb-3" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: activeYear === 1 ? 'var(--accent)' : 'var(--color-purple)' }}>
                        Trimestre {q}
                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-faint)' }}>({q * 3} Mês)</span>
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                      {completedCount}/{quarterTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {quarterTasks.length === 0 ? (
                      <div className="p-8 border border-dashed rounded-xl text-center space-y-1" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
                        <p className="text-[11px] font-semibold">Nenhuma etapa neste trimestre.</p>
                        <p className="text-[9px]">Arraste um cartão de outro trimestre até aqui!</p>
                      </div>
                    ) : (
                      quarterTasks.map((task) => renderTaskCard(task))
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-center pt-2 text-zinc-400 font-semibold">
                  Solte aqui para mover ao T{q}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW (BY STATUS) */}
      {viewMode === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* COLUMN: A FAZER / PENDENTES */}
          <div
            onDragOver={(e) => handleDragOver(e, 'status_todo')}
            onDragLeave={(e) => handleDragLeave(e, 'status_todo')}
            onDrop={(e) => handleDropStatus(e, 'todo')}
            className={`rounded-2xl border p-5 space-y-4 min-h-[450px] transition-all duration-200 ${dragOverColumn === 'status_todo' ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 shadow-lg scale-[1.01]' : 'border-zinc-200 dark:border-zinc-800/80'}`}
            style={{ background: dragOverColumn === 'status_todo' ? undefined : 'var(--surface-2)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-amber-500">
                <Clock className="w-4 h-4" /> Etapas Pendentes / A Fazer
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {filteredChecklists.filter(c => !c.is_completed).length} Tarefas
              </span>
            </div>

            <div className="space-y-3">
              {filteredChecklists.filter(c => !c.is_completed).length === 0 ? (
                <div className="p-12 border border-dashed rounded-xl text-center space-y-1" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
                  <p className="text-xs font-bold text-emerald-500">🎉 Todas as etapas foram concluídas!</p>
                  <p className="text-[10px]">Parabéns! Sua jornada está 100% em dia.</p>
                </div>
              ) : (
                filteredChecklists.filter(c => !c.is_completed).map((task) => renderTaskCard(task))
              )}
            </div>
          </div>

          {/* COLUMN: CONCLUÍDAS / REGULARIZADAS */}
          <div
            onDragOver={(e) => handleDragOver(e, 'status_done')}
            onDragLeave={(e) => handleDragLeave(e, 'status_done')}
            onDrop={(e) => handleDropStatus(e, 'done')}
            className={`rounded-2xl border p-5 space-y-4 min-h-[450px] transition-all duration-200 ${dragOverColumn === 'status_done' ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 shadow-lg scale-[1.01]' : 'border-zinc-200 dark:border-zinc-800/80'}`}
            style={{ background: dragOverColumn === 'status_done' ? undefined : 'var(--surface-2)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" /> Etapas Concluídas / Regularizadas
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {filteredChecklists.filter(c => c.is_completed).length} Concluídas
              </span>
            </div>

            <div className="space-y-3">
              {filteredChecklists.filter(c => c.is_completed).length === 0 ? (
                <div className="p-12 border border-dashed rounded-xl text-center space-y-1" style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
                  <p className="text-xs font-semibold">Nenhuma etapa concluída ainda.</p>
                  <p className="text-[10px]">Arraste etapas pendentes para este lado conforme for finalizando!</p>
                </div>
              ) : (
                filteredChecklists.filter(c => c.is_completed).map((task) => renderTaskCard(task))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegularizacaoPage() {
  return (
    <ImigracaoShell>
      <RegularizacaoKanbanContent />
    </ImigracaoShell>
  );
}
