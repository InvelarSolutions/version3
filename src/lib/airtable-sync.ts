import { supabase } from './supabase';

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

interface SyncStats {
  totalSubmissions: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: string | null;
  recentLogs: SyncLog[];
}

class AirtableSyncService {
  private baseUrl: string;

  constructor() {
    // Use Supabase Edge Function endpoint for all Airtable operations
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync`;
  }

  private async makeEdgeFunctionRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
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

  async getSyncStats(): Promise<SyncStats> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Get total submissions count
      const { count: totalSubmissions, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true });

      if (submissionsError) {
        throw new Error(`Failed to fetch submissions count: ${submissionsError.message}`);
      }

      // Get sync statistics
      const { data: syncLogs, error: syncError } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (syncError) {
        throw new Error(`Failed to fetch sync logs: ${syncError.message}`);
      }

      const totalSyncs = syncLogs?.length || 0;
      const successfulSyncs = syncLogs?.filter(log => log.status === 'completed').length || 0;
      const failedSyncs = syncLogs?.filter(log => log.status === 'failed').length || 0;
      const lastSyncTime = syncLogs?.[0]?.completed_at || null;
      const recentLogs = syncLogs?.slice(0, 10) || [];

      return {
        totalSubmissions: totalSubmissions || 0,
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        lastSyncTime,
        recentLogs,
      };
    } catch (error) {
      throw new Error(`Failed to fetch sync stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async triggerManualSync(): Promise<SyncResult> {
    try {
      const result = await this.makeEdgeFunctionRequest('/sync', {
        method: 'POST',
        body: JSON.stringify({ type: 'manual' }),
      });

      return {
        ...result,
        lastSyncTime: new Date(result.lastSyncTime),
      };
    } catch (error) {
      throw new Error(`Manual sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.makeEdgeFunctionRequest('/test', {
        method: 'GET',
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }
}

export const airtableSyncService = new AirtableSyncService();