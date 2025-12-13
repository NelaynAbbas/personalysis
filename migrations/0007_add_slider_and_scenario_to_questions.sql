-- Add slider_config and scenario_text columns to survey_questions table

ALTER TABLE "survey_questions" ADD COLUMN "slider_config" json;
ALTER TABLE "survey_questions" ADD COLUMN "scenario_text" text;

