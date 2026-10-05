import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim()

let parsedSupabaseUrl
try {
  parsedSupabaseUrl = supabaseUrl ? new URL(supabaseUrl) : undefined
} catch {
  parsedSupabaseUrl = undefined
}

const isValid =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  Boolean(parsedSupabaseUrl) &&
  ["http:", "https:"].includes(parsedSupabaseUrl?.protocol ?? "")

if (!isValid) {
  console.error(
    "[Kavach] Supabase configuration is missing or invalid.\n" +
      "  VITE_SUPABASE_URL  = " +
      (supabaseUrl ? supabaseUrl : "(not set)") +
      "\n" +
      "  VITE_SUPABASE_ANON_KEY = " +
      (supabaseAnonKey
        ? "(set, " + supabaseAnonKey.length + " chars)"
        : "(not set)") +
      "\n" +
      "  To fix: create a Supabase project at https://supabase.com, copy the Project URL and anon key,\n" +
      "  set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart Vite.",
  )
}

// Export a flag so AuthContext can show a proper error instead of crashing
export const supabaseConfigured = isValid

// Always create a client — even with placeholder values so modules can import it.
// The client will fail on actual requests when credentials are wrong.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
)
