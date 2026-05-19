import { createClient } from '@supabase/supabase-js'

export const LIST_ID =
  (import.meta.env.VITE_LIST_ID || '').trim() || 'our-couple-list'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null

/** @param {import('@supabase/supabase-js').PostgrestError | null} error */
export function formatDbError(error) {
  if (!error) return null
  return error.message || 'Something went wrong'
}
