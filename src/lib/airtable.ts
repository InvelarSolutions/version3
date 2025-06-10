// Airtable API integration using field IDs
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

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Field mapping using actual Airtable field IDs
const FIELD_IDS = {
  firstName: 'fld2yAX1BepyzcYxb',           // First Name
  lastName: 'fldnLyFGgejjoSTTd',            // Last Name
  email: 'fldqtGtICn9VQSmyT',               // Email Address
  phone: 'fldJkeLbcy9NtcBCY',               // Phone Number
  currentStatus: 'fldFRzOgZvS5kNfex',       // Current Status
  companyName: 'fldmdPJ6b8w9B45NF',         // Company Name
  industry: 'fld6IS6IersuxaV1B',            // Industry Type
  additionalNotes: 'fldWeqmLYt3MX1Wn5',     // Additional Notes
  newsletterSubscription: 'fldbAeIOCdQQm7JzG', // Newsletter Subscription Status
  creationTimestamp: 'fldtmLnCmbGEG8g5P',   // Creation Timestamp
  syncTimestamp: 'fldQZqbSsfJkfUfiw',       // Sync Timestamp
  lastUpdateTimestamp: 'fldlwObGh6kc1peJ4'  // Last Update Timestamp
};

class AirtableService {
  private apiKey: string;
  private baseId: string;
  private tableId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || 'pathdCnsO2NWzZNnO.b282f93d07ef47a2cb0186d26ffd8ddbc780729e9397553cfd73624b32a5ade0';
    this.baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appOjOMHTayU1oZLJ';
    this.tableId = import.meta.env.VITE_AIRTABLE_TABLE_ID || 'tblhpwqJMeAIETi1v';
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}`;

    if (!this.apiKey) {
      console.warn('Airtable API key not found. Please set VITE_AIRTABLE_API_KEY in your environment variables.');
    }
  }

  private validateApiKey(): boolean {
    if (!this.apiKey || this.apiKey === 'your_airtable_api_key') {
      throw new Error('Airtable API key is required. Please set VITE_AIRTABLE_API_KEY in your environment variables.');
    }

    // Validate API key format (Airtable personal access tokens start with 'pat')
    if (!this.apiKey.startsWith('pat') || this.apiKey.length < 20) {
      throw new Error('Invalid Airtable API key format. Please ensure you are using a valid personal access token.');
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

  private createRecord(data: ContactFormData): AirtableRecord {
    const currentTimestamp = new Date().toISOString();
    
    const record: AirtableRecord = {
      fields: {
        // Required fields using field IDs
        [FIELD_IDS.firstName]: data.firstName.trim(),
        [FIELD_IDS.lastName]: data.lastName.trim(),
        [FIELD_IDS.email]: data.email.trim().toLowerCase(),
        [FIELD_IDS.phone]: this.formatPhoneNumber(data.phone),
        
        // Set current status to indicate new submission
        [FIELD_IDS.currentStatus]: 'New Submission',
        
        // Optional fields using field IDs
        [FIELD_IDS.companyName]: data.companyName?.trim() || '',
        [FIELD_IDS.industry]: data.industry || '',
        [FIELD_IDS.additionalNotes]: data.additionalNotes?.trim() || '',
        [FIELD_IDS.newsletterSubscription]: data.newsletterSubscription || false,
        
        // Timestamps using field IDs
        [FIELD_IDS.creationTimestamp]: currentTimestamp,
        [FIELD_IDS.syncTimestamp]: currentTimestamp,
        [FIELD_IDS.lastUpdateTimestamp]: currentTimestamp
      }
    };

    return record;
  }

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // Validate API configuration
      this.validateApiKey();

      // Validate form data
      this.validateFormData(data);

      // Prepare the record for Airtable using field IDs
      const record = this.createRecord(data);

      console.log('📤 Submitting to Airtable with field IDs');
      console.log('📤 Record data:', record);

      // Make the API request to Airtable with proper headers
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
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
          // Parse the error to provide more specific feedback
          try {
            const errorObj = JSON.parse(errorData);
            if (errorObj.error?.message) {
              throw new Error(`Airtable validation error: ${errorObj.error.message}`);
            }
          } catch (parseError) {
            // If we can't parse the error, use a generic message
          }
          throw new Error('Invalid data format. Please check your form inputs and try again.');
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
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
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
  getConfig(): { baseId: string; tableId: string; hasApiKey: boolean; fieldMapping: typeof FIELD_IDS } {
    return {
      baseId: this.baseId,
      tableId: this.tableId,
      hasApiKey: !!this.apiKey && this.apiKey !== 'your_airtable_api_key',
      fieldMapping: FIELD_IDS
    };
  }
}

// Export singleton instance
export const airtableService = new AirtableService();

// Export types for use in components
export type { ContactFormData };