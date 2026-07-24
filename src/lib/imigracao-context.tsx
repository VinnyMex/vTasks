'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { uploadTravelDoc, deleteTravelDoc, getTravelDocUrl } from '@/lib/travel-docs';
import { AppState, FamilyMember, FinancialExpense, HousingDetails, AppEvent } from '@/components/travel-docs/types';
import { INITIAL_STATE, DEFAULT_CHECKLISTS, DEFAULT_PACKING_CHECKLISTS, ensureVacationScheduleInState } from '@/components/travel-docs/data';

// ────────── DADOS INICIAIS ──────────

const DEFAULT_CHECKLIST = [
  // T1
  { quarter: 1, title: 'Semana 1 — Empadronamento', description: 'Confirmar endereço estável (contrato de aluguel ou autorização escrita). Ir ao Ayuntamiento de Menasalbas e solicitar volante de empadronamento.', category: 'URGENTE', link: 'https://menasalbas.sedelectronica.es', position: 0 },
  { quarter: 1, title: 'Semanas 2-3 — Escola da filha', description: 'Matrícula extraordinária (obrigatória dos 6 aos 16 anos). Ir à escola com passaporte da filha, volante de empadronamento e carteira de vacinação.', category: 'DOC', link: 'https://educacion.castillalamancha.es', position: 1 },
  { quarter: 1, title: 'Semanas 3-4 — Cartão de Saúde', description: 'O RD 180/2026 garante assistência sanitária gratuita. Solicitar cartão de saúde pelo link online e obter o documento provisório.', category: 'LEI', link: 'https://www.jccm.es/tramites/1003840', position: 2 },
  { quarter: 1, title: 'Meses 2-3 — Cartão de Transporte e Vida Cotidiana', description: 'Abrir conta bancária básica no Sabadell ou CaixaBank com passaporte. Colocar faturas (luz, internet) em seu nome como prova de residência.', category: 'LINK', link: 'https://caritastoledo.com', position: 3 },
  // T2
  { quarter: 2, title: 'NIE — Número de Identidade Estrangeiro', description: 'Pedir cita prévia na Oficina de Extranjería Toledo pelo site ou tel 060. Levar formulário EX-15, passaporte original e cópia, motivo justificado e taxa paga.', category: 'DOC', link: 'https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus', position: 0 },
  { quarter: 2, title: 'Renda e Trabalho', description: 'Pedir contrato de trabalho escrito ou pesquisar alta como autônomo (Segurança Social) se for tech. Guardar contratos, faturas emitidas e extratos bancários.', category: 'DOC', link: 'https://www.sepe.es', position: 1 },
  { quarter: 2, title: 'Integração Social', description: 'Inscrever-se no curso de espanhol da Escola de Idiomas de Toledo ou participar de associações culturais/esportivas em Menasalbas para obter certificados.', category: 'LINK', link: 'https://eoitoledo.edu.es', position: 2 },
  // T3
  { quarter: 3, title: 'Documentação e Registros', description: 'Renovar volante de empadronamento. Solicitar certificado de escolarização da filha referente ao ano letivo em curso. Reunir extratos dos últimos 6 meses.', category: 'DOC', link: '', position: 0 },
  { quarter: 3, title: 'Integração Comunitária', description: 'Verificar com Cáritas ou Cruz Roja programas de formação com certificação. Documentar participação em atividades com certificados ou declarações.', category: 'DOC', link: 'https://caritastoledo.com', position: 1 },
  // T4
  { quarter: 4, title: 'Organização do Dossiê', description: 'Criar pasta física + digital com tudo organizado por: identidade, moradia, saúde, educação, renda e integração. Contar dias de ausência da Espanha (<90-120 dias).', category: 'URGENTE', link: '', position: 0 },
  { quarter: 4, title: 'Consulta Especializada', description: 'Agendar consulta com advogado de extranjería ou ONGs (Cáritas, Accem) para revisar dossiê e escolher a via de arraigo (social ou socioformativo).', category: 'URGENTE', link: 'https://accem.es', position: 1 }
];

const DEFAULT_CONTACTS = [
  { name: 'Ayuntamiento de Menasalbas', address: 'Plaza España, 1 — 45128 Menasalbas, Toledo', purpose: 'Empadronamento, Bem-estar Social e Registro geral', phone: '+34925407006', email: 'aytomenasalbas@menasalbas.es', website: 'https://menasalbas.es', sede_electronica: 'https://menasalbas.sedelectronica.es', category: 'oficial' },
  { name: 'SESCAM — Saúde CLM', address: 'Centro de Saúde da sua área de empadronamento', purpose: 'Cartão de saúde, Médico de família, Pediatria e Urgências', phone: '900252525', email: '', website: 'https://sanidad.castillalamancha.es/ciudadanos/citaprevia', sede_electronica: 'https://www.jccm.es/tramites/1003840', category: 'saude' },
  { name: 'Consejería Educación CLM', address: 'Bulevar Río Alberche s/n — 45071 Toledo', purpose: 'Matrícula escolar e escolarização extraordinária de menores', phone: '+34925247400', email: '', website: 'https://educacion.castillalamancha.es', sede_electronica: '', category: 'educacao' },
  { name: 'Oficina Extranjería Toledo', address: 'Ronda Buenavista, 57 — 45071 Toledo', purpose: 'Emissão de NIE, Arraigo, Cartão TIE e Cita Previa', phone: '060', email: '', website: 'https://sede.administracionespublicas.gob.es/pagina/index/directorio/icpplus', sede_electronica: '', category: 'oficial' },
  { name: 'SEPE / Oficina Empleo Toledo', address: 'Bajada Castilla-La Mancha, 5 — 45003 Toledo', purpose: 'Inscrição como demandante de emprego e cursos gratuitos oficiais', phone: '+34925330830', email: 'oetoledo@jccm.es', website: 'https://www.sepe.es', sede_electronica: '', category: 'oficial' },
  { name: 'Cáritas Toledo — Imigrantes', address: 'Calle Río Alberche, 29 — 45007 Toledo', purpose: 'Orientação de direitos, apoio social e assessoria de Arraigo', phone: '+34925240558', email: 'mmorenot@caritastoledo.es', website: 'https://caritastoledo.com', sede_electronica: '', category: 'ong' },
  { name: 'Cruz Roja Toledo', address: 'C. Canarias, 3 — 45005 Toledo', purpose: 'Rede de apoio a imigrantes, cursos de integração e ajuda humanitária', phone: '+34925216060', email: '', website: 'https://cruzroja.es', sede_electronica: '', category: 'ong' },
  { name: 'Escola de Idiomas Toledo', address: 'Toledo — Cursos de espanhol oficial', purpose: 'Ensino oficial de espanhol. Os certificados valem para comprovação de arraigo', phone: '+34925216112', email: '45005483.eoi@edu.jccm.es', website: 'https://eoitoledo.edu.es', sede_electronica: '', category: 'educacao' },
  { name: 'Asociacion de Inmigrantes de Toledo', address: 'Av. de Irlanda, 6 — 45005 Toledo', purpose: 'Apoio geral, orientação legal e rede de integração para estrangeiros', phone: '', email: '', website: '', sede_electronica: '', category: 'ong' },
  { name: 'Accem Toledo', address: 'ONG Nacional de Integração de Imigrantes', purpose: 'Assessoria jurídica para regularização e programas de acolhimento', phone: '+34915312312', email: '', website: 'https://accem.es', sede_electronica: '', category: 'ong' }
];

export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  BRL: 'R$',
  EUR: '€',
  USD: '$'
};

// ────────── TIPOS DO CONTEXTO ──────────

interface ImigracaoContextType {
  // Auth / Currency
  user: any;
  exchangeRate: number;
  activeCurrency: string;
  primaryCurrency: string;
  secondaryCurrency: string;

  // Dados principais
  profile: any;
  extendedState: AppState;
  checklists: any[];
  contacts: any[];
  documents: any[];
  loading: boolean;
  scenarios: any[];

  // Financeiro (Visão Geral)
  formData: typeof INITIAL_FORM_DATA;
  budget: number;
  scenarioName: string;
  showAddScenario: boolean;
  newScenarioName: string;
  author: string;
  editingScenarioId: string | null;
  initialPackageBRL: number;
  monthlyExpensesBRL: number;
  extraIncomeBRL: number;
  monthlyIncomeBRL: number;
  netMonthlyFlowBRL: number;
  remainingAfterInitialBRL: number;
  months: any[];

  // Modais
  taskModal: { open: boolean; mode: 'add' | 'edit'; data?: any };
  contactModal: { open: boolean; mode: 'add' | 'edit'; data?: any };
  docModal: { open: boolean; file?: File; name: string; category: string; expiry_date: string; associated_quarter: string; notes: string };
  isUploading: boolean;

  // Todoist
  todoistToken: string;
  setTodoistToken: React.Dispatch<React.SetStateAction<string>>;
  isTodoistConnected: boolean;
  isTodoistSimulated: boolean;
  todoistSyncLogs: string[];

  // Estatísticas
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;

  // Setters diretos
  setFormData: React.Dispatch<React.SetStateAction<typeof INITIAL_FORM_DATA>>;
  setBudget: React.Dispatch<React.SetStateAction<number>>;
  setScenarioName: React.Dispatch<React.SetStateAction<string>>;
  setShowAddScenario: React.Dispatch<React.SetStateAction<boolean>>;
  setNewScenarioName: React.Dispatch<React.SetStateAction<string>>;
  setAuthor: React.Dispatch<React.SetStateAction<string>>;
  setEditingScenarioId: React.Dispatch<React.SetStateAction<string | null>>;
  setTaskModal: React.Dispatch<React.SetStateAction<{ open: boolean; mode: 'add' | 'edit'; data?: any }>>;
  setContactModal: React.Dispatch<React.SetStateAction<{ open: boolean; mode: 'add' | 'edit'; data?: any }>>;
  setDocModal: React.Dispatch<React.SetStateAction<{ open: boolean; file?: File; name: string; category: string; expiry_date: string; associated_quarter: string; notes: string }>>;

  // Funções
  loadAllData: () => Promise<void>;
  updateExtendedState: (newState: AppState) => Promise<void>;
  handleSyncIdeias: () => Promise<void>;
  isSyncingAI: boolean;
  handleAISync: () => Promise<void>;
  handleFamilyMembersChange: (updated: FamilyMember[]) => void;
  handleChecklistsChange: (categoryId: string, items: any[]) => void;
  handlePackingChecklistsChange: (categoryId: string, items: any[]) => void;
  handleFinancialExpensesChange: (updated: FinancialExpense[]) => void;
  handleTimelineTasksChange: (updated: any[]) => void;
  handleTimelineTaskToggle: (taskId: string) => void;
  handleHousingChange: (updated: HousingDetails) => void;
  handleToursChange: (updated: any[]) => void;
  handleAddEvent: (event: AppEvent) => void;
  handleUpdateEvent: (updated: AppEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  handleTriggerTodoistSync: (tokenInput?: string) => Promise<void>;
  handleDisconnectTodoist: () => void;
  handleConnectTodoistSimulated: () => void;
  updateProfileField: (field: string, value: any) => Promise<void>;
  toggleChecklistTask: (taskId: string, isCompleted: boolean) => Promise<void>;
  saveTask: (e: React.FormEvent) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  saveContact: (e: React.FormEvent) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadDocument: (e: React.FormEvent) => Promise<void>;
  deleteDocument: (docId: string, filePath: string) => Promise<void>;
  viewDocument: (filePath: string) => Promise<void>;
  getDocumentExpiryStatus: (dateStr: string) => { label: string; color: string };
  handleInputChange: (field: string, value: string) => void;
  handleSaveScenario: () => Promise<void>;
  handleDeleteScenario: (id: string) => Promise<void>;
  handleLoadScenario: (sc: any) => void;
  formatValue: (valueInPrimary: number) => string;
  userName: () => string;
  updateOpenRouterConfig: (apiKey: string, model: string) => void;
  saveChatSessions: (sessions: any[]) => void;
  syncStatus: 'saved' | 'saving' | 'error';
  lastSyncTime: string;
  reorderOrMoveTask: (taskId: string, targetQuarter: number, newPosition?: number, isCompleted?: boolean) => Promise<void>;
}

const INITIAL_FORM_DATA = {
  flights: 11500,
  stay: 1655,
  food: 1754,
  transport: 372,
  tours: 558,
  emergencyInitial: 1550,
  rent: 3100,
  bills: 930,
  market: 4340,
  transportMonthly: 1240,
  health: 620,
  kids: 930,
  monthlyReserve: 4340,
  extraIncome: 6200,
};

const ImigracaoContext = createContext<ImigracaoContextType | null>(null);

export function ImigracaoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeCurrency, exchangeRates, exchangeRate } = useCurrency();
  const [extendedState, setExtendedState] = useState<AppState>(INITIAL_STATE);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('pt-BR'));
  const [todoistToken, setTodoistToken] = useState<string>('');
  const [isTodoistConnected, setIsTodoistConnected] = useState<boolean>(false);
  const [isTodoistSimulated, setIsTodoistSimulated] = useState<boolean>(false);
  const [todoistSyncLogs, setTodoistSyncLogs] = useState<string[]>([]);

  const addTodoistLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setTodoistSyncLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 100));
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<any>({
    id: 'local',
    destination_country: 'Espanha',
    destination_city: 'Menasalbas / Toledo',
    immigration_goal: 'Arraigo Social/Socioformativo',
    current_quarter: 1
  });
  const profileRef = useRef<any>(null);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const [checklists, setChecklists] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [budget, setBudget] = useState(60000);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioName, setScenarioName] = useState('Cenário Principal');
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [author, setAuthor] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);

  const [taskModal, setTaskModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [contactModal, setContactModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [docModal, setDocModal] = useState<{ open: boolean; file?: File; name: string; category: string; expiry_date: string; associated_quarter: string; notes: string }>({
    open: false, name: '', category: 'identidade', expiry_date: '', associated_quarter: '', notes: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  // Timestamp do último save local — o realtime ignora eventos anteriores a este instante
  const lastSaveTimestampRef = useRef<number>(0);

  // Carregar todos os dados ao iniciar — só uma vez por user_id
  const loadedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    if (loadedUserIdRef.current === user.id) return; // já carregou para este user
    loadedUserIdRef.current = user.id;
    loadAllData();
  }, [user]);

  // Subscrição em Tempo Real
  useEffect(() => {
    if (!user || !profile?.id || profile.id === 'local') return;

    const channel = supabase
      .channel(`realtime-immigration-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'immigration_profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload: any) => {
          const newProfile = payload.new;
          if (!newProfile?.extended_state) return;
          // Ignora o echo do próprio save local (evita sobrescrever estado atual com o que acabou de ser salvo)
          if (Date.now() - lastSaveTimestampRef.current < 5000) return;
          // Usa ref para comparar sem depender do closure — evita loop e dados stale
          const current = extendedStateRef.current;
          if (JSON.stringify(newProfile.extended_state) === JSON.stringify(current)) return;
          // Só aplica dados vindos de outra aba/dispositivo
          const remoteExt = newProfile.extended_state;
          const hasChecklistData = remoteExt.checklists && Object.keys(remoteExt.checklists).length > 0 &&
            Object.values(remoteExt.checklists).some((arr: any) => Array.isArray(arr) && arr.length > 0);
          setProfile(newProfile);
          setExtendedState(prev => {
            const next = {
              ...remoteExt,
              checklists: hasChecklistData ? remoteExt.checklists : (prev.checklists || remoteExt.checklists)
            };
            extendedStateRef.current = next;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // Removido extendedState das deps — usamos extendedStateRef para evitar recriar o channel a cada mudança de estado
  }, [user, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAllData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carrega ou cria perfil
      let profileData = null;
      try {
        let { data: profiles, error: profileErr } = await supabase
          .from('immigration_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (profileErr) throw profileErr;

        if (profiles && profiles.length > 0) {
          profileData = profiles[0];
        } else {
          // Usa upsert para nunca criar duplicatas
          const { data: newProfile, error: createErr } = await supabase
            .from('immigration_profiles')
            .upsert({
              user_id: user.id,
              destination_country: 'Espanha',
              destination_city: 'Menasalbas / Toledo',
              immigration_goal: 'Arraigo Social/Socioformativo',
              current_quarter: 1
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (createErr) throw createErr;
          profileData = newProfile;
        }
      } catch (e: any) {
        console.warn("Tabela immigration_profiles ausente ou erro ao acessar. Usando perfil local.", e.message || e);
        profileData = {
          id: 'local',
          user_id: user.id,
          destination_country: 'Espanha',
          destination_city: 'Menasalbas / Toledo',
          immigration_goal: 'Arraigo Social/Socioformativo',
          current_quarter: 1
        };
      }
      setProfile(profileData);

      // Carregar extended_state com fallback robusto e auto-upload para o Supabase
      let extState = INITIAL_STATE;
      try {
        // Sempre lê o localStorage como base de fallback para checklists
        let localState: AppState | null = null;
        try {
          const saved = localStorage.getItem('checklist_espanha_app_state_v1');
          if (saved) localState = JSON.parse(saved);
        } catch {}

        if (profileData && 'extended_state' in profileData && profileData.extended_state && Object.keys(profileData.extended_state).length > 0) {
          const remoteChecklists = profileData.extended_state.checklists;
          const localChecklists = localState?.checklists;

          // Usa checklists do Supabase se tiver itens marcados; caso contrário usa localStorage
          // Isso evita que um extended_state sem checklists (ou com checklists vazias) apague as marcações
          const hasRemoteChecklistData = remoteChecklists && Object.keys(remoteChecklists).length > 0 &&
            Object.values(remoteChecklists).some((arr: any) => Array.isArray(arr) && arr.length > 0);

          const checklistsToUse = hasRemoteChecklistData
            ? { ...INITIAL_STATE.checklists, ...remoteChecklists }
            : { ...INITIAL_STATE.checklists, ...(localChecklists || {}) };

          extState = {
            ...INITIAL_STATE,
            ...profileData.extended_state,
            checklists: checklistsToUse
          };
          try {
            localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(extState));
          } catch {}
        } else if (localState) {
          // Supabase vazio — usa localStorage como fonte de verdade
          extState = {
            ...INITIAL_STATE,
            ...localState,
            checklists: {
              ...INITIAL_STATE.checklists,
              ...(localState.checklists || {})
            }
          };
          // Sincroniza o localStorage de volta ao Supabase
          if (user) {
            await supabase
              .from('immigration_profiles')
              .update({ extended_state: extState, updated_at: new Date().toISOString() })
              .eq('user_id', user.id);
          }
        }
      } catch (e) {
        console.warn("Erro ao carregar extended_state:", e);
        try {
          const saved = localStorage.getItem('checklist_espanha_app_state_v1');
          if (saved) extState = JSON.parse(saved);
        } catch {}
      }

      extState = ensureVacationScheduleInState(extState);

      // Limpeza de estimativas legadas pré-preenchidas dos itens padrão
      const oldMockValues: Record<string, number> = {
        fe_1: 1000, fe_2: 400, fe_3: 800, fe_4: 1500, fe_5: 12000,
        fe_6: 1800, fe_7: 5500, fe_8: 8000, fe_9: 2500, fe_10: 18000, fe_11: 1200,
        fe_ferias_atracoes: 1240, fe_ferias_alimentacao: 3038, fe_ferias_transporte: 2232
      };
      if (extState.financialExpenses) {
        extState.financialExpenses = extState.financialExpenses.map(exp => {
          if (oldMockValues[exp.id] !== undefined && exp.estimated === oldMockValues[exp.id]) {
            return { ...exp, estimated: 0 };
          }
          return exp;
        });
      }

      // Sincronizar credenciais do OpenRouter entre o estado do Supabase e o localStorage local
      if (extState.openrouterApiKey) {
        try {
          localStorage.setItem('openrouter_api_key', extState.openrouterApiKey);
          localStorage.setItem('vtask_openrouter_api_key_v2', extState.openrouterApiKey);
        } catch {}
      } else {
        const localKey = localStorage.getItem('openrouter_api_key') || localStorage.getItem('vtask_openrouter_api_key_v2');
        if (localKey) {
          extState.openrouterApiKey = localKey;
        }
      }

      if (extState.openrouterModel) {
        try {
          localStorage.setItem('openrouter_model', extState.openrouterModel);
          localStorage.setItem('vtask_openrouter_model_v2', extState.openrouterModel);
        } catch {}
      } else {
        const localModel = localStorage.getItem('openrouter_model') || localStorage.getItem('vtask_openrouter_model_v2');
        if (localModel) {
          extState.openrouterModel = localModel;
        }
      }

      setExtendedState(extState);

      // 2. Carrega checklists
      try {
        const { data: checkData, error: checkErr } = await supabase
          .from('immigration_checklists')
          .select('*')
          .eq('user_id', user.id)
          .order('quarter', { ascending: true })
          .order('position', { ascending: true });

        if (checkErr) throw checkErr;

        if (!checkData || checkData.length === 0) {
          const batchInsert = DEFAULT_CHECKLIST.map(item => ({
            ...item,
            user_id: user.id
          }));
          const { data: insertedCheck, error: insertErr } = await supabase
            .from('immigration_checklists')
            .insert(batchInsert)
            .select();

          if (insertErr) throw insertErr;
          setChecklists(insertedCheck || []);
        } else {
          setChecklists(checkData);
        }
      } catch (e: any) {
        console.warn("Tabela immigration_checklists ausente ou erro. Usando checklist local.", e.message || e);
        const saved = localStorage.getItem('immigration_checklists_local');
        if (saved) {
          setChecklists(JSON.parse(saved));
        } else {
          const initialChecks = DEFAULT_CHECKLIST.map((item, idx) => ({
            ...item,
            id: `local_ch_${idx}`,
            user_id: user.id,
            is_completed: false
          }));
          setChecklists(initialChecks);
          localStorage.setItem('immigration_checklists_local', JSON.stringify(initialChecks));
        }
      }

      // 3. Carrega contatos
      try {
        const { data: contactData, error: contactErr } = await supabase
          .from('immigration_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (contactErr) throw contactErr;

        if (!contactData || contactData.length === 0) {
          const batchInsert = DEFAULT_CONTACTS.map(item => ({
            ...item,
            user_id: user.id
          }));
          const { data: insertedContacts, error: insertErr } = await supabase
            .from('immigration_contacts')
            .insert(batchInsert)
            .select();

          if (insertErr) throw insertErr;
          setContacts(insertedContacts || []);
        } else {
          setContacts(contactData);
        }
      } catch (e: any) {
        console.warn("Tabela immigration_contacts ausente ou erro. Usando contatos locais.", e.message || e);
        const saved = localStorage.getItem('immigration_contacts_local');
        if (saved) {
          setContacts(JSON.parse(saved));
        } else {
          const initialContacts = DEFAULT_CONTACTS.map((item, idx) => ({
            ...item,
            id: `local_co_${idx}`,
            user_id: user.id
          }));
          setContacts(initialContacts);
          localStorage.setItem('immigration_contacts_local', JSON.stringify(initialContacts));
        }
      }

      // 4. Carrega cenários financeiros
      try {
        const { data: scData, error: scErr } = await supabase
          .from('espanha_scenarios')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (scErr) throw scErr;
        setScenarios(scData.map((s: any) => ({
          ...s,
          formData: s.form_data,
          createdAt: new Date(s.created_at).toLocaleDateString('pt-BR')
        })));
      } catch (e: any) {
        console.warn("Tabela espanha_scenarios ausente ou erro. Usando cenários locais.", e.message || e);
        const saved = localStorage.getItem('espanha_scenarios_local');
        if (saved) {
          setScenarios(JSON.parse(saved));
        } else {
          setScenarios([]);
        }
      }

      // 5. Carrega documentos de viagem
      try {
        const { data: docsData, error: docsErr } = await supabase
          .from('travel_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (docsErr) throw docsErr;
        setDocuments(docsData || []);
      } catch (e: any) {
        console.warn("Tabela travel_documents ausente ou erro. Usando documentos locais.", e.message || e);
        const saved = localStorage.getItem('travel_documents_local');
        if (saved) {
          setDocuments(JSON.parse(saved));
        } else {
          setDocuments([]);
        }
      }

    } catch (err) {
      console.error("Erro geral no fluxo loadAllData:", err);
    } finally {
      setLoading(false);
    }
  }

  // ────────── SINCRONIZAÇÃO DO IDEIAS.MD ──────────
  async function handleSyncIdeias() {
    if (!user) return;
    if (!confirm("Isso irá importar/substituir as checklists e contatos do ideias.md na sua conta em uso do Supabase. Deseja prosseguir?")) return;

    setLoading(true);
    try {
      await supabase.from('immigration_checklists').delete().eq('user_id', user.id);
      await supabase.from('immigration_contacts').delete().eq('user_id', user.id);

      const batchChecklist = DEFAULT_CHECKLIST.map(item => ({ ...item, user_id: user.id }));
      const { error: checkErr } = await supabase.from('immigration_checklists').insert(batchChecklist);
      if (checkErr) throw checkErr;

      const batchContacts = DEFAULT_CONTACTS.map(item => ({ ...item, user_id: user.id }));
      const { error: contactErr } = await supabase.from('immigration_contacts').insert(batchContacts);
      if (contactErr) throw contactErr;

      alert("Sucesso! As checklists e contatos do ideias.md foram adicionados à sua conta.");
      await loadAllData();
    } catch (err: any) {
      alert("Erro ao sincronizar dados: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAISync() {
    if (!user) return;
    
    const key = extendedState.openrouterApiKey || localStorage.getItem('openrouter_api_key') || localStorage.getItem('vtask_openrouter_api_key_v2');
    const model = extendedState.openrouterModel || localStorage.getItem('openrouter_model') || localStorage.getItem('vtask_openrouter_model_v2') || 'google/gemini-2.5-flash';
    
    if (!key) {
      alert("Configuração de API do vTask Agent Requerida!\n\nPara sincronizar a jornada personalizada com Inteligência Artificial, você precisa cadastrar a sua API Key da OpenRouter.\n\nComo cadastrar:\n1. Abra o chatbot vTask Agent no canto inferior direito.\n2. Clique no ícone de engrenagem de configurações.\n3. Insira sua API Key do OpenRouter e salve.\n4. Tente sincronizar novamente!");
      return;
    }

    const dest = profile.destination_country || "Espanha";
    const city = profile.destination_city || "Menasalbas / Toledo";
    const goal = profile.immigration_goal || "Arraigo Social/Socioformativo";
    
    if (!confirm(`O vTask Agent irá gerar uma jornada completa de imigração e planejamento financeiro totalmente customizada para ${dest} (${city}) com foco em ${goal}.\n\nIsso irá substituir os dados atuais de checklists, malas, custos e contatos. Deseja prosseguir?`)) {
      return;
    }

    setIsSyncingAI(true);
    try {
      const prompt = `Você é o vTask Agent, assistente especialista em imigração. Crie uma jornada de imigração e planejamento de viagem completa, real e altamente específica para o seguinte perfil de imigrante:
- País de Destino: ${dest}
- Cidade/Região de Destino: ${city}
- Objetivo/Visto: ${goal}

Você deve responder ESTREITAMENTE com um objeto JSON puro e válido. Não adicione tags de markdown, blocos de código \`\`\`json ou qualquer texto fora do JSON. O JSON deve seguir a seguinte estrutura de propriedades:

{
  "timelineTasks": [
    { "id": "t1", "timeframe": "6_meses", "timeframeLabel": "6 Meses Antes", "title": "...", "description": "...", "completed": false, "priority": "high" }
  ],
  "checklists": {
    "documentos_brasil": [ { "id": "db1", "text": "...", "completed": false, "notes": "", "priority": "high", "cost": 0 } ],
    "apostila_haia": [ ],
    "traducao_juramentada": [ ],
    "bagagem_mao": [ ],
    "empadronamiento": [ ],
    "escola": [ ],
    "regularizacao_2026": [ ]
  },
  "packingChecklists": {
    "malas_roupas": [ { "id": "m1", "text": "...", "completed": false, "notes": "", "priority": "medium", "cost": 0 } ],
    "eletronicos": [ ],
    "documentos_valores": [ ],
    "saude_higiene": [ ],
    "itens_pessoais": [ ]
  },
  "financialExpenses": [
    { "id": "f1", "description": "Taxas para emissão de novos passaportes (família)", "category": "documentos", "categoryLabel": "Documentos", "estimated": 1000, "real": 0, "paid": false }
  ],
  "contacts": [
    { "name": "...", "purpose": "...", "phone": "...", "email": "...", "website": "...", "sede_electronica": "...", "address": "...", "category": "oficial" }
  ],
  "tours": [
    { "id": "tour1", "day": "Dia 1", "title": "...", "location": "...", "cost": 100, "status": "planejado", "notes": "" }
  ],
  "generalNotes": "Regras locais importantes, leis de permanência contínua, dicas sobre clima, transporte e moradia em ${city}."
}

INSTRUÇÕES DE CONTEÚDO IMPORTANTES:
1. Gere pelo menos 12 tarefas cronológicas para "timelineTasks" cobrindo prazos desde "6_meses" até a fase de "regularizacao" pós-chegada.
2. Gere checklists robustos para cada uma das 7 categorias em "checklists" contendo itens reais, nomes oficiais de documentos e trâmites de imigração para o destino, incluindo custos estimados plausíveis em BRL (ex: taxas de cartório, traduções juramentadas, apostilamento de Haia).
3. Estime despesas reais para "financialExpenses" baseadas na realidade econômica de imigrar para ${dest} (ex: passagens aéreas internacionais reais estimadas em BRL, primeiros alugueis no destino, seguro viagem obrigatório, etc.).
4. Forneça pelo menos 6 contatos reais locais (hospitais, embaixadas brasileiras no país, câmaras municipais locais, etc.) com telefones, emails e websites legítimos em "contacts".
5. Forneça pelo menos 4 passeios/lazer recomendados em "tours" para que a família conheça a cidade na chegada.
6. A propriedade "generalNotes" deve conter um texto explicativo bem detalhado com conselhos úteis sobre custo de vida, moradia, obtenção de vistos e clima local.

Retorne estritamente o JSON pronto para ser parseado.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'vTask Agent Sync'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      let text = resData.choices?.[0]?.message?.content || '';
      
      // Limpeza caso venha envelopado em markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(text);
      
      const newExtended: AppState = {
        ...extendedStateRef.current,
        timelineTasks: parsed.timelineTasks || [],
        checklists: parsed.checklists || {},
        packingChecklists: parsed.packingChecklists || {},
        financialExpenses: parsed.financialExpenses || [],
        contacts: parsed.contacts || [],
        tours: parsed.tours || [],
        generalNotes: parsed.generalNotes || '',
        destinationCountry: dest,
        travelYear: '2026'
      };

      // 1. Atualiza o extendedState imediatamente
      setExtendedState(newExtended);
      localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(newExtended));

      // 2. Achata os checklists por trimestre para o estado paralelo (Regularização)
      const flatChecklists: any[] = [];
      Object.entries(parsed.checklists || {}).forEach(([catId, items]: any) => {
        const quarterMap: Record<string, number> = {
          documentos_brasil: 1, apostila_haia: 2, traducao_juramentada: 3,
          bagagem_mao: 4, empadronamiento: 5, escola: 6, regularizacao_2026: 7
        };
        items.forEach((item: any, idx: number) => {
          flatChecklists.push({
            id: `local_ch_ai_${catId}_${idx}`,
            user_id: user.id,
            quarter: quarterMap[catId] || 4,
            title: item.text,
            description: item.notes || '',
            category: item.priority === 'high' ? 'URGENTE' : 'DOC',
            link: '',
            position: idx,
            is_completed: item.completed || false
          });
        });
      });

      // Transforma os contatos da IA para o formato do estado paralelo
      const newContacts = (parsed.contacts || []).map((c: any, idx: number) => ({
        id: `local_co_ai_${idx}`,
        user_id: user.id,
        name: c.name,
        purpose: c.purpose || '',
        phone: c.phone || '',
        email: c.email || '',
        website: c.website || '',
        sede_electronica: c.sede_electronica || '',
        address: c.address || '',
        category: c.category || 'oficial'
      }));

      // 3. Atualiza os estados paralelos E limpa o localStorage antigo (fonte de duplicação)
      setChecklists(flatChecklists);
      setContacts(newContacts);
      localStorage.setItem('immigration_checklists_local', JSON.stringify(flatChecklists));
      localStorage.setItem('immigration_contacts_local', JSON.stringify(newContacts));

      // 4. Salva diretamente no Supabase (sem timeout) para garantir persistência
      if (profile?.id && profile.id !== 'local') {
        const { error: saveErr } = await supabase
          .from('immigration_profiles')
          .update({ extended_state: newExtended })
          .eq('id', profile.id);
        if (saveErr) {
          console.warn('Erro ao salvar extended_state no Supabase:', saveErr.message);
        }

        // 5. Tenta sincronizar nas tabelas separadas (opcional — falha silenciosa se não existirem)
        try {
          await supabase.from('immigration_checklists').delete().eq('user_id', user.id);
          if (flatChecklists.length > 0) {
            await supabase.from('immigration_checklists').insert(
              flatChecklists.map(({ id: _id, ...rest }: { id: string; [key: string]: any }) => rest)
            );
          }
          await supabase.from('immigration_contacts').delete().eq('user_id', user.id);
          if (newContacts.length > 0) {
            await supabase.from('immigration_contacts').insert(
              newContacts.map(({ id: _id, ...rest }: { id: string; [key: string]: any }) => rest)
            );
          }
        } catch (_) {
          // Tabelas opcionais — não é crítico
        }
      }

      alert(`✅ Jornada Sincronizada!\n\nO vTask Agent gerou sua jornada completa e personalizada para ${dest} (${city}).\n\nNavegue pelas seções para ver checklists, finanças, passeios, contatos e malas customizados!`);
    } catch (error: any) {
      console.error('Erro na sincronização IA:', error);
      alert(`Erro ao sincronizar dados da IA: ${error.message || error}\n\nCertifique-se de que a sua chave da API do OpenRouter e o modelo estão corretos e válidos.`);
    } finally {
      setIsSyncingAI(false);
    }
  }

  const extendedStateRef = useRef(extendedState);
  useEffect(() => {
    extendedStateRef.current = extendedState;
  }, [extendedState]);

  // ────────── SINCRONIZAÇÃO EM NUVEM ──────────

  // Persiste um estado já montado no Supabase — não mexe no state do React
  async function persistToSupabase(state: AppState) {
    if (!user) return;
    // Bloqueia saves enquanto o perfil não foi carregado do Supabase
    // (evita sobrescrever dados com o INITIAL_STATE vazio durante a inicialização)
    const profileId = profileRef.current?.id;
    if (!profileId || profileId === 'local') return;
    setSyncStatus('saving');
    try {
      const { error } = await supabase
        .from('immigration_profiles')
        .update({ extended_state: state, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (error) {
        console.warn("Erro ao salvar extended_state no Supabase:", error.message);
        setSyncStatus('error');
      } else {
        // Marca o timestamp do save para o realtime ignorar o echo desta gravação
        lastSaveTimestampRef.current = Date.now();
        setSyncStatus('saved');
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
      }
    } catch (e) {
      console.warn("Erro ao atualizar extended_state na nuvem:", e);
      setSyncStatus('error');
    }
  }

  async function updateExtendedState(newState: AppState) {
    if (!user) return;
    extendedStateRef.current = newState;
    // Usa callback funcional para garantir que o React aplica sobre o estado mais recente
    setExtendedState(() => newState);
    try { localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(newState)); } catch {}
    await persistToSupabase(newState);
  }

  // Salva apenas as chatSessions no banco sem tocar no React state — evita re-renders e loops infinitos
  function saveChatSessions(sessions: any[]) {
    if (!user) return;
    const next = { ...extendedStateRef.current, chatSessions: sessions };
    extendedStateRef.current = next;
    try { localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(next)); } catch {}
    persistToSupabase(next);
  }

  // Garantir salvamento no Supabase se o usuário fechar a aba/janela rapidamente
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && extendedStateRef.current) {
        supabase
          .from('immigration_profiles')
          .update({ extended_state: extendedStateRef.current, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // ────────── TODOIST INTEGRATION ──────────
  useEffect(() => {
    const savedToken = localStorage.getItem('todoist_api_token');
    const savedConnected = localStorage.getItem('todoist_connected') === 'true';
    const savedSimulated = localStorage.getItem('todoist_simulated') === 'true';
    if (savedToken) setTodoistToken(savedToken);
    setIsTodoistConnected(savedConnected);
    setIsTodoistSimulated(savedSimulated);
  }, []);

  const handleConnectTodoistSimulated = () => {
    setIsTodoistSimulated(true);
    setIsTodoistConnected(false);
    localStorage.setItem('todoist_simulated', 'true');
    localStorage.setItem('todoist_connected', 'false');
    addTodoistLog(`[AUTH] Conectado ao Todoist em Modo Simulado.`);
  };

  const handleDisconnectTodoist = () => {
    setIsTodoistConnected(false);
    setIsTodoistSimulated(false);
    setTodoistToken('');
    localStorage.removeItem('todoist_api_token');
    localStorage.setItem('todoist_connected', 'false');
    localStorage.setItem('todoist_simulated', 'false');
    addTodoistLog(`[AUTH] Desconectado da integração do Todoist.`);
    const currentExt = extendedStateRef.current || extendedState;
    const updatedEvents = (currentExt.events || []).filter(e => e.sourceType !== 'todoist');
    updateExtendedState({ ...currentExt, events: updatedEvents });
  };

  const handleTriggerTodoistSync = async (tokenInput?: string) => {
    const tokenToUse = tokenInput || todoistToken;
    if (!tokenToUse && !isTodoistSimulated) {
      alert("Por favor, insira o seu Todoist API Token.");
      return;
    }

    if (isTodoistSimulated) {
      addTodoistLog(`[SIMULADO] Buscando tarefas do Todoist...`);
      setTimeout(() => {
        const today = new Date();
        const mockTasks = [
          { id: 'sim_1', title: '🎯 Planejar orçamento mensal', description: 'Revisar custos de aluguel e alimentação', date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0], time: '10:00' },
          { id: 'sim_2', title: '📞 Ligar para imobiliária', description: 'Confirmar documentos exigidos para contrato', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString().split('T')[0], time: '14:30' },
          { id: 'sim_3', title: '🎒 Organizar bagagem de mão', description: 'Verificar limites de peso e líquidos', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().split('T')[0] },
          { id: 'sim_4', title: '🛒 Comprar itens de viagem', description: 'Adaptador de tomada, cadeados e tags', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0] },
        ];
        
        const currentExt = extendedStateRef.current || extendedState;
        const currentEvents = currentExt.events || [];
        const nonTodoistEvents = currentEvents.filter(e => e.sourceType !== 'todoist');
        
        const newEvents = mockTasks.map(t => ({
          id: `todoist_${t.id}`,
          title: t.title,
          description: t.description,
          date: t.date,
          time: t.time,
          notifyOneDayBefore: false,
          sourceType: 'todoist' as const,
          sourceId: t.id
        }));

        updateExtendedState({
          ...currentExt,
          events: [...nonTodoistEvents, ...newEvents]
        });
        
        addTodoistLog(`[SIMULADO] Importação concluída! 4 tarefas mapeadas no calendário.`);
      }, 800);
      return;
    }

    addTodoistLog(`[API] Autenticando com a API do Todoist...`);
    try {
      const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
      }

      const tasks = await response.json();
      addTodoistLog(`[API] Recebidas ${tasks.length} tarefas do Todoist. Filtrando as com data...`);

      const datedTasks = tasks.filter((t: any) => t.due && t.due.date);
      addTodoistLog(`[API] Encontradas ${datedTasks.length} tarefas com vencimento.`);

      const currentExt = extendedStateRef.current || extendedState;
      const currentEvents = currentExt.events || [];
      const nonTodoistEvents = currentEvents.filter(e => e.sourceType !== 'todoist');

      const mappedEvents = datedTasks.map((t: any) => {
        let eventTime = undefined;
        if (t.due.datetime) {
          try {
            const dt = new Date(t.due.datetime);
            eventTime = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          } catch (e) {}
        }
        return {
          id: `todoist_${t.id}`,
          title: `📝 [Todoist] ${t.content}`,
          description: t.description || 'Tarefa sincronizada do Todoist',
          date: t.due.date,
          time: eventTime,
          notifyOneDayBefore: false,
          sourceType: 'todoist' as const,
          sourceId: t.id
        };
      });

      updateExtendedState({
        ...currentExt,
        events: [...nonTodoistEvents, ...mappedEvents]
      });

      localStorage.setItem('todoist_api_token', tokenToUse);
      localStorage.setItem('todoist_connected', 'true');
      localStorage.setItem('todoist_simulated', 'false');
      setTodoistToken(tokenToUse);
      setIsTodoistConnected(true);
      setIsTodoistSimulated(false);
      
      addTodoistLog(`[API] Sincronização concluída com sucesso! ${mappedEvents.length} tarefas importadas.`);
    } catch (e: any) {
      addTodoistLog(`[ERRO] Falha na sincronização: ${e.message}`);
    }
  };

  // ────────── HANDLERS MY-TRAVEL-DOCS ──────────
  const handleFamilyMembersChange = (updated: FamilyMember[]) => {
    const currentExt = extendedStateRef.current || extendedState;
    updateExtendedState({ ...currentExt, familyMembers: updated });
  };

  const handleChecklistsChange = (categoryId: string, items: any[]) => {
    setExtendedState(prev => {
      const next = {
        ...prev,
        checklists: {
          ...(prev.checklists || DEFAULT_CHECKLISTS),
          [categoryId]: items
        }
      };
      extendedStateRef.current = next;
      try { localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(next)); } catch {}
      persistToSupabase(next);
      return next;
    });
  };

  const handlePackingChecklistsChange = (categoryId: string, items: any[]) => {
    setExtendedState(prev => {
      const next = {
        ...prev,
        packingChecklists: {
          ...(prev.packingChecklists || DEFAULT_PACKING_CHECKLISTS),
          [categoryId]: items
        }
      };
      extendedStateRef.current = next;
      try { localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(next)); } catch {}
      persistToSupabase(next);
      return next;
    });
  };

  const handleFinancialExpensesChange = (updated: FinancialExpense[]) => {
    const cur = extendedStateRef.current;
    updateExtendedState({ ...cur, financialExpenses: updated });
  };

  const handleTimelineTasksChange = (updated: any[]) => {
    const cur = extendedStateRef.current;
    updateExtendedState({ ...cur, timelineTasks: updated });
  };

  const handleTimelineTaskToggle = (taskId: string) => {
    const cur = extendedStateRef.current;
    updateExtendedState({
      ...cur,
      timelineTasks: cur.timelineTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    });
  };

  const handleHousingChange = (updated: HousingDetails) => {
    const cur = extendedStateRef.current;
    updateExtendedState({ ...cur, housing: updated });
  };

  const handleToursChange = (updated: any[]) => {
    const cur = extendedStateRef.current;
    updateExtendedState({ ...cur, tours: updated });
  };

  // Sync Engine Effect (Birthdays, Expiries & Tours)
  useEffect(() => {
    if (!extendedState || !extendedState.familyMembers) return;
    const currentEvents = extendedState.events || [];
    const generatedEvents: AppEvent[] = [];

    (extendedState.familyMembers || []).forEach(member => {
      if (member.passportExpiry) {
        const existing = currentEvents.find(e => e.sourceType === 'passport_expiry' && e.sourceId === member.id);
        generatedEvents.push({
          id: existing?.id || `passport_${member.id}`,
          title: `⚠️ Vencimento Passaporte: ${member.name || member.roleLabel}`,
          description: `Passaporte nº ${member.passportNumber || ''}`,
          date: member.passportExpiry,
          notifyOneDayBefore: existing ? existing.notifyOneDayBefore : true,
          sourceType: 'passport_expiry',
          sourceId: member.id,
          googleEventId: existing?.googleEventId
        });
      }
      if (member.birthDate) {
        const existing = currentEvents.find(e => e.sourceType === 'birthday' && e.sourceId === member.id);
        generatedEvents.push({
          id: existing?.id || `birthday_${member.id}`,
          title: `🎂 Aniversário: ${member.name || member.roleLabel}`,
          description: `Data de nascimento: ${member.birthDate.split('-').reverse().join('/')}`,
          date: member.birthDate,
          notifyOneDayBefore: existing ? existing.notifyOneDayBefore : false,
          sourceType: 'birthday',
          sourceId: member.id,
          googleEventId: existing?.googleEventId
        });
      }
    });

    (extendedState.tours || []).forEach(tour => {
      if (tour.date) {
        const existing = currentEvents.find(e => e.sourceType === 'tour' && e.sourceId === tour.id);
        generatedEvents.push({
          id: existing?.id || `tour_ev_${tour.id}`,
          title: `🎒 Passeio: ${tour.title}`,
          description: tour.location ? `Local: ${tour.location}` : undefined,
          date: tour.date,
          time: tour.time,
          notifyOneDayBefore: existing ? existing.notifyOneDayBefore : false,
          sourceType: 'tour',
          sourceId: tour.id,
          googleEventId: existing?.googleEventId
        });
      }
    });

    const customEvents = currentEvents.filter(e => e.sourceType === 'custom' || !e.sourceType);
    const newEventsList = [...customEvents, ...generatedEvents];

    if (JSON.stringify(newEventsList) === JSON.stringify(currentEvents)) {
      return;
    }
    setExtendedState(prev => {
      const next = { ...prev, events: newEventsList };
      extendedStateRef.current = next;
      return next;
    });
  }, [extendedState.familyMembers, extendedState.tours]);

  const handleAddEvent = (event: AppEvent) => {
    const cur = extendedStateRef.current;
    const updatedEvents = [...(cur.events || []), event];
    updateExtendedState({ ...cur, events: updatedEvents });
    addTodoistLog(`Evento criado: "${event.title}"`);
  };

  const handleUpdateEvent = (updated: AppEvent) => {
    const cur = extendedStateRef.current;
    const updatedEvents = (cur.events || []).map(e => e.id === updated.id ? updated : e);
    updateExtendedState({ ...cur, events: updatedEvents });
    addTodoistLog(`Evento atualizado: "${updated.title}"`);
  };

  const handleDeleteEvent = (eventId: string) => {
    const cur = extendedStateRef.current;
    const ev = (cur.events || []).find(e => e.id === eventId);
    const updatedEvents = (cur.events || []).filter(e => e.id !== eventId);
    updateExtendedState({ ...cur, events: updatedEvents });
    if (ev) {
      addTodoistLog(`Evento removido: "${ev.title}"`);
    }
  };

  // ────────── AÇÕES DO PERFIL ──────────
  async function updateProfileField(field: string, value: any) {
    if (!user) return;
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    try {
      localStorage.setItem('immigration_profile_local', JSON.stringify(updated));
    } catch {}

    try {
      const { error } = await supabase
        .from('immigration_profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
    }
  }

  // ────────── AÇÕES DA CHECKLIST ──────────
  async function toggleChecklistTask(taskId: string, isCompleted: boolean) {
    const updated = checklists.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t);
    setChecklists(updated);

    if (String(taskId).startsWith('local_')) {
      localStorage.setItem('immigration_checklists_local', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('immigration_checklists')
        .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao atualizar status do checklist:", err);
    }
  }

  async function reorderOrMoveTask(taskId: string, targetQuarter: number, newPosition?: number, isCompleted?: boolean) {
    setSyncStatus('saving');
    const targetTask = checklists.find(t => String(t.id) === String(taskId));
    if (!targetTask) return;

    const updatedIsCompleted = isCompleted !== undefined ? isCompleted : targetTask.is_completed;
    const updatedQuarter = targetQuarter;
    const updatedPosition = newPosition !== undefined ? newPosition : (targetTask.position || 0);

    const updatedChecklists = checklists.map(t => {
      if (String(t.id) === String(taskId)) {
        return {
          ...t,
          quarter: updatedQuarter,
          position: updatedPosition,
          is_completed: updatedIsCompleted
        };
      }
      return t;
    });

    setChecklists(updatedChecklists);
    try {
      localStorage.setItem('immigration_checklists_local', JSON.stringify(updatedChecklists));
    } catch {}

    const _extForChecklist = extendedStateRef.current;
    if (_extForChecklist && _extForChecklist.checklists) {
      const flatNewChecklists = { ..._extForChecklist.checklists };
      let foundInExtended = false;
      Object.keys(flatNewChecklists).forEach(cat => {
        flatNewChecklists[cat] = flatNewChecklists[cat].map(item => {
          if (String(item.id) === String(taskId)) {
            foundInExtended = true;
            return { ...item, completed: updatedIsCompleted };
          }
          return item;
        });
      });
      if (foundInExtended) {
        updateExtendedState({ ...extendedStateRef.current, checklists: flatNewChecklists });
      }
    }

    if (!String(taskId).startsWith('local_') && user) {
      try {
        const { error } = await supabase
          .from('immigration_checklists')
          .update({
            quarter: updatedQuarter,
            position: updatedPosition,
            is_completed: updatedIsCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) {
          console.warn("Erro ao mover tarefa no Supabase:", error.message);
          setSyncStatus('error');
        } else {
          setSyncStatus('saved');
          setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
        }
      } catch (err) {
        console.error("Erro ao mover tarefa:", err);
        setSyncStatus('error');
      }
    } else {
      setSyncStatus('saved');
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    }
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const fd = new FormData(e.target as HTMLFormElement);
    const taskPayload = {
      quarter: parseInt(fd.get('quarter') as string) || 1,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      category: fd.get('category') as string,
      link: fd.get('link') as string,
      user_id: user.id
    };

    if (profile.id === 'local' || (taskModal.data?.id && String(taskModal.data.id).startsWith('local_'))) {
      let updatedChecks;
      if (taskModal.mode === 'add') {
        const newTask = {
          ...taskPayload,
          id: `local_ch_${Date.now()}`,
          is_completed: false,
          position: checklists.filter(c => c.quarter === taskPayload.quarter).length
        };
        updatedChecks = [...checklists, newTask].sort((a, b) => a.quarter - b.quarter || a.position - b.position);
      } else {
        updatedChecks = checklists.map(t => t.id === taskModal.data.id ? { ...t, ...taskPayload } : t)
          .sort((a, b) => a.quarter - b.quarter || a.position - b.position);
      }
      setChecklists(updatedChecks);
      localStorage.setItem('immigration_checklists_local', JSON.stringify(updatedChecks));
      setTaskModal({ open: false, mode: 'add' });
      return;
    }

    try {
      if (taskModal.mode === 'add') {
        const { data, error } = await supabase
          .from('immigration_checklists')
          .insert({ ...taskPayload, is_completed: false, position: checklists.filter(c => c.quarter === taskPayload.quarter).length })
          .select()
          .single();

        if (error) throw error;
        setChecklists(prev => [...prev, data].sort((a, b) => a.quarter - b.quarter || a.position - b.position));
      } else {
        const { data, error } = await supabase
          .from('immigration_checklists')
          .update(taskPayload)
          .eq('id', taskModal.data.id)
          .select()
          .single();

        if (error) throw error;
        setChecklists(prev => prev.map(t => t.id === taskModal.data.id ? data : t).sort((a, b) => a.quarter - b.quarter || a.position - b.position));
      }
      setTaskModal({ open: false, mode: 'add' });
    } catch (err) {
      console.error("Erro ao salvar tarefa:", err);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Tem certeza que deseja excluir esta tarefa do checklist?")) return;
    const updated = checklists.filter(t => t.id !== taskId);
    setChecklists(updated);

    if (String(taskId).startsWith('local_')) {
      localStorage.setItem('immigration_checklists_local', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('immigration_checklists')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir tarefa:", err);
    }
  }

  // ────────── AÇÕES DOS CONTATOS ──────────
  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const fd = new FormData(e.target as HTMLFormElement);
    const contactPayload = {
      name: fd.get('name') as string,
      address: fd.get('address') as string,
      purpose: fd.get('purpose') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      website: fd.get('website') as string,
      sede_electronica: fd.get('sede_electronica') as string,
      category: fd.get('category') as string,
      user_id: user.id
    };

    if (profile.id === 'local' || contactModal.data?.id?.startsWith('local_')) {
      let updatedContacts;
      if (contactModal.mode === 'add') {
        const newContact = {
          ...contactPayload,
          id: `local_co_${Date.now()}`
        };
        updatedContacts = [...contacts, newContact].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        updatedContacts = contacts.map(c => c.id === contactModal.data.id ? { ...c, ...contactPayload } : c)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      setContacts(updatedContacts);
      localStorage.setItem('immigration_contacts_local', JSON.stringify(updatedContacts));
      setContactModal({ open: false, mode: 'add' });
      return;
    }

    try {
      if (contactModal.mode === 'add') {
        const { data, error } = await supabase
          .from('immigration_contacts')
          .insert(contactPayload)
          .select()
          .single();

        if (error) throw error;
        setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const { data, error } = await supabase
          .from('immigration_contacts')
          .update(contactPayload)
          .eq('id', contactModal.data.id)
          .select()
          .single();

        if (error) throw error;
        setContacts(prev => prev.map(c => c.id === contactModal.data.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
      }
      setContactModal({ open: false, mode: 'add' });
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
    }
  }

  async function deleteContact(contactId: string) {
    if (!confirm("Deseja mesmo excluir este contato?")) return;
    const updated = contacts.filter(c => c.id !== contactId);
    setContacts(updated);

    if (String(contactId).startsWith('local_')) {
      localStorage.setItem('immigration_contacts_local', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('immigration_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir contato:", err);
    }
  }

  // ────────── AÇÕES DOS DOCUMENTOS ──────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setDocModal(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.split('.')[0]
      }));
    }
  }

  async function uploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !docModal.file) return;

    setIsUploading(true);

    if (profile.id === 'local') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newDoc = {
          id: `local_doc_${Date.now()}`,
          name: docModal.name,
          category: docModal.category,
          file_url: dataUrl,
          expiry_date: docModal.expiry_date || null,
          associated_quarter: docModal.associated_quarter ? parseInt(docModal.associated_quarter) : null,
          notes: docModal.notes,
          created_at: new Date().toISOString()
        };
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        localStorage.setItem('travel_documents_local', JSON.stringify(updatedDocs));
        setDocModal({ open: false, name: '', category: 'identidade', expiry_date: '', associated_quarter: '', notes: '' });
        setIsUploading(false);
      };
      reader.readAsDataURL(docModal.file);
      return;
    }

    try {
      const { path, error: uploadErr } = await uploadTravelDoc(user.id, docModal.file, docModal.name);
      if (uploadErr) throw uploadErr;

      const docPayload = {
        user_id: user.id,
        name: docModal.name,
        category: docModal.category,
        file_url: path,
        expiry_date: docModal.expiry_date || null,
        associated_quarter: docModal.associated_quarter ? parseInt(docModal.associated_quarter) : null,
        notes: docModal.notes
      };

      const { data, error: dbErr } = await supabase
        .from('travel_documents')
        .insert(docPayload)
        .select()
        .single();

      if (dbErr) throw dbErr;

      setDocuments(prev => [data, ...prev]);
      setDocModal({ open: false, name: '', category: 'identidade', expiry_date: '', associated_quarter: '', notes: '' });
    } catch (err: any) {
      alert("Erro ao enviar documento: " + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteDocument(docId: string, filePath: string) {
    if (!confirm("Tem certeza que deseja excluir permanentemente este documento?")) return;

    if (String(docId).startsWith('local_')) {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      localStorage.setItem('travel_documents_local', JSON.stringify(updated));
      return;
    }

    try {
      const { success, error: storageErr } = await deleteTravelDoc(filePath);
      if (storageErr) console.warn("Aviso ao remover do storage:", storageErr);

      const { error: dbErr } = await supabase
        .from('travel_documents')
        .delete()
        .eq('id', docId);

      if (dbErr) throw dbErr;

      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert("Erro ao excluir documento: " + (err.message || err));
    }
  }

  async function viewDocument(filePath: string) {
    if (filePath.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${filePath}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
      return;
    }

    const url = await getTravelDocUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Não foi possível gerar um link seguro para visualizar o documento.");
    }
  }

  function getDocumentExpiryStatus(dateStr: string) {
    if (!dateStr) return { label: 'Sem Validade', color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800' };
    const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (diff < 0) return { label: 'Expirado', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' };
    if (diff <= 30) return { label: `Vence em ${Math.ceil(diff)} dias`, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    return { label: `Válido (${new Date(dateStr).toLocaleDateString('pt-BR')})`, color: 'text-green-500 bg-green-50 dark:bg-green-950/20' };
  }

  // ────────── LÓGICA DO SIMULADOR FINANCEIRO ──────────
  const formatValue = (valueInBRL: number) => {
    const sym = CURRENCY_SYMBOLS[activeCurrency] || 'R$';
    const rate = activeCurrency === 'BRL' ? 1 : exchangeRate;
    const valueInActive = (valueInBRL || 0) / rate;
    return `${sym} ${Math.round(valueInActive).toLocaleString('pt-BR')}`;
  };

  const initialPackageBRL = (formData.flights || 0) + (formData.stay || 0) + (formData.food || 0) +
    (formData.transport || 0) + (formData.tours || 0) + (formData.emergencyInitial || 0);

  const monthlyExpensesBRL = (formData.rent || 0) + (formData.bills || 0) + (formData.market || 0) +
    (formData.transportMonthly || 0) + (formData.health || 0) + (formData.kids || 0) + (formData.monthlyReserve || 0);

  const monthlyIncomeBRL = formData.extraIncome || 0;
  const netMonthlyFlowBRL = monthlyIncomeBRL - monthlyExpensesBRL;
  const remainingAfterInitialBRL = budget - initialPackageBRL;

  const calculateMonths = () => {
    const monthsArr = [];
    let balance = remainingAfterInitialBRL;

    for (let i = 1; i <= 12; i++) {
      const monthlyExpense = monthlyExpensesBRL;
      const extraIncome = monthlyIncomeBRL;
      const netFlow = extraIncome - monthlyExpense;
      const initialBalance = balance;
      const endBalance = balance + netFlow;

      monthsArr.push({
        month: i,
        initialBalance,
        monthlyExpense,
        extraIncome,
        netFlow,
        endBalance,
        healthy: endBalance >= 0
      });

      balance = endBalance;
    }
    return monthsArr;
  };

  const months = calculateMonths();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  async function handleSaveScenario() {
    if (!user) return;
    const nameToUse = scenarioName || 'Cenário ' + new Date().toLocaleDateString('pt-BR');

    try {
      const payload = {
        user_id: user.id,
        name: nameToUse,
        author: author || userName(),
        budget,
        form_data: { ...formData, exchange: exchangeRate }
      };

      if (editingScenarioId) {
        const { error } = await supabase
          .from('espanha_scenarios')
          .update(payload)
          .eq('id', editingScenarioId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('espanha_scenarios')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setScenarios(prev => [{ ...data, formData: data.form_data, createdAt: new Date(data.created_at).toLocaleDateString('pt-BR') }, ...prev]);
      }

      alert("Cenário salvo com sucesso!");
      setEditingScenarioId(null);
      setShowAddScenario(false);
      loadAllData();
    } catch (err) {
      console.error("Erro ao salvar cenário financeiro:", err);
    }
  }

  async function handleDeleteScenario(id: string) {
    if (!confirm("Deseja mesmo remover este cenário financeiro?")) return;
    try {
      setScenarios(prev => prev.filter(s => s.id !== id));
      const { error } = await supabase
        .from('espanha_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Erro ao excluir cenário:", err);
    }
  }

  function handleLoadScenario(sc: any) {
    setFormData(sc.formData);
    setBudget(sc.budget);
    setScenarioName(sc.name);
    setAuthor(sc.author);
    setEditingScenarioId(sc.id);
    setShowAddScenario(true);
  }

  const userName = () => user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  // Estatísticas do checklist
  const totalTasks = checklists.length;
  const completedTasks = checklists.filter(c => c.is_completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const value: ImigracaoContextType = {
    user,
    exchangeRate,
    activeCurrency,
    primaryCurrency: 'BRL',
    secondaryCurrency: activeCurrency !== 'BRL' ? activeCurrency : 'EUR',
    profile,
    extendedState,
    checklists,
    contacts,
    documents,
    loading,
    scenarios,
    formData,
    budget,
    scenarioName,
    showAddScenario,
    newScenarioName,
    author,
    editingScenarioId,
    initialPackageBRL,
    monthlyExpensesBRL,
    extraIncomeBRL: monthlyIncomeBRL,
    monthlyIncomeBRL,
    netMonthlyFlowBRL,
    remainingAfterInitialBRL,
    months,
    taskModal,
    contactModal,
    docModal,
    isUploading,
    todoistToken,
    setTodoistToken,
    isTodoistConnected,
    isTodoistSimulated,
    todoistSyncLogs,
    totalTasks,
    completedTasks,
    completionPercentage,
    setFormData,
    setBudget,
    setScenarioName,
    setShowAddScenario,
    setNewScenarioName,
    setAuthor,
    setEditingScenarioId,
    setTaskModal,
    setContactModal,
    setDocModal,
    loadAllData,
    updateExtendedState,
    handleSyncIdeias,
    isSyncingAI,
    handleAISync,
    handleFamilyMembersChange,
    handleChecklistsChange,
    handlePackingChecklistsChange,
    handleFinancialExpensesChange,
    handleTimelineTasksChange,
    handleTimelineTaskToggle,
    handleHousingChange,
    handleToursChange,
    handleAddEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleTriggerTodoistSync,
    handleDisconnectTodoist,
    handleConnectTodoistSimulated,
    updateProfileField,
    toggleChecklistTask,
    reorderOrMoveTask,
    saveTask,
    deleteTask,
    saveContact,
    deleteContact,
    handleFileChange,
    uploadDocument,
    deleteDocument,
    viewDocument,
    getDocumentExpiryStatus,
    handleInputChange,
    handleSaveScenario,
    handleDeleteScenario,
    handleLoadScenario,
    formatValue,
    userName,
    syncStatus,
    lastSyncTime,
    updateOpenRouterConfig: (apiKey: string, model: string) => {
      const cleanKey = apiKey.trim();
      const cleanModel = model.trim() || 'google/gemini-2.5-flash';

      try {
        localStorage.setItem('openrouter_api_key', cleanKey);
        localStorage.setItem('vtask_openrouter_api_key_v2', cleanKey);
        localStorage.setItem('openrouter_model', cleanModel);
        localStorage.setItem('vtask_openrouter_model_v2', cleanModel);
      } catch {}

      updateExtendedState({
        ...extendedStateRef.current,
        openrouterApiKey: cleanKey,
        openrouterModel: cleanModel
      });
    },
    saveChatSessions,
  };

  return (
    <ImigracaoContext.Provider value={value}>
      {children}
    </ImigracaoContext.Provider>
  );
}

export function useImigracao() {
  const ctx = useContext(ImigracaoContext);
  if (!ctx) throw new Error('useImigracao must be used within ImigracaoProvider');
  return ctx;
}
