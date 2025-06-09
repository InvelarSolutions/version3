/*
  # Enhanced Real-time Sync System

  1. Trigger Functions
    - Create comprehensive trigger function for INSERT, UPDATE, DELETE operations
    - Add proper error handling and logging
    - Support for different operation types

  2. Database Triggers
    - Real-time triggers for all DML operations
    - Async HTTP calls to edge function
    - Proper error handling without blocking operations

  3. Scheduled Sync Support
    - Function to handle scheduled sync operations
    - Configurable sync intervals
*/

-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing trigger and function to recreate with enhanced functionality
DROP TRIGGER IF EXISTS contact_submission_airtable_sync ON contact_submissions;
DROP FUNCTION IF EXISTS trigger_airtable_sync();

-- Create enhanced trigger function for real-time sync
CREATE OR REPLACE FUNCTION trigger_airtable_sync()
RETURNS TRIGGER AS $$
DECLARE
  operation_type text;
  record_id text;
  sync_url text;
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'INSERT';
    record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'UPDATE';
    record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'DELETE';
    record_id := OLD.id;
  END IF;

  -- Build sync URL with parameters
  sync_url := current_setting('app.supabase_url', true) || 
              '/functions/v1/airtable-sync?type=realtime&recordId=' || record_id || 
              '&operation=' || operation_type;

  -- Make async HTTP request to sync edge function
  -- This runs in the background and won't block the DML operation
  PERFORM
    net.http_post(
      url := sync_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'operation', operation_type,
        'record_id', record_id,
        'timestamp', extract(epoch from now())
      ),
      timeout_milliseconds := 30000
    );
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the DML operation
    RAISE WARNING 'Failed to trigger Airtable sync for % operation on record %: %', 
                  operation_type, record_id, SQLERRM;
    
    -- Return appropriate record to allow operation to continue
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all DML operations
CREATE TRIGGER contact_submission_airtable_sync_insert
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();

CREATE TRIGGER contact_submission_airtable_sync_update
  AFTER UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();

CREATE TRIGGER contact_submission_airtable_sync_delete
  AFTER DELETE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();

-- Create function for scheduled sync (can be called by cron jobs)
CREATE OR REPLACE FUNCTION run_scheduled_airtable_sync()
RETURNS jsonb AS $$
DECLARE
  sync_result jsonb;
  sync_url text;
BEGIN
  -- Build sync URL for scheduled sync
  sync_url := current_setting('app.supabase_url', true) || 
              '/functions/v1/airtable-sync?type=scheduled';

  -- Make HTTP request to sync edge function
  SELECT content INTO sync_result
  FROM net.http_post(
    url := sync_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := jsonb_build_object(
      'timestamp', extract(epoch from now())
    ),
    timeout_milliseconds := 300000  -- 5 minutes timeout for scheduled sync
  );

  RETURN COALESCE(sync_result, '{"success": false, "error": "No response from sync function"}'::jsonb);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', extract(epoch from now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION trigger_airtable_sync() IS 'Triggers real-time sync to Airtable for INSERT, UPDATE, and DELETE operations on contact submissions';
COMMENT ON FUNCTION run_scheduled_airtable_sync() IS 'Runs scheduled sync to Airtable, can be called by cron jobs or external schedulers';

COMMENT ON TRIGGER contact_submission_airtable_sync_insert ON contact_submissions IS 'Real-time sync trigger for INSERT operations';
COMMENT ON TRIGGER contact_submission_airtable_sync_update ON contact_submissions IS 'Real-time sync trigger for UPDATE operations';
COMMENT ON TRIGGER contact_submission_airtable_sync_delete ON contact_submissions IS 'Real-time sync trigger for DELETE operations';

-- Create a view for monitoring sync health
CREATE OR REPLACE VIEW sync_health_monitor AS
SELECT 
  DATE_TRUNC('hour', created_at) as sync_hour,
  sync_type,
  status,
  COUNT(*) as sync_count,
  SUM(records_processed) as total_records_processed,
  SUM(records_synced) as total_records_synced,
  SUM(records_failed) as total_records_failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM sync_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), sync_type, status
ORDER BY sync_hour DESC, sync_type, status;

COMMENT ON VIEW sync_health_monitor IS 'Provides hourly sync health metrics for the last 24 hours';