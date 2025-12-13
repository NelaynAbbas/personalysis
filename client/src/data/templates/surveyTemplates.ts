/**
 * Survey Template Types
 */
export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions: SurveyTemplateQuestion[];
  estimatedCompletionTime: number; // minutes
  tags: string[];
}

export interface SurveyTemplateQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'likert' | 'open_ended';
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  maxLength?: number;
  minRating?: number;
  maxRating?: number;
}

/**
 * Survey Templates
 */
export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'customer-satisfaction',
    name: 'Customer Delight Detective',
    description: 'Uncover the secrets to customer happiness and discover magic moments to improve',
    category: 'Customer Feedback',
    estimatedCompletionTime: 3,
    tags: ['customer', 'satisfaction', 'feedback', 'service', 'delight'],
    questions: [
      {
        id: 'cs-1',
        type: 'rating',
        question: 'How satisfied are you with our product/service?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'cs-2',
        type: 'single_choice',
        question: 'How likely are you to recommend our product/service to others?',
        options: [
          'Very unlikely',
          'Unlikely',
          'Neutral',
          'Likely',
          'Very likely'
        ],
        required: true
      },
      {
        id: 'cs-3',
        type: 'multiple_choice',
        question: 'Which aspects of our product/service do you value the most?',
        options: [
          'Quality',
          'Price',
          'Customer service',
          'Reliability',
          'User experience',
          'Features'
        ],
        required: false
      },
      {
        id: 'cs-4',
        type: 'open_ended',
        question: 'How could we improve our product/service?',
        required: false,
        maxLength: 1000
      },
      {
        id: 'cs-bc-1',
        type: 'single_choice',
        question: 'As a business leader, how would you prioritize budget allocation for customer experience tools?',
        options: [
          'Innovation focus - investing in cutting-edge solutions',
          'Operational efficiency - streamlining existing processes',
          'Customer acquisition - growing your customer base',
          'Team training - enhancing your staff capabilities'
        ],
        required: false
      },
      {
        id: 'cs-bc-2',
        type: 'multiple_choice',
        question: 'Which industry challenges impact your customer service decisions most significantly?',
        options: [
          'Regulatory compliance requirements',
          'Intense competition in your market',
          'Rapid technological changes',
          'Talent acquisition difficulties',
          'Supply chain constraints'
        ],
        required: false
      }
    ]
  },
  {
    id: 'product-feedback',
    name: 'Product Power-Up Quest',
    description: 'Embark on a journey to uncover hidden product gems and unlock new feature potential',
    category: 'Product Development',
    estimatedCompletionTime: 5,
    tags: ['product', 'feedback', 'features', 'usability', 'quest'],
    questions: [
      {
        id: 'pf-1',
        type: 'single_choice',
        question: 'How often do you use our product?',
        options: [
          'Daily',
          'Several times a week',
          'Weekly',
          'Monthly',
          'Rarely'
        ],
        required: true
      },
      {
        id: 'pf-2',
        type: 'multiple_choice',
        question: 'Which features do you use most frequently?',
        options: [
          'Feature A',
          'Feature B',
          'Feature C',
          'Feature D',
          'Feature E'
        ],
        required: true
      },
      {
        id: 'pf-3',
        type: 'rating',
        question: 'How would you rate the usability of our product?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'pf-4',
        type: 'likert',
        question: 'The product helps me accomplish my goals efficiently',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'pf-5',
        type: 'open_ended',
        question: 'What features would you like to see added to our product?',
        required: false,
        maxLength: 500
      },
      {
        id: 'pf-bc-1',
        type: 'single_choice',
        question: 'Which best describes your organization\'s current growth stage?',
        options: [
          'Early-stage startup (1-10 employees)',
          'Growth-stage company (11-50 employees)',
          'Established mid-market (51-200 employees)',
          'Enterprise organization (201+ employees)'
        ],
        required: false
      },
      {
        id: 'pf-bc-2',
        type: 'multiple_choice',
        question: 'Which tools or software categories are most critical to your operations?',
        options: [
          'CRM and customer management',
          'Financial management and accounting',
          'Team collaboration and productivity',
          'Data analytics and business intelligence',
          'Marketing automation'
        ],
        required: false
      }
    ]
  },
  {
    id: 'employee-satisfaction',
    name: 'Workplace Happiness Odyssey',
    description: 'Embark on a journey to uncover the secrets of workplace joy and team magic',
    category: 'Human Resources',
    estimatedCompletionTime: 7,
    tags: ['employee', 'satisfaction', 'workplace', 'culture', 'engagement', 'happiness'],
    questions: [
      {
        id: 'es-1',
        type: 'likert',
        question: 'I am satisfied with my current role',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'es-2',
        type: 'likert',
        question: 'I feel valued and appreciated for my contributions',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'es-3',
        type: 'likert',
        question: 'I have opportunities for professional growth',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'es-4',
        type: 'single_choice',
        question: 'How would you describe the work-life balance in your role?',
        options: [
          'Poor',
          'Below average',
          'Average',
          'Good',
          'Excellent'
        ],
        required: true
      },
      {
        id: 'es-5',
        type: 'multiple_choice',
        question: 'Which benefits do you value the most?',
        options: [
          'Health insurance',
          'Retirement plan',
          'Flexible work hours',
          'Remote work options',
          'Professional development',
          'Paid time off'
        ],
        required: true
      },
      {
        id: 'es-6',
        type: 'open_ended',
        question: 'What changes would improve your workplace experience?',
        required: false,
        maxLength: 500
      },
      {
        id: 'es-bc-1',
        type: 'single_choice',
        question: 'As a manager, what service level expectations are most important to your HR department?',
        options: [
          'Rapid response times to inquiries and issues',
          '24/7 availability and support coverage',
          'Deep technical expertise and knowledge',
          'Proactive monitoring and issue prevention',
          'Consistent relationship with dedicated contacts'
        ],
        required: false
      },
      {
        id: 'es-bc-2',
        type: 'multiple_choice',
        question: 'How would you characterize your organization\'s approach to support tickets?',
        options: [
          'We minimize support requests and prefer self-service',
          'We only create tickets for critical issues',
          'We document all issues thoroughly to ensure resolution',
          'We prefer real-time collaborative problem solving',
          'We expect automated solutions for common problems'
        ],
        required: false
      }
    ]
  },
  {
    id: 'market-research',
    name: 'Market Trend Treasure Hunt',
    description: 'Embark on an expedition to uncover hidden market gems and consumer desire patterns',
    category: 'Marketing',
    estimatedCompletionTime: 8,
    tags: ['market', 'research', 'competition', 'trends', 'demographics', 'treasure'],
    questions: [
      {
        id: 'mr-1',
        type: 'single_choice',
        question: 'How familiar are you with our brand?',
        options: [
          'Not at all familiar',
          'Slightly familiar',
          'Moderately familiar',
          'Very familiar',
          'Extremely familiar'
        ],
        required: true
      },
      {
        id: 'mr-2',
        type: 'multiple_choice',
        question: 'Which competing products/services have you used?',
        options: [
          'Competitor A',
          'Competitor B',
          'Competitor C',
          'Competitor D',
          'None of the above'
        ],
        required: true
      },
      {
        id: 'mr-3',
        type: 'rating',
        question: 'How important is price in your purchase decision?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'mr-4',
        type: 'rating',
        question: 'How important is quality in your purchase decision?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'mr-5',
        type: 'single_choice',
        question: 'How often do you purchase products in this category?',
        options: [
          'Weekly',
          'Monthly',
          'Quarterly',
          'Annually',
          'Rarely'
        ],
        required: true
      },
      {
        id: 'mr-6',
        type: 'open_ended',
        question: 'What factors influence your purchasing decisions in this category?',
        required: false,
        maxLength: 500
      },
      {
        id: 'mr-bc-1',
        type: 'single_choice',
        question: 'What are your preferred communication channels for vendor or business interactions?',
        options: [
          'Email correspondence (asynchronous)',
          'Phone calls and direct conversations',
          'Video meetings and screen sharing',
          'Instant messaging and chat platforms',
          'In-person meetings and site visits'
        ],
        required: false
      },
      {
        id: 'mr-bc-2',
        type: 'multiple_choice',
        question: 'What industry-specific marketing challenges impact your business decisions?',
        options: [
          'Changing consumer privacy regulations',
          'Digital platform algorithm changes',
          'Rising customer acquisition costs',
          'Content oversaturation in your industry',
          'Difficulty measuring marketing ROI'
        ],
        required: false
      }
    ]
  },
  {
    id: 'event-feedback',
    name: 'Event Experience Time Capsule',
    description: 'Create a memory vault of your event journey to shape amazing future experiences',
    category: 'Events',
    estimatedCompletionTime: 4,
    tags: ['event', 'conference', 'feedback', 'attendee', 'experience', 'journey'],
    questions: [
      {
        id: 'ef-1',
        type: 'rating',
        question: 'How would you rate the overall event?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'ef-2',
        type: 'single_choice',
        question: 'Did the event meet your expectations?',
        options: [
          'Did not meet expectations',
          'Somewhat met expectations',
          'Met expectations',
          'Exceeded expectations',
          'Far exceeded expectations'
        ],
        required: true
      },
      {
        id: 'ef-3',
        type: 'rating',
        question: 'How would you rate the quality of presentations/content?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'ef-4',
        type: 'rating',
        question: 'How would you rate the venue and facilities?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'ef-5',
        type: 'single_choice',
        question: 'How likely are you to attend this event again in the future?',
        options: [
          'Very unlikely',
          'Unlikely',
          'Neutral',
          'Likely',
          'Very likely'
        ],
        required: true
      },
      {
        id: 'ef-6',
        type: 'open_ended',
        question: 'What suggestions do you have for improving future events?',
        required: false,
        maxLength: 500
      }
    ]
  },
  {
    id: 'website-usability',
    name: 'Digital Experience Detective Quest',
    description: 'Embark on a mission to uncover the secrets of great digital interactions and site navigation',
    category: 'Web Design',
    estimatedCompletionTime: 6,
    tags: ['website', 'usability', 'user experience', 'navigation', 'design', 'detective', 'quest'],
    questions: [
      {
        id: 'wu-1',
        type: 'rating',
        question: 'How easy was it to find what you were looking for?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'wu-2',
        type: 'likert',
        question: 'The website is visually appealing',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'wu-3',
        type: 'likert',
        question: 'The website loads quickly',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'wu-4',
        type: 'single_choice',
        question: 'Which device do you primarily use to access our website?',
        options: [
          'Desktop/laptop',
          'Tablet',
          'Smartphone',
          'Other'
        ],
        required: true
      },
      {
        id: 'wu-5',
        type: 'multiple_choice',
        question: 'Which aspects of our website need improvement?',
        options: [
          'Navigation',
          'Visual design',
          'Content',
          'Speed/performance',
          'Mobile experience',
          'Search functionality'
        ],
        required: false
      },
      {
        id: 'wu-6',
        type: 'open_ended',
        question: 'What specific changes would improve your experience on our website?',
        required: false,
        maxLength: 500
      },
      {
        id: 'wu-bc-1',
        type: 'single_choice',
        question: 'What type of support do you prefer when using digital products?',
        options: [
          'Self-service knowledge base and documentation',
          'Live chat with support representatives',
          'Email support with thorough responses',
          'Phone support with real-time problem solving',
          'Video tutorials and guided walkthroughs'
        ],
        required: false
      },
      {
        id: 'wu-bc-2',
        type: 'multiple_choice',
        question: 'What digital pain points most significantly impact your business?',
        options: [
          'Complex user interfaces requiring extensive training',
          'Integration difficulties between digital systems',
          'Slow technical support response times',
          'Frequent updates disrupting workflows',
          'Limited customization options for business needs'
        ],
        required: false
      }
    ]
  },
  {
    id: 'course-evaluation',
    name: 'Knowledge Journey Reflection Quest',
    description: 'Chart your learning adventure and help shape future educational voyages',
    category: 'Education',
    estimatedCompletionTime: 7,
    tags: ['education', 'course', 'evaluation', 'instructor', 'learning', 'journey', 'adventure'],
    questions: [
      {
        id: 'ce-1',
        type: 'rating',
        question: 'How would you rate the overall quality of this course?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'ce-2',
        type: 'rating',
        question: 'How would you rate the instructor\'s effectiveness?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'ce-3',
        type: 'likert',
        question: 'The course materials were relevant and helpful',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'ce-4',
        type: 'likert',
        question: 'The course was well-organized and structured',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'ce-5',
        type: 'likert',
        question: 'The assessments fairly measured my knowledge and skills',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'ce-6',
        type: 'open_ended',
        question: 'What aspects of the course were most valuable?',
        required: false,
        maxLength: 500
      },
      {
        id: 'ce-7',
        type: 'open_ended',
        question: 'What suggestions do you have for improving this course?',
        required: false,
        maxLength: 500
      },
      {
        id: 'ce-bc-1',
        type: 'single_choice',
        question: 'How do you prefer to learn new professional skills?',
        options: [
          'Self-paced online courses with interactive elements',
          'Structured instructor-led virtual classrooms',
          'Blended learning with both online and in-person components',
          'In-person workshops with hands-on activities',
          'Peer learning and collaborative project-based work'
        ],
        required: false
      },
      {
        id: 'ce-bc-2',
        type: 'multiple_choice',
        question: 'What skills are most relevant to your current business needs?',
        options: [
          'Leadership and management development',
          'Technical expertise in specific tools or technologies',
          'Communication and presentation skills',
          'Data analysis and decision making',
          'Creative problem-solving methodologies'
        ],
        required: false
      }
    ]
  },
  {
    id: 'non-profit-donor',
    name: 'Change-Maker Impact Journey',
    description: 'Discover how your generosity is transforming lives and shaping a better world',
    category: 'Non-Profit',
    estimatedCompletionTime: 5,
    tags: ['non-profit', 'donor', 'fundraising', 'charity', 'impact', 'change-maker', 'journey'],
    questions: [
      {
        id: 'np-1',
        type: 'single_choice',
        question: 'How long have you been supporting our organization?',
        options: [
          'Less than 1 year',
          '1-2 years',
          '3-5 years',
          '5-10 years',
          'More than 10 years'
        ],
        required: true
      },
      {
        id: 'np-2',
        type: 'multiple_choice',
        question: 'What motivated you to donate to our organization?',
        options: [
          'Personal connection to the cause',
          'Organizational reputation',
          'Specific program or initiative',
          'Friend or family recommendation',
          'Emergency appeal',
          'Tax benefits'
        ],
        required: true
      },
      {
        id: 'np-3',
        type: 'single_choice',
        question: 'How would you prefer to receive updates from us?',
        options: [
          'Email',
          'Physical mail',
          'Social media',
          'Phone',
          'Text message',
          'I don\'t want to receive updates'
        ],
        required: true
      },
      {
        id: 'np-4',
        type: 'likert',
        question: 'I feel my donations are making a meaningful impact',
        options: [
          'Strongly disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly agree'
        ],
        required: true
      },
      {
        id: 'np-5',
        type: 'rating',
        question: 'How satisfied are you with the level of transparency about how funds are used?',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'np-6',
        type: 'open_ended',
        question: 'What could we do to improve your donor experience?',
        required: false,
        maxLength: 500
      },
      {
        id: 'np-bc-1',
        type: 'single_choice',
        question: 'What is your organization\'s primary funding focus?',
        options: [
          'Innovation grants and seed funding',
          'Operational sustainability',
          'Emergency relief assistance',
          'Community development projects',
          'Research and development initiatives'
        ],
        required: false
      },
      {
        id: 'np-bc-2',
        type: 'multiple_choice',
        question: 'What measurement metrics most influence your donation decisions?',
        options: [
          'Clear impact measurements',
          'Transparent financial reporting',
          'Beneficiary testimonials',
          'Program completion rates',
          'Statistical outcomes data'
        ],
        required: false
      }
    ]
  }
];
