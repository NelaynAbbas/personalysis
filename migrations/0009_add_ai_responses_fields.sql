-- Add AI responses fields to surveys table
ALTER TABLE surveys 
ADD COLUMN enable_ai_responses BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_response_count INTEGER DEFAULT 10;
