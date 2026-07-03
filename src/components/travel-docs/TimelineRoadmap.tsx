import React, { useState } from 'react';
import { TimelineTask } from './types';
import { Clock, Check, AlertCircle, Lightbulb, Info, Plus, Trash2, Pencil, X } from 'lucide-react';

interface TimelineRoadmapProps {
  tasks: TimelineTask[];
  onToggleTask: (taskId: string) => void;
  onChangeTasks: (tasks: TimelineTask[]) => void;
  destinationCountry?: string;
  travelYear?: string;
}

export default function TimelineRoadmap({ tasks, onToggleTask, onChangeTasks, destinationCountry, travelYear }: TimelineRoadmapProps) {
  const [showTips, setShowTips] = useState<boolean>(true);

  // Form states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<TimelineTask['timeframe']>('6_meses');
  const [priority, setPriority] = useState<TimelineTask['priority']>('medium');

  const phases: { id: TimelineTask['timeframe']; title: string; subtitle: string; color: string }[] = [
    { id: '6_meses', title: "6 Meses Antes", subtitle: "Preparação inicial", color: "bg-blue-500" },
    { id: '3_meses', title: "3 Meses Antes", subtitle: "Documentos e vistos", color: "bg-purple-500" },
    { id: '1_mes', title: "1 Mês Antes", subtitle: "Finais e malas", color: "bg-amber-500" },
    { id: 'chegada', title: "Primeiros Dias", subtitle: "Instalação e moradia", color: "bg-teal-500" },
    { id: 'regularizacao', title: "Regularização", subtitle: "Trâmites locais", color: "bg-indigo-500" }
  ];

  const timelineTips = [
    { title: "Validade Estrita de Antecedentes", text: "Não adiante a emissão do antecedente criminal da Polícia Federal brasileira. Ele tem validade legal máxima de 90 dias a contar da emissão. Emita de 30 a 40 dias antes de embarcar." },
    { title: "Agendamentos Prévios", text: `No seu destino (${destinationCountry || 'exterior'}), o atendimento físico em órgãos públicos (como prefeituras e delegacias de polícia) exige agendamento pela internet. Consiga suas marcações ou registros assim que fechar a moradia.` },
    { title: "Matrícula Escolar Obrigatória", text: "O ano letivo escolar começa em períodos distintos pelo mundo, mas para crianças em idade escolar obrigatória, os órgãos de educação garantem matrícula em qualquer mês do ano mediante comprovação de moradia no local." },
    { title: "Direção com CNH Brasileira", text: `Como turista ou recém-chegado, você pode dirigir legalmente no destino (${destinationCountry || 'exterior'}) com sua CNH brasileira por até 6 meses. Após esse período, verifique regras de homologação ou troca de carteira.` }
  ];

  const startEdit = (task: TimelineTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setTimeframe(task.timeframe);
    setPriority(task.priority);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setTimeframe('6_meses');
    setPriority('medium');
  };

  const handleDeleteTask = (id: string) => {
    onChangeTasks(tasks.filter(t => t.id !== id));
    if (editingTaskId === id) {
      cancelEdit();
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      const updated = tasks.map(t => {
        if (t.id === editingTaskId) {
          const matchedPhase = phases.find(p => p.id === timeframe);
          return {
            ...t,
            title: title.trim(),
            description: description.trim(),
            timeframe,
            priority,
            timeframeLabel: matchedPhase ? matchedPhase.title : 'Prazo'
          };
        }
        return t;
      });
      onChangeTasks(updated);
      cancelEdit();
    } else {
      const matchedPhase = phases.find(p => p.id === timeframe);
      const newTask: TimelineTask = {
        id: `task_${Date.now()}`,
        timeframe,
        timeframeLabel: matchedPhase ? matchedPhase.title : 'Prazo',
        title: title.trim(),
        description: description.trim(),
        completed: false,
        priority
      };
      onChangeTasks([...tasks, newTask]);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Tips Area */}
      <div className="bg-cyan-50 dark:bg-cyan-950/20 p-5 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 no-print">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Dicas e Regras de Cronograma ({destinationCountry || 'Destino'}{travelYear ? ` ${travelYear}` : ''})
            </h4>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 text-xs font-semibold">
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>
        
        {showTips && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {timelineTips.map((tip, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 space-y-1">
                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-500" />
                  {tip.title}
                </span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel - left column (hidden on print) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <div className={`p-5 rounded-2xl border shadow-xs transition-all ${
            editingTaskId 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' 
              : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 ${
              editingTaskId ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-400'
            }`}>
              {editingTaskId ? <Pencil className="w-4 h-4 text-blue-500 animate-pulse" /> : <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />}
              <span>{editingTaskId ? '📌 EDITANDO: Tarefa' : 'Nova Tarefa no Cronograma'}</span>
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Título da Tarefa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tirar passaporte da família"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                  style={{ minHeight: '38px' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Agendar no site da PF e pagar taxas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:bg-zinc-900 transition-all text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Fase / Época</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ minHeight: '38px' }}
                  >
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ minHeight: '38px' }}
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {editingTaskId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    style={{ minHeight: '40px' }}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingTaskId ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs`}
                  style={{ minHeight: '40px' }}
                >
                  {editingTaskId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTaskId ? 'Salvar Alterações' : 'Adicionar ao Cronograma'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Timeline List - right column (main timeline card) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs print-card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: "var(--text)" }}>
            <Clock className="text-brand-primary w-5 h-5" />
            <span>3. Cronograma da Mudança (Linha do Tempo)</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Acompanhe o planejamento cronológico recomendado. Marque as tarefas principais à medida que as concluir para acompanhar seu progresso no tempo.
          </p>

          {/* Chronological Timeline Track */}
          <div className="relative border-l-2 border-zinc-100 dark:border-zinc-800 pl-4 sm:pl-6 ml-3 sm:ml-5 space-y-10">
            {phases.map((phase) => {
              const phaseTasks = tasks.filter(t => t.timeframe === phase.id);
              const completedCount = phaseTasks.filter(t => t.completed).length;
              const totalCount = phaseTasks.length;
              const phasePct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div key={phase.id} className="relative">
                  {/* Visual marker dot on the left line */}
                  <div className={`absolute -left-[25px] sm:-left-[33px] top-1 w-4.5 h-4.5 rounded-full border-4 border-white ${phase.color} shadow-xs`} />

                  {/* Phase Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{phase.title}</span>
                        <span className="text-xs font-normal text-zinc-400">({phase.subtitle})</span>
                      </h3>
                    </div>
                    {/* Progress badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="w-20 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${phasePct}%` }} />
                      </div>
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 px-2 py-0.5 rounded-md font-bold font-mono">
                        {completedCount}/{totalCount} concluídos
                      </span>
                    </div>
                  </div>

                  {/* Tasks cards under phase */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phaseTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onToggleTask(task.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between hover:shadow-xs active:bg-zinc-50 dark:bg-zinc-800/40 ${
                          task.completed
                            ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                            : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40/20 border-zinc-200 dark:border-zinc-800/80 shadow-2xs'
                        } ${editingTaskId === task.id ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/10' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Interactive checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id);
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                              task.completed
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-zinc-300 bg-white dark:bg-zinc-900 hover:border-blue-500'
                            }`}
                            style={{ minWidth: '22px', minHeight: '22px' }}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold block leading-snug ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                              {task.title}
                            </span>
                            <p className={`text-[11px] mt-1 leading-relaxed ${task.completed ? 'text-zinc-400 font-normal' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              {task.description}
                            </p>
                          </div>
                        </div>

                        {/* Priority indicator & Actions footer */}
                        <div className="mt-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between w-full">
                          <span className={`text-[8px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                            task.priority === 'high' 
                              ? 'bg-red-50 text-red-600' 
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>

                          <div className="flex items-center gap-1.5 no-print">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(task);
                              }}
                              className={`p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 transition-colors cursor-pointer ${
                                editingTaskId === task.id ? 'text-blue-600 bg-blue-50/50' : 'text-zinc-400 hover:text-blue-500'
                              }`}
                              title="Editar tarefa"
                              style={{ minWidth: '28px', minHeight: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Excluir a tarefa "${task.title}"?`)) {
                                  handleDeleteTask(task.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Excluir tarefa"
                              style={{ minWidth: '28px', minHeight: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {phaseTasks.length === 0 && (
                      <div className="col-span-full py-6 text-center text-zinc-400 border border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <p className="text-[11px]">Nenhuma tarefa nesta fase.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
