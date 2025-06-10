// Airtable API integration
interface AirtableRecord {
  fields: {
    'First Name': string;
    'Last Name': string;
    'Email': string;
    'Phone': string;
    'Company Name'?: string;
    'Industry'?: string;
    'Additional Notes'?: string;
    'Newsletter Subscription': boolean;
    'Submission Date': string;
  };
}

interface AirtableResponse {
  records: Array<{
    id: string;
    fields: AirtableRecord['fields'];
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

class AirtableService {
  private apiKey: string;
  private baseId: string;
  private tableId: string;
  private baseUrl: string;

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

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // Validate API configuration
      this.validateApiKey();

      // Validate form data
      this.validateFormData(data);

      // Prepare the record for Airtable
      const record: AirtableRecord = {
        fields: {
          'First Name': data.firstName.trim(),
          'Last Name': data.lastName.trim(),
          'Email': data.email.trim().toLowerCase(),
          'Phone': this.formatPhoneNumber(data.phone),
          'Company Name': data.companyName?.trim() || '',
          'Industry': data.industry || '',
          'Additional Notes': data.additionalNotes?.trim() || '',
          'Newsletter Subscription': data.newsletterSubscription || false,
          'Submission Date': new Date().toISOString(),
        }
      };

      console.log('📤 Submitting to Airtable:', record);

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
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Airtable configuration.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your Airtable permissions.');
        } else if (response.status === 404) {
          throw new Error('Airtable base or table not found. Please check your configuration.');
        } else if (response.status === 422) {
          throw new Error('Invalid data format. Please check your form inputs.');
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

  async testConnection(): Promise<{ success: boolean; message: string }> {
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

      return {
        success: true,
        message: 'Airtable connection successful'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Get configuration info for debugging
  getConfig(): { baseId: string; tableId: string; hasApiKey: boolean } {
    return {
      baseId: this.baseId,
      tableId: this.tableId,
      hasApiKey: !!this.apiKey && this.apiKey !== 'your_airtable_api_key'
    };
  }
}

// Export singleton instance
export const airtableService = new AirtableService();

// Export types for use in components
export type { ContactFormData };