/*
  # Add RLS policy for contact submissions

  1. Security Changes
    - Add policy for authenticated users to insert contact submissions
    - Allows authenticated users to submit contact form data

  2. Notes
    - Uses DROP IF EXISTS and CREATE to ensure idempotent operation
    - Policy allows any authenticated user to insert contact submissions
*/

-- Drop the policy if it exists to ensure idempotent operation
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON contact_submissions;

-- Add policy for authenticated users to insert contact submissions
CREATE POLICY "Authenticated users can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the policy is properly applied
COMMENT ON POLICY "Authenticated users can submit contact form" ON contact_submissions 
IS 'Allows authenticated users to submit contact form data';