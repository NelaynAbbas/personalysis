-- Add slider_config and scenario_text columns to template_questions table
ALTER TABLE template_questions 
ADD COLUMN IF NOT EXISTS slider_config JSON,
ADD COLUMN IF NOT EXISTS scenario_text TEXT;

