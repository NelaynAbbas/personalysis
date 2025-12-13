-- Migration: Add missing business context and configuration columns to surveys table
-- This migration adds columns that are collected during survey creation but were missing from the database

-- Add business context columns for comprehensive survey data storage
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "product_name" text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "product_description" text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "product_category" text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "product_features" json;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "value_proposition" text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "competitors" json;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "target_market" json;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "industry" text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "pain_points" json;

-- Add survey configuration columns
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "survey_language" text DEFAULT 'en';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "enable_ai_insights" boolean DEFAULT true;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "enable_social_sharing" boolean DEFAULT true;

-- Add demographic collection settings
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "collect_age" boolean DEFAULT true;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "collect_gender" boolean DEFAULT true;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "collect_location" boolean DEFAULT true;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "collect_education" boolean DEFAULT false;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS "collect_income" boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN surveys.product_name IS 'Name of the product or service being surveyed';
COMMENT ON COLUMN surveys.product_description IS 'Description of the product or service';
COMMENT ON COLUMN surveys.product_category IS 'Category or industry of the product';
COMMENT ON COLUMN surveys.product_features IS 'JSON array of key product features';
COMMENT ON COLUMN surveys.value_proposition IS 'Unique value proposition of the product';
COMMENT ON COLUMN surveys.competitors IS 'JSON array of competitor objects with name and url';
COMMENT ON COLUMN surveys.target_market IS 'JSON array of target market segments';
COMMENT ON COLUMN surveys.industry IS 'Industry classification for the survey context';
COMMENT ON COLUMN surveys.pain_points IS 'JSON array of customer pain points';

COMMENT ON COLUMN surveys.survey_language IS 'Primary language for survey questions';
COMMENT ON COLUMN surveys.enable_ai_insights IS 'Enable AI-powered personality insights';
COMMENT ON COLUMN surveys.enable_social_sharing IS 'Allow respondents to share results';

COMMENT ON COLUMN surveys.collect_age IS 'Collect age demographic data';
COMMENT ON COLUMN surveys.collect_gender IS 'Collect gender demographic data';
COMMENT ON COLUMN surveys.collect_location IS 'Collect location demographic data';
COMMENT ON COLUMN surveys.collect_education IS 'Collect education level data';
COMMENT ON COLUMN surveys.collect_income IS 'Collect income range data';
