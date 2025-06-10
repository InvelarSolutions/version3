// Airtable API integration
interface AirtableRecord {
  fields: Record<string, any>;
}

interface AirtableResponse {
  records: Array<{
    id: string;
    fields: Record<string, any>;
    createdTime: string;
  }>;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  industry?: string;
  additionalNotes?: string;
  newsletterSubscription: boolean;
}

// Field mapping configurations - try different formats
const FIELD_MAPPINGS = [
  // Format 1: Title Case with spaces (original)
  {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    companyName: 'Company Name',
    industry: 'Industry',
    additionalNotes: 'Additional Notes',
    newsletterSubscription: 'Newsletter Subscription',
    submissionDate: 'Submission Date'
  },
  // Format 2: snake_case (matches database)
  {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    companyName: 'company_name',
    industry: 'industry',
    additionalNotes: 'additional_notes',
    newsletterSubscription: 'newsletter_subscription',
    submissionDate: 'created_at'
  },
  // Format 3: camelCase
  {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    companyName: 'companyName',
    industry: 'industry',
    additionalNotes: 'additionalNotes',
    newsletterSubscription: 'newsletterSubscription',
    submissionDate: 'submissionDate'
  },
  // Format 4: lowercase with spaces
  {
    firstName: 'first name',
    lastName: 'last name',
    email: 'email',
    phone: 'phone',
    companyName: 'company name',
    industry: 'industry',
    additionalNotes: 'additional notes',
    newsletterSubscription: 'newsletter subscription',
    submissionDate: 'submission date'
  }
];

class AirtableService {
  private apiKey: string;
  private baseId: string;
  private tableId: string;
  private baseUrl: string;
  private fieldMapping: Record<string, string> | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || '';
    this.baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appOjOMHTayU1oZLJ';
    this.tableId = import.meta.env.VITE_AIRTABLE_TABLE_ID || 'tblhpwqJMeAIETi1v';
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}`;

    if (!this.apiKey) {
      console.warn('Airtable API key not found. Please set VITE_AIRTABLE_API_KEY in your environment variables.');
    }
  }

  private validateApiKey(): boolean {
    if (!this.apiKey || this.apiKey === 'your_airtable_api_key') {
      throw new Error('Airtable API key is not configured. Please set VITE_AIRTABLE_API_KEY in your environment variables.');
    }
    return true;
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters except + and spaces
    const cleaned = phone.replace(/[^\d\s\+\-\(\)]/g, '');
    return cleaned.trim();
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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

  // Discover the correct field mapping by testing different formats
  private async discoverFieldMapping(): Promise<Record<string, string>> {
    if (this.fieldMapping) {
      return this.fieldMapping;
    }

    console.log('🔍 Discovering Airtable field mapping...');

    // First, try to get the table schema
    try {
      const response = await fetch(`${this.baseUrl}?maxRecords=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AirtableResponse = await response.json();
        if (data.records && data.records.length > 0) {
          const availableFields = Object.keys(data.records[0].fields);
          console.log('📋 Available Airtable fields:', availableFields);

          // Try to match fields with our mappings
          for (const mapping of FIELD_MAPPINGS) {
            const requiredFields = [mapping.firstName, mapping.lastName, mapping.email, mapping.phone];
            const matchingFields = requiredFields.filter(field => availableFields.includes(field));
            
            if (matchingFields.length >= 3) { // At least 3 required fields match
              console.log('✅ Found matching field mapping:', mapping);
              this.fieldMapping = mapping;
              return mapping;
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch table schema, will try default mapping');
    }

    // Fallback to the first mapping (original format)
    console.log('📝 Using default field mapping');
    this.fieldMapping = FIELD_MAPPINGS[0];
    return this.fieldMapping;
  }

  private async createRecord(data: ContactFormData, mapping: Record<string, string>): Promise<AirtableRecord> {
    const record: AirtableRecord = {
      fields: {}
    };

    // Map the form data to Airtable fields
    record.fields[mapping.firstName] = data.firstName.trim();
    record.fields[mapping.lastName] = data.lastName.trim();
    record.fields[mapping.email] = data.email.trim().toLowerCase();
    record.fields[mapping.phone] = this.formatPhoneNumber(data.phone);
    
    // Optional fields
    if (data.companyName?.trim()) {
      record.fields[mapping.companyName] = data.companyName.trim();
    }
    
    if (data.industry) {
      record.fields[mapping.industry] = data.industry;
    }
    
    if (data.additionalNotes?.trim()) {
      record.fields[mapping.additionalNotes] = data.additionalNotes.trim();
    }
    
    record.fields[mapping.newsletterSubscription] = data.newsletterSubscription || false;
    record.fields[mapping.submissionDate] = new Date().toISOString();

    return record;
  }

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // Validate API configuration
      this.validateApiKey();

      // Validate form data
      this.validateFormData(data);

      // Discover the correct field mapping
      const mapping = await this.discoverFieldMapping();

      // Prepare the record for Airtable
      const record = await this.createRecord(data, mapping);

      console.log('📤 Submitting to Airtable with mapping:', mapping);
      console.log('📤 Record data:', record);

      // Make the API request to Airtable
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [record]
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Airtable API Error:', response.status, errorData);
        
        // If we get a field name error, try the next mapping
        if (response.status === 422 && errorData.includes('Unknown field name')) {
          console.log('🔄 Field name error detected, trying alternative mappings...');
          
          // Reset field mapping and try alternatives
          this.fieldMapping = null;
          
          for (let i = 1; i < FIELD_MAPPINGS.length; i++) {
            try {
              console.log(`🔄 Trying mapping ${i + 1}:`, FIELD_MAPPINGS[i]);
              const alternativeRecord = await this.createRecord(data, FIELD_MAPPINGS[i]);
              
              const retryResponse = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${this.apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  records: [alternativeRecord]
                }),
              });

              if (retryResponse.ok) {
                const result: AirtableResponse = await retryResponse.json();
                console.log('✅ Alternative mapping successful:', FIELD_MAPPINGS[i]);
                this.fieldMapping = FIELD_MAPPINGS[i]; // Cache successful mapping
                return {
                  success: true,
                  recordId: result.records[0]?.id
                };
              }
            } catch (retryError) {
              console.log(`❌ Mapping ${i + 1} failed:`, retryError);
              continue;
            }
          }
        }
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Airtable configuration.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your Airtable permissions.');
        } else if (response.status === 404) {
          throw new Error('Airtable base or table not found. Please check your configuration.');
        } else if (response.status === 422) {
          // Parse the error to provide more specific feedback
          try {
            const errorObj = JSON.parse(errorData);
            if (errorObj.error?.message?.includes('Unknown field name')) {
              throw new Error(`Field mapping error: ${errorObj.error.message}. Please check your Airtable table field names.`);
            }
          } catch (parseError) {
            // If we can't parse the error, use a generic message
          }
          throw new Error('Invalid data format. Please check your Airtable table field names match the expected format.');
        } else {
          throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
      }

      const result: AirtableResponse = await response.json();
      console.log('✅ Airtable submission successful:', result);

      return {
        success: true,
        recordId: result.records[0]?.id
      };

    } catch (error) {
      console.error('❌ Contact form submission failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; availableFields?: string[] }> {
    try {
      this.validateApiKey();

      const response = await fetch(`${this.baseUrl}?maxRecords=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }

      const data: AirtableResponse = await response.json();
      const availableFields = data.records?.[0] ? Object.keys(data.records[0].fields) : [];

      return {
        success: true,
        message: 'Airtable connection successful',
        availableFields
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Get configuration info for debugging
  getConfig(): { baseId: string; tableId: string; hasApiKey: boolean; currentMapping?: Record<string, string> } {
    return {
      baseId: this.baseId,
      tableId: this.tableId,
      hasApiKey: !!this.apiKey && this.apiKey !== 'your_airtable_api_key',
      currentMapping: this.fieldMapping || undefined
    };
  }
}

// Export singleton instance
export const airtableService = new AirtableService();

// Export types for use in components
export type { ContactFormData };