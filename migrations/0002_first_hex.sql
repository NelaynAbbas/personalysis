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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "product_name" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "product_description" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "product_category" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "product_features" json;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "value_proposition" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "competitors" json;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "target_market" json;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "pain_points" json;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "survey_language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "enable_ai_insights" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "enable_social_sharing" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "collect_age" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "collect_gender" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "collect_location" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "collect_education" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "collect_income" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;