/*
  # Add company name, industry, and additional notes to contact submissions

  1. Schema Changes
    - Add `company_name` (text, optional)
    - Add `industry` (text, optional with predefined values)
    - Add `additional_notes` (text, optional)

  2. Constraints
    - Company name character limit
    - Industry enum validation
    - Additional notes character limit

  3. Indexes
    - Add index on company_name for filtering
    - Add index on industry for analytics
*/

-- Add new columns to contact_submissions table
DO $$
BEGIN
  -- Add company_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN company_name text;
  END IF;

  -- Add industry column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'industry'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN industry text;
  END IF;

  -- Add additional_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'additional_notes'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN additional_notes text;
  END IF;
END $$;

-- Add constraints for the new columns
DO $$
BEGIN
  -- Company name constraint (optional, max 200 characters)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'contact_submissions_company_name_check'
  ) THEN
    ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_company_name_check
    CHECK (company_name IS NULL OR (char_length(company_name) >= 1 AND char_length(company_name) <= 200));
  END IF;

  -- Industry constraint (optional, predefined values)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'contact_submissions_industry_check'
  ) THEN
    ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_industry_check
    CHECK (industry IS NULL OR industry IN (
      'technology',
      'healthcare',
      'finance',
      'retail',
      'manufacturing',
      'education',
      'real_estate',
      'consulting',
      'marketing',
      'legal',
      'hospitality',
      'transportation',
      'energy',
      'agriculture',
      'construction',
      'media',
      'nonprofit',
      'government',
      'other'
    ));
  END IF;

  -- Additional notes constraint (optional, max 2000 characters)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'contact_submissions_additional_notes_check'
  ) THEN
    ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_additional_notes_check
    CHECK (additional_notes IS NULL OR char_length(additional_notes) <= 2000);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_company_name 
ON contact_submissions(company_name) WHERE company_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_industry 
ON contact_submissions(industry) WHERE industry IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN contact_submissions.company_name IS 'Company name (optional, max 200 characters)';
COMMENT ON COLUMN contact_submissions.industry IS 'Industry sector (optional, predefined values)';
COMMENT ON COLUMN contact_submissions.additional_notes IS 'Additional notes or comments (optional, max 2000 characters)';