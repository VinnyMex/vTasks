'use client';

import React from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { ImigracaoProvider, useImigracao } from '@/lib/imigracao-context';
import ElenaAssistant from '@/components/travel-docs/ElenaAssistant';

function ImigracaoModais() {
  const {
    taskModal, setTaskModal, saveTask, profile,
    contactModal, setContactModal, saveContact,
    docModal, setDocModal, uploadDocument, handleFileChange, isUploading,
    extendedState,
  } = useImigracao();

  return (
    <>
      {/* MODAL TAREFA */}
      {taskModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md border animate-scaleUp" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                {taskModal.mode === 'add' ? 'Adicionar Tarefa' : 'Editar Tarefa'}
              </h3>
              <button onClick={() => setTaskModal({ open: false, mode: 'add' })} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Título da Etapa/Tarefa</label>
                <input type="text" name="title" required defaultValue={taskModal.data?.title || ''} className="input text-xs" placeholder="Ex: Semana 1 — Empadronamento" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Trimestre (1 a 8)</label>
                  <select name="quarter" defaultValue={taskModal.data?.quarter || profile.current_quarter} className="input text-xs">
                    {[1,2,3,4,5,6,7,8].map(q => <option key={q} value={q}>Trimestre {q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Prioridade / Tag</label>
                  <select name="category" defaultValue={taskModal.data?.category || 'DOC'} className="input text-xs">
                    <option value="URGENTE">URGENTE</option>
                    <option value="DOC">DOC (Gera Documento)</option>
                    <option value="LEI">LEI (Direito Legal)</option>
                    <option value="LINK">LINK (Portal Web)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Descrição</label>
                <textarea name="description" rows={3} defaultValue={taskModal.data?.description || ''} className="input text-xs" placeholder="Instruções e detalhes..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">URL de Apoio</label>
                <input type="url" name="link" defaultValue={taskModal.data?.link || ''} className="input text-xs" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTaskModal({ open: false, mode: 'add' })} className="btn px-4 py-2 border rounded-xl text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancelar</button>
                <button type="submit" className="btn px-4 py-2 text-white rounded-xl text-xs font-bold" style={{ background: 'var(--accent)' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONTATO */}
      {contactModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md border animate-scaleUp" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                {contactModal.mode === 'add' ? 'Novo Contato' : 'Editar Contato'}
              </h3>
              <button onClick={() => setContactModal({ open: false, mode: 'add' })} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nome do Órgão/Contato</label>
                <input type="text" name="name" required defaultValue={contactModal.data?.name || ''} className="input text-xs" placeholder="Ex: Ayuntamiento de Menasalbas" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Categoria</label>
                  <select name="category" defaultValue={contactModal.data?.category || 'oficial'} className="input text-xs">
                    <option value="oficial">Órgão Oficial</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação / Escola</option>
                    <option value="ong">ONG / Apoio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Telefone</label>
                  <input type="text" name="phone" defaultValue={contactModal.data?.phone || ''} className="input text-xs" placeholder="+34..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Finalidade / Objetivo</label>
                <input type="text" name="purpose" defaultValue={contactModal.data?.purpose || ''} className="input text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Endereço Físico</label>
                <input type="text" name="address" defaultValue={contactModal.data?.address || ''} className="input text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Site / Portal</label>
                  <input type="url" name="website" defaultValue={contactModal.data?.website || ''} className="input text-xs" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Sede Eletrônica</label>
                  <input type="url" name="sede_electronica" defaultValue={contactModal.data?.sede_electronica || ''} className="input text-xs" placeholder="https://sede..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">E-mail</label>
                <input type="email" name="email" defaultValue={contactModal.data?.email || ''} className="input text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setContactModal({ open: false, mode: 'add' })} className="btn px-4 py-2 border rounded-xl text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancelar</button>
                <button type="submit" className="btn px-4 py-2 text-white rounded-xl text-xs font-bold" style={{ background: 'var(--accent)' }}>Salvar Contato</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENTO */}
      {docModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md border animate-scaleUp" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                Upload de Documento Seguro
              </h3>
              <button onClick={() => setDocModal(prev => ({ ...prev, open: false }))} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={uploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Selecionar Arquivo (PDF ou Imagem)</label>
                <input type="file" accept=".pdf,image/*" required onChange={handleFileChange} className="input text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nome Amigável do Documento</label>
                <input type="text" required value={docModal.name} onChange={(e) => setDocModal(prev => ({ ...prev, name: e.target.value }))} className="input text-xs" placeholder="Ex: Meu Passaporte..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Categoria</label>
                  <select value={docModal.category} onChange={(e) => setDocModal(prev => ({ ...prev, category: e.target.value }))} className="input text-xs">
                    <option value="identidade">Identidade / Passaporte</option>
                    <option value="moradia">Moradia / Contrato</option>
                    <option value="educacao">Educação / Certificado</option>
                    <option value="trabalho">Trabalho / Renda</option>
                    <option value="saude">Saúde / Carteira</option>
                    <option value="outro">Outro Documento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Validade / Vencimento</label>
                  <input type="date" value={docModal.expiry_date} onChange={(e) => setDocModal(prev => ({ ...prev, expiry_date: e.target.value }))} className="input text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Vincular ao Trimestre (opcional)</label>
                <select value={docModal.associated_quarter} onChange={(e) => setDocModal(prev => ({ ...prev, associated_quarter: e.target.value }))} className="input text-xs">
                  <option value="">Nenhum</option>
                  {[1,2,3,4,5,6,7,8].map(q => <option key={q} value={q}>Trimestre {q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Anotações</label>
                <textarea value={docModal.notes} onChange={(e) => setDocModal(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="input text-xs" placeholder="Número de protocolo, observações..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDocModal(prev => ({ ...prev, open: false }))} className="btn px-4 py-2 border rounded-xl text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancelar</button>
                <button type="submit" disabled={isUploading} className="btn px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50" style={{ background: 'var(--accent)' }}>
                  {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</> : <><Upload className="w-3.5 h-3.5" /> Fazer Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ElenaAssistant state={extendedState} />
    </>
  );
}

function ImigracaoShellInner({ children }: { children: React.ReactNode }) {
  const { syncStatus, lastSyncTime } = useImigracao();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Barra de Status de Sincronização em Tempo Real Supabase */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-2 font-bold">
          {syncStatus === 'saving' && (
            <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              🔄 Sincronizando com o Supabase em tempo real...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              🟢 Cloud Sync Ativo — Salvo no Supabase em tempo real ({lastSyncTime})
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              ⚠️ Falha ao salvar no Supabase (salvo no cache local)
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-zinc-400 hidden sm:block">
          Supabase PostgreSQL Realtime Active
        </div>
      </div>

      {children}
      <ImigracaoModais />
    </div>
  );
}

export function ImigracaoShell({ children }: { children: React.ReactNode }) {
  return (
    <ImigracaoProvider>
      <ImigracaoShellInner>{children}</ImigracaoShellInner>
    </ImigracaoProvider>
  );
}
