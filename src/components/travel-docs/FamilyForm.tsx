import React, { useState } from 'react';
import { FamilyMember } from './types';
import { User, Users, Plus, Trash2, Calendar, Shield, CreditCard, Mail, Lightbulb, Info } from 'lucide-react';

interface FamilyFormProps {
  familyMembers: FamilyMember[];
  onChangeFamilyMembers: (updated: FamilyMember[]) => void;
  destinationCountry?: string;
  travelYear?: string;
}

export default function FamilyForm({ familyMembers, onChangeFamilyMembers, destinationCountry, travelYear }: FamilyFormProps) {
  const [showTips, setShowTips] = useState<boolean>(false);

  const familyTips = [
    { 
      title: "Registro de União Familiar", 
      text: `No seu destino (${destinationCountry || 'exterior'}), os registros oficiais ajudam a comprovar o vínculo do casal e filhos. Certidões brasileiras de Casamento e Nascimento de inteiro teor, devidamente apostiladas e traduzidas, cumprem essa função legal.` 
    },
    { 
      title: "Matrícula Escolar Obrigatória", 
      text: "A escolarização de crianças e adolescentes é obrigatória por lei e gratuita no sistema público da maioria dos países de destino. A falta de matrícula ou assiduidade escolar regular pode gerar sérias sanções e afetar a regularização da família." 
    },
    { 
      title: "Passaporte para Menores", 
      text: "Os passaportes de bebês e crianças brasileiras possuem validade menor (de 1 a 4 anos dependendo da idade). Certifique-se de que tenham validade suficiente ao viajar para evitar renovações urgentes ou caras no consulado." 
    },
    { 
      title: "Número de Identidade Estrangeira", 
      text: "Um identificador ou número de residência para estrangeiros é essencial para qualquer trâmite administrativo, escolar ou abertura de contas bancárias por imigrantes no destino." 
    }
  ];

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    const updated = familyMembers.map(m => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onChangeFamilyMembers(updated);
  };

  const addChildren = () => {
    const nextNum = familyMembers.filter(m => m.role === 'filho').length + 1;
    const newChild: FamilyMember = {
      id: `filho_${Date.now()}`,
      role: 'filho',
      roleLabel: `Filho(a) ${nextNum}`,
      name: '',
      passportNumber: '',
      passportExpiry: '',
      cpf: '',
      rg: '',
      birthDate: '',
      notes: ''
    };
    onChangeFamilyMembers([...familyMembers, newChild]);
  };

  const removeChildren = (id: string) => {
    const filtered = familyMembers.filter(m => m.id !== id);
    // Recalculate roleLabels for children to keep it sequential
    let childCount = 1;
    const updated = filtered.map(m => {
      if (m.role === 'filho') {
        const updatedLabel = { ...m, roleLabel: `Filho(a) ${childCount}` };
        childCount++;
        return updatedLabel;
      }
      return m;
    });
    onChangeFamilyMembers(updated);
  };

  return (
    <div className="space-y-6">
      {/* Collapsible Family Tips */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Dicas e Regras Familiares ({destinationCountry || 'Destino'}{travelYear ? ` ${travelYear}` : ''})
            </h4>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 text-xs font-semibold">
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>
        
        {showTips && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {familyTips.map((tip, idx) => (
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

      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: "var(--text)" }}>
          <User className="text-brand-primary w-5 h-5" />
          <span>1. Dados da Família</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Preencha as informações essenciais de cada familiar. Estes dados ajudam a organizar os requisitos dos passaportes e certidões.
        </p>

        <div className="space-y-6">
          {familyMembers.map((member) => (
            <div 
              key={member.id} 
              className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 transition-colors space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  {member.role === 'principal' ? (
                    <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> {member.roleLabel}
                    </span>
                  ) : member.role === 'conjuge' ? (
                    <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {member.roleLabel}
                    </span>
                  ) : (
                    <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {member.roleLabel}
                    </span>
                  )}
                </div>
                
                {member.role === 'filho' && (
                  <button
                    type="button"
                    onClick={() => removeChildren(member.id)}
                    className="text-zinc-400 hover:text-red-500 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 transition-colors no-print"
                    title="Remover filho"
                    style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nome completo */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Nome Completo</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                    placeholder="Ex: João Silva Santos"
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    
                  />
                </div>

                {/* Data de Nascimento para filhos ou geral */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Data de Nascimento</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={member.birthDate || ''}
                      onChange={(e) => updateMember(member.id, 'birthDate', e.target.value)}
                      className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  {member.birthDate && (() => {
                    const today = new Date();
                    const birth = new Date(member.birthDate);
                    let age = today.getFullYear() - birth.getFullYear();
                    const notYet = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
                    if (notYet) age--;
                    return age >= 0 ? (
                      <span className="text-[11px] font-semibold mt-1 block" style={{ color: "var(--text-muted)" }}>
                        {age === 0 ? 'Menos de 1 ano' : `${age} ${age === 1 ? 'ano' : 'anos'}`}
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Passaporte Número */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Passaporte (Número)</label>
                  <input
                    type="text"
                    value={member.passportNumber}
                    onChange={(e) => updateMember(member.id, 'passportNumber', e.target.value)}
                    placeholder="Ex: YA123456"
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    
                  />
                </div>

                {/* Validade do Passaporte */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Validade do Passaporte</label>
                  <input
                    type="date"
                    value={member.passportExpiry}
                    onChange={(e) => updateMember(member.id, 'passportExpiry', e.target.value)}
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>CPF</label>
                  <input
                    type="text"
                    value={member.cpf}
                    onChange={(e) => updateMember(member.id, 'cpf', e.target.value)}
                    placeholder="Ex: 000.000.000-00"
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    
                  />
                </div>

                {/* RG */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>RG (Órgão Emissor / UF)</label>
                  <input
                    type="text"
                    value={member.rg}
                    onChange={(e) => updateMember(member.id, 'rg', e.target.value)}
                    placeholder="Ex: 12.345.678-9 SSP/SP"
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    
                  />
                </div>

                {/* Contato (apenas para responsáveis) */}
                {member.role !== 'filho' && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Contato (E-mail / Telefone)</label>
                    <input
                      type="text"
                      value={member.contact || ''}
                      onChange={(e) => updateMember(member.id, 'contact', e.target.value)}
                      placeholder="Ex: vinicius@email.com / +55 11 99999-9999"
                      className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                      
                    />
                  </div>
                )}

                {/* Observações */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Anotações Individuais</label>
                  <textarea
                    value={member.notes || ''}
                    onChange={(e) => updateMember(member.id, 'notes', e.target.value)}
                    placeholder="Observações de certidões, vistos antigos, pendências..."
                    className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botão de adicionar filho */}
        <div className="mt-4 flex justify-end no-print">
          <button
            type="button"
            onClick={addChildren}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Filho / Dependente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
