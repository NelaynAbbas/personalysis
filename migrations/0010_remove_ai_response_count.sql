-- Remove AI response count field from surveys table
ALTER TABLE surveys DROP COLUMN IF EXISTS ai_response_count;
