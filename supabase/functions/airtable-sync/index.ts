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
  id?: string
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
    'Last Updated': string
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
  private airtableViewId: string
  private supabase: any

  constructor() {
    this.airtableApiKey = Deno.env.get('AIRTABLE_API_KEY') || 'patXUDooi13mZ5UK0'
    this.airtableBaseId = 'appOjOMHTayU1oZLJ'
    this.airtableTableId = 'tblhpwqJMeAIETi1v'
    this.airtableViewId = 'viwEO6AvLQ641myYg'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  async logSync(log: SyncLog): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('sync_logs')
        .insert([log])
        .select()
        .single()

      if (error) throw error
      return data?.id || null
    } catch (error) {
      console.error('Failed to log sync:', error)
      return null
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

  async getExistingAirtableRecords(): Promise<Map<string, string>> {
    const existingRecords = new Map<string, string>() // submissionId -> airtableRecordId
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
            existingRecords.set(record.fields['Submission ID'], record.id)
          }
        })

        offset = data.offset || ''
      } while (offset)

    } catch (error) {
      console.error('Failed to fetch existing Airtable records:', error)
      throw error
    }

    return existingRecords
  }

  async createAirtableRecords(records: ContactSubmission[]): Promise<{ synced: number, failed: number, errors: string[] }> {
    const errors: string[] = []
    let synced = 0
    let failed = 0

    if (records.length === 0) {
      return { synced: 0, failed: 0, errors: [] }
    }

    // Process records in batches of 10 (Airtable limit)
    const batchSize = 10
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
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
            'Synced At': new Date().toISOString(),
            'Last Updated': new Date().toISOString()
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
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return { synced, failed, errors }
  }

  async updateAirtableRecords(records: ContactSubmission[], existingRecords: Map<string, string>): Promise<{ synced: number, failed: number, errors: string[] }> {
    const errors: string[] = []
    let synced = 0
    let failed = 0

    const recordsToUpdate = records.filter(record => existingRecords.has(record.id))

    if (recordsToUpdate.length === 0) {
      return { synced: 0, failed: 0, errors: [] }
    }

    // Process records in batches of 10 (Airtable limit)
    const batchSize = 10
    for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
      const batch = recordsToUpdate.slice(i, i + batchSize)
      
      try {
        const airtableRecords = batch.map(record => ({
          id: existingRecords.get(record.id)!,
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
            'Last Updated': new Date().toISOString()
          }
        }))

        const response = await fetch(`https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}`, {
          method: 'PATCH',
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
        const errorMessage = `Update batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`
        errors.push(errorMessage)
        failed += batch.length
        console.error(errorMessage)
      }

      // Rate limiting: wait 200ms between batches
      if (i + batchSize < recordsToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return { synced, failed, errors }
  }

  async deleteAirtableRecords(recordIds: string[]): Promise<{ deleted: number, failed: number, errors: string[] }> {
    const errors: string[] = []
    let deleted = 0
    let failed = 0

    if (recordIds.length === 0) {
      return { deleted: 0, failed: 0, errors: [] }
    }

    // Process records in batches of 10 (Airtable limit)
    const batchSize = 10
    for (let i = 0; i < recordIds.length; i += batchSize) {
      const batch = recordIds.slice(i, i + batchSize)
      
      try {
        const deleteUrl = `https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}?${batch.map(id => `records[]=${id}`).join('&')}`

        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.airtableApiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const result = await response.json()
        deleted += result.records?.length || 0

      } catch (error) {
        const errorMessage = `Delete batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`
        errors.push(errorMessage)
        failed += batch.length
        console.error(errorMessage)
      }

      // Rate limiting: wait 200ms between batches
      if (i + batchSize < recordIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return { deleted, failed, errors }
  }

  async performSync(syncType: 'manual' | 'scheduled' | 'realtime', recordId?: string, operation?: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<any> {
    const startTime = new Date().toISOString()
    
    // Create initial sync log
    const logId = await this.logSync({
      sync_type: syncType,
      records_processed: 0,
      records_synced: 0,
      records_failed: 0,
      started_at: startTime,
      status: 'running'
    })

    try {
      let records: ContactSubmission[] = []
      let totalProcessed = 0
      let totalSynced = 0
      let totalFailed = 0
      const allErrors: string[] = []

      // Get existing Airtable records for comparison
      const existingRecords = await this.getExistingAirtableRecords()

      if (syncType === 'realtime' && recordId) {
        // Real-time sync for specific record
        if (operation === 'DELETE') {
          // Handle deletion
          const airtableRecordId = existingRecords.get(recordId)
          if (airtableRecordId) {
            const { deleted, failed, errors } = await this.deleteAirtableRecords([airtableRecordId])
            totalProcessed = 1
            totalSynced = deleted
            totalFailed = failed
            allErrors.push(...errors)
          }
        } else {
          // Handle INSERT or UPDATE
          const { data: record, error } = await this.supabase
            .from('contact_submissions')
            .select('*')
            .eq('id', recordId)
            .single()

          if (error) {
            throw new Error(`Failed to fetch record from Supabase: ${error.message}`)
          }

          if (record) {
            records = [record]
            totalProcessed = 1

            if (existingRecords.has(recordId)) {
              // Update existing record
              const { synced, failed, errors } = await this.updateAirtableRecords(records, existingRecords)
              totalSynced = synced
              totalFailed = failed
              allErrors.push(...errors)
            } else {
              // Create new record
              const { synced, failed, errors } = await this.createAirtableRecords(records)
              totalSynced = synced
              totalFailed = failed
              allErrors.push(...errors)
            }
          }
        }
      } else {
        // Full sync or scheduled sync
        let query = this.supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: true })

        if (syncType === 'scheduled') {
          // For scheduled sync, only sync records created/updated since last successful sync
          const lastSync = await this.getLastSyncTimestamp()
          if (lastSync) {
            query = query.gt('created_at', lastSync)
          }
        }

        const { data: allRecords, error } = await query

        if (error) {
          throw new Error(`Failed to fetch records from Supabase: ${error.message}`)
        }

        records = allRecords || []
        totalProcessed = records.length

        if (records.length > 0) {
          // Separate new records from existing ones
          const newRecords = records.filter(record => !existingRecords.has(record.id))
          const existingRecordsToUpdate = records.filter(record => existingRecords.has(record.id))

          // Create new records
          if (newRecords.length > 0) {
            const { synced, failed, errors } = await this.createAirtableRecords(newRecords)
            totalSynced += synced
            totalFailed += failed
            allErrors.push(...errors)
          }

          // Update existing records
          if (existingRecordsToUpdate.length > 0) {
            const { synced, failed, errors } = await this.updateAirtableRecords(existingRecordsToUpdate, existingRecords)
            totalSynced += synced
            totalFailed += failed
            allErrors.push(...errors)
          }
        }
      }

      const completedAt = new Date().toISOString()

      // Update sync log
      if (logId) {
        await this.updateSyncLog(logId, {
          records_processed: totalProcessed,
          records_synced: totalSynced,
          records_failed: totalFailed,
          errors: allErrors.length > 0 ? allErrors : undefined,
          completed_at: completedAt,
          status: totalFailed > 0 ? 'failed' : 'completed'
        })
      }

      return {
        success: true,
        message: `Sync completed: ${totalSynced} records synced, ${totalFailed} failed`,
        records_processed: totalProcessed,
        records_synced: totalSynced,
        records_failed: totalFailed,
        errors: allErrors.length > 0 ? allErrors : undefined
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

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test Airtable API connection
      const response = await fetch(`https://api.airtable.com/v0/${this.airtableBaseId}/${this.airtableTableId}?maxRecords=1`, {
        headers: {
          'Authorization': `Bearer ${this.airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
      }

      return {
        success: true,
        message: 'Airtable connection successful'
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
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
    const operation = url.searchParams.get('operation') as 'INSERT' | 'UPDATE' | 'DELETE' | null

    // Handle test endpoint
    if (url.pathname.endsWith('/test')) {
      const airtableSync = new AirtableSync()
      const result = await airtableSync.testConnection()
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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
    const result = await airtableSync.performSync(
      syncType as any, 
      recordId || undefined,
      operation || undefined
    )

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