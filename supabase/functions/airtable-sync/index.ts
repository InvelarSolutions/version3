import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactSubmission {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
  industry?: string
  additional_notes?: string
  newsletter_subscription: boolean
  created_at: string
}

interface AirtableRecord {
  fields: {
    'Submission ID': string
    'First Name': string
    'Last Name': string
    'Email': string
    'Phone': string
    'Company Name'?: string
    'Industry'?: string
    'Additional Notes'?: string
    'Newsletter Subscription': boolean
    'Created At': string
    'Synced At': string
  }
}

interface SyncLog {
  id?: string
  sync_type: 'manual' | 'scheduled' | 'realtime'
  records_processed: number
  records_synced: number
  records_failed: number
  errors?: string[]
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed'
}

class AirtableSync {
  private airtableApiKey: string
  private airtableBaseId: string
  private airtableTableId: string
  private supabase: any

  constructor() {
    this.airtableApiKey = Deno.env.get('AIRTABLE_API_KEY') || ''
    this.airtableBaseId = 'appOjOMHTayU1oZLJ'
    this.airtableTableId = 'tblhpwqJMeAIETi1v'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  async logSync(log: SyncLog): Promise<void> {
    try {
      await this.supabase
        .from('sync_logs')
        .insert([log])
    } catch (error) {
      console.error('Failed to log sync:', error)
    }
  }

  async updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<void> {
    try {
      await this.supabase
        .from('sync_logs')
        .update(updates)
        .eq('id', id)
    } catch (error) {
      console.error('Failed to update sync log:', error)
    }
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      const { data } = await this.supabase
        .from('sync_logs')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      return data?.completed_at || null
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error)
      return null
    }
  }

  async getExistingAirtableRecords(): Promise<Set<string>> {
    const existingIds = new Set<string>()
    let offset = ''

    try {
      do {
        const url = `https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}?fields[]=Submission%20ID${offset ? `&offset=${offset}` : ''}`
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.airtableApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        data.records?.forEach((record: any) => {
          if (record.fields['Submission ID']) {
            existingIds.add(record.fields['Submission ID'])
          }
        })

        offset = data.offset || ''
      } while (offset)

    } catch (error) {
      console.error('Failed to fetch existing Airtable records:', error)
      throw error
    }

    return existingIds
  }

  async syncToAirtable(records: ContactSubmission[], existingIds: Set<string>): Promise<{ synced: number, failed: number, errors: string[] }> {
    const errors: string[] = []
    let synced = 0
    let failed = 0

    // Filter out records that already exist in Airtable
    const newRecords = records.filter(record => !existingIds.has(record.id))

    if (newRecords.length === 0) {
      return { synced: 0, failed: 0, errors: [] }
    }

    // Process records in batches of 10 (Airtable limit)
    const batchSize = 10
    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize)
      
      try {
        const airtableRecords: AirtableRecord[] = batch.map(record => ({
          fields: {
            'Submission ID': record.id,
            'First Name': record.first_name,
            'Last Name': record.last_name,
            'Email': record.email,
            'Phone': record.phone,
            'Company Name': record.company_name || '',
            'Industry': record.industry || '',
            'Additional Notes': record.additional_notes || '',
            'Newsletter Subscription': record.newsletter_subscription,
            'Created At': record.created_at,
            'Synced At': new Date().toISOString()
          }
        }))

        const response = await fetch(`https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: airtableRecords })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()
        synced += result.records?.length || 0

      } catch (error) {
        const errorMessage = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`
        errors.push(errorMessage)
        failed += batch.length
        console.error(errorMessage)
      }

      // Rate limiting: wait 200ms between batches
      if (i + batchSize < newRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return { synced, failed, errors }
  }

  async performSync(syncType: 'manual' | 'scheduled' | 'realtime', recordId?: string): Promise<any> {
    const startTime = new Date().toISOString()
    
    // Create initial sync log
    const { data: logData } = await this.supabase
      .from('sync_logs')
      .insert([{
        sync_type: syncType,
        records_processed: 0,
        records_synced: 0,
        records_failed: 0,
        started_at: startTime,
        status: 'running'
      }])
      .select()
      .single()

    const logId = logData?.id

    try {
      let query = this.supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: true })

      // For real-time sync, only sync the specific record
      if (syncType === 'realtime' && recordId) {
        query = query.eq('id', recordId)
      } else if (syncType === 'scheduled') {
        // For scheduled sync, only sync records created since last successful sync
        const lastSync = await this.getLastSyncTimestamp()
        if (lastSync) {
          query = query.gt('created_at', lastSync)
        }
      }

      const { data: records, error } = await query

      if (error) {
        throw new Error(`Failed to fetch records from Supabase: ${error.message}`)
      }

      if (!records || records.length === 0) {
        await this.updateSyncLog(logId, {
          records_processed: 0,
          records_synced: 0,
          records_failed: 0,
          completed_at: new Date().toISOString(),
          status: 'completed'
        })

        return {
          success: true,
          message: 'No new records to sync',
          records_processed: 0,
          records_synced: 0,
          records_failed: 0
        }
      }

      // Get existing Airtable records to avoid duplicates
      const existingIds = await this.getExistingAirtableRecords()

      // Sync to Airtable
      const { synced, failed, errors } = await this.syncToAirtable(records, existingIds)

      const completedAt = new Date().toISOString()

      // Update sync log
      await this.updateSyncLog(logId, {
        records_processed: records.length,
        records_synced: synced,
        records_failed: failed,
        errors: errors.length > 0 ? errors : undefined,
        completed_at: completedAt,
        status: failed > 0 ? 'failed' : 'completed'
      })

      return {
        success: true,
        message: `Sync completed: ${synced} records synced, ${failed} failed`,
        records_processed: records.length,
        records_synced: synced,
        records_failed: failed,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      console.error('Sync failed:', error)

      if (logId) {
        await this.updateSyncLog(logId, {
          errors: [error.message],
          completed_at: new Date().toISOString(),
          status: 'failed'
        })
      }

      return {
        success: false,
        error: error.message
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'manual'
    const recordId = url.searchParams.get('recordId')

    if (!['manual', 'scheduled', 'realtime'].includes(syncType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid sync type. Must be manual, scheduled, or realtime' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const airtableSync = new AirtableSync()
    const result = await airtableSync.performSync(syncType as any, recordId || undefined)

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})