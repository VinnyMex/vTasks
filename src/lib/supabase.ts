import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: { params: { eventsPerSecond: 10 } },
});

export type Task = {
  id: string;
  user_id?: string;
  project_id: string | null;
  content: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  position: number | null;
  created_at: string;
  updated_at?: string;
  updated_by?: string | null;
};

export type Note = {
  id: string;
  user_id?: string;
  project_id: string | null;
  title: string | null;
  content: string;
  type: string | null;
  created_at: string;
  updated_at?: string;
  updated_by?: string | null;
};

export type Project = {
  id: string;
  title: string;
  description: string | null;
  view_type: string | null;
  is_favorite: boolean | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  recipient: string | null;
  quantity: number | null;
  amount_brl: number | null;
  amount_eur: number | null;
  amount_usd: number | null;
  currency: "BRL" | "EUR" | "USD";
  category: string | null;
  date: string;
  link: string | null;
  created_at: string;
  updated_at?: string;
  updated_by?: string | null;
};
