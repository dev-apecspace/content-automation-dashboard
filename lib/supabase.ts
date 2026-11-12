import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Do NOT throw at import time: a throw here kills the whole server bundle
  // during `next build` prerendering and on boot whenever env is missing,
  // which used to blank every page (health-check -> deploy failure).
  // The placeholder client keeps the module importable; individual queries
  // fail at request time and are handled by their callers.
  console.error("Missing Supabase credentials - using placeholder client")
  supabase = createClient("https://placeholder.invalid", "placeholder-key")
}

export { supabase }
