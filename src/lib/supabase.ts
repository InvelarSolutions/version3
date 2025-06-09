import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not configured properly.')
  console.error('Current values:')
  console.error(`- VITE_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}`)
  console.error(`- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey || 'NOT SET'}`)
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase project credentials.')
}

let supabase: ReturnType<typeof createClient<Database>> | null = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  } else {
    console.error('❌ Supabase client could not be created - check environment variables')
  }
} catch (error) {
  console.error('❌ Error creating Supabase client:', error)
}

export { supabase }