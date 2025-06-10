/*
  # Sync Configuration and Enhanced Functions

  1. New Tables
    - `sync_config` - Configuration settings for sync system
  
  2. Functions
    - `get_sync_config()` - Retrieve configuration values
    - `update_sync_config()` - Update configuration values
    - `cleanup_sync_logs()` - Remove old logs based on retention
    - `reset_sync_state()` - Reset stuck sync operations
    - `sync_health_check()` - Monitor sync system health
  
  3. Views
    - `sync_statistics` - Enhanced statistics and metrics
  
  4. Security
    - RLS policies for sync_config table
    - Proper access controls for functions
*/

-- Create sync configuration table
CREATE TABLE IF NOT EXISTS sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default configuration (only if not exists)
INSERT INTO sync_config (config_key, config_value, description) 
SELECT * FROM (VALUES
  ('realtime_sync_enabled', 'true', 'Enable/disable real-time sync triggers'),
  ('scheduled_sync_enabled', 'true', 'Enable/disable scheduled sync'),
  ('sync_batch_size', '10', 'Number of records to process in each batch'),
  ('sync_rate_limit_ms', '200', 'Milliseconds to wait between API calls'),
  ('max_retry_attempts', '3', 'Maximum number of retry attempts for failed syncs'),
  ('log_retention_days', '30', 'Number of days to keep sync logs'),
  ('airtable_base_id', '"appOjOMHTayU1oZLJ"', 'Airtable base ID'),
  ('airtable_table_id', '"tblhpwqJMeAIETi1v"', 'Airtable table ID'),
  ('airtable_view_id', '"viwEO6AvLQ641myYg"', 'Airtable view ID')
) AS new_config(config_key, config_value, description)
WHERE NOT EXISTS (
  SELECT 1 FROM sync_config WHERE sync_config.config_key = new_config.config_key
);

-- Enable RLS on sync_config
ALTER TABLE sync_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop service role policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sync_config' 
    AND policyname = 'Service role can manage sync config'
  ) THEN
    DROP POLICY "Service role can manage sync config" ON sync_config;
  END IF;
  
  -- Drop authenticated users policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sync_config' 
    AND policyname = 'Authenticated users can read sync config'
  ) THEN
    DROP POLICY "Authenticated users can read sync config" ON sync_config;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Service role can manage sync config"
  ON sync_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read sync config"
  ON sync_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to get sync configuration
CREATE OR REPLACE FUNCTION get_sync_config(key text)
RETURNS jsonb AS $$
DECLARE
  config_value jsonb;
BEGIN
  SELECT sync_config.config_value INTO config_value
  FROM sync_config
  WHERE config_key = key;
  
  RETURN COALESCE(config_value, 'null'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update sync configuration
CREATE OR REPLACE FUNCTION update_sync_config(key text, value jsonb)
RETURNS boolean AS $$
BEGIN
  UPDATE sync_config 
  SET config_value = value, updated_at = now()
  WHERE config_key = key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced sync statistics view
CREATE OR REPLACE VIEW sync_statistics AS
WITH recent_stats AS (
  SELECT 
    sync_type,
    status,
    COUNT(*) as sync_count,
    SUM(records_processed) as total_processed,
    SUM(records_synced) as total_synced,
    SUM(records_failed) as total_failed,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
    MAX(completed_at) as last_sync
  FROM sync_logs 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY sync_type, status
),
overall_stats AS (
  SELECT 
    COUNT(*) as total_syncs,
    SUM(records_processed) as total_records_processed,
    SUM(records_synced) as total_records_synced,
    SUM(records_failed) as total_records_failed,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
    MAX(completed_at) as last_sync_time
  FROM sync_logs
),
error_analysis AS (
  SELECT 
    COUNT(*) as error_count,
    array_agg(DISTINCT unnest(errors)) as common_errors
  FROM sync_logs 
  WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND errors IS NOT NULL
)
SELECT 
  jsonb_build_object(
    'recent_24h', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'sync_type', sync_type,
          'status', status,
          'count', sync_count,
          'processed', total_processed,
          'synced', total_synced,
          'failed', total_failed,
          'avg_duration', avg_duration,
          'last_sync', last_sync
        )
      ) FROM recent_stats
    ),
    'overall', (
      SELECT jsonb_build_object(
        'total_syncs', total_syncs,
        'total_processed', total_records_processed,
        'total_synced', total_records_synced,
        'total_failed', total_records_failed,
        'avg_duration', avg_duration,
        'last_sync', last_sync_time
      ) FROM overall_stats
    ),
    'errors', (
      SELECT jsonb_build_object(
        'error_count', error_count,
        'common_errors', common_errors
      ) FROM error_analysis
    )
  ) as statistics;

-- Create function to cleanup old sync logs
CREATE OR REPLACE FUNCTION cleanup_sync_logs()
RETURNS integer AS $$
DECLARE
  retention_days integer;
  deleted_count integer;
BEGIN
  -- Get retention period from config
  SELECT (get_sync_config('log_retention_days')::text)::integer INTO retention_days;
  
  -- Default to 30 days if not configured
  retention_days := COALESCE(retention_days, 30);
  
  -- Delete old logs
  DELETE FROM sync_logs 
  WHERE created_at < NOW() - (retention_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset sync state (for troubleshooting)
CREATE OR REPLACE FUNCTION reset_sync_state()
RETURNS jsonb AS $$
DECLARE
  running_syncs integer;
BEGIN
  -- Count running syncs
  SELECT COUNT(*) INTO running_syncs
  FROM sync_logs 
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '1 hour';
  
  -- Mark old running syncs as failed
  UPDATE sync_logs 
  SET status = 'failed',
      completed_at = now(),
      errors = COALESCE(errors, ARRAY[]::text[]) || ARRAY['Sync reset due to timeout']
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '1 hour';
  
  RETURN jsonb_build_object(
    'reset_syncs', running_syncs,
    'timestamp', extract(epoch from now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for sync health check
CREATE OR REPLACE FUNCTION sync_health_check()
RETURNS jsonb AS $$
DECLARE
  health_status jsonb;
  recent_failures integer;
  stuck_syncs integer;
  last_successful_sync timestamptz;
BEGIN
  -- Count recent failures
  SELECT COUNT(*) INTO recent_failures
  FROM sync_logs 
  WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  -- Count stuck syncs
  SELECT COUNT(*) INTO stuck_syncs
  FROM sync_logs 
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '30 minutes';
  
  -- Get last successful sync
  SELECT MAX(completed_at) INTO last_successful_sync
  FROM sync_logs 
  WHERE status = 'completed';
  
  -- Build health status
  health_status := jsonb_build_object(
    'status', CASE 
      WHEN stuck_syncs > 0 THEN 'critical'
      WHEN recent_failures > 5 THEN 'warning'
      WHEN last_successful_sync < NOW() - INTERVAL '1 hour' THEN 'warning'
      ELSE 'healthy'
    END,
    'recent_failures', recent_failures,
    'stuck_syncs', stuck_syncs,
    'last_successful_sync', last_successful_sync,
    'check_timestamp', now()
  );
  
  RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_created_at ON sync_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type_status ON sync_logs(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_config_key ON sync_config(config_key);

-- Add comments
COMMENT ON TABLE sync_config IS 'Configuration settings for Airtable sync system';
COMMENT ON FUNCTION get_sync_config(text) IS 'Retrieve sync configuration value by key';
COMMENT ON FUNCTION update_sync_config(text, jsonb) IS 'Update sync configuration value';
COMMENT ON FUNCTION cleanup_sync_logs() IS 'Remove old sync logs based on retention policy';
COMMENT ON FUNCTION reset_sync_state() IS 'Reset stuck sync operations for troubleshooting';
COMMENT ON FUNCTION sync_health_check() IS 'Check overall health of sync system';
COMMENT ON VIEW sync_statistics IS 'Comprehensive sync statistics and metrics';