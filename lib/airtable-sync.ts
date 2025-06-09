// Client-side utilities for managing Airtable sync

export interface SyncLog {
  id: string
  sync_type: 'manual' | 'scheduled' | 'realtime'
  records_processed: number
  records_synced: number
  records_failed: number
  errors?: string[]
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed'
  created_at: string
}

export interface SyncResult {
  success: boolean
  message?: string
  records_processed?: number
  records_synced?: number
  records_failed?: number
  errors?: string[]
  error?: string
}

class AirtableSyncService {
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }

  async triggerManualSync(): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/airtable-sync?type=manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to trigger manual sync:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getSyncLogs(limit: number = 50): Promise<SyncLog[]> {
    try {
      const { supabase } = await import('./supabase')
      
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch sync logs:', error)
      return []
    }
  }

  async getLatestSyncStatus(): Promise<SyncLog | null> {
    try {
      const logs = await this.getSyncLogs(1)
      return logs.length > 0 ? logs[0] : null
    } catch (error) {
      console.error('Failed to get latest sync status:', error)
      return null
    }
  }

  async getSyncStats(): Promise<{
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    totalRecordsSynced: number
    lastSyncAt?: string
  }> {
    try {
      const { supabase } = await import('./supabase')
      
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('sync_logs')
        .select('status, records_synced, completed_at')
        .eq('status', 'completed')

      if (error) {
        throw error
      }

      const logs = data || []
      const totalSyncs = logs.length
      const successfulSyncs = logs.filter(log => log.status === 'completed').length
      const failedSyncs = totalSyncs - successfulSyncs
      const totalRecordsSynced = logs.reduce((sum, log) => sum + (log.records_synced || 0), 0)
      const lastSyncAt = logs.length > 0 ? logs[0].completed_at : undefined

      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        totalRecordsSynced,
        lastSyncAt
      }
    } catch (error) {
      console.error('Failed to get sync stats:', error)
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalRecordsSynced: 0
      }
    }
  }
}

export const airtableSyncService = new AirtableSyncService()