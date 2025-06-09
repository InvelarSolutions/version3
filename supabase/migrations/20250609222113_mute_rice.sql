/*
  # Create sync logs table for tracking Airtable synchronization

  1. New Tables
    - `sync_logs`
      - `id` (uuid, primary key)
      - `sync_type` (text) - manual, scheduled, or realtime
      - `records_processed` (integer) - total records processed
      - `records_synced` (integer) - successfully synced records
      - `records_failed` (integer) - failed records
      - `errors` (text array) - error messages if any
      - `started_at` (timestamp) - when sync started
      - `completed_at` (timestamp) - when sync completed
      - `status` (text) - running, completed, or failed
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sync_logs` table
    - Add policy for service role access
*/

CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'realtime')),
  records_processed integer DEFAULT 0,
  records_synced integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  errors text[],
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage sync logs
CREATE POLICY "Service role can manage sync logs"
  ON sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read sync logs (for admin dashboard)
CREATE POLICY "Authenticated users can read sync logs"
  ON sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_completed_at ON sync_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);