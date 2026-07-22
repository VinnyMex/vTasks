import React, { useState } from 'react';
import { TimelineTask } from './types';
import { Clock, Check, Info, Plus, Trash2, Pencil, X, Lightbulb } from 'lucide-react';

interface TimelineRoadmapProps {
  tasks: TimelineTask[];
  onToggleTask: (taskId: string) => void;
  onChangeTasks: (tasks: TimelineTask[]) => void;
  destinationCountry?: string;
  travelYear?: string;
}

export default function TimelineRoadmap({ tasks, onToggleTask, onChangeTasks, destinationCountry, travelYear }: TimelineRoadmapProps) {
  const [showTips, setShowTips] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<TimelineTask['timeframe']>('6_meses');
  const [priority, setPriority] = useState<TimelineTask['priority']>('medium');

  const phases: { id: TimelineTask['timeframe']; title: string; subtitle: string; color: string }[] = [
    { id: '6_meses', title: "6 Meses Antes", subtitle: "Preparação e documentação inicial", color: "bg-blue-500" },
    { id: '3_meses', title: "3 Meses Antes", subtitle: "Apostila de Haia e traduções juramentadas", color: "bg-purple-500" },
    { id: '1_mes', title: "1 Mês Antes", subtitle: "Passagens, seguro viagem e organização física", color: "bg-amber-500" },
    { id: 'chegada', title: "Primeiros Dias (Na Chegada)", subtitle: "Acomodação estável e registro de residência", color: "bg-teal-500" },
    { id: 'regularizacao', title: "Rumo à Regularização", subtitle: "Preservação de provas e assessoria legal", color: "bg-indigo-500" }
  ];

  const phaseGrads: Record<TimelineTask['timeframe'], string> = {
    '6_meses': 'linear-gradient(90deg, #1A56DB, #3B82F6)',
    '3_meses': 'linear-gradient(90deg, #057A55, #10B981)',
    '1_mes': 'linear-gradient(90deg, #B45309, #F59E0B)',
    'chegada': 'linear-gradient(90deg, #6D28D9, #8B5CF6)',
    'regularizacao': 'linear-gradient(90deg, #991B1B, #EF4444)'
  };

  const phaseShortNames: Record<TimelineTask['timeframe'], string> = {
    '6_meses': 'F1',
    '3_meses': 'F2',
    '1_mes': 'F3',
    'chegada': 'F4',
    'regularizacao': 'F5'
  };

  const timelineTips = [
    { title: "Validade Estrita de Antecedentes", text: "Não adiante a emissão do antecedente criminal da Polícia Federal brasileira. Ele tem validade legal máxima de 90 dias a contar da data de emissão. Deixe para emitir de 30 a 40 dias antes de embarcar." },
    { title: "Agendamentos Prévios (Cita Previa)", text: `No seu destino (${destinationCountry || 'exterior'}), os atendimentos em órgãos de imigração e prefeituras exigem marcação prévia online. Monitore as marcações assim que fechar a moradia.` },
    { title: "Escolarização Obrigatória", text: "A matrícula em escolas locais é garantida para menores de 6 a 16 anos mediante comprovação de moradia (registro de residência), independente de status migratório regular." },
    { title: "CNH Brasileira no Exterior", text: `Como turista ou recém-chegado, você pode dirigir legalmente no destino (${destinationCountry || 'exterior'}) com sua CNH por até 6 meses. Depois, consulte regras de homologação ou troca de carteira.` }
  ];

  const phaseTips: Record<TimelineTask['timeframe'], { text: string; bg: string; border: string; textCol: string }> = {
    '6_meses': { 
      text: "Não atrase a renovação ou emissão de novos passaportes. Eles devem ter no mínimo 1 ano de validade restante na data do embarque.",
      bg: 'var(--bg-doing)', border: 'var(--accent-border)', textCol: 'var(--accent)'
    },
    '3_meses': { 
      text: "Apostilar as certidões e contratar tradutores juramentados com antecedência evita correria e sobretaxas de prazos urgentes.",
      bg: 'var(--bg-purple)', border: 'rgba(175,82,222,0.2)', textCol: 'var(--color-purple)'
    },
    '1_mes': { 
      text: "Antecedentes criminais da PF têm validade curta de 90 dias. Emita e apostile a certidão no Brasil dentro deste intervalo de 30 dias da viagem.",
      bg: 'var(--bg-warning)', border: 'var(--bg-warning)', textCol: 'var(--color-warning)'
    },
    'chegada': { 
      text: "O registro municipal de residência (Empadronamiento) é a chave de acesso à saúde pública gratuita e matrícula escolar para crianças.",
      bg: 'var(--bg-done)', border: 'rgba(52,199,89,0.2)', textCol: 'var(--color-done)'
    },
    'regularizacao': { 
      text: "Mantenha o registro de residência contínuo e arquive todas as faturas e extratos de compras no destino. Cada documento comprova o seu tempo de permanência.",
      bg: 'var(--bg-danger)', border: 'var(--bg-danger)', textCol: 'var(--color-danger)'
    }
  };

  const startEdit = (task: TimelineTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setTimeframe(task.timeframe);
    setPriority(task.priority);
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setTimeframe('6_meses');
    setPriority('medium');
  };

  const openAddModal = () => {
    cancelEdit();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    cancelEdit();
    setIsModalOpen(false);
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
    }
    closeModal();
  };

  function extractLink(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      {/* Button panel above chronological track */}
      <div className="flex justify-between items-center gap-4 no-print pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-black flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Clock className="text-brand-primary w-5 h-5" />
            <span>3. Cronograma da Mudança (Linha do Tempo)</span>
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acompanhe e edite o cronograma de preparação pré e pós imigração.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary px-4 py-2.5 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Adicionar Tarefa ao Cronograma
        </button>
      </div>

      {/* Chronological Blocks (Style ideas.md) */}
      <div className="space-y-6">
        {phases.map((phase) => {
          const phaseTasks = tasks.filter(t => t.timeframe === phase.id);
          const completedCount = phaseTasks.filter(t => t.completed).length;
          const totalCount = phaseTasks.length;

          return (
            <div 
              key={phase.id} 
              className="card rounded-2xl overflow-hidden border shadow-xs" 
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Header block with ideas.md gradient styles */}
              <div className="flex items-center gap-3 px-5 py-3.5 text-white select-none" style={{ background: phaseGrads[phase.id] }}>
                <div className="text-2xl font-black opacity-60 font-mono tracking-tighter leading-none pr-1">
                  {phaseShortNames[phase.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold tracking-wide truncate">{phase.title}</h3>
                  <p className="text-[10px] opacity-85 truncate mt-0.5">{phase.subtitle}</p>
                </div>
                <div className="flex-shrink-0 bg-white/20 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase">
                  {completedCount}/{totalCount} Concluídas
                </div>
              </div>

              {/* Body space of the block */}
              <div className="p-4 space-y-4">
                {totalCount === 0 ? (
                  <p className="text-center py-8 text-[11px] font-bold" style={{ color: 'var(--text-faint)' }}>
                    Nenhuma tarefa cadastrada nesta fase. Clique em "Adicionar Tarefa ao Cronograma" no topo.
                  </p>
                ) : (
                  <ul className="space-y-2.5 list-none m-0 p-0">
                    {phaseTasks.map((task) => {
                      const tags = [];
                      if (task.priority === 'high') {
                        tags.push({ label: 'URGENTE', bg: 'var(--bg-danger)', color: 'var(--color-danger)' });
                      } else if (task.priority === 'medium') {
                        tags.push({ label: 'DOC', bg: 'var(--bg-doing)', color: 'var(--color-doing)' });
                      } else {
                        tags.push({ label: 'LEI', bg: 'var(--bg-done)', color: 'var(--color-done)' });
                      }

                      const linkUrl = extractLink(task.description + ' ' + task.title);

                      return (
                        <li 
                          key={task.id} 
                          className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/40"
                        >
                          {/* Checkbox item */}
                          <button
                            type="button"
                            onClick={() => onToggleTask(task.id)}
                            className="w-4.5 h-4.5 rounded-md border flex items-center justify-center mt-0.5 flex-shrink-0 cursor-pointer transition-colors"
                            style={{
                              borderColor: task.completed ? 'var(--accent)' : 'var(--border-strong)',
                              background: task.completed ? 'var(--accent)' : 'var(--surface-2)',
                              minWidth: '18px',
                              minHeight: '18px'
                            }}
                          >
                            {task.completed && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
                          </button>

                          {/* Content description */}
                          <div className="flex-1 min-w-0">
                            <span 
                              className={`text-xs font-bold block leading-relaxed ${task.completed ? 'line-through' : ''}`}
                              style={{ color: task.completed ? 'var(--text-faint)' : 'var(--text)' }}
                            >
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {task.description}
                              </p>
                            )}

                            {/* Dynamic Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              {tags.map((t, i) => (
                                <span key={i} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: t.bg, color: t.color }}>
                                  {t.label}
                                </span>
                              ))}
                              {linkUrl && (
                                <a 
                                  href={linkUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[9px] font-bold hover:underline flex items-center gap-0.5" 
                                  style={{ color: 'var(--accent)' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                                    LINK
                                  </span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Actions button */}
                          <div className="flex items-center gap-1 flex-shrink-0 self-center no-print">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(task);
                              }}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Editar"
                              style={{ minWidth: '28px', minHeight: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Excluir a tarefa "${task.title}"?`)) {
                                  handleDeleteTask(task.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Excluir"
                              style={{ minWidth: '28px', minHeight: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Dica / Alerta at bottom of the phase */}
                {phaseTips[phase.id] && (
                  <div 
                    className="p-3 rounded-xl border flex gap-2.5 text-[10px] leading-relaxed no-print" 
                    style={{ background: phaseTips[phase.id].bg, borderColor: phaseTips[phase.id].border, color: phaseTips[phase.id].textCol }}
                  >
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: phaseTips[phase.id].textCol }} />
                    <div>
                      <strong className="font-extrabold">Dica de Planejamento:</strong> {phaseTips[phase.id].text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE/EDIT MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="card p-6 w-full max-w-md border animate-scaleUp" 
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                {editingTaskId ? 'Editar Tarefa do Cronograma' : 'Nova Tarefa no Cronograma'}
              </h3>
              <button onClick={closeModal} style={{ color: 'var(--text-muted)' }} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apostilar certidões da família"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input text-xs"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Ir ao cartório de notas com certidões originais..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input text-xs"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Fase / Prazo</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="input text-xs cursor-pointer"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="input text-xs cursor-pointer"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="high">Alta / Urgente</option>
                    <option value="medium">Média / Doc</option>
                    <option value="low">Baixa / Info</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn-secondary px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
