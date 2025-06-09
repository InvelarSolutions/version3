# Airtable Sync Setup Guide

This guide will help you set up automated data synchronization between your Supabase contact_submissions table and Airtable.

## Prerequisites

1. **Airtable Account**: You need access to the Airtable base `appOjOMHTayU1oZLJ`
2. **Airtable API Key**: Generate a personal access token from your Airtable account
3. **Supabase Project**: Your project should be deployed and accessible

## Setup Steps

### 1. Configure Airtable

1. **Create Required Fields in Airtable Table**:
   - Navigate to your Airtable base: `appOjOMHTayU1oZLJ`
   - Open table: `tblhpwqJMeAIETi1v`
   - Ensure the following fields exist:
     - `Submission ID` (Single line text)
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

2. **Generate Airtable API Key**:
   - Go to https://airtable.com/create/tokens
   - Create a new personal access token
   - Grant the following scopes:
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
   - Add your base `appOjOMHTayU1oZLJ` to the token
   - Copy the generated token

### 2. Configure Supabase Environment Variables

Add the following environment variable to your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to Settings > Environment Variables
3. Add:
   ```
   AIRTABLE_API_KEY=your_airtable_personal_access_token_here
   ```

### 3. Deploy Database Migrations

Run the following migrations in your Supabase SQL editor:

1. **Create sync logs table**:
   ```sql
   -- Run the content from supabase/migrations/create_sync_logs_table.sql
   ```

2. **Create real-time sync trigger**:
   ```sql
   -- Run the content from supabase/migrations/create_contact_submissions_trigger.sql
   ```

### 4. Deploy Edge Function

The Airtable sync edge function is located at `supabase/functions/airtable-sync/index.ts`. Deploy it using:

```bash
supabase functions deploy airtable-sync
```

### 5. Configure Scheduled Sync (Optional)

To set up automatic sync every 15 minutes, you can use:

1. **Supabase Cron Jobs** (if available in your plan):
   ```sql
   SELECT cron.schedule(
     'airtable-sync-job',
     '*/15 * * * *', -- Every 15 minutes
     $$
     SELECT net.http_post(
       url := current_setting('app.supabase_url') || '/functions/v1/airtable-sync?type=scheduled',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

2. **External Cron Service** (alternative):
   - Use a service like GitHub Actions, Vercel Cron, or Netlify Functions
   - Make a POST request to: `https://your-project.supabase.co/functions/v1/airtable-sync?type=scheduled`
   - Include the Authorization header with your service role key

## How It Works

### Real-time Sync
- When a new contact submission is inserted into Supabase, a database trigger automatically calls the Airtable sync function
- The function checks if the record already exists in Airtable (duplicate prevention)
- If it's new, the record is immediately synced to Airtable

### Scheduled Sync
- Runs every 15 minutes (configurable)
- Syncs any records that might have been missed by real-time sync
- Only processes records created since the last successful sync

### Manual Sync
- Can be triggered from the admin dashboard
- Useful for initial data migration or troubleshooting
- Processes all records or specific date ranges

## Monitoring and Troubleshooting

### Sync Dashboard
Access the sync dashboard in your admin panel to:
- View sync statistics
- Monitor recent sync activity
- Trigger manual syncs
- View error logs

### Common Issues

1. **Authentication Errors**:
   - Verify your Airtable API key is correct
   - Ensure the token has the required scopes
   - Check that the base ID is included in the token permissions

2. **Field Mapping Errors**:
   - Ensure all required fields exist in your Airtable table
   - Verify field names match exactly (case-sensitive)
   - Check field types are compatible

3. **Rate Limiting**:
   - Airtable has rate limits (5 requests per second)
   - The sync function includes automatic rate limiting
   - Large batches are processed in chunks of 10 records

4. **Network Timeouts**:
   - Edge functions have a 30-second timeout
   - Large syncs are batched to stay within limits
   - Failed batches are logged for retry

### Logs and Debugging

- All sync activities are logged in the `sync_logs` table
- Check the Supabase Edge Functions logs for detailed error information
- Use the sync dashboard to monitor success/failure rates

## Security Considerations

1. **API Key Security**:
   - Store Airtable API key as environment variable only
   - Never expose API keys in client-side code
   - Rotate API keys regularly

2. **Access Control**:
   - Sync functions use service role permissions
   - Only authenticated users can view sync logs
   - Real-time triggers are secured with RLS policies

3. **Data Privacy**:
   - Ensure Airtable workspace complies with your privacy policies
   - Consider data retention policies for sync logs
   - Implement proper access controls in Airtable

## Testing

1. **Test Real-time Sync**:
   - Submit a new contact form
   - Check that the record appears in Airtable within seconds
   - Verify all fields are mapped correctly

2. **Test Manual Sync**:
   - Use the dashboard to trigger a manual sync
   - Monitor the sync logs for success/failure
   - Verify duplicate prevention works

3. **Test Error Handling**:
   - Temporarily use an invalid API key
   - Verify errors are logged properly
   - Confirm the system recovers when fixed

## Maintenance

1. **Regular Monitoring**:
   - Check sync dashboard weekly
   - Monitor error rates and investigate failures
   - Verify data consistency between systems

2. **Performance Optimization**:
   - Monitor sync duration and batch sizes
   - Adjust batch sizes if needed for performance
   - Consider archiving old sync logs

3. **Updates and Changes**:
   - Test sync functionality after Airtable schema changes
   - Update field mappings if Airtable fields are modified
   - Monitor for Airtable API changes and updates