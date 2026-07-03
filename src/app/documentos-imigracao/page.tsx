'use client';

import React from 'react';
import { FileText, File, Upload, Eye, Trash2 } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';

function DocumentosContent() {
  const { documents, setDocModal, deleteDocument, viewDocument, getDocumentExpiryStatus } = useImigracao();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Gerenciador de Documentos de Viagem & Imigração
            </h2>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Faça o upload seguro de passaportes, certidões e empadronamentos. Controle datas de validade.
            </p>
          </div>
          <button
            onClick={() => setDocModal({ open: true, name: '', category: 'identidade', expiry_date: '', associated_quarter: '', notes: '' })}
            className="btn px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            <Upload className="w-4 h-4" /> Enviar Novo Documento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6" style={{ borderColor: 'var(--border)' }}>
              <File className="w-10 h-10 mb-3" style={{ color: 'var(--text-faint)' }} />
              <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-faint)' }}>Nenhum documento anexado ainda</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Faça upload de comprovantes, passaportes ou certidões para mantê-los seguros na nuvem.</p>
            </div>
          ) : (
            documents.map(doc => {
              const status = getDocumentExpiryStatus(doc.expiry_date);
              return (
                <div key={doc.id} className="p-4 rounded-xl border flex flex-col justify-between shadow-sm" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>{doc.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        <File className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black truncate" style={{ color: 'var(--text)' }}>{doc.name}</h4>
                        <p className="text-[9px]" style={{ color: 'var(--text-faint)' }}>Cadastrado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    {doc.notes && (
                      <p className="text-[10px] p-2 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{doc.notes}</p>
                    )}
                    {doc.associated_quarter && (
                      <div className="text-[9px] font-bold" style={{ color: 'var(--accent)' }}>
                        📂 Vinculado ao Trimestre {doc.associated_quarter}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t justify-end" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => viewDocument(doc.file_url)}
                      className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 border rounded-lg transition-colors"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Visualizar / Baixar
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_url)}
                      className="p-1.5 rounded-lg border border-transparent transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function DocumentosImigracaoPage() {
  return (
    <ImigracaoShell>
      <DocumentosContent />
    </ImigracaoShell>
  );
}
