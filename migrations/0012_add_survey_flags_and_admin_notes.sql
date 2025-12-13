-- Add survey flags and admin notes support

-- Create survey_flags table for tracking survey issues
CREATE TABLE IF NOT EXISTS survey_flags (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('missing_data', 'broken_logic', 'client_complaint', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_by_id INTEGER REFERENCES users(id),
  created_by_name TEXT,
  resolved_at TIMESTAMP,
  resolved_by_id INTEGER REFERENCES users(id),
  resolved_by_name TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add admin_note field to surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_flags_survey_id ON survey_flags(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_flags_status ON survey_flags(status);
CREATE INDEX IF NOT EXISTS idx_survey_flags_created_at ON survey_flags(created_at);

