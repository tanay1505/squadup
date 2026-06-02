import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,      // automatically refresh before expiry
    persistSession: true,         // keep session across page reloads
    detectSessionInUrl: true,     // handle OAuth redirects
  }
})