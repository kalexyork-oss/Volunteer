import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error('Missing Supabase env vars. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
