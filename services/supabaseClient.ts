import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nmmrdfqbewfnqtvulgex.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dy_3IegxsybjUDa36jixjQ_UYQ2PuhN'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'ziezan-station-pos' },
  },
});