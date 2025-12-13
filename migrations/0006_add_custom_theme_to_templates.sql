-- Add custom_theme column to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS custom_theme TEXT;

