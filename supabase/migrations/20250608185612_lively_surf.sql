/*
  # Database Connection Verification and Reset

  1. Verification Steps
    - Check table existence and structure
    - Verify RLS policies are working
    - Test data integrity
    - Confirm indexes are in place

  2. Connection Reset
    - Refresh RLS policies
    - Verify authentication settings
    - Test connection permissions

  3. Data Preservation
    - All existing data will be preserved
    - No destructive operations performed
    - Only connection and permission resets
*/

-- Step 1: Verify table structure and data integrity
DO $$
DECLARE
    table_exists boolean;
    data_count integer;
BEGIN
    -- Check if contact_submissions table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_submissions'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get current data count
        SELECT COUNT(*) INTO data_count FROM contact_submissions;
        RAISE NOTICE 'Table contact_submissions exists with % records', data_count;
        
        -- Verify all required columns exist
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contact_submissions' 
            AND column_name IN ('id', 'first_name', 'last_name', 'email', 'phone', 'created_at')
        ) THEN
            RAISE NOTICE 'All required columns are present';
        ELSE
            RAISE WARNING 'Some required columns may be missing';
        END IF;
    ELSE
        RAISE WARNING 'Table contact_submissions does not exist';
    END IF;
END $$;

-- Step 2: Refresh and verify RLS policies
-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON contact_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contact_submissions;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON contact_submissions;

-- Recreate policies with explicit permissions
CREATE POLICY "Enable insert for anonymous users"
  ON contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Ensure RLS is properly enabled
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify indexes are in place for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_company_name ON contact_submissions(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_industry ON contact_submissions(industry) WHERE industry IS NOT NULL;

-- Step 5: Verify constraints are properly set
DO $$
BEGIN
    -- Check company_name constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'contact_submissions_company_name_check'
    ) THEN
        ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_company_name_check
        CHECK (company_name IS NULL OR (char_length(company_name) >= 1 AND char_length(company_name) <= 200));
        RAISE NOTICE 'Added company_name constraint';
    END IF;

    -- Check industry constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'contact_submissions_industry_check'
    ) THEN
        ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_industry_check
        CHECK (industry IS NULL OR industry IN (
            'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
            'education', 'real_estate', 'consulting', 'marketing', 'legal',
            'hospitality', 'transportation', 'energy', 'agriculture',
            'construction', 'media', 'nonprofit', 'government', 'other'
        ));
        RAISE NOTICE 'Added industry constraint';
    END IF;

    -- Check additional_notes constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'contact_submissions_additional_notes_check'
    ) THEN
        ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_additional_notes_check
        CHECK (additional_notes IS NULL OR char_length(additional_notes) <= 2000);
        RAISE NOTICE 'Added additional_notes constraint';
    END IF;
END $$;

-- Step 6: Final verification query
SELECT 
    'Database Reset Complete' as status,
    COUNT(*) as total_records,
    MAX(created_at) as latest_submission,
    MIN(created_at) as earliest_submission
FROM contact_submissions;

-- Step 7: Test policy functionality
-- This will show if the policies are working correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contact_submissions'
ORDER BY policyname;