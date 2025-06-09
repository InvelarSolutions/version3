/*
  # Fix contact submissions RLS policies

  1. Policy Updates
    - Ensure both anonymous and authenticated users can insert
    - Simplify policy structure to avoid conflicts
    - Add proper documentation

  2. Security
    - Maintain read access for authenticated users only
    - Allow public form submissions (standard for contact forms)
*/

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON contact_submissions;

-- Create a single comprehensive insert policy that works for all users
CREATE POLICY "Public can submit contact forms"
  ON contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Keep the read policy for authenticated users (admin access)
CREATE POLICY "Authenticated users can read all submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Add policy documentation
COMMENT ON POLICY "Public can submit contact forms" ON contact_submissions 
IS 'Allows anyone (anonymous or authenticated) to submit contact form data';

COMMENT ON POLICY "Authenticated users can read all submissions" ON contact_submissions 
IS 'Allows authenticated admin users to read all contact submissions';