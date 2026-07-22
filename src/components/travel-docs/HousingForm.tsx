import React, { useState } from 'react';
import { HousingDetails } from './types';
import { Home, ShieldCheck, MapPin, Key, DollarSign, Lightbulb, Info } from 'lucide-react';

interface HousingFormProps {
  housing: HousingDetails;
  onChangeHousing: (updated: HousingDetails) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
  exchangeRate: number;
  destinationCountry?: string;
  travelYear?: string;
}

export default function HousingForm({ housing, onChangeHousing, currency, currencySymbol, exchangeRate, destinationCountry, travelYear }: HousingFormProps) {
  const [showTips, setShowTips] = useState<boolean>(false);

  const housingTips = [
    { 
      title: "Registro de Moradia Requerido", 
      text: `O registro de moradia é o cadastro de residência obrigatório no município do seu destino (${destinationCountry || 'exterior'}). Para realizá-lo, você precisará apresentar o contrato de aluguel assinado e autorização por escrito do proprietário.` 
    },
    { 
      title: "Evite Golpes de Aluguel", 
      text: `Nunca envie depósitos antecipados de caução ou fiança sem antes visitar pessoalmente o imóvel ou ter um representante de confiança em ${destinationCountry || 'seu destino'}. Golpes de anúncios falsos em portais imobiliários locais são muito comuns.` 
    },
    { 
      title: "Duração do Contrato", 
      text: "Para ser aceito no registro de moradia e comprovar residência estável de longo prazo, os contratos de aluguel residencial costumam ter vigência mínima de 12 meses." 
    },
    { 
      title: "Subarrendamento de Quartos", 
      text: "Alugar apenas um quarto é permitido para fins de registro na maioria dos destinos, desde que o locatário principal ou proprietário assine uma autorização oficial de residência." 
    }
  ];

  const handleChange = (field: keyof HousingDetails, value: string) => {
    onChangeHousing({
      ...housing,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Collapsible Housing Tips */}
      <div className="card p-5 print-card" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTips(!showTips)}>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Dicas e Regras de Moradia ({destinationCountry || 'Destino'}{travelYear ? ` ${travelYear}` : ''})
            </h4>
          </div>
          <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-350 text-xs font-semibold">
            {showTips ? "Ocultar Dicas" : "Mostrar Dicas"}
          </button>
        </div>
        
        {showTips && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {housingTips.map((tip, idx) => (
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
          <Home className="text-brand-primary w-5 h-5" />
          <span>4. Detalhes de Moradia no Destino</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Registre os dados da sua acomodação em {destinationCountry || 'seu destino'}. Estas informações ajudam a organizar os requisitos para o registro de moradia da família.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Endereço Completo */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <MapPin className="w-3 h-3 text-zinc-400" />
              <span>Endereço Completo no Destino</span>
            </label>
            <input
              type="text"
              value={housing.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ex: Calle Gran Vía, nº 15, Piso 3A, Madrid - CP 28013"
              className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              
            />
          </div>

          {/* Nome do Titular */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Nome do Proprietário / Titular</label>
            <input
              type="text"
              value={housing.landlordName}
              onChange={(e) => handleChange('landlordName', e.target.value)}
              placeholder="Ex: Manuel Garcia Rodríguez"
              className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              
            />
          </div>

          {/* Documento do Titular */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Documento do Titular (DNI / NIE / Passaporte)</label>
            <input
              type="text"
              value={housing.landlordDocument}
              onChange={(e) => handleChange('landlordDocument', e.target.value)}
              placeholder="Ex: 12345678Z (DNI)"
              className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              
            />
          </div>

          {/* Tipo de Prova */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Tipo de Comprovante de Residência</label>
            <input
              type="text"
              value={housing.proofType}
              onChange={(e) => handleChange('proofType', e.target.value)}
              placeholder="Ex: Contrato de aluguel por temporada, Carta de hospedagem"
              className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              
            />
          </div>

          {/* Valor do Aluguel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Aluguel Mensal ({currency})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 text-xs font-semibold">{currencySymbol}</span>
                <input
                  type="text"
                  value={housing.rentValue ? (() => { const v = Math.round((parseFloat(housing.rentValue) / exchangeRate || 0) * 100) / 100; return v % 1 === 0 ? v.toFixed(0) : v.toString(); })() : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange('rentValue', (val * exchangeRate).toString());
                  }}
                  placeholder="Ex: 850"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                  
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Caução ({currency})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 text-xs font-semibold">{currencySymbol}</span>
                <input
                  type="text"
                  value={housing.depositValue ? (() => { const v = Math.round((parseFloat(housing.depositValue) / exchangeRate || 0) * 100) / 100; return v % 1 === 0 ? v.toFixed(0) : v.toString(); })() : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleChange('depositValue', (val * exchangeRate).toString());
                  }}
                  placeholder="Ex: 1700"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                  
                />
              </div>
            </div>
          </div>

          {/* Observações Adicionais */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Anotações da Moradia</label>
            <textarea
              value={housing.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Contatos da imobiliária, datas de vistoria, dados da conta de faturamento de serviços..."
              className="input text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
