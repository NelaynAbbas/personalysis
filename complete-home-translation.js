/**
 * This script systematically updates Home.tsx with i18n translations
 * It handles JSX syntax and preserves code structure
 */

const fs = require('fs');

const homeFilePath = './client/src/pages/Home.tsx';
let content = fs.readFileSync(homeFilePath, 'utf8');

// Text replacements with proper JSX handling
const textReplacements = [
  // Hero section - badges and titles
  {
    from: '>AI-Powered Business Intelligence Platform<',
    to: '>{t(\'pages.home.hero.badge\')}<'
  },
  {
    from: 'Transform Personality Data into <br/>',
    to: '{t(\'pages.home.hero.title\')} <br/>'
  },
  {
    from: '>Actionable Business Intelligence<',
    to: '>{t(\'pages.home.hero.titleHighlight\')}<'
  },
  {
    from: 'Reveal deep customer insights with AI-driven personality analytics to fuel strategic, measurable growth.',
    to: '{t(\'pages.home.hero.subtitle\')}'
  },

  // Buttons
  {
    from: '                  Book a Demo\n                </Button>',
    to: '                  {t(\'pages.home.hero.bookDemo\')}\n                </Button>'
  },
  {
    from: '                    How It Works\n                  </Button>',
    to: '                    {t(\'pages.home.hero.howItWorks\')}\n                  </Button>'
  },

  // Features section
  {
    from: '>Predict Consumer Behavior with AI<',
    to: '>{t(\'pages.home.features.badge\')}<'
  },
  {
    from: '<h2 id="features-heading" className="text-4xl font-bold mb-6">Advanced Personality Analytics</h2>',
    to: '<h2 id="features-heading" className="text-4xl font-bold mb-6">{t(\'pages.home.features.title\')}</h2>'
  },
  {
    from: 'A powerful AI platform that blends psychology, analytics, and machine learning to unlock customer understanding, competitive positioning, and strategic market insights.',
    to: '{t(\'pages.home.features.subtitle\')}'
  },

  // Feature cards
  {
    from: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Gamified Micro-Experiences</h3>',
    to: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t(\'pages.home.features.gamified.title\')}</h3>'
  },
  {
    from: '<p className="text-gray-600 mb-6">Interactive surveys designed to drive engagement and collect rich psychographic data effortlessly.\n</p>',
    to: '<p className="text-gray-600 mb-6">{t(\'pages.home.features.gamified.description\')}\n</p>'
  },
  {
    from: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Identify Psychographic Profiles</h3>',
    to: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t(\'pages.home.features.psychographic.title\')}</h3>'
  },
  {
    from: '<p className="text-gray-600 mb-6">Advanced algorithms uncover actionable insights from customer behavior, going beyond traditional A/B testing to optimize decision-making.\n</p>',
    to: '<p className="text-gray-600 mb-6">{t(\'pages.home.features.psychographic.description\')}\n</p>'
  },
  {
    from: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Hyper-Personalized CTAs</h3>',
    to: '<h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t(\'pages.home.features.ctas.title\')}</h3>'
  },
  {
    from: '<p className="text-gray-600 mb-6">Dynamic call-to-action generation designed to deliver tailored offers, recommendations, and messages that maximize engagement.</p>',
    to: '<p className="text-gray-600 mb-6">{t(\'pages.home.features.ctas.description\')}</p>'
  },

  // Business Intelligence section
  {
    from: '>Business Intelligence<',
    to: '>{t(\'pages.home.features.businessIntelligence.badge\')}<'
  },
  {
    from: '<h3 className="text-3xl font-bold mb-6">Turn Insights Into Strategic Advantage</h3>',
    to: '<h3 className="text-3xl font-bold mb-6">{t(\'pages.home.features.businessIntelligence.title\')}</h3>'
  },
  {
    from: 'Gain strategic clarity through a Business Intelligence Suite that decode behavior patterns and transform psychographic data into decision-ready business insights.',
    to: '{t(\'pages.home.features.businessIntelligence.subtitle\')}'
  },
  {
    from: '                  <span>Dashboards highlight campaign performance and audience engagement</span>',
    to: '                  <span>{t(\'pages.home.features.businessIntelligence.feature1\')}</span>'
  },
  {
    from: '                  <span>Traits, behaviors and recommended products charts uncover drivers of decision-making and loyalty</span>',
    to: '                  <span>{t(\'pages.home.features.businessIntelligence.feature2\')}</span>'
  },
  {
    from: '                  <span>Compare against industry benchmarks, market fit, features priorities and much more</span>',
    to: '                  <span>{t(\'pages.home.features.businessIntelligence.feature3\')}</span>'
  },
  {
    from: '                  Explore more',
    to: '                  {t(\'pages.home.features.businessIntelligence.exploreMore\')}'
  },

  // Industries section
  {
    from: '>Tailored for any Industry<',
    to: '>{t(\'pages.home.industries.badge\')}<'
  },
  {
    from: '<h2 className="text-4xl font-bold mb-6">Industry-Specific Solutions</h2>',
    to: '<h2 className="text-4xl font-bold mb-6">{t(\'pages.home.industries.title\')}</h2>'
  },
  {
    from: 'From market validation to hyper-personalized engagement, PersonalysisPro adapts to any industry\'s needs to drive performance.',
    to: '{t(\'pages.home.industries.subtitle\')}'
  },

  // Finance industry
  {
    from: '<h3 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">Finance & Insurance</h3>',
    to: '<h3 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">{t(\'pages.home.industries.finance.title\')}</h3>'
  },
  {
    from: '<p className="text-gray-600 mb-6">Move beyond past data with predictive psychographic insights that let you design products, content, and acquisition strategies aligned with deeper consumer traits.</p>',
    to: '<p className="text-gray-600 mb-6">{t(\'pages.home.industries.finance.description\')}</p>'
  },

  // Benefits section
  {
    from: '<h2 className="text-3xl font-bold text-center mb-12">Why Choose PersonalysisPro?</h2>',
    to: '<h2 className="text-3xl font-bold text-center mb-12">{t(\'pages.home.benefits.title\')}</h2>'
  },
  {
    from: '<h3 className="text-2xl font-semibold mb-4">Drive Business Growth</h3>',
    to: '<h3 className="text-2xl font-semibold mb-4">{t(\'pages.home.benefits.growth.title\')}</h3>'
  },
  {
    from: '<h3 className="text-2xl font-semibold mb-4">Actionable Insights</h3>',
    to: '<h3 className="text-2xl font-semibold mb-4">{t(\'pages.home.benefits.insights.title\')}</h3>'
  },

  // Clients section
  {
    from: '<h2 id="clients-heading" className="text-2xl md:text-3xl font-bold mb-4">Trusted by Industry Leaders</h2>',
    to: '<h2 id="clients-heading" className="text-2xl md:text-3xl font-bold mb-4">{t(\'pages.home.clients.title\')}</h2>'
  },
  {
    from: '<p className="text-gray-600 mb-8">Join innovative companies and gain an edge over competitors</p>',
    to: '<p className="text-gray-600 mb-8">{t(\'pages.home.clients.subtitle\')}</p>'
  },

  // CTA section
  {
    from: '<h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>',
    to: '<h2 className="text-3xl font-bold mb-6">{t(\'pages.home.cta.title\')}</h2>'
  },
  {
    from: 'Discover how PersonalysisPro can help your business understand customers at a deeper level and make more informed strategic decisions.',
    to: '{t(\'pages.home.cta.subtitle\')}'
  },

  // Dialogs
  {
    from: '<DialogTitle>Business Login</DialogTitle>',
    to: '<DialogTitle>{t(\'pages.home.loginDialog.title\')}</DialogTitle>'
  },
  {
    from: 'Sign in to access your dashboard',
    to: '{t(\'pages.home.loginDialog.description\')}'
  },
  {
    from: '<DialogTitle className="text-2xl">Request a Demo</DialogTitle>',
    to: '<DialogTitle className="text-2xl">{t(\'pages.home.demoDialog.title\')}</DialogTitle>'
  },
  {
    from: 'Fill the form to request a dedicated demo for PersonalysisPro.',
    to: '{t(\'pages.home.demoDialog.description\')}'
  },
];

// Apply all replacements
textReplacements.forEach(({ from, to }) => {
  const count = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.split(from).join(to);
  if (count > 0) {
    console.log(`✓ Replaced "${from.substring(0, 50)}..." (${count} occurrences)`);
  }
});

// Write the updated content
fs.writeFileSync(homeFilePath, content, 'utf8');
console.log('\n✅ Home.tsx updated successfully with i18n translations');
console.log('Note: Please review the file and manually fix any JSX syntax issues if needed.');
