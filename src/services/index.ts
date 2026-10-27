import { DemoAdapter } from './demo-adapter';
import { SupabaseAdapter } from './supabase-adapter';
import type { DataService } from './data-service';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const dataService: DataService =
  url && key ? new SupabaseAdapter(url, key) : new DemoAdapter();

export type { DataService };
