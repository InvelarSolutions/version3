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

// Contact service for handling contact form submissions
export const contactService = {
  async createContactSubmission(data: Database['public']['Tables']['contact_submissions']['Insert']) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }
    
    const { data: result, error } = await supabase
      .from('contact_submissions')
      .insert(data)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return result
  },

  async testConnection() {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not initialized' }
    }
    
    try {
      const { error } = await supabase.from('contact_submissions').select('count').limit(1)
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  async getContactSubmissionStats() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }
    
    const { count, error } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    return { total: count || 0 }
  }
}

export { supabase }