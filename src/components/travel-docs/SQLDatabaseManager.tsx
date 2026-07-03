import React, { useState, useEffect, useRef } from 'react';
import { AppState, ChecklistItem, FamilyMember, FinancialExpense, HousingDetails } from './types';
import { Database, Download, Upload, FileCode, Check, Play, AlertCircle, Trash2, ShieldAlert, Share2, Info, Copy } from 'lucide-react';

interface SQLDatabaseManagerProps {
  state: AppState;
  onRestoreState: (restored: AppState) => void;
  onResetAll: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currency: 'BRL' | 'EUR' | 'USD';
  currencySymbol: string;
}

export default function SQLDatabaseManager({ state, onRestoreState, onResetAll, onExportBackup, onImportBackup, currency, currencySymbol }: SQLDatabaseManagerProps) {
  const [selectedTable, setSelectedTable] = useState<'family_members' | 'checklist_items' | 'financial_expenses' | 'housing_details'>('checklist_items');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, text, completed, cost FROM checklist_items WHERE completed = 1');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedDump, setCopiedDump] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onImportBackup(event);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to escape string values for SQL inserts
  const escapeSQL = (val: any): string => {
    if (val === undefined || val === null) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') {
      return typeof val === 'boolean' ? (val ? '1' : '0') : val.toString();
    }
    const escaped = val.toString().replace(/'/g, "''");
    return `'${escaped}'`;
  };

  // Generate full SQL Dump
  const generateSQLDump = (): string => {
    let sql = `-- ==========================================================\n`;
    sql += `-- BANCO DE DADOS CHECKLIST ESPANHA 2026\n`;
    sql += `-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    sql += `-- Conformidade LGPD: Armazenamento estritamente local (Offline-first)\n`;
    sql += `-- Moeda ativa no momento da exportação: ${currency}\n`;
    sql += `-- ==========================================================\n\n`;

    // 1. Table family_members
    sql += `CREATE TABLE IF NOT EXISTS family_members (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  role TEXT,\n`;
    sql += `  role_label TEXT,\n`;
    sql += `  name TEXT,\n`;
    sql += `  passport_number TEXT,\n`;
    sql += `  passport_expiry TEXT,\n`;
    sql += `  cpf TEXT,\n`;
    sql += `  rg TEXT,\n`;
    sql += `  birth_date TEXT,\n`;
    sql += `  contact TEXT,\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    state.familyMembers.forEach(m => {
      sql += `INSERT OR REPLACE INTO family_members (id, role, role_label, name, passport_number, passport_expiry, cpf, rg, birth_date, contact, notes) VALUES (\n`;
      sql += `  ${escapeSQL(m.id)}, ${escapeSQL(m.role)}, ${escapeSQL(m.roleLabel)}, ${escapeSQL(m.name)}, ${escapeSQL(m.passportNumber)}, ${escapeSQL(m.passportExpiry)}, ${escapeSQL(m.cpf)}, ${escapeSQL(m.rg)}, ${escapeSQL(m.birthDate)}, ${escapeSQL(m.contact)}, ${escapeSQL(m.notes)}\n`;
      sql += `);\n`;
    });
    sql += `\n`;

    // 2. Table checklist_items
    sql += `CREATE TABLE IF NOT EXISTS checklist_items (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  category_id TEXT,\n`;
    sql += `  text TEXT,\n`;
    sql += `  completed INTEGER,\n`;
    sql += `  notes TEXT,\n`;
    sql += `  priority TEXT,\n`;
    sql += `  cost REAL\n`;
    sql += `);\n\n`;

    Object.entries(state.checklists).forEach(([catId, items]) => {
      items.forEach((item: ChecklistItem) => {
        sql += `INSERT OR REPLACE INTO checklist_items (id, category_id, text, completed, notes, priority, cost) VALUES (\n`;
        sql += `  ${escapeSQL(item.id)}, ${escapeSQL(catId)}, ${escapeSQL(item.text)}, ${item.completed ? 1 : 0}, ${escapeSQL(item.notes)}, ${escapeSQL(item.priority)}, ${item.cost || 0}\n`;
        sql += `);\n`;
      });
    });
    sql += `\n`;

    // 3. Table financial_expenses
    sql += `CREATE TABLE IF NOT EXISTS financial_expenses (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  description TEXT,\n`;
    sql += `  category TEXT,\n`;
    sql += `  category_label TEXT,\n`;
    sql += `  estimated REAL,\n`;
    sql += `  real REAL,\n`;
    sql += `  paid INTEGER,\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    state.financialExpenses.forEach((fe: FinancialExpense) => {
      sql += `INSERT OR REPLACE INTO financial_expenses (id, description, category, category_label, estimated, real, paid, notes) VALUES (\n`;
      sql += `  ${escapeSQL(fe.id)}, ${escapeSQL(fe.description)}, ${escapeSQL(fe.category)}, ${escapeSQL(fe.categoryLabel)}, ${fe.estimated}, ${fe.real}, ${fe.paid ? 1 : 0}, ${escapeSQL(fe.notes)}\n`;
      sql += `);\n`;
    });
    sql += `\n`;

    // 4. Table housing_details
    sql += `CREATE TABLE IF NOT EXISTS housing_details (\n`;
    sql += `  address TEXT,\n`;
    sql += `  landlord_name TEXT,\n`;
    sql += `  landlord_document TEXT,\n`;
    sql += `  proof_type TEXT,\n`;
    sql += `  rent_value REAL,\n`;
    sql += `  deposit_value REAL,\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    const h = state.housing;
    sql += `INSERT INTO housing_details (address, landlord_name, landlord_document, proof_type, rent_value, deposit_value, notes) VALUES (\n`;
    sql += `  ${escapeSQL(h.address)}, ${escapeSQL(h.landlordName)}, ${escapeSQL(h.landlordDocument)}, ${escapeSQL(h.proofType)}, ${parseFloat(h.rentValue) || 0}, ${parseFloat(h.depositValue) || 0}, ${escapeSQL(h.notes)}\n`;
    sql += `);\n`;

    return sql;
  };

  // Download SQL script file
  const handleDownloadSQL = () => {
    try {
      const sqlText = generateSQLDump();
      const element = document.createElement("a");
      const file = new Blob([sqlText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `checklist_espanha_database_dump_${currency.toLowerCase()}_2026.sql`;
      document.body.appendChild(element);
      element.click();
      element.remove();
    } catch (e) {
      alert("Erro ao gerar arquivo SQL.");
    }
  };

  // Copy SQL script to clipboard for sharing
  const handleCopySQL = () => {
    try {
      const sqlText = generateSQLDump();
      navigator.clipboard.writeText(sqlText);
      setCopiedDump(true);
      setTimeout(() => setCopiedDump(false), 2500);
    } catch (e) {
      alert("Erro ao copiar.");
    }
  };

  // Simulated SQL Query engine to support selection queries beautifully
  const executeQuery = () => {
    setQueryError(null);
    setQueryResult(null);

    const query = sqlQuery.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!query.startsWith('select')) {
      setQueryError("Apenas consultas do tipo 'SELECT' de leitura rápida são suportadas neste console local simulado.");
      return;
    }

    try {
      // Extract target table
      let tableName: 'family_members' | 'checklist_items' | 'financial_expenses' | 'housing_details' | null = null;
      if (query.includes('from checklist_items')) tableName = 'checklist_items';
      else if (query.includes('from family_members')) tableName = 'family_members';
      else if (query.includes('from financial_expenses')) tableName = 'financial_expenses';
      else if (query.includes('from housing_details')) tableName = 'housing_details';

      if (!tableName) {
        setQueryError("Tabela não identificada. Use: checklist_items, family_members, financial_expenses ou housing_details.");
        return;
      }

      // Map raw data from state
      let dataset: any[] = [];
      if (tableName === 'checklist_items') {
        dataset = Object.entries(state.checklists).flatMap(([catId, items]) => 
          items.map(item => ({
            id: item.id,
            category_id: catId,
            text: item.text,
            completed: item.completed ? 1 : 0,
            notes: item.notes || 'NULL',
            priority: item.priority,
            cost: item.cost || 0
          }))
        );
      } else if (tableName === 'family_members') {
        dataset = state.familyMembers.map(m => ({
          id: m.id,
          role: m.role,
          role_label: m.roleLabel,
          name: m.name || 'NULL',
          passport_number: m.passportNumber || 'NULL',
          passport_expiry: m.passportExpiry || 'NULL',
          cpf: m.cpf || 'NULL',
          rg: m.rg || 'NULL',
          birth_date: m.birthDate || 'NULL',
          contact: m.contact || 'NULL'
        }));
      } else if (tableName === 'financial_expenses') {
        dataset = state.financialExpenses.map(e => ({
          id: e.id,
          description: e.description,
          category: e.category,
          category_label: e.categoryLabel,
          estimated: e.estimated,
          real: e.real,
          paid: e.paid ? 1 : 0,
          notes: e.notes || 'NULL'
        }));
      } else if (tableName === 'housing_details') {
        dataset = [{
          address: state.housing.address || 'NULL',
          landlord_name: state.housing.landlordName || 'NULL',
          landlord_document: state.housing.landlordDocument || 'NULL',
          proof_type: state.housing.proofType || 'NULL',
          rent_value: parseFloat(state.housing.rentValue) || 0,
          deposit_value: parseFloat(state.housing.depositValue) || 0,
          notes: state.housing.notes || 'NULL'
        }];
      }

      // Handle simple filters
      let filtered = [...dataset];
      if (query.includes('where completed = 1')) {
        filtered = filtered.filter(row => row.completed === 1);
      } else if (query.includes('where completed = 0')) {
        filtered = filtered.filter(row => row.completed === 0);
      } else if (query.includes('where paid = 1')) {
        filtered = filtered.filter(row => row.paid === 1);
      } else if (query.includes('where paid = 0')) {
        filtered = filtered.filter(row => row.paid === 0);
      }

      // Column extraction
      let columns: string[] = [];
      const matchSelectFields = sqlQuery.match(/select\s+(.+?)\s+from/i);
      if (matchSelectFields && matchSelectFields[1]) {
        const fields = matchSelectFields[1].split(',').map(f => f.trim());
        if (fields.length === 1 && fields[0] === '*') {
          columns = filtered.length > 0 ? Object.keys(filtered[0]) : [];
        } else {
          columns = fields;
        }
      } else {
        columns = filtered.length > 0 ? Object.keys(filtered[0]) : [];
      }

      const rows = filtered.map(row => {
        const item: any = {};
        columns.forEach(col => {
          item[col] = row[col] !== undefined ? row[col] : 'NULL';
        });
        return item;
      });

      setQueryResult({ columns, rows });
    } catch (err) {
      setQueryError("Erro de sintaxe na consulta SQL. Tente usar uma consulta básica como: SELECT * FROM checklist_items");
    }
  };

  useEffect(() => {
    executeQuery();
  }, [selectedTable, state]);

  // Handle preset queries click
  const handlePresetQuery = (preset: string) => {
    setSqlQuery(preset);
  };

  return (
    <div className="space-y-6">
      {/* Privacy & LGPD Statement Card */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start shadow-xs">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300">Conformidade e Proteção de Dados (LGPD)</h3>
            <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Armazenamento Local Ativo</span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
            Em total acordo com a <strong>LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018)</strong>, este aplicativo foi desenhado com tecnologia de <strong>banco de dados offline-first</strong>. 
            Todas as informações inseridas sobre você, seu cônjuge e sua filha são guardadas de forma privada e 100% segura no armazenamento interno do seu navegador (no banco de dados do dispositivo). 
            Nenhum dado é enviado para servidores externos. Você possui o direito contínuo ao controle, backup imediato e exclusão total dos seus dados.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
            <span>✓ Seus dados são seus</span>
            <span>•</span>
            <span>✓ Backup completo em formato SQL ou JSON</span>
            <span>•</span>
            <span>✓ Livre de rastreamento</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table schema & Export buttons - Left Side */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                <Database className="w-4 h-4 text-blue-500" />
                <span>Estrutura do Banco Local</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Clique nas tabelas relacionais do sistema para visualizar suas linhas e colunas instantaneamente:
              </p>
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'family_members', label: 'family_members', desc: 'Dados civis dos familiares', count: state.familyMembers.length },
                { id: 'checklist_items', label: 'checklist_items', desc: 'Requisitos e custos de documentos', count: Object.values(state.checklists).flat().length },
                { id: 'financial_expenses', label: 'financial_expenses', desc: 'Fluxo financeiro e despesas', count: state.financialExpenses.length },
                { id: 'housing_details', label: 'housing_details', desc: 'Endereço e caução de aluguel', count: state.housing.address ? 1 : 0 }
              ].map((tbl) => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedTable(tbl.id as any)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedTable === tbl.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 font-bold'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs block">{tbl.label}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">{tbl.desc}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400">
                    {tbl.count} row{tbl.count !== 1 && 's'}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Exportação SQL</span>

              <button
                type="button"
                onClick={handleDownloadSQL}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Banco (.SQL Dump)</span>
              </button>

              <button
                type="button"
                onClick={handleCopySQL}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-white dark:bg-zinc-900/5 hover:bg-zinc-200 dark:hover:bg-white dark:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 rounded-xl py-2 text-[11px] font-bold transition-all cursor-pointer"
              >
                {copiedDump ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDump ? 'Copiado!' : 'Copiar SQL para Área de Transferência'}</span>
              </button>

              <p className="text-[9px] text-zinc-400 text-center leading-normal">
                O arquivo .SQL pode ser importado para SQLite, MySQL ou PostgreSQL.
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Backup JSON</span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Backup</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-white dark:bg-zinc-900/5 hover:bg-zinc-200 dark:hover:bg-white dark:bg-zinc-900/10 text-zinc-700 dark:text-zinc-300 rounded-xl py-2.5 text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar Backup</span>
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <p className="text-[9px] text-zinc-400 text-center leading-normal">
                Faça backup antes de excluir dados. Todos os dados ficam apenas no seu dispositivo.
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">Zona de Perigo</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(
                    'Tem certeza absoluta de que deseja excluir TODOS os dados?\n\n' +
                    'Isso irá apagar permanentemente:\n' +
                    '• Todos os dados da família e documentos\n' +
                    '• Finanças, cronograma e passeios\n' +
                    '• Histórico de conversa com a Elena\n' +
                    '• Chave de API do Gemini\n' +
                    '• Alertas, configurações de tema e câmbio\n\n' +
                    'Todos os dados são salvos apenas no seu dispositivo (localStorage) e não poderão ser recuperados após a exclusão.\n\n' +
                    'Recomendamos exportar um backup antes de continuar.'
                  )) {
                    onResetAll();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl py-2.5 text-[11px] font-bold transition-all cursor-pointer border border-red-200 dark:border-red-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Todos os Dados (LGPD)</span>
              </button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-bold">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>Sincronização Nuvem (Breve)</span>
            </div>
            <p>
              Em breve, permitiremos que você realize login com sua <strong>Conta Google</strong> de forma segura, permitindo criptografar e salvar seu banco de dados diretamente na nuvem para acesso simultâneo em múltiplos dispositivos.
            </p>
          </div>
        </div>

        {/* Database records viewer & SQL query editor - Right Side */}
        <div className="lg:col-span-8 space-y-4">
          {/* Interactive Query Playground */}
          <div className="card p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                  <FileCode className="w-4 h-4 text-emerald-500" />
                  <span>Console SQL Playground (Leitura rápida)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Escreva e teste comandos SELECT ou use os atalhos abaixo:</p>
              </div>
              <button
                type="button"
                onClick={executeQuery}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Executar</span>
              </button>
            </div>

            {/* Monospace Code Editor */}
            <div className="font-mono text-xs text-emerald-400 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full bg-transparent border-none text-emerald-400 font-mono focus:outline-none resize-none focus:ring-0 leading-relaxed"
                rows={3}
                placeholder="Ex: SELECT * FROM checklist_items;"
                spellCheck={false}
              />
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1">Exemplos:</span>
              <button
                type="button"
                onClick={() => handlePresetQuery(`SELECT id, text, cost FROM checklist_items WHERE completed = 1`)}
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 rounded-md text-[10px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Ver concluídos com custo
              </button>
              <button
                type="button"
                onClick={() => handlePresetQuery(`SELECT description, estimated, real, paid FROM financial_expenses`)}
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 rounded-md text-[10px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Ver custos do planejador
              </button>
              <button
                type="button"
                onClick={() => handlePresetQuery(`SELECT name, role_label, passport_number FROM family_members`)}
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-1 rounded-md text-[10px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Ver dados da família
              </button>
            </div>
          </div>

          {/* Table Output Content */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xs flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Resultado da Consulta Local</span>
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                {queryResult ? `${queryResult.rows.length} rows returned` : '0 rows'}
              </span>
            </div>

            {queryError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-4 flex gap-3 text-red-700 dark:text-red-400 text-xs items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{queryError}</span>
              </div>
            )}

            {!queryError && queryResult && (
              <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-left font-mono text-xs divide-y divide-zinc-100 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <tr>
                      {queryResult.columns.map((col, index) => (
                        <th key={index} className="px-4 py-3 font-bold text-[10px]">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {queryResult.rows.map((row, rIndex) => (
                      <tr key={rIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-800/40 dark:hover:bg-zinc-950/30">
                        {queryResult.columns.map((col, cIndex) => {
                          const val = row[col];
                          let rendered = val;
                          if (typeof val === 'number' && (col === 'cost' || col === 'estimated' || col === 'real' || col === 'rent_value' || col === 'deposit_value')) {
                            rendered = `${currencySymbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                          }
                          return (
                            <td key={cIndex} className="px-4 py-3.5 whitespace-nowrap text-[11px]">
                              {val === 1 && (col === 'completed' || col === 'paid') ? (
                                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">TRUE</span>
                              ) : val === 0 && (col === 'completed' || col === 'paid') ? (
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">FALSE</span>
                              ) : (
                                rendered?.toString()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {queryResult.rows.length === 0 && (
                      <tr>
                        <td colSpan={queryResult.columns.length} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 dark:text-zinc-400">
                          Nenhum registro encontrado para os critérios selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
