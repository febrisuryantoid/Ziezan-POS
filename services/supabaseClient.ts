import { createClient } from '@supabase/supabase-js';

// Fallback credentials from user input (ensures app works immediately)
const FALLBACK_URL = 'https://nmmrdfqbewfnqtvulgex.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbXJkZnFiZXdmbnF0dnVsZ2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIyNjAsImV4cCI6MjA4NDE1ODI2MH0.NXcOB9YrfVyTMX9k35hTIyLR-jyQva7gO5b1MEnD6mM';

// Use import.meta.env for Vite, but fallback to hardcoded values if missing
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'ziezan-station-pos' },
  },
});