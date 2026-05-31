import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Task = {
  id: string;
  project_id: string | null;
  content: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high' | null;
  due_date: string | null;
  position: number | null;
  created_at: string;
};

export type Note = {
  id: string;
  project_id: string | null;
  title: string | null;
  content: string;
  type: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  description: string | null;
  view_type: string | null;
  is_favorite: boolean | null;
  created_at: string;
};
