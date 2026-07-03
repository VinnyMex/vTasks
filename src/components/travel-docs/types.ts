export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  cost?: number;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  iconName: string; // Used to dynamically map Lucide icons
  items: ChecklistItem[];
}

export interface FamilyMember {
  id: string;
  role: 'principal' | 'conjuge' | 'filho' | 'outro';
  roleLabel: string;
  name: string;
  passportNumber: string;
  passportExpiry: string;
  cpf: string;
  rg: string;
  birthDate?: string;
  contact?: string;
  notes?: string;
}

export interface FinancialExpense {
  id: string;
  description: string;
  category: 'documentos' | 'passagens' | 'moradia' | 'reserva' | 'outros';
  categoryLabel: string;
  estimated: number;
  real: number;
  paid: boolean;
  notes?: string;
}

export interface TimelineTask {
  id: string;
  timeframe: '6_meses' | '3_meses' | '1_mes' | 'chegada' | 'regularizacao';
  timeframeLabel: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface HousingDetails {
  address: string;
  landlordName: string;
  landlordDocument: string;
  proofType: string;
  rentValue: string;
  depositValue: string;
  notes?: string;
}

export interface TourActivity {
  id: string;
  day: string;
  date?: string; // Formato YYYY-MM-DD para sincronizar com calendário
  time?: string;
  title: string;
  location?: string;
  cost?: number;
  status: 'planejado' | 'pago' | 'concluido';
  notes?: string;
  ticketAttached?: boolean;
}

export interface AppEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // Formato YYYY-MM-DD
  time?: string; // Formato HH:MM
  notifyOneDayBefore: boolean;
  googleEventId?: string;
  sourceType?: 'custom' | 'passport_expiry' | 'birthday' | 'tour';
  sourceId?: string;
}

export interface AppState {
  familyMembers: FamilyMember[];
  checklists: { [categoryId: string]: ChecklistItem[] };
  financialExpenses: FinancialExpense[];
  timelineTasks: TimelineTask[];
  housing: HousingDetails;
  generalNotes: string;
  currency: 'BRL' | 'EUR' | 'USD';
  packingChecklists?: { [categoryId: string]: ChecklistItem[] };
  destinationCountry?: string;
  travelYear?: string;
  tours?: TourActivity[];
  events?: AppEvent[];
  googleClientId?: string;
  googleCalendarId?: string;
  googleSyncEnabled?: boolean;
}
