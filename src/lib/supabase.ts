import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  _client = createClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: false, // callback.tsx processa o hash manualmente
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _client;
}

// Exporta como getter para evitar criação durante SSR/prerender
export const supabase = {
  get auth()      { return getClient().auth; },
  get from()      { return getClient().from.bind(getClient()); },
  get channel()   { return getClient().channel.bind(getClient()); },
  get removeChannel() { return getClient().removeChannel.bind(getClient()); },
  get removeAllChannels() { return getClient().removeAllChannels.bind(getClient()); },
  get storage()   { return getClient().storage; },
  get functions() { return getClient().functions; },
  get rpc()       { return getClient().rpc.bind(getClient()); },
};

// Tipos básicos para exportação
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
  receipt_url: string | null;
  created_at: string;
  updated_at?: string;
  updated_by?: string | null;
};
