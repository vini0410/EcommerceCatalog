import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export let supabase: ReturnType<typeof createClient> | undefined;

if (supabaseUrl && supabaseAnonKey) {
  // Cria e exporta o cliente Supabase
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not defined. Supabase client will not be initialized.');
}
