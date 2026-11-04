import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.warn('[jk-store] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in .env')
}

// Public client. Only the ANON key is used here; all writes that matter go
// through serverless functions with the service role key.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true },
})
