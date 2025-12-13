-- Migration: Add missing fields to demo_requests table
-- This migration adds industry, company_size, and message columns that are used by forms but missing from the database

-- Add missing columns to demo_requests table
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS message text;

-- Add comments for documentation
COMMENT ON COLUMN demo_requests.industry IS 'Industry classification for the demo request';
COMMENT ON COLUMN demo_requests.company_size IS 'Size of the company requesting the demo';
COMMENT ON COLUMN demo_requests.message IS 'Optional message from the user requesting the demo';
