// Airtable API integration using backend API endpoint
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
  private apiEndpoint: string;

  constructor() {
    // Use public API endpoint that redirects to Netlify Functions
    this.apiEndpoint = '/api/airtable';
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

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async submitContactForm(data: ContactFormData): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // Validate form data
      this.validateFormData(data);

      console.log('📤 Submitting to Airtable via Netlify Functions');

      // Submit to Netlify Function
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          companyName: data.companyName?.trim() || '',
          industry: data.industry || '',
          additionalNotes: data.additionalNotes?.trim() || '',
          newsletterSubscription: data.newsletterSubscription || false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Netlify Function Error:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API configuration.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please contact support.');
        } else if (response.status === 422) {
          throw new Error('Invalid data format. Please check your form inputs and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again in a few moments.');
        } else {
          throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Submission successful:', result);

      return {
        success: true,
        recordId: result.recordId || result.id
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
      const response = await fetch(`/api/airtable/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Connection successful',
        availableFields: data.availableFields
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Get configuration info for debugging
  getConfig(): { apiEndpoint: string; hasApiKey: boolean; baseId: string; tableId: string } {
    return {
      apiEndpoint: this.apiEndpoint,
      hasApiKey: true, // Netlify Functions will have access to the environment variable
      baseId: 'appOjOMHTayU1oZLJ',
      tableId: 'tblhpwqJMeAIETi1v'
    };
  }
}

// Export singleton instance
export const airtableService = new AirtableService();

// Export types for use in components
export type { ContactFormData };