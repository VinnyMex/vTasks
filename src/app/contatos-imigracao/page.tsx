'use client';

import React from 'react';
import { Phone, Mail, Globe, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { ImigracaoShell } from '@/components/ImigracaoShell';
import { useImigracao } from '@/lib/imigracao-context';

function ContatosContent() {
  const { contacts, setContactModal, deleteContact } = useImigracao();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Diretório de Contatos Oficiais
            </h2>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Acesse órgãos oficiais, escolas, centros de saúde e ONGs úteis para regularização.
            </p>
          </div>
          <button
            onClick={() => setContactModal({ open: true, mode: 'add' })}
            className="btn px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            <PlusCircle className="w-4 h-4" /> Adicionar Contato
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.length === 0 ? (
            <p className="col-span-full text-center py-20 text-xs font-bold uppercase" style={{ color: 'var(--text-faint)' }}>Nenhum contato cadastrado.</p>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="p-4 rounded-xl border flex flex-col justify-between border-l-4"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  borderLeftColor: c.category === 'oficial' ? 'var(--accent)' : c.category === 'saude' ? 'var(--color-teal)' : c.category === 'educacao' ? 'var(--color-warning)' : 'var(--color-purple)'
                }}>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full" style={{
                      background: c.category === 'oficial' ? 'var(--bg-doing)' : c.category === 'saude' ? 'var(--bg-teal)' : c.category === 'educacao' ? 'var(--bg-warning)' : 'var(--bg-purple)',
                      color: c.category === 'oficial' ? 'var(--color-doing)' : c.category === 'saude' ? 'var(--color-teal)' : c.category === 'educacao' ? 'var(--color-warning)' : 'var(--color-purple)',
                    }}>
                      {c.category === 'oficial' ? 'Órgão Oficial' : c.category === 'saude' ? 'Saúde' : c.category === 'educacao' ? 'Educação / Escolar' : 'Apoio / ONG'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setContactModal({ open: true, mode: 'edit', data: c })} className="p-1" style={{ color: 'var(--text-faint)' }}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteContact(c.id)} className="p-1" style={{ color: 'var(--text-faint)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="text-xs font-black truncate" style={{ color: 'var(--text)' }}>{c.name}</h3>
                  {c.address && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}><span className="font-bold">Endereço:</span> {c.address}</p>}
                  {c.purpose && <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>"{c.purpose}"</p>}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border rounded-lg transition-colors" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <Phone className="w-3 h-3" style={{ color: 'var(--accent)' }} /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border rounded-lg transition-colors" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <Mail className="w-3 h-3" style={{ color: 'var(--color-purple)' }} /> E-mail
                    </a>
                  )}
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border rounded-lg transition-colors" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <Globe className="w-3 h-3" style={{ color: 'var(--color-done)' }} /> Site
                    </a>
                  )}
                  {c.sede_electronica && (
                    <a href={c.sede_electronica} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      <Globe className="w-3 h-3" /> Sede Eletrônica
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContatosImigracaoPage() {
  return (
    <ImigracaoShell>
      <ContatosContent />
    </ImigracaoShell>
  );
}
