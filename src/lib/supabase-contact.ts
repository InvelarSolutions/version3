import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  industry?: string;
  additionalNotes?: string;
  newsletterSubscription: boolean;
}

class SupabaseContactService {
  private validateFormData(data: ContactFormData): void {
    const errors: string[] = [];

    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // Validate form data
      this.validateFormData(data);

      console.log('📤 Submitting to Supabase contact_submissions table');

      // Prepare data for Supabase
      const submissionData = {
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        company_name: data.companyName?.trim() || null,
        industry: data.industry || null,
        additional_notes: data.additionalNotes?.trim() || null,
        newsletter_subscription: data.newsletterSubscription || false
      };

      // Insert into Supabase
      const { data: result, error } = await supabase
        .from('contact_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase Error:', error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          throw new Error('Database connection failed. Please try again.');
        } else if (error.code === '23505') {
          throw new Error('A submission with this email already exists.');
        } else if (error.code === '23514') {
          throw new Error('Invalid data format. Please check your inputs.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log('✅ Submission successful:', result.id);

      return {
        success: true,
        recordId: result.id
      };

    } catch (error) {
      console.error('❌ Contact form submission failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; recordCount?: number }> {
    try {
      // Test connection by counting records
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'Supabase connection successful',
        recordCount: count || 0
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Get configuration info for debugging
  getConfig(): { 
    supabaseUrl: string; 
    hasAnonKey: boolean; 
    isConfigured: boolean;
  } {
    const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
                        supabaseAnonKey !== 'your-anon-key' &&
                        supabaseUrl.includes('supabase.co');

    return {
      supabaseUrl,
      hasAnonKey: supabaseAnonKey !== 'your-anon-key',
      isConfigured
    };
  }
}

// Export singleton instance
export const contactService = new SupabaseContactService();

// Export types for use in components
export type { ContactFormData };