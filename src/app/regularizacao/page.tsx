'use client';

import React from 'react';
import { PlusCircle, Edit2, Trash2, Globe, CheckSquare } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';

function RegularizacaoContent() {
  const { checklists, toggleChecklistTask, setTaskModal, deleteTask } = useImigracao();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Checklist Cronológico de Regularização
            </h2>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Acompanhe e personalize cada etapa ao longo de 8 trimestres (24 meses) para sua legalidade.
            </p>
          </div>
          <button
            onClick={() => setTaskModal({ open: true, mode: 'add' })}
            className="btn px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            <PlusCircle className="w-4 h-4" /> Adicionar Etapa/Tarefa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(q => (
            <div key={q} className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-black uppercase" style={{ color: 'var(--accent)' }}>
                  Trimestre {q} <span className="text-[10px] font-normal" style={{ color: 'var(--text-faint)' }}>({q * 3} Meses)</span>
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                  {checklists.filter(c => c.quarter === q && c.is_completed).length}/{checklists.filter(c => c.quarter === q).length}
                </span>
              </div>
              <div className="space-y-3 min-h-[150px]">
                {checklists.filter(c => c.quarter === q).length === 0 ? (
                  <p className="text-[10px] text-center py-10" style={{ color: 'var(--text-faint)' }}>Nenhuma tarefa neste trimestre.</p>
                ) : (
                  checklists.filter(c => c.quarter === q).map(task => (
                    <div key={task.id} className="p-3 rounded-lg border flex flex-col justify-between shadow-sm space-y-2 relative" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={task.is_completed} onChange={(e) => toggleChecklistTask(task.id, e.target.checked)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold block ${task.is_completed ? 'line-through' : ''}`} style={{ color: task.is_completed ? 'var(--text-faint)' : 'var(--text)' }}>
                            {task.title}
                          </span>
                          <p className="text-[10px] mt-1 line-clamp-3" style={{ color: 'var(--text-faint)' }}>{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex gap-1">
                          {task.category && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                              background: task.category === 'URGENTE' ? 'var(--bg-danger)' : task.category === 'DOC' ? 'var(--bg-doing)' : task.category === 'LEI' ? 'var(--bg-done)' : 'var(--bg-purple)',
                              color: task.category === 'URGENTE' ? 'var(--color-danger)' : task.category === 'DOC' ? 'var(--color-doing)' : task.category === 'LEI' ? 'var(--color-done)' : 'var(--color-purple)',
                            }}>
                              {task.category}
                            </span>
                          )}
                          {task.link && (
                            <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-[8px] font-semibold hover:underline flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
                              <Globe className="w-2.5 h-2.5" /> Link
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setTaskModal({ open: true, mode: 'edit', data: task })} className="p-0.5 rounded" style={{ color: 'var(--text-faint)' }}><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => deleteTask(task.id)} className="p-0.5 rounded" style={{ color: 'var(--text-faint)' }}><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-black uppercase mb-4" style={{ color: 'var(--text-faint)' }}>Segundo Ano de Imigração (Trimestres 5 a 8)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[5,6,7,8].map(q => (
              <div key={q} className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-black" style={{ color: 'var(--color-purple)' }}>Trimestre {q}</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                    {checklists.filter(c => c.quarter === q && c.is_completed).length}/{checklists.filter(c => c.quarter === q).length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {checklists.filter(c => c.quarter === q).length === 0 ? (
                    <p className="text-[10px] text-center py-10" style={{ color: 'var(--text-faint)' }}>Use o botão acima para planejar este período.</p>
                  ) : (
                    checklists.filter(c => c.quarter === q).map(task => (
                      <div key={task.id} className="p-3 rounded-lg border flex flex-col justify-between shadow-sm space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-start gap-2">
                          <input type="checkbox" checked={task.is_completed} onChange={(e) => toggleChecklistTask(task.id, e.target.checked)} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold block ${task.is_completed ? 'line-through' : ''}`} style={{ color: task.is_completed ? 'var(--text-faint)' : 'var(--text)' }}>
                              {task.title}
                            </span>
                            <p className="text-[10px] mt-1 line-clamp-3" style={{ color: 'var(--text-faint)' }}>{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex gap-1">
                            {task.category && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-purple)', color: 'var(--color-purple)' }}>{task.category}</span>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setTaskModal({ open: true, mode: 'edit', data: task })} className="p-0.5 rounded" style={{ color: 'var(--text-faint)' }}><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => deleteTask(task.id)} className="p-0.5 rounded" style={{ color: 'var(--text-faint)' }}><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegularizacaoPage() {
  return (
    <ImigracaoShell>
      <RegularizacaoContent />
    </ImigracaoShell>
  );
}
