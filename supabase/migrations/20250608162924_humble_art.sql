/*
  # Add authenticated user write policy for contact submissions

  1. Security Changes
    - Add policy for authenticated users to insert contact submissions
    - This complements the existing anonymous insert policy
    - Ensures form works for both authenticated and anonymous users

  2. Policy Details
    - Policy name: "Authenticated users can submit contact form"
    - Applies to: INSERT operations
    - Target: authenticated role
    - Condition: Always allow (true)
*/

-- First, check if the policy already exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'contact_submissions' 
    AND policyname = 'Authenticated users can submit contact form'
  ) THEN
    DROP POLICY "Authenticated users can submit contact form" ON contact_submissions;
  END IF;
END $$;

-- Create the policy for authenticated users to insert contact submissions
CREATE POLICY "Authenticated users can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment to document the policy
COMMENT ON POLICY "Authenticated users can submit contact form" ON contact_submissions 
IS 'Allows authenticated users to submit contact form data. Complements the anonymous insert policy to ensure form works for all user types.';