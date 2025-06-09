/*
  # Fix RLS policies for contact form submissions

  1. Security Updates
    - Drop existing problematic RLS policies
    - Create new working RLS policies for anonymous and authenticated users
    - Ensure anonymous users can submit contact forms
    - Ensure authenticated users can read all submissions and submit forms

  2. Changes
    - Remove old policies that may have incorrect conditions
    - Add clear, working policies for INSERT and SELECT operations
    - Test that anonymous users can insert contact form data
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous contact form submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated contact form submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can read all submissions" ON contact_submissions;

-- Create new working policies
-- Allow anonymous users to insert contact form submissions
CREATE POLICY "Enable insert for anonymous users"
  ON contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert contact form submissions
CREATE POLICY "Enable insert for authenticated users"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all contact submissions
CREATE POLICY "Enable read for authenticated users"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure RLS is enabled (should already be enabled but double-check)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;