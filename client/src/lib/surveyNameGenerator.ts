/**
 * Gamified Survey Name Generator
 * 
 * This utility generates engaging, game-like names for surveys
 * to increase user engagement and participation rates.
 */

// Creative prefixes for survey names
const ADVENTURE_PREFIXES = [
  'Quest',
  'Adventure',
  'Journey',
  'Expedition',
  'Odyssey',
  'Mission',
  'Voyage',
  'Saga',
  'Chronicle',
  'Conquest',
  'Exploration',
  'Pursuit',
  'Trek',
  'Venture',
  'Pilgrimage'
];

// Engaging descriptors for surveys
const ENGAGING_DESCRIPTORS = [
  'Epic',
  'Legendary',
  'Ultimate',
  'Grand',
  'Mystic',
  'Heroic',
  'Magical',
  'Cosmic',
  'Daring',
  'Thrilling',
  'Extraordinary',
  'Fantastic',
  'Mythical',
  'Secret',
  'Mysterious'
];

// Action verbs to make survey names feel dynamic
const ACTION_VERBS = [
  'Unlock',
  'Discover',
  'Reveal',
  'Uncover',
  'Chart',
  'Explore',
  'Quest',
  'Embark',
  'Navigate',
  'Delve',
  'Journey',
  'Venture',
  'Trek',
  'Solve',
  'Decode'
];

// Survey themes that create curiosity
const CURIOSITY_THEMES = [
  'Hidden Patterns',
  'Inner Secrets',
  'Mind Map',
  'Personality Code',
  'Character Blueprint',
  'Soul Profile',
  'Identity Matrix',
  'Mind Mosaic',
  'Cognitive Compass',
  'Trait Tapestry',
  'Behavior Cipher',
  'Mindset Maze',
  'Character Canvas',
  'Decision DNA',
  'Potential Pathways'
];

// Topic-specific adjectives to personalize the survey name
const TOPIC_ADJECTIVES: Record<string, string[]> = {
  personality: [
    'Self-Discovery', 'Character', 'Identity', 'True-Self', 'Inner-Light',
    'Potential', 'Hidden-Talent', 'Authentic', 'Core-Value', 'Mindscape'
  ],
  customer: [
    'Satisfaction', 'Delight', 'Experience', 'Service', 'Product-Love',
    'Feedback', 'Loyalty', 'Journey', 'Perspective', 'Voice'
  ],
  employee: [
    'Workplace', 'Team', 'Culture', 'Collaboration', 'Professional',
    'Growth', 'Leadership', 'Engagement', 'Talent', 'Career'
  ],
  product: [
    'Innovation', 'Feature', 'Design', 'Usability', 'Experience',
    'Vision', 'Roadmap', 'Improvement', 'Quality', 'Enhancement'
  ],
  market: [
    'Trend', 'Consumer', 'Insight', 'Strategy', 'Competitive',
    'Industry', 'Preference', 'Behavior', 'Demand', 'Forecast'
  ],
  education: [
    'Knowledge', 'Learning', 'Teaching', 'Development', 'Skill',
    'Academic', 'Course', 'Training', 'Educational', 'Instructional'
  ]
};

// Reward-themed words to suggest value from completion
const REWARD_THEMES = [
  'Treasure', 'Rewards', 'Bounty', 'Discoveries', 'Insights',
  'Revelation', 'Breakthrough', 'Awakening', 'Transformation', 'Enlightenment',
  'Achievement', 'Recognition', 'Mastery', 'Excellence', 'Pinnacle'
];

/**
 * Generates a random element from an array
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Combines multiple arrays and returns a random element
 */
const getRandomFromCombined = <T>(...arrays: T[][]): T => {
  const combined = arrays.flat();
  return getRandomElement(combined);
};

/**
 * Generate an engaging, adventure-themed survey title based on the topic
 */
export function generateAdventureSurveyName(topic: string = 'personality'): string {
  // Get topic-specific adjectives or use general ones if topic not found
  const topicWords = TOPIC_ADJECTIVES[topic.toLowerCase()] || TOPIC_ADJECTIVES.personality;
  
  // Generate different survey name patterns
  const patterns = [
    // Pattern 1: The [Adjective] [Topic] [Adventure]
    () => `The ${getRandomElement(ENGAGING_DESCRIPTORS)} ${getRandomElement(topicWords)} ${getRandomElement(ADVENTURE_PREFIXES)}`,
    
    // Pattern 2: [Action] Your [Topic] [Theme]
    () => `${getRandomElement(ACTION_VERBS)} Your ${getRandomElement(topicWords)} ${getRandomElement(CURIOSITY_THEMES)}`,
    
    // Pattern 3: [Topic] [Adventure] of [Reward]
    () => `${getRandomElement(topicWords)} ${getRandomElement(ADVENTURE_PREFIXES)} of ${getRandomElement(REWARD_THEMES)}`,
    
    // Pattern 4: The [Adjective] [Adventure] to [Action] Your [Topic]
    () => `The ${getRandomElement(ENGAGING_DESCRIPTORS)} ${getRandomElement(ADVENTURE_PREFIXES)} to ${getRandomElement(ACTION_VERBS)} Your ${getRandomElement(topicWords)}`,
    
    // Pattern 5: [Topic] [Theme] [Adventure]
    () => `${getRandomElement(topicWords)} ${getRandomElement(CURIOSITY_THEMES)} ${getRandomElement(ADVENTURE_PREFIXES)}`
  ];
  
  // Select a random pattern and generate the name
  return getRandomElement(patterns)();
}

/**
 * Generate a set of survey name options based on the topic
 */
export function generateSurveyNameOptions(topic: string = 'personality', count: number = 5): string[] {
  const names: string[] = [];
  const usedNames = new Set<string>();
  
  // Generate unique names
  for (let i = 0; i < count * 2 && names.length < count; i++) {
    const name = generateAdventureSurveyName(topic);
    if (!usedNames.has(name)) {
      usedNames.add(name);
      names.push(name);
    }
    
    // Break the loop if we can't generate enough unique names after too many tries
    if (i >= count * 3 && names.length > 0) break;
  }
  
  return names;
}

export default {
  generateAdventureSurveyName,
  generateSurveyNameOptions
};