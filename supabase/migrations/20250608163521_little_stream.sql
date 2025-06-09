/*
  # Fix Contact Submissions RLS Policy

  1. Security Updates
    - Update RLS policy for contact_submissions table to properly allow anonymous submissions
    - Ensure the policy allows INSERT operations for anonymous users (anon role)
    - Verify the policy configuration matches the application requirements

  2. Changes
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy that explicitly allows anonymous submissions
    - Ensure the policy uses the correct role (anon) for public access
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Public can submit contact forms" ON contact_submissions;

-- Create new INSERT policy for anonymous users
CREATE POLICY "Allow anonymous contact form submissions"
  ON contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure the policy also works for authenticated users
CREATE POLICY "Allow authenticated contact form submissions"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);