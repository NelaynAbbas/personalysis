-- Add AI generation jobs table
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL,
  generated_count INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add AI generation fields to survey_responses table
ALTER TABLE survey_responses 
ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_job_id INTEGER REFERENCES ai_generation_jobs(id);
