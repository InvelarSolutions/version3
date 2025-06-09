import { supabase } from './supabase';

// Airtable configuration
const AIRTABLE_BASE_ID = 'appOjOMHTayU1oZLJ';
const AIRTABLE_TABLE_ID = 'tblhpwqJMeAIETi1v';
const AIRTABLE_VIEW_ID = 'viwEO6AvLQ641myYg';

interface AirtableRecord {
  id?: string;
  fields: {
    'First Name': string;
    'Last Name': string;
    'Email': string;
    'Phone': string;
    'Company Name'?: string;
    'Industry'?: string;
    'Additional Notes'?: string;
    'Newsletter Subscription': boolean;
    'Created At': string;
    'Supabase ID': string;
  };
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  errors: string[];
  lastSyncTime: Date;
}

interface SyncLog {
  id?: string;
  sync_type: 'manual' | 'scheduled' | 'realtime';
  records_processed: number;
  records_synced: number;
  records_failed: number;
  errors: string[];
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  created_at?: string;
}

class AirtableSyncService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.airtable.com/v0';

  constructor() {
    // In a real implementation, this would come from environment variables
    // For now, we'll simulate the service without actual API calls
    this.apiKey = process.env.AIRTABLE_API_KEY || null;
  }

  private async makeAirtableRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('Airtable API key not configured');
    }

    const url = `${this.baseUrl}/${AIRTABLE_BASE_ID}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private mapSupabaseToAirtable(record: any): AirtableRecord {
    return {
      fields: {
        'First Name': record.first_name,
        'Last Name': record.last_name,
        'Email': record.email,
        'Phone': record.phone,
        'Company Name': record.company_name || '',
        'Industry': record.industry || '',
        'Additional Notes': record.additional_notes || '',
        'Newsletter Subscription': record.newsletter_subscription || false,
        'Created At': record.created_at,
        'Supabase ID': record.id,
      },
    };
  }

  async syncToAirtable(records: any[]): Promise<SyncResult> {
    const startTime = new Date();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Check if API key is available
      if (!this.apiKey) {
        throw new Error('Airtable API key not configured. Please add AIRTABLE_API_KEY to environment variables.');
      }

      // Process records in batches of 10 (Airtable limit)
      const batchSize = 10;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        try {
          const airtableRecords = batch.map(record => this.mapSupabaseToAirtable(record));
          
          await this.makeAirtableRequest(AIRTABLE_TABLE_ID, {
            method: 'POST',
            body: JSON.stringify({
              records: airtableRecords,
            }),
          });

          recordsSynced += batch.length;
        } catch (error) {
          recordsFailed += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: recordsFailed === 0,
        recordsProcessed: records.length,
        recordsSynced,
        recordsFailed,
        errors,
        lastSyncTime: startTime,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: records.length,
        recordsSynced,
        recordsFailed: records.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: startTime,
      };
    }
  }

  async getUnsynced(): Promise<any[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // For now, get all records. In a real implementation, you'd track which records have been synced
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch unsynced records: ${error.message}`);
    }

    return data || [];
  }

  async logSync(syncData: Omit<SyncLog, 'id' | 'created_at'>): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('sync_logs')
      .insert([syncData]);

    if (error) {
      console.error('Failed to log sync:', error);
    }
  }

  async getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch sync logs: ${error.message}`);
    }

    return data || [];
  }

  async performFullSync(): Promise<SyncResult> {
    const startTime = new Date();
    
    // Log sync start
    const syncLogData: Omit<SyncLog, 'id' | 'created_at'> = {
      sync_type: 'manual',
      records_processed: 0,
      records_synced: 0,
      records_failed: 0,
      errors: [],
      started_at: startTime.toISOString(),
      status: 'running',
    };

    try {
      const records = await this.getUnsynced();
      syncLogData.records_processed = records.length;

      const result = await this.syncToAirtable(records);
      
      // Update sync log
      syncLogData.records_synced = result.recordsSynced;
      syncLogData.records_failed = result.recordsFailed;
      syncLogData.errors = result.errors;
      syncLogData.completed_at = new Date().toISOString();
      syncLogData.status = result.success ? 'completed' : 'failed';

      await this.logSync(syncLogData);

      return result;
    } catch (error) {
      // Log failed sync
      syncLogData.errors = [error instanceof Error ? error.message : 'Unknown error'];
      syncLogData.completed_at = new Date().toISOString();
      syncLogData.status = 'failed';
      
      await this.logSync(syncLogData);

      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Airtable API key not configured. Please add AIRTABLE_API_KEY to environment variables.',
        };
      }

      // Test connection by fetching base schema
      await this.makeAirtableRequest(`meta/bases/${AIRTABLE_BASE_ID}/tables`);
      
      return {
        success: true,
        message: 'Successfully connected to Airtable',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }
}

export const airtableSyncService = new AirtableSyncService();