import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we have placeholder values or empty values
const hasPlaceholderValues = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'your_supabase_project_url' ||
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseUrl.includes('your_supabase') ||
  supabaseAnonKey.includes('your_supabase');

// Validate environment variables
if (hasPlaceholderValues) {
  console.warn('Supabase environment variables are not configured properly. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file with your actual Supabase project credentials.');
}

// Only create client if we have valid values
export const supabase = !hasPlaceholderValues && supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// Legacy type for backward compatibility
export interface ContactSubmission {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  newsletter_subscription: boolean;
  created_at?: string;
}

// Helper functions for lead management
export const leadService = {
  // Insert a new lead
  async createLead(leadData: Database['public']['Tables']['leads']['Insert']) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return data;
  },

  // Get all leads (admin only)
  async getAllLeads() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return data;
  },

  // Get leads with pagination
  async getLeadsPaginated(page: number = 1, limit: number = 50) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return {
      data,
      count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  },

  // Search leads by email or name
  async searchLeads(query: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search leads: ${error.message}`);
    }

    return data;
  },

  // Update a lead
  async updateLead(id: string, updates: Database['public']['Tables']['leads']['Update']) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }

    return data;
  },

  // Delete a lead
  async deleteLead(id: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete lead: ${error.message}`);
    }

    return true;
  },

  // Get leads by newsletter subscription status
  async getLeadsByNewsletterStatus(subscribed: boolean) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('newsletter_signup', subscribed)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch leads by newsletter status: ${error.message}`);
    }

    return data;
  },

  // Get leads statistics
  async getLeadsStats() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const [totalResult, newsletterResult, recentResult] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('newsletter_signup', true),
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      total: totalResult.count || 0,
      newsletterSubscribers: newsletterResult.count || 0,
      recentLeads: recentResult.count || 0
    };
  }
};