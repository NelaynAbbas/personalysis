-- Migration: Add survey templates and template questions tables
-- This migration creates the templates and template_questions tables for managing reusable survey templates

-- Create templates table for storing survey templates
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"estimated_time" integer,
	"question_count" integer,
	"traits" json,
	"is_active" boolean DEFAULT true,
	"survey_type" text NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create template_questions table for storing questions that belong to templates
CREATE TABLE "template_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"question" text NOT NULL,
	"question_type" text DEFAULT 'multiple-choice' NOT NULL,
	"required" boolean DEFAULT true,
	"help_text" text,
	"order" integer NOT NULL,
	"options" json,
	"custom_validation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for template_questions
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;

-- Add comments for documentation
COMMENT ON TABLE templates IS 'Stores reusable survey templates that can be used to create surveys';
COMMENT ON COLUMN templates.type IS 'Template type identifier (e.g., personality_profile, consumer_behavior)';
COMMENT ON COLUMN templates.title IS 'Display title for the template';
COMMENT ON COLUMN templates.description IS 'Description of what the template measures or assesses';
COMMENT ON COLUMN templates.estimated_time IS 'Estimated time in minutes to complete the survey';
COMMENT ON COLUMN templates.question_count IS 'Number of questions in the template';
COMMENT ON COLUMN templates.traits IS 'Array of personality traits or characteristics this template measures';
COMMENT ON COLUMN templates.is_active IS 'Whether this template is available for use';
COMMENT ON COLUMN templates.survey_type IS 'Category of survey (personality, consumer-preferences, etc.)';
COMMENT ON COLUMN templates.image IS 'Preview image URL for the template';

COMMENT ON TABLE template_questions IS 'Stores individual questions that belong to survey templates';
COMMENT ON COLUMN template_questions.template_id IS 'Reference to the parent template';
COMMENT ON COLUMN template_questions.question IS 'The question text';
COMMENT ON COLUMN template_questions.question_type IS 'Type of question (multiple-choice, text, slider, etc.)';
COMMENT ON COLUMN template_questions.required IS 'Whether the question is required to be answered';
COMMENT ON COLUMN template_questions.help_text IS 'Optional help text or instructions for the question';
COMMENT ON COLUMN template_questions.order IS 'Order/sequence of the question in the template';
COMMENT ON COLUMN template_questions.options IS 'JSON array of options for multiple-choice questions';
COMMENT ON COLUMN template_questions.custom_validation IS 'Custom validation rules for the question';
