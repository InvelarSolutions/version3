import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

// Get environment variables with proper Vite prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging for environment variables
console.log('🔍 Environment Check:');
console.log('- VITE_SUPABASE_URL exists:', !!supabaseUrl);
console.log('- VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log('- URL starts with https:', supabaseUrl.startsWith('https://'));
console.log('- Key starts with eyJ:', supabaseAnonKey.startsWith('eyJ'));

// Check if we have placeholder values or empty values
const hasPlaceholderValues = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'your_supabase_project_url' ||
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseUrl.includes('your_supabase') ||
  supabaseAnonKey.includes('your_supabase') ||
  supabaseUrl === 'https://your-project.supabase.co' ||
  supabaseAnonKey.length < 100; // Anon keys are typically much longer

// Validate environment variables
if (hasPlaceholderValues) {
  console.error('❌ Supabase environment variables are not configured properly.');
  console.error('Current values:');
  console.error('- VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase project credentials.');
}

// Create client with additional options for better error handling
export const supabase = !hasPlaceholderValues && supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Log connection status
if (supabase) {
  console.log('✅ Supabase client created successfully');
} else {
  console.error('❌ Supabase client could not be created - check environment variables');
}

// Contact submission type for backward compatibility
export interface ContactSubmission {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  newsletter_subscription: boolean;
  created_at?: string;
}

// Helper functions for contact submission management
export const contactService = {
  // Test basic connection
  async testConnection() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please check your environment variables.');
    }

    console.log('🔍 Testing Supabase connection...');
    
    try {
      // Test 1: Basic health check
      const { data, error, count } = await supabase
        .from('contact_submissions')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Connection test failed:', error);
        throw error;
      }

      console.log('✅ Connection test successful');
      console.log(`📊 Total records: ${count || 0}`);
      return true;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      throw error;
    }
  },

  // Insert a new contact submission
  async createContactSubmission(submissionData: Database['public']['Tables']['contact_submissions']['Insert']) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please check your environment variables.');
    }

    console.log('📝 Creating contact submission:', submissionData);

    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw new Error(`Failed to create contact submission: ${error.message}`);
      }

      console.log('✅ Contact submission created:', data);
      return data;
    } catch (error) {
      console.error('❌ Create submission error:', error);
      throw error;
    }
  },

  // Get all contact submissions (admin only)
  async getAllContactSubmissions() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contact submissions: ${error.message}`);
    }

    return data;
  },

  // Get contact submissions with pagination
  async getContactSubmissionsPaginated(page: number = 1, limit: number = 50) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch contact submissions: ${error.message}`);
    }

    return {
      data,
      count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  },

  // Search contact submissions by email or name
  async searchContactSubmissions(query: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search contact submissions: ${error.message}`);
    }

    return data;
  },

  // Get contact submissions by newsletter subscription status
  async getContactSubmissionsByNewsletterStatus(subscribed: boolean) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('newsletter_subscription', subscribed)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contact submissions by newsletter status: ${error.message}`);
    }

    return data;
  },

  // Get contact submission statistics
  async getContactSubmissionStats() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const [totalResult, newsletterResult, recentResult] = await Promise.all([
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('newsletter_subscription', true),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      total: totalResult.count || 0,
      newsletterSubscribers: newsletterResult.count || 0,
      recentSubmissions: recentResult.count || 0
    };
  }
};