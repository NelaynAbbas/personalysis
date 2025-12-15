const fs = require('fs');
const path = require('path');

// Read the Home.tsx file
const homeFile = './client/src/pages/Home.tsx';
let content = fs.readFileSync(homeFile, 'utf8');

// Define all the replacements needed for Home.tsx
const replacements = [
  // Hero Section
  ['AI-Powered Business Intelligence Platform', "t('pages.home.hero.badge')"],
  ['Transform Personality Data into <br/>', "t('pages.home.hero.title') + ' '"],
  ['Actionable Business Intelligence', "t('pages.home.hero.titleHighlight')"],
  ['Reveal deep customer insights with AI-driven personality analytics to fuel strategic, measurable growth.', "t('pages.home.hero.subtitle')"],
  ['Book a Demo', "t('pages.home.hero.bookDemo')"],
  ['How It Works', "t('pages.home.hero.howItWorks')"],

  // Features Section
  ['Predict Consumer Behavior with AI', "t('pages.home.features.badge')"],
  ['Advanced Personality Analytics', "t('pages.home.features.title')"],
  ['A powerful AI platform that blends psychology, analytics, and machine learning to unlock customer understanding, competitive positioning, and strategic market insights.', "t('pages.home.features.subtitle')"],
  ['Gamified Micro-Experiences', "t('pages.home.features.gamified.title')"],
  ['Interactive surveys designed to drive engagement and collect rich psychographic data effortlessly.', "t('pages.home.features.gamified.description')"],
  ['Identify Psychographic Profiles', "t('pages.home.features.psychographic.title')"],
  ['Advanced algorithms uncover actionable insights from customer behavior, going beyond traditional A/B testing to optimize decision-making.', "t('pages.home.features.psychographic.description')"],
  ['Hyper-Personalized CTAs', "t('pages.home.features.ctas.title')"],
  ['Dynamic call-to-action generation designed to deliver tailored offers, recommendations, and messages that maximize engagement.', "t('pages.home.features.ctas.description')"],

  // Business Intelligence
  ['Business Intelligence', "t('pages.home.features.businessIntelligence.badge')"],
  ['Turn Insights Into Strategic Advantage', "t('pages.home.features.businessIntelligence.title')"],
  ['Gain strategic clarity through a Business Intelligence Suite that decode behavior patterns and transform psychographic data into decision-ready business insights.', "t('pages.home.features.businessIntelligence.subtitle')"],

  // Industries
  ['Tailored for any Industry', "t('pages.home.industries.badge')"],
  ['Industry-Specific Solutions', "t('pages.home.industries.title')"],
  ['From market validation to hyper-personalized engagement, PersonalysisPro adapts to any industry's needs to drive performance.', "t('pages.home.industries.subtitle')"],

  // Benefits
  ['Why Choose PersonalysisPro?', "t('pages.home.benefits.title')"],
  ['Drive Business Growth', "t('pages.home.benefits.growth.title')"],
  ['Actionable Insights', "t('pages.home.benefits.insights.title')"],

  // Clients
  ['Trusted by Industry Leaders', "t('pages.home.clients.title')"],
  ['Join innovative companies and gain an edge over competitors', "t('pages.home.clients.subtitle')"],

  // CTA
  ['Ready to Transform Your Business?', "t('pages.home.cta.title')"],
  ['Discover how PersonalysisPro can help your business understand customers at a deeper level and make more informed strategic decisions.', "t('pages.home.cta.subtitle')"],
  ['Schedule a Demo', "t('pages.home.cta.scheduleDemo')"],

  // Login Dialog
  ['Business Login', "t('pages.home.loginDialog.title')"],
  ['Sign in to access your dashboard', "t('pages.home.loginDialog.description')"],
  ['Continue to Login', "t('pages.home.loginDialog.continueToLogin')"],

  // Demo Dialog - form fields
  ['Request a Demo', "t('pages.home.demoDialog.title')"],
  ['Fill the form to request a dedicated demo for PersonalysisPro.', "t('pages.home.demoDialog.description')"],
  ['Your first name', "t('pages.home.demoDialog.namePlaceholder')"],
  ['Your last name', "t('pages.home.demoDialog.surnamePlaceholder')"],
  ['your.email@company.com', "t('pages.home.demoDialog.emailPlaceholder')"],
  ['+1 (555) 000-0000', "t('pages.home.demoDialog.phonePlaceholder')"],
  ['Your company name', "t('pages.home.demoDialog.companyPlaceholder')"],
  ['Tell us about your specific needs or questions...', "t('pages.home.demoDialog.messagePlaceholder')"],
  ['Book Your Demo', "t('pages.home.demoDialog.bookDemo')"],
];

// Apply simple string replacements
replacements.forEach(([oldStr, newStr]) => {
  // Escape special regex characters in the search string
  const escapedOld = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`"${escapedOld}"`, 'g');
  content = content.replace(regex, `{${newStr}}`);
});

// Save the updated file
fs.writeFileSync(homeFile, content, 'utf8');
console.log('Home.tsx updated successfully with i18n translations');
