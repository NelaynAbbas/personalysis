import { pgTable, text, serial, integer, json, timestamp, boolean, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles for platform access
export const UserRole = {
  // Platform administrator (you as the platform owner)
  PLATFORM_ADMIN: 'platform_admin',
  PLATFORM_SUPPORT: 'platform_support', // Support staff with limited admin access
  PLATFORM_BILLING: 'platform_billing', // Finance team with billing-related access
  
  // Business roles (your clients)
  BUSINESS_OWNER: 'business_owner',  // Can manage all aspects of the business account
  BUSINESS_ADMIN: 'business_admin',  // Can manage users and surveys but not billing
  BUSINESS_ANALYST: 'business_analyst', // Can view results and analytics only
  BUSINESS_USER: 'business_user',    // Basic user with limited permissions
  SURVEY_MANAGER: 'survey_manager',  // Can create and manage surveys
  REPORT_VIEWER: 'report_viewer',    // Can only view reports and results
} as const;

// Permissions (capability-based)
export const Permission = {
  // User management
  MANAGE_USERS: 'manage_users',           // Add/edit/delete users
  INVITE_USERS: 'invite_users',           // Invite new users
  
  // Survey management
  CREATE_SURVEY: 'create_survey',         // Create new surveys
  EDIT_SURVEY: 'edit_survey',             // Edit existing surveys
  DELETE_SURVEY: 'delete_survey',         // Delete surveys
  PUBLISH_SURVEY: 'publish_survey',       // Make surveys public
  
  // Data & analytics
  VIEW_RESPONSES: 'view_responses',       // View individual responses
  EXPORT_DATA: 'export_data',             // Export response data
  VIEW_ANALYTICS: 'view_analytics',       // View analytics dashboards
  VIEW_REPORTS: 'view_reports',           // View pre-built reports
  CREATE_REPORTS: 'create_reports',       // Create custom reports
  
  // Business management
  MANAGE_BILLING: 'manage_billing',       // Change/update billing
  MANAGE_SUBSCRIPTION: 'manage_subscription', // Change subscription
  MANAGE_COMPANY: 'manage_company',       // Edit company details
  MANAGE_API_KEYS: 'manage_api_keys',     // Create/revoke API keys
  
  // Integration management
  MANAGE_INTEGRATIONS: 'manage_integrations', // Connect/disconnect integrations
  
  // Platform admin permissions (for you as platform owner)
  PLATFORM_ADMIN_ACCESS: 'platform_admin_access',     // Access admin console
  MANAGE_CLIENT_ACCOUNTS: 'manage_client_accounts',   // Manage all client accounts
  MANAGE_LICENSES: 'manage_licenses',                 // Manage client licenses
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics', // View platform-wide analytics
  MANAGE_SUPPORT_TICKETS: 'manage_support_tickets',   // Manage support tickets
  SYSTEM_CONFIGURATION: 'system_configuration',       // Configure system settings
  BILLING_OPERATIONS: 'billing_operations',           // All billing operations
  FEATURE_MANAGEMENT: 'feature_management',           // Enable/disable features
  USER_IMPERSONATION: 'user_impersonation',           // Temporarily act as other users
} as const;

// License tiers for businesses (Plan types)
export const SubscriptionTier = {
  TRIAL: 'trial',         // Limited time trial access
  ANNUAL: 'annual',       // Annual license
  PROJECT: 'project'      // Project-based license
} as const;

// License status for businesses
export const LicenseStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
} as const;

// License types for clients
export const LicenseType = {
  PROJECT: 'project',  // Single survey, limited responses and seats
  ANNUAL: 'annual'     // Unlimited access with no limitations
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyId: integer("company_id").references(() => companies.id),
  role: text("role").default(UserRole.BUSINESS_USER).notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  isActive: boolean("is_active").default(true),
  profilePic: text("profile_pic"),
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  
  // Password reset
  passwordResetToken: text("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  passwordLastChanged: timestamp("password_last_changed"),
  
  // Multi-factor authentication
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"),
  
  // Account security
  loginAttempts: integer("login_attempts").default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  accountLocked: boolean("account_locked").default(false),
  accountLockedUntil: timestamp("account_locked_until"),
  
  // Tracking and timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  passwordSalt: text("password_salt"), // Store salt separately for better security
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  apiKey: text("api_key").notNull().unique(),
  
  // License and subscription information
  subscriptionTier: text("subscription_tier").default(SubscriptionTier.TRIAL).notNull(),
  licenseStatus: text("license_status").default(LicenseStatus.ACTIVE).notNull(),
  // Optional foreign key to a concrete license record
  licenseId: integer("license_id").references(() => licenses.id),
  licenseStartDate: timestamp("license_start_date").defaultNow().notNull(),
  licenseEndDate: timestamp("license_end_date"),
  trialEnds: timestamp("trial_ends"),
  
  // Company details
  logo: text("logo_url"),
  website: text("website"),
  industry: text("industry"),
  size: text("company_size"),
  primaryContact: text("primary_contact"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  
  // Feature limits based on license tier
  maxUsers: integer("max_users").default(3),
  maxSurveys: integer("max_surveys").default(2),
  maxResponses: integer("max_responses").default(100),
  maxStorage: integer("max_storage_gb").default(5),
  
  // Feature toggles
  customBranding: boolean("custom_branding").default(false),
  socialSharing: boolean("social_sharing").default(true),
  crmIntegration: boolean("crm_integration").default(false),
  aiInsights: boolean("ai_insights").default(false),
  advancedAnalytics: boolean("advanced_analytics").default(false),
  dataExport: boolean("data_export").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Business Context table for storing product and market information
export const businessContexts = pgTable("business_contexts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  
  // Company information
  industry: text("industry"),
  companySize: text("company_size"),
  companyStage: text("company_stage"),
  department: text("department"),
  role: text("role"),
  targetMarket: json("target_market"),  // Array of target markets
  
  // Product/Service information
  productName: text("product_name"),
  productDescription: text("product_description"),
  productCategory: text("product_category"),
  productFeatures: json("product_features"),  // Array of features
  valueProposition: text("value_proposition"),
  uniqueSellingPoints: json("unique_selling_points"),  // Array of USPs
  
  // Market analysis
  competitors: json("competitors"),  // Array of competitors
  marketPosition: text("market_position"),
  pricingStrategy: text("pricing_strategy"),
  
  // Decision making information
  decisionTimeframe: text("decision_timeframe"),
  budget: text("budget"),
  decisionMakers: json("decision_makers"),  // Array of decision makers
  
  // Challenges
  painPoints: json("pain_points"),  // Array of pain points
  currentSolutions: text("current_solutions"),
  desiredOutcomes: json("desired_outcomes"),  // Array of desired outcomes
  
  // Customer information
  idealCustomerProfile: text("ideal_customer_profile"),
  customerDemographics: text("customer_demographics"),
  customerPsychographics: text("customer_psychographics"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Surveys table for tracking all surveys created by companies
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),

  title: text("title").notNull(),
  description: text("description"),
  surveyType: text("survey_type").default("general").notNull(),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  accessCode: text("access_code"), // Optional access code for private surveys
  customLogo: text("custom_logo"),
  customTheme: text("custom_theme"),
  customCss: text("custom_css"),
  customWelcomeMessage: text("custom_welcome_message"),
  customCompletionMessage: text("custom_completion_message"),
  redirectUrl: text("redirect_url"),
  allowAnonymous: boolean("allow_anonymous").default(true),
  requireEmail: boolean("require_email").default(false),
  collectDemographics: boolean("collect_demographics").default(true),
  estimatedTime: integer("estimated_time_minutes"),
  maxResponses: integer("max_responses"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").default("active").notNull(),
  adminDeactivated: boolean("admin_deactivated").default(false), // Admin-side deactivation (blocks all client actions)
  responseCount: integer("response_count").default(0),
  completionRate: integer("completion_rate").default(0),

  // Business Context Columns - Added for comprehensive survey data storage
  productName: text("product_name"),
  productDescription: text("product_description"),
  productCategory: text("product_category"),
  productFeatures: json("product_features"), // Array of product features
  valueProposition: text("value_proposition"),
  competitors: json("competitors"), // Array of competitor objects with name and url
  targetMarket: json("target_market"), // Array of target market segments
  industry: text("industry"),
  painPoints: json("pain_points"), // Array of customer pain points

  // Survey Configuration Columns
  surveyLanguage: text("survey_language").default("en"),
  enableAIInsights: boolean("enable_ai_insights").default(true),
  enableSocialSharing: boolean("enable_social_sharing").default(true),

  // Demographic Collection Settings
  collectAge: boolean("collect_age").default(true),
  collectGender: boolean("collect_gender").default(true),
  collectLocation: boolean("collect_location").default(true),
  collectEducation: boolean("collect_education").default(false),
  collectIncome: boolean("collect_income").default(false),

  // AI Responses Settings
  enableAIResponses: boolean("enable_ai_responses").default(false),

  // Admin Management Fields
  adminNote: text("admin_note"), // Internal admin notes

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Survey questions customization
export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").default("multiple-choice").notNull(),
  required: boolean("required").default(true),
  helpText: text("help_text"),
  order: integer("order").notNull(),
  options: json("options"), // Array of options for multiple choice questions
  customValidation: text("custom_validation"),
  sliderConfig: json("slider_config"), // Store slider configuration (minLabel, maxLabel)
  scenarioText: text("scenario_text"), // Store scenario description text
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Survey Templates table for managing reusable survey templates
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // personality_profile, professional_profile, consumer_behavior, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedTime: integer("estimated_time"), // in minutes
  questionCount: integer("question_count"),
  traits: json("traits"), // Array of personality traits this template measures
  isActive: boolean("is_active").default(true),
  surveyType: text("survey_type").notNull(), // personality, consumer-preferences, employee-satisfaction, etc.
  image: text("image"), // Template preview image URL
  customTheme: text("custom_theme"), // Template theme (default, modern, classic, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Template Questions table for storing questions that belong to templates
export const templateQuestions = pgTable("template_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").default("multiple-choice").notNull(),
  required: boolean("required").default(true),
  helpText: text("help_text"),
  order: integer("order").notNull(),
  options: json("options"), // Array of options for multiple choice questions
  customValidation: text("custom_validation"),
  sliderConfig: json("slider_config"), // Store slider configuration (minLabel, maxLabel)
  scenarioText: text("scenario_text"), // Store scenario description text
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for templates
export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTemplateQuestionSchema = createInsertSchema(templateQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Template types
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type TemplateQuestion = typeof templateQuestions.$inferSelect;
export type InsertTemplateQuestion = z.infer<typeof insertTemplateQuestionSchema>;

// Define relations for templates
export const templatesRelations = relations(templates, ({ many }) => ({
  questions: many(templateQuestions)
}));

export const templateQuestionsRelations = relations(templateQuestions, ({ one }) => ({
  template: one(templates, {
    fields: [templateQuestions.templateId],
    references: [templates.id]
  })
}));

// AI Generation Jobs table for tracking AI response generation
export const aiGenerationJobs = pgTable("ai_generation_jobs", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(), // pending, running, completed, failed
  totalCount: integer("total_count").notNull(),
  generatedCount: integer("generated_count").default(0),
  progress: integer("progress").default(0), // percentage 0-100
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Survey responses schema
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  respondentId: text("respondent_id").notNull(),
  respondentEmail: text("respondent_email"),
  responses: json("responses").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  source: text("source"), // Where the response came from (e.g. direct, email, social)
  referrer: text("referrer"),
  startTime: timestamp("start_time").defaultNow().notNull(),
  completeTime: timestamp("complete_time"),
  
  // Analysis results
  traits: json("traits").notNull(),
  demographics: json("demographics").notNull(),
  genderStereotypes: json("gender_stereotypes"),
  productRecommendations: json("product_recommendations"),
  marketSegment: text("market_segment"),
  completed: boolean("completed").default(false).notNull(),
  
  // AI Generation flag
  isAIGenerated: boolean("is_ai_generated").default(false),
  aiJobId: integer("ai_job_id").references(() => aiGenerationJobs.id),
  
  // Feedback
  feedback: text("feedback"),
  satisfactionScore: integer("satisfaction_score"),
  
  // Processing features
  isAnonymized: boolean("is_anonymized").default(false),
  validationStatus: text("validation_status"),  // 'valid', 'invalid', 'pending'
  validationErrors: json("validation_errors"),  // JSON object containing validation errors
  processingStatus: text("processing_status").default("pending"), // 'pending', 'processed', 'failed'
  // Note: processing_errors column is defined in schema but missing from actual database
  // processingErrors: json("processing_errors"),  // JSON object containing processing errors
  qualityScore: integer("quality_score"), // Score from 0-100 indicating response quality
  completionTimeSeconds: integer("response_time_seconds"), // Time taken to complete in seconds
  exportCount: integer("export_count").default(0), // Number of times this response has been exported
  lastExportedAt: timestamp("last_exported_at"), // Timestamp of last export
  // Note: last_processed_at column is defined in schema but missing from actual database
  // lastProcessedAt: timestamp("last_processed_at"), // Timestamp of last processing
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Newsletter subscriptions table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscriptionSource: text("subscription_source").default("website_footer"),
  subscribed: boolean("subscribed").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  confirmationToken: text("confirmation_token"),
  confirmed: boolean("confirmed").default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cookie consent tracking for GDPR compliance
export const cookieConsents = pgTable("cookie_consents", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"), // For anonymous users
  userId: integer("user_id").references(() => users.id), // For logged-in users
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  
  // Cookie preferences
  necessary: boolean("necessary").default(true).notNull(),
  analytics: boolean("analytics").default(false).notNull(),
  marketing: boolean("marketing").default(false).notNull(),
  functional: boolean("functional").default(false).notNull(),
  
  // Metadata
  consentVersion: text("consent_version").default("1.0").notNull(),
  consentTimestamp: timestamp("consent_timestamp").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Location data for compliance
  country: text("country"),
  region: text("region"),
});

// Insert schemas for newsletter
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Insert schemas for cookie consent
export const insertCookieConsentSchema = createInsertSchema(cookieConsents).omit({
  id: true,
  consentTimestamp: true,
  updatedAt: true
});
export type InsertCookieConsent = z.infer<typeof insertCookieConsentSchema>;
export type CookieConsent = typeof cookieConsents.$inferSelect;

// Billing and subscription tables
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  planType: text("plan_type").default(SubscriptionTier.TRIAL).notNull(),
  status: text("status").default(LicenseStatus.ACTIVE).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethod: text("payment_method"),
  paymentDetails: json("payment_details"),
  billingCycle: text("billing_cycle").default("annual"), // annual, monthly, quarterly
  amount: integer("amount"),  // in cents
  currency: text("currency").default("USD"),
  discount: integer("discount").default(0), // in cents
  lastBillingDate: timestamp("last_billing_date"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelDate: timestamp("cancel_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Invoices for billing
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  invoiceNumber: text("invoice_number").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("USD").notNull(),
  tax: integer("tax").default(0), // in cents
  status: text("status").default("pending").notNull(), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  items: json("items").notNull(), // Line items
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Payment transaction records
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  transactionId: text("transaction_id").notNull(), // External payment provider transaction ID
  provider: text("provider").notNull(), // e.g., stripe, paypal, etc.
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // success, failed, pending, refunded
  paymentMethod: text("payment_method").notNull(), // credit_card, bank_transfer, etc.
  paymentMethodDetails: json("payment_method_details"), // Card type, last 4 digits, etc.
  refundedAmount: integer("refunded_amount").default(0), // in cents
  refundedAt: timestamp("refunded_at"),
  gatewayResponse: json("gateway_response"), // Raw response from payment provider
  errorMessage: text("error_message"),
  metadata: json("metadata"), // Additional data
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  
  // General settings
  general: json("general").notNull(),
  security: json("security").notNull(),
  notifications: json("notifications").notNull(),
  storage: json("storage").notNull(),
  userManagement: json("user_management").notNull(),
  appearance: json("appearance").notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id)
});

// Demo requests table to store demo booking requests
export const demoRequests = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  industry: text("industry"),
  companySize: text("company_size"),
  message: text("message"),
  notes: text("notes"),
  status: text("status").default("pending").notNull(), // pending, contacted, scheduled, completed, canceled
  scheduledDate: timestamp("scheduled_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  contactAttempts: integer("contact_attempts").default(0),
  lastContactAttempt: timestamp("last_contact_attempt"),
  viewed: boolean("viewed").default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Track user sessions and activity
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  browser: text("browser"),
  device: text("device"),
  os: text("os"),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  logoutTime: timestamp("logout_time"),
  sessionDuration: integer("session_duration"), // in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Audit logs for security and compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  action: text("action").notNull(), // e.g., login, create survey, update settings
  entityType: text("entity_type"), // e.g., user, survey, company
  entityId: text("entity_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

// Role-Permission mapping (defines what permissions each role has)
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // References UserRole
  permission: text("permission").notNull(), // References Permission
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq: unique("role_permission_unique").on(table.role, table.permission)
}));

// User-Permission overrides (grants or denies specific permissions to users)
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  permission: text("permission").notNull(), // References Permission
  granted: boolean("granted").default(true).notNull(), // true=grant, false=deny (override)
  grantedBy: integer("granted_by").references(() => users.id), // Who granted this permission
  reason: text("reason"), // Why this exception was granted
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary permissions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  unq: unique("user_permission_unique").on(table.userId, table.permission)
}));

// Support ticket priority levels
export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

// Support ticket status values
export const TicketStatus = {
  NEW: 'new',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CUSTOMER: 'waiting_for_customer',
  WAITING_FOR_THIRD_PARTY: 'waiting_for_third_party',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

// Support ticket types
export const TicketType = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  FEATURE_REQUEST: 'feature_request',
  ACCOUNT: 'account',
  USAGE: 'usage',
  GENERAL: 'general'
} as const;

// Integration types
export const IntegrationType = {
  CRM: 'crm',
  EMAIL: 'email',
  ANALYTICS: 'analytics'
} as const;

// Integration status values
export const IntegrationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CONFIGURED: 'configured',
  ERROR: 'error'
} as const;

// Integrations table for managing external service connections
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // crm, email, analytics
  provider: text("provider").notNull(), // e.g., Salesforce, HubSpot, Mailchimp
  status: text("status").default(IntegrationStatus.INACTIVE).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  apiUrl: text("api_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSynced: timestamp("last_synced"),
  config: json("config").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Licenses table for managing different license types and their details
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseKey: text("license_key").notNull().unique(),
  type: text("type").notNull(), // project or annual
  status: text("status").default("active").notNull(), // active, expired, suspended
  name: text("name").notNull(),
  description: text("description"),
  clientName: text("client_name"), // Optional client name for license assignment
  clientEmail: text("client_email"), // Optional client email for license assignment
  maxSurveys: integer("max_surveys").notNull(), // 1 for project, unlimited (-1) for annual
  maxResponses: integer("max_responses").notNull(),
  maxSeats: integer("max_seats").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  cost: integer("cost").default(0), // in cents
  features: json("features"), // Array of included features
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Clients table for management of client accounts in the admin console
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").default("pending").notNull(), // active, pending, inactive
  licenseId: integer("license_id").references(() => licenses.id), // Reference to the assigned license
  initialPassword: text("initial_password"), // Initial password for client account
  contactPhone: text("contact_phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Client survey deployments - links clients with survey templates
export const clientSurveyDeployments = pgTable("client_survey_deployments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  licenseId: integer("license_id").references(() => licenses.id), // Optional link to the license used for this deployment
  status: text("status").default("active").notNull(), // active, paused, completed
  deploymentDate: timestamp("deployment_date").defaultNow().notNull(),
  expirationDate: timestamp("expiration_date"), // Optional end date for time-limited deployments
  maxResponses: integer("max_responses"), // Optional limit on number of responses
  customBranding: boolean("custom_branding").default(false),
  customConfig: json("custom_config"), // Optional deployment-specific configuration
  responseCount: integer("response_count").default(0), // Track responses received

  lastResponseDate: timestamp("last_response_date"), // Track date of most recent response
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Business Intelligence Tables

// Market Fit Analysis Table
export const marketFitAnalyses = pgTable("market_fit_analyses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  productId: text("product_id").default("default").notNull(),
  overallFitScore: integer("overall_fit_score").notNull(),
  problemSolutionFit: integer("problem_solution_fit").notNull(),
  productMarketFit: integer("product_market_fit").notNull(),
  marketSizePotential: text("market_size_potential").notNull(), // JSON string
  customerNeedAlignment: integer("customer_need_alignment").notNull(),
  valuePropositionClarity: integer("value_proposition_clarity").notNull(),
  priceToValuePerception: integer("price_to_value_perception").notNull(),
  productDifferentiation: integer("product_differentiation").notNull(),
  competitiveAdvantage: text("competitive_advantage").notNull(), // JSON array as string
  marketChallenges: text("market_challenges").notNull(), // JSON array as string
  customerPainPoints: text("customer_pain_points").notNull(), // JSON array as string
  recommendations: text("recommendations").notNull(), // JSON array as string
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const competitorAnalyses = pgTable("competitor_analyses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  marketShare: integer("market_share").notNull(),
  strengthScore: integer("strength_score").notNull(),
  weaknessScore: integer("weakness_score").notNull(),
  overallThreatLevel: integer("overall_threat_level").notNull(),
  strengths: text("strengths").notNull(), // JSON array as string
  weaknesses: text("weaknesses").notNull(), // JSON array as string
  primaryCompetitiveAdvantage: text("primary_competitive_advantage"),
  keyWeakness: text("key_weakness"),
  pricingPosition: text("pricing_position"),
  customerSentiment: integer("customer_sentiment"),
  productFeatureComparison: text("product_feature_comparison"), // JSON object as string
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const customerSegments = pgTable("customer_segments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  percentageOfCustomers: integer("percentage_of_customers").notNull(),
  growthRate: integer("growth_rate"),
  dominantTraits: text("dominant_traits").notNull(), // JSON array as string
  demographicSummary: text("demographic_summary"), // JSON object as string
  purchaseBehavior: text("purchase_behavior"), // JSON object as string
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const productFeaturePriorities = pgTable("product_feature_priorities", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  featureName: text("feature_name").notNull(),
  featureId: text("feature_id").notNull(),
  description: text("description"),
  importance: integer("importance").notNull(),
  currentSatisfaction: integer("current_satisfaction"),
  developmentCost: integer("development_cost").notNull(),
  timeToImplement: text("time_to_implement"),
  impactOnSales: integer("impact_on_sales"),
  competitiveNecessity: integer("competitive_necessity"),
  technicalFeasibility: integer("technical_feasibility"),
  strategicAlignment: integer("strategic_alignment"),
  overallPriority: integer("overall_priority").notNull(),
  alignedTraits: text("aligned_traits"), // JSON array as string
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pricingStrategies = pgTable("pricing_strategies", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  strategyName: text("strategy_name").notNull(),
  strategyId: text("strategy_id").notNull(),
  appropriateness: integer("appropriateness"),
  potentialRevenue: integer("potential_revenue"),
  customerAcceptance: integer("customer_acceptance"),
  competitiveSustainability: integer("competitive_sustainability"),
  implementationComplexity: integer("implementation_complexity"),
  profitMargin: integer("profit_margin"),
  marketPenetration: integer("market_penetration"),
  overallScore: integer("overall_score").notNull(),
  priceElasticity: integer("price_elasticity"),
  pricingStructure: text("pricing_structure").notNull(), // JSON object as string
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const marketingStrategies = pgTable("marketing_strategies", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  strategyName: text("strategy_name").notNull(),
  strategyId: text("strategy_id").notNull(),
  effectiveness: integer("effectiveness").notNull(),
  costEfficiency: integer("cost_efficiency"),
  implementationTimeline: text("implementation_timeline"),
  revenueImpact: integer("revenue_impact"),
  brandAlignment: integer("brand_alignment"),
  customerReach: integer("customer_reach"),
  competitiveAdvantage: integer("competitive_advantage"),
  channelBreakdown: text("channel_breakdown").notNull(), // JSON object as string
  messagingThemes: text("messaging_themes").notNull(), // JSON array as string
  targetedPersonas: text("targeted_personas").notNull(), // JSON array as string
  overallScore: integer("overall_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const revenueForecasts = pgTable("revenue_forecasts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  scenario: text("scenario").notNull(),
  probabilityOfOccurrence: integer("probability_of_occurrence").notNull(),
  timeframe: text("timeframe").notNull(),
  projectedRevenue: integer("projected_revenue").notNull(),
  growthRate: integer("growth_rate").notNull(),
  marketShareProjection: integer("market_share_projection"),
  customerAdoption: integer("customer_adoption"),
  contributingFactors: text("contributing_factors"), // JSON array as string
  riskFactors: text("risk_factors"), // JSON array as string
  confidenceLevel: integer("confidence_level").notNull(),
  monthlyBreakdown: text("monthly_breakdown").notNull(), // JSON object as string
  revenueStreams: text("revenue_streams"), // JSON array as string
  totalProjectedRevenue: integer("total_projected_revenue").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  size: text("size"),
  path: text("path"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(), // e.g., TICK-1234
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Person who created the ticket
  assignedToId: integer("assigned_to_id").references(() => users.id), // Support staff assigned
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default(TicketPriority.MEDIUM).notNull(),
  status: text("status").default(TicketStatus.NEW).notNull(),
  type: text("type").default(TicketType.GENERAL).notNull(),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  attachments: json("attachments"), // Array of attachment URLs
  tags: json("tags"), // Array of tag strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Support ticket comments/replies
export const supportTicketComments = pgTable("support_ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Person who left the comment
  isInternal: boolean("is_internal").default(false).notNull(), // True if only visible to staff
  content: text("content").notNull(),
  attachments: json("attachments"), // Array of attachment URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDemoRequestSchema = createInsertSchema(demoRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSupportTicketCommentSchema = createInsertSchema(supportTicketComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});



export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessContextSchema = createInsertSchema(businessContexts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Select schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;

// Create insert schemas for billing
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;



export type BusinessContextTable = typeof businessContexts.$inferSelect;
export type InsertBusinessContext = z.infer<typeof insertBusinessContextSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicketComment = typeof supportTicketComments.$inferSelect;
export type InsertSupportTicketComment = z.infer<typeof insertSupportTicketCommentSchema>;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;

// License schema
export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Client schema
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// Client survey deployment schema
export const insertClientSurveyDeploymentSchema = createInsertSchema(clientSurveyDeployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ClientSurveyDeployment = typeof clientSurveyDeployments.$inferSelect;
export type InsertClientSurveyDeployment = z.infer<typeof insertClientSurveyDeploymentSchema>;

// Integration schema
export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type DemoRequest = typeof demoRequests.$inferSelect;
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;

// Define a type for personality traits
export type PersonalityTrait = {
  name: string;
  score: number;
  category: string;
};

// SurveyAnalytics interface for survey analysis data - fixes missing property compilation errors
export interface SurveyAnalytics {
  surveyId?: number;
  totalResponses: number;
  responseCount?: number;
  completionRate: number;
  averageCompletionTime: number;
  averageTimeSpent: number;
  averageRating?: number;
  uniqueRespondents?: number;
  activeRespondents?: number; // Currently taking the survey (active sessions)
  lastResponseTime?: Date;
  personalityTraits?: PersonalityTrait[];
  traitDistribution: { [key: string]: number };
  demographics: any;
  responsesByDate?: any;
  responseRates?: any;
  surveyDetails?: any;
}

// Demographics interface for consistent demographic data structure
export interface Demographics {
  age?: number;
  gender?: string;
  location?: string;
  education?: string;
  income?: string;
  occupation?: string;
  interests?: string[];
  ethnicBackground?: string;
  maritalStatus?: string;
  householdSize?: number;
}

// SimulatedFocusGroup interface for focus group simulation data
export interface SimulatedFocusGroup {
  productConcept: string;
  participants: Array<{
    traits: PersonalityTrait[];
    demographics: {
      age: number;
      gender: string;
      occupation: string;
      education: string;
      industry: string;
    };
  }>;
  overallSentiment: number;
  keyThemes: { [key: string]: number };
  suggestedImprovements: string[];
  purchaseIntent: number;
  pricePerception: string;
  valuePerception: number;
  featureFeedback: { [key: string]: number };
  competitiveComparisons: { [key: string]: number };
  participantQuotes: string[];
}

// Collaboration tables
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  surveyId: integer("survey_id").references(() => surveys.id).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  metadata: json("metadata"),
  status: text("status").default("active").notNull(), // active, completed, archived
  visibility: text("visibility").default("private").notNull(), // private, team, public
  version: integer("version").default(1).notNull(), // For tracking survey version being edited
  lockTimeout: integer("lock_timeout").default(30000), // Time in ms before locks expire
  currentLocks: json("current_locks"), // Currently locked elements and by whom
  customPermissions: json("custom_permissions"), // Special permission rules for this session
  invitedUsers: integer("invited_users").array(), // Users specifically invited to join
  reviewStatus: text("review_status").default("not_reviewed"), // not_reviewed, under_review, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const collaborationParticipants = pgTable("collaboration_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborationSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  role: text("role").default("editor").notNull(), // editor, viewer, commentator
  cursor: json("cursor"), // Current cursor position {x, y}
  status: text("status").default("online").notNull(), // online, idle, offline
  color: text("color"), // User's color in the collaboration session
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  unq: unique("session_user_unique").on(table.sessionId, table.userId)
}));

export const collaborationChanges = pgTable("collaboration_changes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborationSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  entityType: text("entity_type").notNull(), // survey, question, option, choice, surveySettings
  entityId: integer("entity_id").notNull(),
  changeType: text("change_type").notNull(), // create, update, delete, reorder
  field: text("field"), // Which specific field was changed (e.g., "question", "required", "order")
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  appliedBy: integer("applied_by").references(() => users.id), // Person who applied/approved the change
  status: text("status").default("applied").notNull() // pending, applied, rejected, conflicted
});

export const collaborationComments: any = pgTable("collaboration_comments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborationSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  entityType: text("entity_type").notNull(), // survey, question, option, choice
  entityId: integer("entity_id").notNull(),
  comment: text("comment").notNull(),
  resolved: boolean("resolved").default(false),
  resolvedById: integer("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  parentId: integer("parent_id"), // For threaded comments - will add reference after table creation
  mentions: text("mentions").array(), // User IDs mentioned in the comment
  priority: text("priority").default("normal"), // high, normal, low
  category: text("category"), // suggestion, issue, question, general
  attachments: json("attachments"), // URLs or references to attached files
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define a type for individual survey answers
export type SurveyAnswer = {
  questionId: number;
  answer: string;
};





// Define business context information for better survey targeting and AI analysis
export type BusinessContext = {
  // Company information
  industry?: string;
  companySize?: string;
  companyStage?: 'startup' | 'growth' | 'established' | 'enterprise';
  department?: string;
  role?: string;
  targetMarket?: string[];
  
  // Product/Service information
  productName?: string;
  productDescription?: string;
  productCategory?: string;
  productFeatures?: string[];
  valueProposition?: string;
  uniqueSellingPoints?: string[];
  
  // Market analysis
  competitors?: string[];
  marketPosition?: 'leader' | 'challenger' | 'follower' | 'niche';
  pricingStrategy?: string;
  
  // Decision making information
  decisionTimeframe?: string;
  budget?: string;
  decisionMakers?: string[];
  
  // Challenges
  painPoints?: string[];
  currentSolutions?: string;
  desiredOutcomes?: string[];
  
  // Customer information
  idealCustomerProfile?: string;
  customerDemographics?: string;
  customerPsychographics?: string;
};



// Define gender stereotype detection
export type GenderStereotype = {
  trait: string;
  score: number;
  stereotypeType: 'male' | 'female' | 'neutral';
  description: string;
};

// Define product recommendations
export type ProductRecommendation = {
  category: string;
  products: {
    name: string;
    confidence: number;
    description: string;
    attributes: string[];
  }[];
  reason: string;
};

// Export validation schema for question display in UI
export const surveyQuestionUiSchema = z.object({
  id: z.number(),
  type: z.enum(["text", "image", "multiple-choice", "slider", "ranking", "scenario", "mood-board", "personality-matrix"]),
  question: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  traitMapping: z.array(
    z.object({
      trait: z.string(),
      valueMapping: z.record(z.string(), z.number()).optional(),
      scoreMultiplier: z.number().optional()
    })
  ).optional(),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      value: z.string(),
      image: z.string().optional(),
      description: z.string().optional(),
      traits: z.record(z.string(), z.number()).optional()
    })
  )
});

export type SurveyQuestionUi = z.infer<typeof surveyQuestionUiSchema>;

// New types for enhanced business analysis features

export type CompetitorAnalysis = {
  competitorId: string;
  competitorName: string;
  customerTraits: PersonalityTrait[];
  marketShare: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
};

export type MarketFitAnalysis = {
  productId: string;
  productName: string;
  overallFitScore: number;
  segmentFitScores: {
    segmentName: string;
    score: number;
    potential: number;
  }[];
  traitAlignments: {
    trait: string;
    alignment: number;
  }[];
  marketSizePotential: {
    total: number;
    addressable: number;
    serviceable: number;
  };
};

export type CustomerSegment = {
  id: string;
  name: string;
  size: number;
  percentOfTotal: number;
  dominantTraits: {
    trait: string;
    score: number;
  }[];
  demographicSummary: {
    averageAge?: number;
    dominantGender?: string;
    averageIncome?: string;
    topLocations?: string[];
    topInterests?: string[];
  };
  purchaseBehavior?: {
    averageOrderValue?: number;
    purchaseFrequency?: number;
    loyaltyScore?: number;
  };
};

export type ProductFeaturePriority = {
  featureId: string;
  featureName: string;
  description: string;
  overallAppeal: number;
  segmentAppeal: Record<string, number>;
  developmentCost: number;
  timeToImplement: number;
  roi: number;
  alignedTraits: {
    trait: string;
    strength: number;
  }[];
};

// Database schema type for pricing strategies
export type DbPricingStrategy = typeof pricingStrategies.$inferSelect;

// Insert schema for pricing strategies
export const insertDbPricingStrategySchema = createInsertSchema(pricingStrategies).omit({
  id: true,
  createdAt: true
});

export type InsertDbPricingStrategy = z.infer<typeof insertDbPricingStrategySchema>;

// Business logic type for pricing strategies (used in memory storage and frontend)
export type PricingStrategy = {
  strategyId: string;
  name: string;
  tiers: {
    tierName: string;
    price: number;
    features: string[];
    targetSegments: string[];
    estimatedAdoption: number;
    estimatedRevenue: number;
  }[];
  optimalPrice: number;
  priceElasticity: number;
  willingness: {
    segment: string;
    price: number;
  }[];
};

export type MarketingStrategy = {
  strategyId: string;
  name: string;
  targetSegments: string[];
  channels: {
    channelName: string;
    effectiveness: number;
    costPerAcquisition: number;
    recommendedBudget: number;
  }[];
  messaging: {
    keyMessages: string[];
    toneOfVoice: string;
    valuePropositions: string[];
  };
  campaignIdeas: {
    name: string;
    description: string;
    targetTrait: string;
    estimatedResponse: number;
  }[];
};

export type RevenueForecasting = {
  scenario: string;
  probabilityOfOccurrence: number;
  timeframe: string;
  projectedRevenue: number;
  growthRate: number;
  marketShareProjection: number;
  customerAdoption: number;
  contributingFactors: string[];
  riskFactors: string[];
  confidenceLevel: number;
  monthlyBreakdown: Record<string, number>;
};



// Export types for collaboration features
// Define relations for collaboration tables
export const collaborationSessionsRelations = relations(collaborationSessions, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [collaborationSessions.surveyId],
    references: [surveys.id]
  }),
  creator: one(users, {
    fields: [collaborationSessions.createdById],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [collaborationSessions.reviewedBy],
    references: [users.id],
    relationName: "sessionReviewer"
  }),
  participants: many(collaborationParticipants),
  changes: many(collaborationChanges),
  comments: many(collaborationComments)
}));

export const collaborationParticipantsRelations = relations(collaborationParticipants, ({ one }) => ({
  session: one(collaborationSessions, {
    fields: [collaborationParticipants.sessionId],
    references: [collaborationSessions.id]
  }),
  user: one(users, {
    fields: [collaborationParticipants.userId],
    references: [users.id]
  })
}));

export const collaborationChangesRelations = relations(collaborationChanges, ({ one }) => ({
  session: one(collaborationSessions, {
    fields: [collaborationChanges.sessionId],
    references: [collaborationSessions.id]
  }),
  user: one(users, {
    fields: [collaborationChanges.userId],
    references: [users.id]
  }),
  applier: one(users, {
    fields: [collaborationChanges.appliedBy],
    references: [users.id],
    relationName: "changeApplier"
  })
}));

export const collaborationCommentsRelations = relations(collaborationComments, ({ one, many }) => ({
  session: one(collaborationSessions, {
    fields: [collaborationComments.sessionId],
    references: [collaborationSessions.id]
  }),
  user: one(users, {
    fields: [collaborationComments.userId],
    references: [users.id]
  }),
  resolver: one(users, {
    fields: [collaborationComments.resolvedById],
    references: [users.id],
    relationName: "commentResolver"
  }),
  parentComment: one(collaborationComments, {
    fields: [collaborationComments.parentId],
    references: [collaborationComments.id],
    relationName: "parentChildComments"
  }),
  replies: many(collaborationComments, {
    relationName: "parentChildComments"
  })
}));

export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type CollaborationParticipant = typeof collaborationParticipants.$inferSelect;
export type CollaborationChange = typeof collaborationChanges.$inferSelect;
export type CollaborationComment = typeof collaborationComments.$inferSelect;

// Insert schemas for collaboration
export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCollaborationParticipantSchema = createInsertSchema(collaborationParticipants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCollaborationChangeSchema = createInsertSchema(collaborationChanges).omit({
  id: true,
  appliedAt: true,
  createdAt: true
});

export const insertCollaborationCommentSchema = createInsertSchema(collaborationComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type InsertCollaborationParticipant = z.infer<typeof insertCollaborationParticipantSchema>;
export type InsertCollaborationChange = z.infer<typeof insertCollaborationChangeSchema>;
export type InsertCollaborationComment = z.infer<typeof insertCollaborationCommentSchema>;

// Types for WebSocket messages
export type CollaborationAction = 
  // Session management
  | { type: 'JOIN_SESSION', sessionId: number, userId: number }
  | { type: 'LEAVE_SESSION', sessionId: number, userId: number }
  | { type: 'UPDATE_CURSOR', sessionId: number, userId: number, position: { x: number, y: number } }
  | { type: 'USER_STATUS', sessionId: number, userId: number, status: string }
  
  // Basic collaboration
  | { type: 'ADD_CHANGE', change: InsertCollaborationChange }
  | { type: 'ADD_COMMENT', comment: InsertCollaborationComment }
  | { type: 'RESOLVE_COMMENT', commentId: number, userId: number }
  | { type: 'REPLY_TO_COMMENT', parentCommentId: number, comment: InsertCollaborationComment }
  
  // Survey specific actions 
  | { type: 'ADD_QUESTION', sessionId: number, surveyId: number, question: any, position?: number }
  | { type: 'UPDATE_QUESTION', sessionId: number, questionId: number, updates: any }
  | { type: 'DELETE_QUESTION', sessionId: number, questionId: number }
  | { type: 'REORDER_QUESTION', sessionId: number, questionId: number, newPosition: number }
  | { type: 'ADD_QUESTION_OPTION', sessionId: number, questionId: number, option: any, position?: number }
  | { type: 'UPDATE_QUESTION_OPTION', sessionId: number, questionId: number, optionId: number, updates: any }
  | { type: 'DELETE_QUESTION_OPTION', sessionId: number, questionId: number, optionId: number }
  | { type: 'REORDER_QUESTION_OPTION', sessionId: number, questionId: number, optionId: number, newPosition: number }
  | { type: 'UPDATE_SURVEY_SETTINGS', sessionId: number, surveyId: number, settings: any }
  
  // Element locking
  | { type: 'LOCK_ELEMENT', sessionId: number, elementType: string, elementId: number, userId: number }
  | { type: 'UNLOCK_ELEMENT', sessionId: number, elementType: string, elementId: number, userId: number }
  
  // Version control
  | { type: 'CREATE_VERSION', sessionId: number, surveyId: number, versionName: string, versionNotes?: string }
  | { type: 'SWITCH_VERSION', sessionId: number, surveyId: number, versionId: number }
  | { type: 'MERGE_VERSION', sessionId: number, sourceSurveyId: number, targetSurveyId: number, resolutionStrategy?: string }
  
  // Review process
  | { type: 'REQUEST_REVIEW', sessionId: number, surveyId: number, requestedById: number, notes?: string }
  | { type: 'SUBMIT_REVIEW', sessionId: number, surveyId: number, reviewerId: number, status: 'approved' | 'rejected', comments?: string }
  
  // Synchronization 
  | { type: 'SYNC_REQUEST', sessionId: number, userId: number }
  | { type: 'SYNC_RESPONSE', sessionId: number, data: any }
  
  // Notifications and errors
  | { type: 'NOTIFICATION', sessionId: number, message: string, level: 'info' | 'warning' | 'error' }
  | { type: 'ERROR', message: string };

// WebSocket message types for real-time communication
export interface ConnectionMessage {
  type: 'connection';
  userId: number;
  role: string;
  status?: string;
  clientId?: string;
}

export interface SystemUpdateData {
  type: 'systemUpdate';
  updateType: 'metrics';
  cpu: { usage: number };
  memory: { usage: number; heapUsed: number; heapTotal: number };
  activeConnections: { total: number; websocket: number; http: number };
  status: string;
  timestamp: string;
}



export interface SurveyAnalyticsUpdateData {
  type: 'surveyAnalyticsUpdate';
  surveyId: number;
  metrics: {
    totalResponses: number;
    completionRate: number;
    averageTimeSpent: number;
    averageRating?: number;
    uniqueRespondents?: number;
    lastResponseTime?: string;
    averageCompletionTime: number;
    traitDistribution: { [key: string]: number };
  };
  demographics?: any;
  responseRates?: any;
  timestamp: string;
}

export interface SurveyResponseReceivedData {
  type: 'surveyResponseReceived';
  surveyId: number;
  responseId: number;
  isAnonymous: boolean;
  isComplete: boolean;
  completionTimeSeconds: number;
  questionCount: number;
  answeredCount: number;
  timestamp: string;
}

// Admin panel types
export type AdminTicket = {
  id: number;
  ticketNumber: string;
  subject: string;
  companyId: number;
  companyName: string;
  userId: number;
  userName: string;
  assignedToId: number | null;
  assignedToName?: string;
  status: string;
  priority: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminCompany = {
  id: number;
  name: string;
  subscriptionTier: string;
  licenseStatus: string;
  licenseStartDate: Date;
  licenseEndDate: Date | null;
  trialEnds: Date | null;
  userCount: number;
  maxUsers: number;
  surveyCount: number;
  maxSurveys: number;
  responseCount: number;
  maxResponses: number;
  email: string;
  industry: string;
  size: string;
};

export const NotificationType = {
  SYSTEM: 'system',
  ALERT: 'alert',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  link: varchar("link", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"),
  expiresAt: timestamp("expiresAt")
});

// System backups for database/system backup management
export const systemBackups = pgTable("system_backups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'auto' or 'manual'
  status: varchar("status", { length: 20 }).notNull(), // 'completed', 'in-progress', 'failed'
  size: varchar("size", { length: 50 }),
  path: varchar("path", { length: 255 }),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationSchema = createInsertSchema(notifications)
  .omit({ 
  });

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// System backups schema and types
export const insertSystemBackupSchema = createInsertSchema(systemBackups)
  .omit({
  id: true,
  createdAt: true
  });

export type SystemBackup = typeof systemBackups.$inferSelect;
export type InsertSystemBackup = z.infer<typeof insertSystemBackupSchema>;

// ============== Table Relations ==============

// Define explicit relations for surveys
export const surveysRelations = relations(surveys, ({ many }) => ({
  questions: many(surveyQuestions),
  responses: many(surveyResponses)
}));

// Define explicit relations for survey questions
export const surveyQuestionsRelations = relations(surveyQuestions, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyQuestions.surveyId],
    references: [surveys.id]
  })
}));

// Define explicit relations for survey responses
export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id]
  }),
  company: one(companies, {
    fields: [surveyResponses.companyId],
    references: [companies.id]
  })
}));

// Survey Flags table for tracking survey issues
export const surveyFlags = pgTable("survey_flags", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => surveys.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'missing_data', 'broken_logic', 'client_complaint', 'other'
  description: text("description").notNull(),
  status: text("status").default("open").notNull(), // 'open', 'resolved'
  createdById: integer("created_by_id").references(() => users.id),
  createdByName: text("created_by_name"),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: integer("resolved_by_id").references(() => users.id),
  resolvedByName: text("resolved_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User activity logs for tracking all user actions
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // login, logout, password_reset, profile_update, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resourceType: text("resource_type"), // survey, response, company, user, etc.
  resourceId: integer("resource_id"), // ID of the affected resource
  details: json("details").default({}),
  status: text("status").default("success"), // success, failure, attempt
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User invitations
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").default(UserRole.BUSINESS_USER).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted, expired
  acceptedById: integer("accepted_by_id").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Blog Categories table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  articleCount: integer("article_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Blog Articles table
export const blogArticles = pgTable("blog_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  status: text("status").default("draft").notNull(), // published, draft, archived, scheduled
  categoryId: integer("category_id").references(() => blogCategories.id).notNull(),
  tags: json("tags").default([]), // Array of tag strings
  authorId: integer("author_id").references(() => users.id).notNull(),
  featuredImage: text("featured_image"),
  viewCount: integer("view_count").default(0),
  publishedAt: timestamp("published_at"),
  scheduledPublishDate: timestamp("scheduled_publish_date"),

  // SEO fields
  seo: json("seo").default({
    metaTitle: null,
    metaDescription: null,
    ogImage: null
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define explicit relations for users
export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  activityLogs: many(userActivityLogs),
  blogArticles: many(blogArticles)
}));

// Define explicit relations for blog categories
export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  articles: many(blogArticles)
}));

// Define explicit relations for blog articles
export const blogArticlesRelations = relations(blogArticles, ({ one, many }) => ({
  category: one(blogCategories, {
    fields: [blogArticles.categoryId],
    references: [blogCategories.id]
  }),
  author: one(users, {
    fields: [blogArticles.authorId],
    references: [users.id]
  })
}));

// Insert schemas for blog tables
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Blog types
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
