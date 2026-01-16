import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite, with fallback to hardcoded strings for dev convenience
// We use optional chaining to prevent crashes if import.meta.env is undefined in certain environments
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://nmmrdfqbewfnqtvulgex.supabase.co';
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dy_3IegxsybjUDa36jixjQ_UYQ2PuhN'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'ziezan-station-pos' },
  },
});