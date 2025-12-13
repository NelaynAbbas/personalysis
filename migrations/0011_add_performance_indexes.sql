-- Performance indexes for frequently queried columns

-- Users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
-- idx_companies_license_id exists from 0008, keep IF NOT EXISTS to be safe
CREATE INDEX IF NOT EXISTS idx_companies_license_id ON companies(license_id);

-- Surveys
CREATE INDEX IF NOT EXISTS idx_surveys_company_id ON surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_is_public ON surveys(is_public);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);

-- Survey Questions
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions("order");

-- Survey Responses (critical for analytics)
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_company_id ON survey_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed ON survey_responses(completed);
CREATE INDEX IF NOT EXISTS idx_survey_responses_ai_job_id ON survey_responses(ai_job_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_respondent_email ON survey_responses(respondent_email);

-- AI Generation Jobs
CREATE INDEX IF NOT EXISTS idx_ai_jobs_survey_id ON ai_generation_jobs(survey_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_generation_jobs(created_at);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_order ON template_questions("order");

-- Subscriptions / Invoices / Payments
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_start_date ON subscriptions(start_date);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date ON invoices(paid_date);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_company_id ON payment_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Support Tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to_id ON support_tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket_id ON support_ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_created_at ON support_ticket_comments(created_at);

-- Business Contexts
CREATE INDEX IF NOT EXISTS idx_business_contexts_company_id ON business_contexts(company_id);
CREATE INDEX IF NOT EXISTS idx_business_contexts_is_active ON business_contexts(is_active);
CREATE INDEX IF NOT EXISTS idx_business_contexts_created_at ON business_contexts(created_at);

-- Demo Requests
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_demo_requests_assigned_to ON demo_requests(assigned_to);

-- User Sessions / Activity
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_resource ON user_activity_logs(resource_type, resource_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_company_id ON integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- Client Survey Deployments
CREATE INDEX IF NOT EXISTS idx_client_deployments_client_id ON client_survey_deployments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deployments_survey_id ON client_survey_deployments(survey_id);
CREATE INDEX IF NOT EXISTS idx_client_deployments_status ON client_survey_deployments(status);
CREATE INDEX IF NOT EXISTS idx_client_deployments_deployment_date ON client_survey_deployments(deployment_date);

-- Blog
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category_id ON blog_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_author_id ON blog_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at);


