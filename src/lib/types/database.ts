// Database type definitions for contact submissions

export interface ContactSubmission {
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
}

export interface ContactSubmissionInsert {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string | null;
  industry?: string | null;
  additional_notes?: string | null;
  newsletter_subscription?: boolean;
}

export interface Database {
  public: {
    Tables: {
      contact_submissions: {
        Row: ContactSubmission;
        Insert: ContactSubmissionInsert;
        Update: Partial<ContactSubmissionInsert>;
      };
    };
  };
}

// Industry options for the form
export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'construction', label: 'Construction' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' }
] as const;