# Airtable Real-time Sync Setup Guide

This guide will help you set up comprehensive real-time data synchronization between your Supabase contact_submissions table and Airtable, including bi-directional sync, error handling, and monitoring.

## Prerequisites

1. **Airtable Account**: Access to base `appOjOMHTayU1oZLJ`
2. **Airtable API Key**: Personal access token with proper permissions
3. **Supabase Project**: Deployed project with database access

## Setup Steps

### 1. Configure Airtable

1. **Create Required Fields in Airtable Table**:
   - Navigate to base: `appOjOMHTayU1oZLJ`
   - Open table: `tblhpwqJMeAIETi1v`
   - Ensure these fields exist:
     - `Submission ID` (Single line text) - Primary key
     - `First Name` (Single line text)
     - `Last Name` (Single line text)
     - `Email` (Email)
     - `Phone` (Phone number)
     - `Company Name` (Single line text)
     - `Industry` (Single select)
     - `Additional Notes` (Long text)
     - `Newsletter Subscription` (Checkbox)
     - `Created At` (Date & time)
     - `Synced At` (Date & time)
     - `Last Updated` (Date & time)

2. **Generate Airtable API Key**:
   - Go to https://airtable.com/create/tokens
   - Create a new personal access token
   - Grant scopes:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
   - Add base `appOjOMHTayU1oZLJ` to the token
   - Copy the generated token: `patXUDooi13mZ5UK0`

### 2. Configure Supabase Environment Variables

Add the Airtable API key to your Supabase project:

1. Go to Supabase Dashboard → Settings → Environment Variables
2. Add:
   ```
   AIRTABLE_API_KEY=patXUDooi13mZ5UK0
   ```

### 3. Deploy Database Migrations

Run these migrations in order:

1. **Sync logs table** (already exists)
2. **Real-time triggers**:
   ```sql
   -- Run supabase/migrations/20250609223000_realtime_sync_triggers.sql
   ```
3. **Sync configuration**:
   ```sql
   -- Run supabase/migrations/20250609223100_sync_configuration.sql
   ```

### 4. Deploy Edge Function

Deploy the enhanced Airtable sync function:

```bash
supabase functions deploy airtable-sync
```

### 5. Configure Scheduled Sync (Optional)

#### Option A: Supabase Cron (if available)
```sql
SELECT cron.schedule(
  'airtable-sync-scheduled',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT run_scheduled_airtable_sync();
  $$
);
```

#### Option B: External Cron Service
Set up external cron to call:
```
POST https://your-project.supabase.co/functions/v1/airtable-sync?type=scheduled
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## Sync Features

### Real-time Sync
- **INSERT**: New contact submissions automatically sync to Airtable within seconds
- **UPDATE**: Changes to existing submissions update corresponding Airtable records
- **DELETE**: Deleted submissions remove records from Airtable
- **Duplicate Prevention**: Checks existing records before creating new ones

### Scheduled Sync
- **Frequency**: Every 15 minutes (configurable)
- **Incremental**: Only syncs records created/updated since last successful sync
- **Batch Processing**: Handles large datasets efficiently
- **Error Recovery**: Retries failed operations

### Bi-directional Sync
- **Supabase → Airtable**: Real-time and scheduled
- **Airtable → Supabase**: Webhook-based (requires additional setup)

### Error Handling
- **Automatic Retries**: Failed operations retry with exponential backoff
- **Error Logging**: All errors logged with detailed information
- **Graceful Degradation**: Database operations never fail due to sync issues
- **Health Monitoring**: Automatic detection of stuck or failed syncs

## Monitoring and Management

### Admin Dashboard
Access the sync dashboard at `/admin` to:
- View real-time sync statistics
- Monitor sync health and performance
- Trigger manual syncs
- View detailed error logs
- Configure sync settings

### Key Metrics
- **Total Syncs**: Number of sync operations performed
- **Success Rate**: Percentage of successful syncs
- **Records Synced**: Total number of records synchronized
- **Average Duration**: Time taken for sync operations
- **Error Rate**: Frequency and types of errors

### Health Checks
The system provides automatic health monitoring:
- **Healthy**: All syncs working normally
- **Warning**: Recent failures or delayed syncs
- **Critical**: Multiple failures or stuck operations

## Configuration Options

### Sync Settings
Configure via the admin dashboard or database:

```sql
-- Enable/disable real-time sync
UPDATE sync_config SET config_value = 'true' WHERE config_key = 'realtime_sync_enabled';

-- Set batch size for processing
UPDATE sync_config SET config_value = '10' WHERE config_key = 'sync_batch_size';

-- Configure rate limiting
UPDATE sync_config SET config_value = '200' WHERE config_key = 'sync_rate_limit_ms';

-- Set log retention period
UPDATE sync_config SET config_value = '30' WHERE config_key = 'log_retention_days';
```

### Performance Tuning
- **Batch Size**: Adjust based on data volume (default: 10 records)
- **Rate Limiting**: Control API call frequency (default: 200ms between calls)
- **Retry Logic**: Configure retry attempts and delays
- **Log Retention**: Balance monitoring needs with storage costs

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```
   Error: Airtable API error: 401 Unauthorized
   ```
   - Verify API key is correct and active
   - Check token permissions include required scopes
   - Ensure base is included in token access

2. **Field Mapping Errors**:
   ```
   Error: Invalid field name
   ```
   - Verify all required fields exist in Airtable
   - Check field names match exactly (case-sensitive)
   - Ensure field types are compatible

3. **Rate Limiting**:
   ```
   Error: 429 Too Many Requests
   ```
   - Increase rate limiting delay in configuration
   - Reduce batch size for large datasets
   - Check for concurrent sync operations

4. **Timeout Errors**:
   ```
   Error: Function timeout
   ```
   - Large syncs may exceed function timeout
   - Use scheduled sync for bulk operations
   - Check network connectivity

### Diagnostic Tools

1. **Test Connection**:
   ```javascript
   const result = await airtableSyncService.testConnection();
   console.log(result);
   ```

2. **Health Check**:
   ```sql
   SELECT sync_health_check();
   ```

3. **Reset Stuck Syncs**:
   ```sql
   SELECT reset_sync_state();
   ```

4. **Cleanup Old Logs**:
   ```sql
   SELECT cleanup_sync_logs();
   ```

### Monitoring Queries

```sql
-- Recent sync activity
SELECT * FROM sync_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Error analysis
SELECT errors, COUNT(*) as error_count
FROM sync_logs 
WHERE status = 'failed' AND errors IS NOT NULL
GROUP BY errors
ORDER BY error_count DESC;

-- Performance metrics
SELECT 
  sync_type,
  AVG(records_processed) as avg_records,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
FROM sync_logs 
WHERE status = 'completed'
GROUP BY sync_type;
```

## Security Considerations

### API Key Security
- Store API key as environment variable only
- Never expose in client-side code
- Rotate keys regularly
- Use minimum required permissions

### Access Control
- Sync functions use service role permissions
- Admin dashboard requires authentication
- RLS policies protect sensitive data
- Audit logs track all sync operations

### Data Privacy
- Ensure Airtable workspace complies with privacy policies
- Implement data retention policies
- Consider data encryption for sensitive fields
- Regular security audits

## Maintenance

### Regular Tasks
1. **Monitor sync health** (daily)
2. **Review error logs** (weekly)
3. **Cleanup old logs** (monthly)
4. **Update API keys** (quarterly)
5. **Performance review** (quarterly)

### Backup and Recovery
- Sync logs provide audit trail
- Airtable serves as backup for contact data
- Database backups include sync configuration
- Recovery procedures documented

### Updates and Changes
- Test sync after schema changes
- Update field mappings when needed
- Monitor for API changes
- Version control for configurations

## Performance Benchmarks

### Expected Performance
- **Real-time sync**: < 5 seconds for single record
- **Batch sync**: ~100 records per minute
- **Error rate**: < 1% under normal conditions
- **Availability**: 99.9% uptime target

### Optimization Tips
- Use scheduled sync for bulk operations
- Monitor and adjust batch sizes
- Implement proper error handling
- Regular maintenance and cleanup

This comprehensive sync system ensures reliable, real-time data synchronization between Supabase and Airtable with robust error handling, monitoring, and maintenance capabilities.