import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Durante prerender estático as env vars não existem — retorna cliente dummy
    _supabase = createClient("https://placeholder.supabase.co", "placeholder");
    return _supabase;
  }
  _supabase = createClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
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
