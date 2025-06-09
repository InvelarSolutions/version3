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
  totalRecordsSynced: number;
  lastSyncAt: string | undefined;
  recentLogs: SyncLog[];
}

interface SyncConfig {
  realtime_sync_enabled: boolean;
  scheduled_sync_enabled: boolean;
  sync_batch_size: number;
  sync_rate_limit_ms: number;
  max_retry_attempts: number;
  log_retention_days: number;
}

interface SyncHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  recent_failures: number;
  stuck_syncs: number;
  last_successful_sync: string | null;
  check_timestamp: string;
}

class AirtableSyncService {
  private baseUrl: string;

  constructor() {
    // Use Supabase Edge Function endpoint for all Airtable operations
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync`;
  }

  private async makeEdgeFunctionRequest(endpoint: string = '', options: RequestInit = {}) {
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
      const totalRecordsSynced = syncLogs?.reduce((sum, log) => sum + (log.records_synced || 0), 0) || 0;
      const lastSyncAt = syncLogs?.[0]?.completed_at;
      const recentLogs = syncLogs?.slice(0, 10) || [];

      return {
        totalSubmissions: totalSubmissions || 0,
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        totalRecordsSynced,
        lastSyncAt,
        recentLogs,
      };
    } catch (error) {
      throw new Error(`Failed to fetch sync stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSyncConfig(): Promise<SyncConfig> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('sync_config')
      .select('config_key, config_value');

    if (error) {
      throw new Error(`Failed to fetch sync config: ${error.message}`);
    }

    // Convert array to object with default values
    const config: SyncConfig = {
      realtime_sync_enabled: true,
      scheduled_sync_enabled: true,
      sync_batch_size: 10,
      sync_rate_limit_ms: 200,
      max_retry_attempts: 3,
      log_retention_days: 30,
    };

    data?.forEach(item => {
      const key = item.config_key as keyof SyncConfig;
      if (key in config) {
        const value = item.config_value;
        if (typeof value === 'boolean') {
          (config as any)[key] = value;
        } else if (typeof value === 'number') {
          (config as any)[key] = value;
        } else if (typeof value === 'string') {
          // Handle string values that should be parsed
          if (key.includes('enabled')) {
            (config as any)[key] = value === 'true';
          } else {
            (config as any)[key] = parseInt(value) || (config as any)[key];
          }
        }
      }
    });

    return config;
  }

  async updateSyncConfig(key: keyof SyncConfig, value: any): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('sync_config')
      .upsert({
        config_key: key,
        config_value: value,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update sync config: ${error.message}`);
    }

    return true;
  }

  async getSyncHealthStatus(): Promise<SyncHealthStatus> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('sync_health_check');

    if (error) {
      throw new Error(`Failed to get sync health status: ${error.message}`);
    }

    return data;
  }

  async triggerManualSync(): Promise<SyncResult> {
    try {
      const result = await this.makeEdgeFunctionRequest('?type=manual', {
        method: 'POST',
      });

      return {
        success: result.success,
        recordsProcessed: result.records_processed || 0,
        recordsSynced: result.records_synced || 0,
        recordsFailed: result.records_failed || 0,
        errors: result.errors || [],
        lastSyncTime: new Date(),
      };
    } catch (error) {
      throw new Error(`Manual sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async triggerScheduledSync(): Promise<SyncResult> {
    try {
      const result = await this.makeEdgeFunctionRequest('?type=scheduled', {
        method: 'POST',
      });

      return {
        success: result.success,
        recordsProcessed: result.records_processed || 0,
        recordsSynced: result.records_synced || 0,
        recordsFailed: result.records_failed || 0,
        errors: result.errors || [],
        lastSyncTime: new Date(),
      };
    } catch (error) {
      throw new Error(`Scheduled sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async cleanupOldLogs(): Promise<{ deleted: number }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('cleanup_sync_logs');

    if (error) {
      throw new Error(`Failed to cleanup logs: ${error.message}`);
    }

    return { deleted: data || 0 };
  }

  async resetSyncState(): Promise<{ reset_syncs: number }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .rpc('reset_sync_state');

    if (error) {
      throw new Error(`Failed to reset sync state: ${error.message}`);
    }

    return data;
  }

  async getSyncStatistics(): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('sync_statistics')
      .select('statistics')
      .single();

    if (error) {
      throw new Error(`Failed to fetch sync statistics: ${error.message}`);
    }

    return data?.statistics || {};
  }
}

export const airtableSyncService = new AirtableSyncService();
export type { SyncLog, SyncStats, SyncConfig, SyncHealthStatus, SyncResult };