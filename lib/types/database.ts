// Database type definitions for the InvelarLeadList

export interface Lead {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  industry?: string | null;
  project_description?: string | null;
  preferred_contact_method?: 'email' | 'phone' | 'both' | 'no_preference' | null;
  estimated_budget?: number | null;
  timeline?: 'immediate' | '1-3_months' | '3-6_months' | '6-12_months' | 'over_12_months' | 'not_sure' | null;
  how_did_you_hear?: 'google_search' | 'social_media' | 'referral' | 'advertisement' | 'website' | 'other' | null;
  newsletter_signup: boolean;
}

export interface LeadInsert {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  job_title?: string;
  industry?: string;
  project_description?: string;
  preferred_contact_method?: 'email' | 'phone' | 'both' | 'no_preference';
  estimated_budget?: number;
  timeline?: 'immediate' | '1-3_months' | '3-6_months' | '6-12_months' | 'over_12_months' | 'not_sure';
  how_did_you_hear?: 'google_search' | 'social_media' | 'referral' | 'advertisement' | 'website' | 'other';
  newsletter_signup?: boolean;
}

// Industry options for contact form
export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal', label: 'Legal' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'media', label: 'Media' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' }
];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
      };
      contact_submissions: {
        Row: {
          id: string;
          created_at: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          company_name?: string | null;
          industry?: string | null;
          additional_notes?: string | null;
          newsletter_subscription: boolean;
        };
        Insert: {
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          company_name?: string | null;
          industry?: string | null;
          additional_notes?: string | null;
          newsletter_subscription?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          company_name?: string | null;
          industry?: string | null;
          additional_notes?: string | null;
          newsletter_subscription?: boolean;
        };
      };
    };
  };
}