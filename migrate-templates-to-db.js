// Migration script to move hardcoded templates to database
// This script populates the templates and template_questions tables with existing template data

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Initialize database connection
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// Import schema
import { templates, templateQuestions } from "./shared/schema.js";

// Hardcoded templates data from the existing components
const hardcodedTemplates = [
  {
    id: "personality-profile",
    type: "personality_profile",
    title: "Unlock Your Inner Blueprint",
    description: "Discover the hidden dimensions of your personality that drive your decisions and relationships",
    estimatedTime: 8,
    questionCount: 42,
    traits: ["Big Five", "Values", "Cognitive Style", "Decision-Making", "Social Skills", "Risk Attitude"],
    isActive: true,
    surveyType: "personality",
    image: "/images/personality-profile.svg",
    questions: [
      {
        id: 1,
        question: "I see myself as someone who is talkative",
        questionType: "multiple-choice",
        required: true,
        order: 1,
        options: [
          { id: "opt1", text: "Strongly Disagree", value: "1" },
          { id: "opt2", text: "Disagree", value: "2" },
          { id: "opt3", text: "Neutral", value: "3" },
          { id: "opt4", text: "Agree", value: "4" },
          { id: "opt5", text: "Strongly Agree", value: "5" }
        ]
      },
      {
        id: 2,
        question: "I see myself as someone who tends to find fault with others",
        questionType: "multiple-choice",
        required: true,
        order: 2,
        options: [
          { id: "opt1", text: "Strongly Disagree", value: "1" },
          { id: "opt2", text: "Disagree", value: "2" },
          { id: "opt3", text: "Neutral", value: "3" },
          { id: "opt4", text: "Agree", value: "4" },
          { id: "opt5", text: "Strongly Agree", value: "5" }
        ]
      }
    ]
  },
  {
    id: "professional-profile",
    type: "professional_profile",
    title: "Reveal Your Professional Superpower",
    description: "Uncover your unique workplace strengths and the secret to your ideal career path",
    estimatedTime: 6,
    questionCount: 30,
    traits: ["Leadership", "Collaboration", "Time Management", "Conflict Resolution", "Innovation"],
    isActive: true,
    surveyType: "professional",
    image: "/images/professional-profile.svg",
    questions: []
  },
  {
    id: "consumer-behavior",
    type: "consumer_behavior",
    title: "Decode Your Shopping DNA",
    description: "Discover the invisible forces that shape your purchasing decisions and brand connections",
    estimatedTime: 5,
    questionCount: 25,
    traits: ["Price Sensitivity", "Brand Loyalty", "Research Approach", "Purchasing Speed", "Trend Adoption"],
    isActive: true,
    surveyType: "consumer-preferences",
    image: "/images/consumer-behavior.svg",
    questions: []
  },
  {
    id: "innovation-mindset",
    type: "innovation_mindset",
    title: "Unleash Your Creative Genius",
    description: "Map your unique innovation style and unlock your full creative potential",
    estimatedTime: 7,
    questionCount: 35,
    traits: ["Creative Thinking", "Problem Solving", "Risk Taking", "Future Orientation", "Adaptability"],
    isActive: true,
    surveyType: "innovation",
    image: "/images/innovation-mindset.svg",
    questions: []
  },
  {
    id: "sustainability-mindset",
    type: "sustainability_orientation",
    title: "Discover Your Earth Guardian Type",
    description: "Reveal how your values and choices are shaping the future of our planet",
    estimatedTime: 5,
    questionCount: 25,
    traits: ["Environmental Awareness", "Sustainable Practices", "Social Responsibility", "Future Outlook"],
    isActive: true,
    surveyType: "sustainability",
    image: "/images/sustainability-mindset.svg",
    questions: []
  },
  {
    id: "digital-behavior",
    type: "digital_behavior",
    title: "Map Your Digital Soul",
    description: "Explore how your online behaviors reveal your true digital identity and tech connections",
    estimatedTime: 6,
    questionCount: 30,
    traits: ["Tech Adoption", "Privacy Concerns", "Platform Preferences", "Content Consumption", "Social Media Use"],
    isActive: true,
    surveyType: "digital",
    image: "/images/digital-behavior.svg",
    questions: []
  },
  {
    id: "custom-template",
    type: "custom",
    title: "Craft Your Unique Discovery Journey",
    description: "Design a completely custom experience tailored to your specific exploration goals",
    estimatedTime: 0,
    questionCount: 0,
    traits: [],
    isActive: true,
    surveyType: "custom",
    image: "/images/custom-template.svg",
    questions: []
  }
];

async function migrateTemplates() {
  console.log("Starting template migration...");

  try {
    // Clear existing data (optional - remove in production)
    console.log("Clearing existing template data...");
    await db.delete(templateQuestions).execute();
    await db.delete(templates).execute();

    // Insert templates and their questions
    for (const templateData of hardcodedTemplates) {
      console.log(`Migrating template: ${templateData.title}`);

      // Insert template
      const insertedTemplate = await db.insert(templates).values({
        type: templateData.type,
        title: templateData.title,
        description: templateData.description,
        estimatedTime: templateData.estimatedTime,
        questionCount: templateData.questionCount,
        traits: templateData.traits,
        isActive: templateData.isActive,
        surveyType: templateData.surveyType,
        image: templateData.image,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: templates.id });

      const templateId = insertedTemplate[0].id;

      // Insert template questions if any exist
      if (templateData.questions && templateData.questions.length > 0) {
        for (const question of templateData.questions) {
          await db.insert(templateQuestions).values({
            templateId: templateId,
            question: question.question,
            questionType: question.questionType,
            required: question.required,
            helpText: question.helpText,
            order: question.order,
            options: question.options,
            customValidation: question.customValidation,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        console.log(`  - Inserted ${templateData.questions.length} questions`);
      }
    }

    console.log("Template migration completed successfully!");

  } catch (error) {
    console.error("Error during template migration:", error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTemplates()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateTemplates };
