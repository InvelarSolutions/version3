/*
  # Create database trigger for real-time Airtable sync

  1. Trigger Function
    - Automatically calls Airtable sync edge function when new contact submission is inserted
    - Uses pg_net extension to make HTTP requests
    - Handles errors gracefully without blocking the insert operation

  2. Trigger
    - Fires AFTER INSERT on contact_submissions table
    - Calls the trigger function for each new row
*/

-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to trigger Airtable sync
CREATE OR REPLACE FUNCTION trigger_airtable_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Make async HTTP request to sync edge function
  -- This runs in the background and won't block the insert operation
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/airtable-sync?type=realtime&recordId=' || NEW.id,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the insert
    RAISE WARNING 'Failed to trigger Airtable sync for record %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after insert
DROP TRIGGER IF EXISTS contact_submission_airtable_sync ON contact_submissions;

CREATE TRIGGER contact_submission_airtable_sync
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_airtable_sync();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_airtable_sync() IS 'Triggers real-time sync to Airtable when new contact submission is inserted';
COMMENT ON TRIGGER contact_submission_airtable_sync ON contact_submissions IS 'Automatically syncs new contact submissions to Airtable in real-time';