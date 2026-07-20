import { FamilyMember, ChecklistCategory, FinancialExpense, TimelineTask, HousingDetails, AppState } from './types';

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'principal',
    role: 'principal',
    roleLabel: 'Responsável Principal',
    name: '',
    passportNumber: '',
    passportExpiry: '',
    cpf: '',
    rg: '',
    birthDate: '',
    contact: '',
    notes: ''
  },
  {
    id: 'conjuge',
    role: 'conjuge',
    roleLabel: 'Cônjuge / Companheiro(a)',
    name: '',
    passportNumber: '',
    passportExpiry: '',
    cpf: '',
    rg: '',
    birthDate: '',
    contact: '',
    notes: ''
  },
  {
    id: 'filho_1',
    role: 'filho',
    roleLabel: 'Filho(a) 1',
    name: '',
    passportNumber: '',
    passportExpiry: '',
    cpf: '',
    rg: '',
    birthDate: '',
    contact: '',
    notes: ''
  }
];

export const DEFAULT_CHECKLISTS: { [key: string]: any[] } = {
  documentos_brasil: [
    { id: 'db_1', text: 'Passaporte brasileiro válido (mínimo de 1 ano de validade)', completed: false, notes: '', priority: 'high' },
    { id: 'db_2', text: 'RG atualizado (com foto recente) e CPF', completed: false, notes: '', priority: 'high' },
    { id: 'db_3', text: 'Certidão de nascimento (2ª via recente emitida há menos de 6 meses)', completed: false, notes: '', priority: 'high' },
    { id: 'db_4', text: 'Certidão de casamento atualizada (e/ou averbação de divórcio, se aplicável)', completed: false, notes: '', priority: 'high' },
    { id: 'db_5', text: 'Certidão de Antecedentes Criminais da Polícia Federal (emissão online gratuita)', completed: false, notes: '', priority: 'high' },
    { id: 'db_6', text: 'Certidões de Antecedentes Criminais Estaduais', completed: false, notes: '', priority: 'medium' },
    { id: 'db_7', text: 'Diplomas e Históricos Escolares/Acadêmicos (para futura homologação ou equivalência)', completed: false, notes: '', priority: 'medium' }
  ],
  apostila_haia: [
    { id: 'ah_1', text: 'Apostilar Certidão de Nascimento do Responsável Principal', completed: false, notes: '', priority: 'high' },
    { id: 'ah_2', text: 'Apostilar Certidão de Nascimento do Cônjuge', completed: false, notes: '', priority: 'high' },
    { id: 'ah_3', text: 'Apostilar Certidão de Nascimento do(s) Filho(s)', completed: false, notes: '', priority: 'high' },
    { id: 'ah_4', text: 'Apostilar Certidão de Casamento atualizada', completed: false, notes: '', priority: 'high' },
    { id: 'ah_5', text: 'Apostilar Certidão de Antecedentes Criminais da PF', completed: false, notes: '', priority: 'high' },
    { id: 'ah_6', text: 'Apostilar Diplomas e Históricos Escolares', completed: false, notes: '', priority: 'medium' }
  ],
  traducao_juramentada: [
    { id: 'tj_1', text: 'Tradução Juramentada das Certidões de Nascimento (toda a família)', completed: false, notes: '', priority: 'high' },
    { id: 'tj_2', text: 'Tradução Juramentada da Certidão de Casamento', completed: false, notes: '', priority: 'high' },
    { id: 'tj_3', text: 'Tradução Juramentada da Certidão de Antecedentes Criminais da PF', completed: false, notes: '', priority: 'high' },
    { id: 'tj_4', text: 'Tradução Juramentada de Históricos Escolares / Diplomas', completed: false, notes: '', priority: 'medium' }
  ],
  bagagem_mao: [
    { id: 'bm_1', text: 'Passaportes físicos originais de todos os membros da família', completed: false, notes: '', priority: 'high' },
    { id: 'bm_2', text: 'Pasta física com todas as Certidões brasileiras apostiladas e traduzidas', completed: false, notes: '', priority: 'high' },
    { id: 'bm_3', text: 'Caderneta de vacinação original de todos (principalmente das crianças)', completed: false, notes: '', priority: 'high' },
    { id: 'bm_4', text: 'Comprovantes de passagens aéreas de ida e volta (impressos)', completed: false, notes: '', priority: 'high' },
    { id: 'bm_5', text: 'Comprovantes de reservas de hospedagem ou Carta de Convite oficial', completed: false, notes: '', priority: 'high' },
    { id: 'bm_6', text: 'Dinheiro físico em espécie e cartões de débito internacionais carregados', completed: false, notes: '', priority: 'high' },
    { id: 'bm_7', text: 'Apólices impressas do Seguro Viagem obrigatório (cobertura internacional)', completed: false, notes: '', priority: 'high' }
  ],
  empadronamiento: [
    { id: 'emp_1', text: 'Passaportes válidos de todos os membros que residirão no imóvel', completed: false, notes: '', priority: 'high' },
    { id: 'emp_2', text: 'Contrato de aluguel assinado OU declaração autorizada de moradia pelo proprietário', completed: false, notes: '', priority: 'high' },
    { id: 'emp_3', text: 'Cópia legível do documento de identidade do locador/titular', completed: false, notes: '', priority: 'high' },
    { id: 'emp_4', text: 'Último recibo de serviços (luz, água, gás) do imóvel caso solicitado pelo órgão de registro local', completed: false, notes: '', priority: 'medium' },
    { id: 'emp_5', text: 'Certidão de nascimento dos filhos apostilada e traduzida (para provar filiação)', completed: false, notes: '', priority: 'high' },
    { id: 'emp_6', text: 'Formulário de solicitação de registro municipal de residência preenchido e assinado', completed: false, notes: '', priority: 'medium' }
  ],
  escola: [
    { id: 'esc_1', text: 'Passaporte físico da criança', completed: false, notes: '', priority: 'high' },
    { id: 'esc_2', text: 'Certidão de nascimento da criança apostilada e traduzida', completed: false, notes: '', priority: 'high' },
    { id: 'esc_3', text: 'Certificado de Registro de Residência atualizado (registro municipal de moradia)', completed: false, notes: '', priority: 'high' },
    { id: 'esc_4', text: 'Caderneta de vacinação brasileira (com tradução ou adaptada por médico do destino)', completed: false, notes: '', priority: 'high' },
    { id: 'esc_5', text: 'Declaração de transferência ou Histórico Escolar da escola anterior no Brasil', completed: false, notes: '', priority: 'medium' },
    { id: 'esc_6', text: 'Fotos de tamanho padrão da criança para cadastro escolar', completed: false, notes: '', priority: 'medium' }
  ],
  regularizacao_2026: [
    { id: 'reg_1', text: 'Cópia completa e legível de todas as páginas do passaporte (mesmo caducado)', completed: false, notes: '', priority: 'high' },
    { id: 'reg_2', text: 'Certificado de Antecedentes Criminais do Brasil (apostilado e traduzido dentro da validade)', completed: false, notes: '', priority: 'high' },
    { id: 'reg_3', text: 'Certificado de Registro de Residência Histórico (comprova o tempo acumulado no município)', completed: false, notes: '', priority: 'high' },
    { id: 'reg_4', text: 'Faturas de serviços de utilidade pública em seu nome (luz, água, internet, gás)', completed: false, notes: '', priority: 'high' },
    { id: 'reg_5', text: 'Histórico de consultas e prontuários médicos obtidos na rede de saúde de {destino}', completed: false, notes: '', priority: 'medium' },
    { id: 'reg_6', text: 'Extratos de contas bancárias e comprovantes de compras locais com cartões nominativos no destino', completed: false, notes: '', priority: 'medium' },
    { id: 'reg_7', text: 'Comprovantes de matrícula escolar e boletins dos filhos (prova robusta de núcleo familiar no destino)', completed: false, notes: '', priority: 'high' },
    { id: 'reg_8', text: 'Contrato de trabalho com entrada em vigor condicionada à autorização de residência', completed: false, notes: '', priority: 'medium' },
    { id: 'reg_9', text: 'Relatório social de inserção ou certificação de vulnerabilidade social (se aplicável)', completed: false, notes: '', priority: 'low' }
  ]
};

export const DEFAULT_FINANCIAL_EXPENSES: FinancialExpense[] = [
  { id: 'fe_1', description: 'Taxas para emissão de novos passaportes (família)', category: 'documentos', categoryLabel: 'Documentos', estimated: 1000, real: 0, paid: false },
  { id: 'fe_2', description: 'Segundas vias de certidões atualizadas nos cartórios', category: 'documentos', categoryLabel: 'Documentos', estimated: 400, real: 0, paid: false },
  { id: 'fe_3', description: 'Apostilamento de Haia (cartórios de notas)', category: 'documentos', categoryLabel: 'Documentos', estimated: 800, real: 0, paid: false },
  { id: 'fe_4', description: 'Traduções juramentadas oficiais', category: 'documentos', categoryLabel: 'Documentos', estimated: 1500, real: 0, paid: false },
  { id: 'fe_5', description: 'Passagens aéreas internacionais', category: 'passagens', categoryLabel: 'Passagens', estimated: 12000, real: 0, paid: false },
  { id: 'fe_6', description: 'Seguro viagem internacional obrigatório (Schengen)', category: 'passagens', categoryLabel: 'Passagens', estimated: 1800, real: 0, paid: false },
  { id: 'fe_7', description: 'Primeiro mês de aluguel no destino ({destino})', category: 'moradia', categoryLabel: 'Moradia / Instalação', estimated: 5500, real: 0, paid: false },
  { id: 'fe_8', description: 'Depósito de caução do aluguel (fiança para garantia)', category: 'moradia', categoryLabel: 'Moradia / Instalação', estimated: 8000, real: 0, paid: false },
  { id: 'fe_9', description: 'Compras iniciais de supermercado e utensílios básicos', category: 'moradia', categoryLabel: 'Moradia / Instalação', estimated: 2500, real: 0, paid: false },
  { id: 'fe_10', description: 'Fundo de reserva de emergência (mínimo recomendado para {destino})', category: 'reserva', categoryLabel: 'Fundo de Reserva', estimated: 18000, real: 0, paid: false },
  { id: 'fe_11', description: 'Gastos adicionais (chips SIM, transporte local, imprevistos)', category: 'outros', categoryLabel: 'Outros Custos', estimated: 1200, real: 0, paid: false }
];

export const DEFAULT_TIMELINE_TASKS: TimelineTask[] = [
  { id: 'tt_1', timeframe: '6_meses', timeframeLabel: '6 Meses Antes', title: 'Verificação e Emissão de Passaportes', description: 'Garantir que todos os passaportes da família tenham no mínimo 1 ano de validade restante na data da viagem. Solicitar renovações se necessário.', completed: false, priority: 'high' },
  { id: 'tt_2', timeframe: '6_meses', timeframeLabel: '6 Meses Antes', title: 'Solicitação de Segundas Vias de Certidões', description: 'Pedir segundas vias recentes (inteiro teor é recomendado por assessores) das certidões de nascimento de todos e de casamento nos cartórios do Brasil.', completed: false, priority: 'high' },
  { id: 'tt_3', timeframe: '6_meses', timeframeLabel: '6 Meses Antes', title: 'Início da Poupança Mensal para a Viagem', description: 'Definir metas de poupança financeira no planejador, comprando a moeda local de {destino} mensalmente para amortecer flutuações.', completed: false, priority: 'medium' },
  
  { id: 'tt_4', timeframe: '3_meses', timeframeLabel: '3 Meses Antes', title: 'Apostilamento de Haia dos Documentos', description: 'Levar as certidões brasileiras originais de nascimento e casamento a um cartório habilitado para realizar o apostilamento de Haia.', completed: false, priority: 'high' },
  { id: 'tt_5', timeframe: '3_meses', timeframeLabel: '3 Meses Antes', title: 'Contratação das Traduções Juramentadas', description: 'Enviar os documentos apostilados para tradutores juramentados e agendar as entregas para {destino}.', completed: false, priority: 'high' },
  { id: 'tt_6', timeframe: '3_meses', timeframeLabel: '3 Meses Antes', title: 'Pesquisa Ativa de Moradia e Escolas', description: 'Pesquisar o custo de moradia e a disponibilidade de escolas públicas ou credenciadas na região ou cidade de {destino}.', completed: false, priority: 'medium' },
  
  { id: 'tt_7', timeframe: '1_mes', timeframeLabel: '1 Mês Antes', title: 'Emissão e Apostila de Antecedentes Criminais', description: 'Emitir a certidão de antecedentes criminais online no site da Polícia Federal e solicitar o apostilamento de Haia imediatamente (validade máxima de 90 dias).', completed: false, priority: 'high' },
  { id: 'tt_8', timeframe: '1_mes', timeframeLabel: '1 Mês Antes', title: 'Compra de Passagens e Seguro Viagem', description: 'Garantir as passagens aéreas e a contratação do seguro internacional obrigatório compatível com {destino}.', completed: false, priority: 'high' },
  { id: 'tt_9', timeframe: '1_mes', timeframeLabel: '1 Mês Antes', title: 'Organizar Pasta de Bagagem de Mão', description: 'Imprimir passagens, reservas, apólices, e guardar todos os originais civis apostilados e traduzidos de forma segura e de fácil acesso.', completed: false, priority: 'high' },
  
  { id: 'tt_10', timeframe: 'chegada', timeframeLabel: 'Na Chegada', title: 'Aluguel de Imóvel Estável', description: 'Visitar imóveis locais, assinar contrato de arrendamento e certificar-se de obter a documentação e permissão do locador para se registrar.', completed: false, priority: 'high' },
  { id: 'tt_11', timeframe: 'chegada', timeframeLabel: 'Na Chegada', title: 'Realizar Registro de Residência', description: 'Solicitar atendimento no órgão municipal de sua cidade em {destino} e registrar a residência oficial de todos os membros da família.', completed: false, priority: 'high' },
  { id: 'tt_12', timeframe: 'chegada', timeframeLabel: 'Na Chegada', title: 'Efetuar Matrícula Escolar da Filha', description: 'Dirigir-se ao órgão de educação local ou à escola atribuída para formalizar a matrícula obrigatória baseando-se no registro de residência.', completed: false, priority: 'high' },
  { id: 'tt_13', timeframe: 'chegada', timeframeLabel: 'Na Chegada', title: 'Comprar Chip de Operadora Local', description: 'Garantir chips SIM locais de {destino} com pacote de internet ativa para ligações locais, agendamentos e e-mails oficiais.', completed: false, priority: 'medium' },
  
  { id: 'tt_14', timeframe: 'regularizacao', timeframeLabel: 'Rumo à Regularização', title: 'Preservar Provas de Presença Continuada', description: 'Guardar faturas, tíquetes de compras normativas em supermercados, faturas de telefone, extratos bancários com compras presenciais e receitas médicas em {destino}.', completed: false, priority: 'high' },
  { id: 'tt_15', timeframe: 'regularizacao', timeframeLabel: 'Rumo à Regularização', title: 'Manter Registro de Residência Ativo e Contínuo', description: 'Garantir que o registro de residência municipal em {destino} esteja sempre atualizado. O registro contínuo é a prova rainha do tempo de residência.', completed: false, priority: 'high' },
  { id: 'tt_16', timeframe: 'regularizacao', timeframeLabel: 'Rumo à Regularização', title: 'Consultar Assessoria Jurídica de Imigração', description: 'Agendar consulta com advogados especializados ou ONGs de apoio a imigrantes para monitorar as diretrizes oficiais atualizadas para o ano {ano}.', completed: false, priority: 'medium' }
];

export const DEFAULT_HOUSING: HousingDetails = {
  address: '',
  landlordName: '',
  landlordDocument: '',
  proofType: '',
  rentValue: '',
  depositValue: '',
  notes: ''
};

export const DEFAULT_PACKING_CHECKLISTS: { [key: string]: any[] } = {
  malas_roupas: [
    { id: 'mr_1', text: 'Casacos de frio adequados ao clima do destino', completed: false, notes: '', priority: 'high' },
    { id: 'mr_2', text: 'Roupas íntimas e meias para pelo menos 15 dias', completed: false, notes: '', priority: 'high' },
    { id: 'mr_3', text: 'Calçados confortáveis para caminhada (no destino caminha-se muito)', completed: false, notes: '', priority: 'high' },
    { id: 'mr_4', text: 'Roupas casuais de transição e de calor de acordo com a época da viagem', completed: false, notes: '', priority: 'medium' },
    { id: 'mr_5', text: 'Toalhas compactas de microfibra e jogo de lençol básico de viagem', completed: false, notes: '', priority: 'low' },
    { id: 'mr_6', text: 'Sacos organizadores a vácuo (otimizam muito espaço nas malas despachadas)', completed: false, notes: '', priority: 'medium' }
  ],
  eletronicos: [
    { id: 'el_1', text: 'Adaptadores de tomada padrão compatíveis com o destino', completed: false, notes: '', priority: 'high' },
    { id: 'el_2', text: 'Notebook de trabalho e carregadores de todos os aparelhos', completed: false, notes: '', priority: 'high' },
    { id: 'el_3', text: 'Power bank (bateria portátil de carga rápida para o dia da viagem)', completed: false, notes: '', priority: 'high' },
    { id: 'el_4', text: 'Smartphones desbloqueados para receber chips SIM locais', completed: false, notes: '', priority: 'high' },
    { id: 'el_5', text: 'HD Externo / Backup em nuvem com fotos e arquivos críticos digitalizados', completed: false, notes: '', priority: 'high' },
    { id: 'el_6', text: 'Fones de ouvido com cancelamento de ruído para o voo longo', completed: false, notes: '', priority: 'medium' }
  ],
  documentos_valores: [
    { id: 'dv_1', text: 'Passaporte físico original válido de todos os viajantes', completed: false, notes: '', priority: 'high' },
    { id: 'dv_2', text: 'Pasta física sanfonada com todos os documentos originais apostilados e traduzidos', completed: false, notes: '', priority: 'high' },
    { id: 'dv_3', text: 'Dinheiro em espécie (moeda do destino) e cartões internacionais habilitados', completed: false, notes: '', priority: 'high' },
    { id: 'dv_4', text: 'Seguro Viagem obrigatório impresso', completed: false, notes: '', priority: 'high' },
    { id: 'dv_5', text: 'Passagens aéreas impressas e reservas de hospedagem confirmadas', completed: false, notes: '', priority: 'high' },
    { id: 'dv_6', text: 'CNH brasileira válida se for alugar carro ou dirigir no destino', completed: false, notes: '', priority: 'medium' }
  ],
  saude_higiene: [
    { id: 'sh_1', text: 'Medicamentos de uso contínuo para 3 a 6 meses com receitas médicas', completed: false, notes: '', priority: 'high' },
    { id: 'sh_2', text: 'Kit básico de farmácia (analgésicos, antialérgicos, remédios de estômago e curativos)', completed: false, notes: '', priority: 'high' },
    { id: 'sh_3', text: 'Necessaire com itens de higiene pessoal em frascos menores que 100ml (para bagagem de mão)', completed: false, notes: '', priority: 'high' },
    { id: 'sh_4', text: 'Óculos de grau de reserva e receita recente do oftalmologista', completed: false, notes: '', priority: 'medium' },
    { id: 'sh_5', text: 'Protetor solar e hidratante labial adequado ao clima local de {destino}', completed: false, notes: '', priority: 'medium' }
  ],
  itens_pessoais: [
    { id: 'ip_1', text: 'Fotos de tamanho padrão de toda a família para trâmites presenciais se necessário', completed: false, notes: '', priority: 'medium' },
    { id: 'ip_2', text: 'Brinquedos compactos, livros e distrações para as crianças no voo', completed: false, notes: '', priority: 'high' },
    { id: 'ip_3', text: 'Almofada inflável de pescoço e máscara de dormir para a viagem', completed: false, notes: '', priority: 'low' },
    { id: 'ip_4', text: 'Pequenos itens de valor sentimental (fotos de família, lembranças leves)', completed: false, notes: '', priority: 'low' }
  ]
};

export const INITIAL_STATE: AppState = {
  familyMembers: DEFAULT_FAMILY_MEMBERS,
  checklists: DEFAULT_CHECKLISTS,
  financialExpenses: DEFAULT_FINANCIAL_EXPENSES,
  timelineTasks: DEFAULT_TIMELINE_TASKS,
  housing: DEFAULT_HOUSING,
  generalNotes: '',
  currency: 'BRL',
  packingChecklists: DEFAULT_PACKING_CHECKLISTS,
  destinationCountry: '',
  travelYear: '',
  tours: [],
  events: [],
  googleClientId: '',
  googleCalendarId: '',
  googleSyncEnabled: false,
  exchangeRates: { EUR: 6.20, USD: 5.50 }
};

export function interpolateText(text: string, country?: string, year?: string): string {
  const dest = country?.trim() || 'o país de destino';
  const y = year?.trim() || 'Ano da Viagem';
  return text
    .replace(/{destino}/g, dest)
    .replace(/{ano}/g, y);
}
