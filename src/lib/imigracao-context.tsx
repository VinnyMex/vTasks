'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { uploadTravelDoc, deleteTravelDoc, getTravelDocUrl } from '@/lib/travel-docs';
import { AppState, FamilyMember, FinancialExpense, HousingDetails, AppEvent } from '@/components/travel-docs/types';
import { INITIAL_STATE, DEFAULT_PACKING_CHECKLISTS } from '@/components/travel-docs/data';

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
  remainingAfterInitialBRL: number;
  months: any[];

  // Modais
  taskModal: { open: boolean; mode: 'add' | 'edit'; data?: any };
  contactModal: { open: boolean; mode: 'add' | 'edit'; data?: any };
  docModal: { open: boolean; file?: File; name: string; category: string; expiry_date: string; associated_quarter: string; notes: string };
  isUploading: boolean;

  // Google Calendar
  isGoogleConnected: boolean;
  isSimulatedConnection: boolean;
  syncLogs: string[];

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
  handleTriggerGeneralSync: () => Promise<void>;
  handleDisconnectGoogle: () => void;
  handleConnectSimulated: () => void;
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
}

const INITIAL_FORM_DATA = {
  flights: 15000,
  stay: 1655,
  food: 1754,
  transport: 372,
  tours: 558,
  emergencyInitial: 1550,
  rent: 500,
  bills: 150,
  market: 700,
  transportMonthly: 200,
  health: 100,
  kids: 150,
  monthlyReserve: 700,
  extraIncome: 1000,
};

const ImigracaoContext = createContext<ImigracaoContextType | null>(null);

export function ImigracaoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeCurrency, primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();

  const [extendedState, setExtendedState] = useState<AppState>(INITIAL_STATE);
  const [exchangeRates] = useState<any>({ BRL: 1.0, EUR: 6.00, USD: 5.50 });
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [isSimulatedConnection, setIsSimulatedConnection] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setSyncLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 100));
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<any>({
    id: 'local',
    destination_country: 'Espanha',
    destination_city: 'Menasalbas / Toledo',
    immigration_goal: 'Arraigo Social/Socioformativo',
    current_quarter: 1
  });

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

  // Carregar todos os dados ao iniciar
  useEffect(() => {
    if (!user) return;
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
          if (newProfile) {
            setProfile(newProfile);
            if (newProfile.extended_state && JSON.stringify(newProfile.extended_state) !== JSON.stringify(extendedState)) {
              setExtendedState(newProfile.extended_state);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.id, extendedState]);

  async function loadAllData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carrega ou cria perfil
      let profileData = null;
      try {
        let { data, error: profileErr } = await supabase
          .from('immigration_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        profileData = data;

        if (!profileData) {
          const { data: newProfile, error: createErr } = await supabase
            .from('immigration_profiles')
            .insert({
              user_id: user.id,
              destination_country: 'Espanha',
              destination_city: 'Menasalbas / Toledo',
              immigration_goal: 'Arraigo Social/Socioformativo',
              current_quarter: 1
            })
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

      // Carregar extended_state com fallback robusto
      let extState = INITIAL_STATE;
      try {
        if (profileData && profileData.id !== 'local' && 'extended_state' in profileData && profileData.extended_state && Object.keys(profileData.extended_state).length > 0) {
          extState = profileData.extended_state;
        } else {
          const saved = localStorage.getItem('checklist_espanha_app_state_v1');
          if (saved) {
            extState = JSON.parse(saved);
          }
        }
      } catch (e) {
        console.warn("Coluna extended_state indisponível. Usando cache local.");
        const saved = localStorage.getItem('checklist_espanha_app_state_v1');
        if (saved) {
          extState = JSON.parse(saved);
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

  // ────────── SINCRONIZAÇÃO EM NUVEM ──────────
  async function updateExtendedState(newState: AppState) {
    if (!user || !profile) return;
    setExtendedState(newState);
    localStorage.setItem('checklist_espanha_app_state_v1', JSON.stringify(newState));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!profile?.id || profile.id === 'local') return;
        const { error } = await supabase
          .from('immigration_profiles')
          .update({ extended_state: newState })
          .eq('id', profile.id);

        if (error) {
          console.warn("Erro ao salvar extended_state no Supabase (verifique se a coluna existe):", error.message);
        }
      } catch (e) {
        console.warn("Erro ao atualizar extended_state na nuvem:", e);
      }
    }, 800);
  }

  // ────────── GOOGLE CALENDAR ──────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'google_oauth_token') {
        const token = event.data.token;
        setGoogleAccessToken(token);
        setIsGoogleConnected(true);
        setIsSimulatedConnection(false);
        addLog(`[AUTH] Conectado ao Google. Sincronização ativa.`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getOrCreateGoogleCalendar = async (): Promise<string | null> => {
    if (!googleAccessToken) return null;
    try {
      addLog(`[API] Verificando lista de calendários...`);
      const listResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      });
      if (!listResponse.ok) {
        addLog(`[ERRO] Falha ao listar calendários: ${listResponse.statusText}`);
        return null;
      }
      const data = await listResponse.json();
      const existing = data.items?.find((item: any) => item.summary === 'My Travel Docs');
      if (existing) {
        addLog(`[API] Calendário "My Travel Docs" encontrado.`);
        if (extendedState.googleCalendarId !== existing.id) {
          updateExtendedState({ ...extendedState, googleCalendarId: existing.id });
        }
        return existing.id;
      }

      addLog(`[API] Criando calendário "My Travel Docs" dedicado...`);
      const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ summary: 'My Travel Docs' })
      });
      if (createResponse.ok) {
        const calData = await createResponse.json();
        addLog(`[API] Calendário criado com sucesso.`);
        updateExtendedState({ ...extendedState, googleCalendarId: calData.id });
        return calData.id;
      } else {
        addLog(`[ERRO] Falha ao criar calendário: ${createResponse.statusText}`);
        return null;
      }
    } catch (e: any) {
      addLog(`[ERRO] Falha de rede ao obter/criar calendário: ${e.message}`);
      return null;
    }
  };

  const syncSingleEventToGoogle = async (event: AppEvent, isDelete = false) => {
    if (isSimulatedConnection) {
      if (isDelete) {
        addLog(`[SIMULADO] Deletando evento no Google Calendar (ID: ${event.googleEventId || 'indefinido'}).`);
      } else {
        const simId = event.googleEventId || `sim_ev_${Math.floor(Math.random() * 1000000)}`;
        addLog(`[SIMULADO] ${event.googleEventId ? 'Atualizando' : 'Criando'} evento "${event.title}" para ${event.date} no Google Calendar.`);
        if (!event.googleEventId) {
          updateExtendedState({
            ...extendedState,
            events: (extendedState.events || []).map(e => e.id === event.id ? { ...e, googleEventId: simId } : e)
          });
        }
      }
      return;
    }

    if (!isGoogleConnected || !googleAccessToken) return;

    try {
      let calId: string | null | undefined = extendedState.googleCalendarId;
      if (!calId) {
        calId = await getOrCreateGoogleCalendar();
      }
      if (!calId) return;

      if (isDelete) {
        if (!event.googleEventId) return;
        addLog(`[API] Removendo "${event.title}" do Google Calendar...`);
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${event.googleEventId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${googleAccessToken}` }
        });
        if (response.ok) {
          addLog(`[API] Evento "${event.title}" removido com sucesso.`);
        } else {
          addLog(`[ERRO] Falha ao deletar evento: ${response.statusText}`);
        }
      } else {
        addLog(`[API] Sincronizando "${event.title}"...`);
        const start = { date: event.date };

        const startDate = new Date(event.date + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        const end = { date: endDate.toISOString().split('T')[0] };

        const body: any = {
          summary: event.title,
          description: event.description || '',
          start,
          end,
          reminders: {
            useDefault: !event.notifyOneDayBefore,
            overrides: event.notifyOneDayBefore ? [{ method: 'popup', minutes: 1440 }] : []
          }
        };

        if (event.time) {
          body.start = { dateTime: `${event.date}T${event.time}:00`, timeZone: 'America/Sao_Paulo' };
          body.end = { dateTime: `${event.date}T${parseInt(event.time.split(':')[0]) + 1}:00`, timeZone: 'America/Sao_Paulo' };
          delete body.start.date;
          delete body.end.date;
        }

        const url = event.googleEventId
          ? `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${event.googleEventId}`
          : `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`;

        const response = await fetch(url, {
          method: event.googleEventId ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          addLog(`[API] Evento "${event.title}" sincronizado com sucesso.`);
          if (!event.googleEventId) {
            updateExtendedState({
              ...extendedState,
              events: (extendedState.events || []).map(e => e.id === event.id ? { ...e, googleEventId: data.id } : e)
            });
          }
        } else {
          if (response.status === 404 && event.googleEventId) {
            addLog(`[API] Evento não encontrado no Google (404). Criando novo...`);
            const createResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ...body, googleEventId: undefined })
            });
            if (createResponse.ok) {
              const data = await createResponse.json();
              addLog(`[API] Evento recriado com sucesso.`);
              updateExtendedState({
                ...extendedState,
                events: (extendedState.events || []).map(e => e.id === event.id ? { ...e, googleEventId: data.id } : e)
              });
            }
          } else {
            addLog(`[ERRO] Falha ao sincronizar: ${response.statusText}`);
          }
        }
      }
    } catch (e: any) {
      addLog(`[ERRO] Falha de rede: ${e.message}`);
    }
  };

  const handleTriggerGeneralSync = async () => {
    if (isSimulatedConnection) {
      addLog(`[SIMULADO] Sincronizando todos os eventos...`);
      let count = 0;
      const updatedEvents = (extendedState.events || []).map(e => {
        if (!e.googleEventId) {
          count++;
          return { ...e, googleEventId: `sim_ev_${Math.floor(Math.random() * 1000000)}` };
        }
        return e;
      });
      updateExtendedState({ ...extendedState, events: updatedEvents });
      addLog(`[SIMULADO] Sincronização concluída! ${count} novos eventos espelhados.`);
      return;
    }

    if (!extendedState.googleClientId) {
      alert("Por favor, insira o seu Google Client ID nas configurações de Calendário.");
      return;
    }

    if (!isGoogleConnected) {
      addLog(`[AUTH] Abrindo login do Google...`);
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${extendedState.googleClientId}&redirect_uri=${window.location.origin}&response_type=token&scope=https://www.googleapis.com/auth/calendar&prompt=consent`;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(url, 'google_oauth_popup', `width=${width},height=${height},left=${left},top=${top}`);
      return;
    }

    addLog(`[API] Sincronizando eventos...`);
    const calId = await getOrCreateGoogleCalendar();
    if (!calId) return;

    const currentEvents = extendedState.events || [];
    for (const ev of currentEvents) {
      await syncSingleEventToGoogle(ev, false);
    }
    addLog(`[API] Sincronização concluída.`);
  };

  const handleDisconnectGoogle = () => {
    setIsGoogleConnected(false);
    setIsSimulatedConnection(false);
    setGoogleAccessToken('');
    addLog(`[AUTH] Desconectado da conta do Google.`);
  };

  const handleConnectSimulated = () => {
    setIsSimulatedConnection(true);
    setIsGoogleConnected(false);
    addLog(`[AUTH] Conectado em Modo Simulado.`);
  };

  // ────────── HANDLERS MY-TRAVEL-DOCS ──────────
  const handleFamilyMembersChange = (updated: FamilyMember[]) => {
    updateExtendedState({ ...extendedState, familyMembers: updated });
  };

  const handleChecklistsChange = (categoryId: string, items: any[]) => {
    updateExtendedState({
      ...extendedState,
      checklists: {
        ...extendedState.checklists,
        [categoryId]: items
      }
    });
  };

  const handlePackingChecklistsChange = (categoryId: string, items: any[]) => {
    updateExtendedState({
      ...extendedState,
      packingChecklists: {
        ...(extendedState.packingChecklists || DEFAULT_PACKING_CHECKLISTS),
        [categoryId]: items
      }
    });
  };

  const handleFinancialExpensesChange = (updated: FinancialExpense[]) => {
    updateExtendedState({ ...extendedState, financialExpenses: updated });
  };

  const handleTimelineTasksChange = (updated: any[]) => {
    updateExtendedState({ ...extendedState, timelineTasks: updated });
  };

  const handleTimelineTaskToggle = (taskId: string) => {
    updateExtendedState({
      ...extendedState,
      timelineTasks: extendedState.timelineTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    });
  };

  const handleHousingChange = (updated: HousingDetails) => {
    updateExtendedState({ ...extendedState, housing: updated });
  };

  const handleToursChange = (updated: any[]) => {
    updateExtendedState({ ...extendedState, tours: updated });
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
    setExtendedState(prev => ({ ...prev, events: newEventsList }));
  }, [extendedState.familyMembers, extendedState.tours]);

  const handleAddEvent = (event: AppEvent) => {
    const updatedEvents = [...(extendedState.events || []), event];
    updateExtendedState({ ...extendedState, events: updatedEvents });
    addLog(`Evento criado: "${event.title}"`);
    if (extendedState.googleSyncEnabled && (isGoogleConnected || isSimulatedConnection)) {
      syncSingleEventToGoogle(event, false);
    }
  };

  const handleUpdateEvent = (updated: AppEvent) => {
    const updatedEvents = (extendedState.events || []).map(e => e.id === updated.id ? updated : e);
    updateExtendedState({ ...extendedState, events: updatedEvents });
    addLog(`Evento atualizado: "${updated.title}"`);
    if (extendedState.googleSyncEnabled && (isGoogleConnected || isSimulatedConnection)) {
      syncSingleEventToGoogle(updated, false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const ev = (extendedState.events || []).find(e => e.id === eventId);
    const updatedEvents = (extendedState.events || []).filter(e => e.id !== eventId);
    updateExtendedState({ ...extendedState, events: updatedEvents });
    if (ev) {
      addLog(`Evento removido: "${ev.title}"`);
      if (extendedState.googleSyncEnabled && (isGoogleConnected || isSimulatedConnection)) {
        syncSingleEventToGoogle(ev, true);
      }
    }
  };

  // ────────── AÇÕES DO PERFIL ──────────
  async function updateProfileField(field: string, value: any) {
    if (!user) return;
    const updated = { ...profile, [field]: value };
    setProfile(updated);

    if (!profile?.id || profile.id === 'local') {
      localStorage.setItem('immigration_profile_local', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase
        .from('immigration_profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

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
  const formatValue = (valueInPrimary: number) => {
    if (activeCurrency === 'primary') {
      return `${primaryCurrency === 'BRL' ? 'R$' : primaryCurrency} ${Math.round(valueInPrimary).toLocaleString('pt-BR')}`;
    } else {
      const valueInSecondary = valueInPrimary / exchangeRate;
      return `${secondaryCurrency === 'EUR' ? '€' : secondaryCurrency} ${valueInSecondary.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  const initialPackageBRL = formData.flights + formData.stay + formData.food +
    formData.transport + formData.tours + formData.emergencyInitial;

  const monthlyExpensesSecondary = formData.rent + formData.bills + formData.market +
    formData.transportMonthly + formData.health + formData.kids + formData.monthlyReserve;

  const monthlyExpensesBRL = monthlyExpensesSecondary * exchangeRate;
  const extraIncomeBRL = formData.extraIncome * exchangeRate;
  const remainingAfterInitialBRL = budget - initialPackageBRL;

  const calculateMonths = () => {
    const monthsArr = [];
    let balance = remainingAfterInitialBRL;

    for (let i = 1; i <= 12; i++) {
      const monthlyExpense = monthlyExpensesBRL;
      const hasExtraIncome = i >= 2;
      const extraIncome = hasExtraIncome ? extraIncomeBRL : 0;
      const netExpense = monthlyExpense - extraIncome;
      const initialBalance = balance;
      const endBalance = balance - netExpense;

      monthsArr.push({
        month: i,
        initialBalance,
        monthlyExpense,
        extraIncome,
        netExpense,
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
    primaryCurrency,
    secondaryCurrency,
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
    extraIncomeBRL,
    remainingAfterInitialBRL,
    months,
    taskModal,
    contactModal,
    docModal,
    isUploading,
    isGoogleConnected,
    isSimulatedConnection,
    syncLogs,
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
    handleTriggerGeneralSync,
    handleDisconnectGoogle,
    handleConnectSimulated,
    updateProfileField,
    toggleChecklistTask,
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
