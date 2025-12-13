// Define frontend question types that match the actual usage in this file
export interface SurveyQuestionOption {
  id: string;
  text: string;
  value: string;
  image?: string;
  description?: string;
  traits?: Record<string, number>;
}

export interface SurveyQuestion {
  id: number;
  type: "text" | "image" | "multiple-choice" | "slider" | "ranking" | "scenario" | "mood-board" | "personality-matrix";
  question: string;
  description?: string;
  category?: string;
  traitMapping?: Array<{
    trait: string;
    valueMapping?: Record<string, number>;
    scoreMultiplier?: number;
  }>;
  options: SurveyQuestionOption[];
}

// Define multiple survey categories
export const surveyCategories = [
  {
    id: "general",
    name: "Personality Profile",
    description: "Discover your core personality traits and decision-making style",
    image: "https://images.unsplash.com/photo-1569078449082-d264d9e239c5?auto=format&fit=crop&w=400&h=300",
    traits: ["Decision Style", "Risk Tolerance", "Communication Style", "Team Dynamics"]
  },
  {
    id: "career",
    name: "Professional Profile",
    description: "Understand your work style, leadership approach, and career preferences",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=400&h=300",
    traits: ["Leadership Style", "Work Environment", "Career Growth", "Team Collaboration"]
  },
  {
    id: "consumer",
    name: "Consumer Behavior",
    description: "Explore your purchasing habits, brand relationships, and value priorities",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&h=300",
    traits: ["Value/Price Propensity", "Brand Loyalty", "Purchase Drivers", "Decision Process"]
  },
  {
    id: "innovation",
    name: "Innovation Mindset",
    description: "Assess your approach to creativity, problem-solving, and adaptability",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&h=300",
    traits: ["Curiosity", "Creativity", "Adaptability", "Risk-Taking"]
  },
  {
    id: "sustainability",
    name: "Sustainability Orientation",
    description: "Evaluate your environmental awareness and sustainable behaviors",
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&h=300",
    traits: ["Environmental Awareness", "Sustainable Practices", "Social Responsibility", "Long-term Thinking"]
  },
  {
    id: "digital",
    name: "Digital Behavior Profile",
    description: "Understand how you interact with technology and digital environments",
    image: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=400&h=300",
    traits: ["Digital Fluency", "Technology Adoption", "Digital Content Preferences", "Online Privacy Concerns"]
  },
  {
    id: "emotional",
    name: "Emotional Intelligence",
    description: "Explore your emotional awareness, empathy, and interpersonal skills",
    image: "https://images.unsplash.com/photo-1521143617427-94249d33f2d0?auto=format&fit=crop&w=400&h=300",
    traits: ["Emotional Intelligence", "Interpersonal Communication", "Conflict Management", "Social Awareness"]
  },
  {
    id: "learning",
    name: "Learning & Development",
    description: "Discover your learning style, knowledge acquisition patterns, and growth mindset",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&h=300",
    traits: ["Learning Style", "Information Processing", "Cultural Appreciation", "Growth Mindset"]
  },
  {
    id: "bigfive",
    name: "Big Five Personality",
    description: "Comprehensive assessment of the five major dimensions of personality",
    image: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=400&h=300",
    traits: ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"]
  },

];

// General personality assessment questions
const generalQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "image",
    question: "If you were to choose a workspace, which appeals to you most?",
    options: [
      {
        id: "organized",
        text: "Organized and minimal",
        value: "organized",
        image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "creative",
        text: "Creative and inspirational",
        value: "creative",
        image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "collaborative",
        text: "Collaborative and social",
        value: "collaborative",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 2,
    type: "multiple-choice",
    question: "In the game of life, what's your preferred strategy?",
    options: [
      {
        id: "decision-analytical",
        text: "Gather all the data and analyze possible outcomes before making a move",
        value: "analytical"
      },
      {
        id: "decision-intuitive",
        text: "Go with your gut feeling about what seems right in the moment",
        value: "intuitive"
      },
      {
        id: "decision-collaborative",
        text: "Consult your alliance members before deciding on your next step",
        value: "collaborative"
      }
    ]
  },
  {
    id: 3,
    type: "multiple-choice",
    question: "You've found a treasure chest in a game. You would:",
    options: [
      {
        id: "risk-cautious",
        text: "Carefully check for traps before opening it",
        value: "risk_averse"
      },
      {
        id: "risk-moderate",
        text: "Assess the situation quickly, then decide whether to open it",
        value: "risk_moderate"
      },
      {
        id: "risk-high",
        text: "Open it immediately to see what's inside!",
        value: "risk_seeking"
      }
    ]
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "When playing a strategy game, which approach do you prefer?",
    options: [
      {
        id: "challenge-methodical",
        text: "Follow a proven strategy with careful planning for each move",
        value: "methodical"
      },
      {
        id: "challenge-creative",
        text: "Try unconventional strategies that might surprise opponents",
        value: "creative"
      },
      {
        id: "challenge-team",
        text: "Adapt your approach based on what other players are doing",
        value: "adaptive"
      }
    ]
  },
  {
    id: 5,
    type: "image",
    question: "Choose your ideal adventure vacation:",
    options: [
      {
        id: "vacation-adventure",
        text: "Wilderness expedition",
        value: "adventure",
        image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "vacation-luxury",
        text: "Luxury resort retreat",
        value: "luxury",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "vacation-cultural",
        text: "Cultural exploration",
        value: "cultural",
        image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 6,
    type: "multiple-choice",
    question: "In a fantasy RPG, which character class would you choose?",
    options: [
      {
        id: "rpg-warrior",
        text: "Warrior - High strength and direct approach",
        value: "direct_action"
      },
      {
        id: "rpg-wizard",
        text: "Wizard - Strategic and knowledge-based powers",
        value: "strategic_thinker"
      },
      {
        id: "rpg-rogue",
        text: "Rogue - Adaptable with unique problem-solving skills",
        value: "creative_problem_solver"
      },
      {
        id: "rpg-healer",
        text: "Healer - Supporting others and maintaining team balance",
        value: "supportive"
      }
    ]
  },
  {
    id: 7,
    type: "multiple-choice",
    question: "When mastering a new video game, you prefer to:",
    options: [
      {
        id: "learning-practice",
        text: "Jump right in and learn through playing",
        value: "practical"
      },
      {
        id: "learning-theory",
        text: "Read tutorials and understand game mechanics first",
        value: "theoretical"
      },
      {
        id: "learning-observe",
        text: "Watch gameplay videos before playing yourself",
        value: "observational"
      }
    ]
  },
  {
    id: 8,
    type: "multiple-choice",
    question: "Which streaming content captures your attention longest?",
    options: [
      {
        id: "content-educational",
        text: "Documentaries or educational channels",
        value: "knowledge_seeking"
      },
      {
        id: "content-entertaining",
        text: "Comedy shows or entertaining streamers",
        value: "entertainment_focused"
      },
      {
        id: "content-inspirational",
        text: "Motivational success stories or self-improvement content",
        value: "inspiration_driven"
      },
      {
        id: "content-social",
        text: "Content that friends have recommended or are discussing",
        value: "relationship_oriented"
      }
    ]
  },
  {
    id: 9,
    type: "multiple-choice",
    question: "In a multiplayer game, you usually find yourself:",
    options: [
      {
        id: "team-lead",
        text: "Taking the lead and coordinating strategy",
        value: "leader"
      },
      {
        id: "team-support",
        text: "Focusing on helping teammates succeed",
        value: "supporter"
      },
      {
        id: "team-ideas",
        text: "Coming up with creative tactics and strategies",
        value: "innovator"
      },
      {
        id: "team-organize",
        text: "Making sure all tasks and objectives are completed",
        value: "organizer"
      }
    ]
  },
  {
    id: 10,
    type: "multiple-choice",
    question: "When you get feedback on your gaming performance, you prefer it to be:",
    options: [
      {
        id: "feedback-direct",
        text: "Straightforward and to the point",
        value: "direct_communicator"
      },
      {
        id: "feedback-gentle",
        text: "Considerate and focused on positives first",
        value: "sensitive_receiver"
      },
      {
        id: "feedback-detailed",
        text: "Detailed with specific examples and timestamps",
        value: "detail_oriented"
      },
      {
        id: "feedback-action",
        text: "Focused on specific actions to improve",
        value: "action_focused"
      }
    ]
  }
];

// Career and professional profile questions
const careerQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "image",
    question: "Which work environment energizes you most?",
    options: [
      {
        id: "work-structured",
        text: "Structured and organized",
        value: "structured",
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "work-creative",
        text: "Creative and flexible",
        value: "creative",
        image: "https://images.unsplash.com/photo-1522071901873-411886a10004?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "work-remote",
        text: "Independent and remote",
        value: "independent",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 2,
    type: "multiple-choice",
    question: "When taking on a new project, you typically:",
    options: [
      {
        id: "project-planning",
        text: "Create a detailed plan with milestones and deadlines",
        value: "structured_planner"
      },
      {
        id: "project-team",
        text: "Assemble the right team and establish clear roles",
        value: "team_builder"
      },
      {
        id: "project-vision",
        text: "Focus on the big picture vision and goals",
        value: "vision_oriented"
      },
      {
        id: "project-adaptable",
        text: "Start working and adapt as you learn more",
        value: "adaptable_executor"
      }
    ]
  },
  {
    id: 3,
    type: "multiple-choice",
    question: "In a professional disagreement, you're most likely to:",
    options: [
      {
        id: "conflict-data",
        text: "Rely on data and facts to make your case",
        value: "fact_based"
      },
      {
        id: "conflict-compromise",
        text: "Look for a middle ground that satisfies both sides",
        value: "compromiser"
      },
      {
        id: "conflict-innovative",
        text: "Suggest a new approach that addresses both perspectives",
        value: "innovative_resolver"
      },
      {
        id: "conflict-principle",
        text: "Stand firm on principles you believe are important",
        value: "principle_oriented"
      }
    ]
  },
  {
    id: 4,
    type: "image",
    question: "Which achievement would make you most proud?",
    options: [
      {
        id: "achievement-innovation",
        text: "Creating an innovative solution to a difficult problem",
        value: "innovator",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "achievement-team",
        text: "Leading a team to exceed expectations",
        value: "leader",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "achievement-growth",
        text: "Achieving significant growth or improvement metrics",
        value: "results_driven",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 5,
    type: "multiple-choice",
    question: "What motivates you most in your career?",
    options: [
      {
        id: "motivation-impact",
        text: "Making a meaningful impact on others or society",
        value: "purpose_driven"
      },
      {
        id: "motivation-challenge",
        text: "Taking on challenging problems and mastering new skills",
        value: "growth_mindset"
      },
      {
        id: "motivation-recognition",
        text: "Recognition for your achievements and contributions",
        value: "achievement_oriented"
      },
      {
        id: "motivation-security",
        text: "Stability and predictable career progression",
        value: "security_focused"
      }
    ]
  }
];

// Consumer behavior questions
const consumerQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "You're shopping for a big-ticket item. Your approach is to:",
    options: [
      {
        id: "shopping-research",
        text: "Research extensively, compare options, and read reviews",
        value: "methodical_consumer"
      },
      {
        id: "shopping-trusted",
        text: "Go with a trusted brand you've had good experiences with",
        value: "brand_loyal"
      },
      {
        id: "shopping-deal",
        text: "Look for the best deal or special promotion",
        value: "value_seeker"
      },
      {
        id: "shopping-innovative",
        text: "Try the newest or most innovative option available",
        value: "innovation_adopter"
      }
    ]
  },
  {
    id: 2,
    type: "image",
    question: "Which shopping experience do you prefer?",
    options: [
      {
        id: "retail-instore",
        text: "Traditional in-store shopping",
        value: "traditional",
        image: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "retail-online",
        text: "Convenient online shopping",
        value: "digital",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "retail-boutique",
        text: "Personalized boutique experience",
        value: "personalized",
        image: "https://images.unsplash.com/photo-1551446591-142875a901a1?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 3,
    type: "multiple-choice",
    question: "When a brand disappoints you with a product or service, you typically:",
    options: [
      {
        id: "brand-forgive",
        text: "Give them another chance if they've been reliable before",
        value: "forgiving"
      },
      {
        id: "brand-switch",
        text: "Switch to a competitor immediately",
        value: "quality_demanding"
      },
      {
        id: "brand-feedback",
        text: "Provide feedback and expect them to make it right",
        value: "engagement_seeking"
      },
      {
        id: "brand-review",
        text: "Share your experience in reviews or social media",
        value: "socially_influential"
      }
    ]
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "Which factor most influences your purchase decisions?",
    options: [
      {
        id: "factor-price",
        text: "Price and value for money",
        value: "price_sensitive"
      },
      {
        id: "factor-quality",
        text: "Quality and reliability",
        value: "quality_focused"
      },
      {
        id: "factor-convenience",
        text: "Convenience and ease of purchase",
        value: "convenience_driven"
      },
      {
        id: "factor-ethics",
        text: "Ethical considerations and brand values",
        value: "values_aligned"
      }
    ]
  },
  {
    id: 5,
    type: "multiple-choice",
    question: "How do you typically respond to new product launches?",
    options: [
      {
        id: "adoption-early",
        text: "Try to be among the first to get it",
        value: "early_adopter"
      },
      {
        id: "adoption-wait",
        text: "Wait for reviews and feedback before buying",
        value: "considered_adopter"
      },
      {
        id: "adoption-need",
        text: "Only consider it if it solves a specific need",
        value: "need_based_adopter"
      },
      {
        id: "adoption-established",
        text: "Prefer established products with proven track records",
        value: "late_adopter"
      }
    ]
  }
];

// Innovation mindset questions
const innovationQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "When faced with a completely new challenge, you typically:",
    options: [
      {
        id: "challenge-research",
        text: "Research existing solutions and adapt them",
        value: "analytical_adapter"
      },
      {
        id: "challenge-create",
        text: "Create something entirely new from scratch",
        value: "original_creator"
      },
      {
        id: "challenge-collaborate",
        text: "Bring together different perspectives to innovate",
        value: "collaborative_innovator"
      },
      {
        id: "challenge-systematic",
        text: "Take a systematic approach to finding a solution",
        value: "systematic_innovator"
      }
    ]
  },
  {
    id: 2,
    type: "image",
    question: "Which innovation approach resonates with you most?",
    options: [
      {
        id: "innovation-breakthrough",
        text: "Breakthrough disruption",
        value: "disruptive",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "innovation-iterative",
        text: "Iterative improvement",
        value: "iterative",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "innovation-fusion",
        text: "Cross-disciplinary fusion",
        value: "combinatory",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 3,
    type: "multiple-choice",
    question: "How do you typically react when your ideas are rejected?",
    options: [
      {
        id: "rejection-persist",
        text: "Refine and try again with improvements",
        value: "resilient_adapter"
      },
      {
        id: "rejection-new",
        text: "Move on to a completely different approach",
        value: "flexible_thinker"
      },
      {
        id: "rejection-understand",
        text: "Seek to understand objections before deciding next steps",
        value: "feedback_integrator"
      },
      {
        id: "rejection-evidence",
        text: "Gather more evidence to support your original idea",
        value: "conviction_driven"
      }
    ]
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "What role do constraints play in your creative process?",
    options: [
      {
        id: "constraints-fuel",
        text: "They fuel creativity by forcing new thinking",
        value: "constraint_inspired"
      },
      {
        id: "constraints-obstacle",
        text: "They're obstacles to overcome or work around",
        value: "constraint_challenged"
      },
      {
        id: "constraints-framework",
        text: "They provide helpful structure and focus",
        value: "constraint_structured"
      },
      {
        id: "constraints-avoid",
        text: "You prefer to work with as few constraints as possible",
        value: "freedom_oriented"
      }
    ]
  },
  {
    id: 5,
    type: "multiple-choice",
    question: "How do you approach learning about unfamiliar topics?",
    options: [
      {
        id: "learning-curiosity",
        text: "Follow your curiosity, even if it leads in unexpected directions",
        value: "curiosity_driven"
      },
      {
        id: "learning-focused",
        text: "Focus on what's most relevant to your immediate goals",
        value: "goal_oriented"
      },
      {
        id: "learning-systematic",
        text: "Take a systematic approach to understand fundamentals first",
        value: "systematic_learner"
      },
      {
        id: "learning-social",
        text: "Learn through discussions and exchanges with others",
        value: "social_learner"
      }
    ]
  }
];

// Sustainability orientation questions
const sustainabilityQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "When making everyday purchases, how often do environmental considerations influence your choice?",
    options: [
      {
        id: "eco-always",
        text: "Almost always a primary factor",
        value: "eco_committed"
      },
      {
        id: "eco-sometimes",
        text: "Sometimes, when convenient or cost-effective",
        value: "eco_conscious"
      },
      {
        id: "eco-rarely",
        text: "Rarely, other factors usually take priority",
        value: "eco_aware"
      },
      {
        id: "eco-never",
        text: "Almost never a deciding factor",
        value: "eco_indifferent"
      }
    ]
  },
  {
    id: 2,
    type: "image",
    question: "Which approach to sustainability appeals to you most?",
    options: [
      {
        id: "sustain-tech",
        text: "Technology-driven solutions",
        value: "tech_optimist",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "sustain-lifestyle",
        text: "Lifestyle and behavioral changes",
        value: "lifestyle_reformer",
        image: "https://images.unsplash.com/photo-1582404851603-67b2d1cc753c?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "sustain-policy",
        text: "Policy and systemic changes",
        value: "system_changer",
        image: "https://images.unsplash.com/photo-1464389491594-8636071f779e?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 3,
    type: "multiple-choice",
    question: "How do you view the relationship between economic growth and environmental protection?",
    options: [
      {
        id: "econ-harmony",
        text: "They can work in harmony through sustainable development",
        value: "sustainable_growth_believer"
      },
      {
        id: "econ-tradeoff",
        text: "There are necessary trade-offs that must be balanced",
        value: "pragmatic_balancer"
      },
      {
        id: "econ-priority",
        text: "Environmental concerns should take priority over growth",
        value: "environment_prioritizer"
      },
      {
        id: "econ-growth",
        text: "Economic growth should be the priority for human well-being",
        value: "growth_prioritizer"
      }
    ]
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "When a company promotes their sustainability initiatives, you typically:",
    options: [
      {
        id: "green-trust",
        text: "Trust their commitment if they have a good track record",
        value: "informed_trusting"
      },
      {
        id: "green-skeptical",
        text: "Remain skeptical until you see evidence and details",
        value: "evidence_seeking"
      },
      {
        id: "green-support",
        text: "Support their efforts regardless of perfection",
        value: "progress_supporter"
      },
      {
        id: "green-ignore",
        text: "Focus more on product quality and value than sustainability claims",
        value: "quality_focused"
      }
    ]
  },
  {
    id: 5,
    type: "multiple-choice",
    question: "Which sustainability practice would you be most willing to adopt?",
    options: [
      {
        id: "practice-consumption",
        text: "Significantly reducing consumption and waste",
        value: "minimalist"
      },
      {
        id: "practice-products",
        text: "Switching to eco-friendly products, even if more expensive",
        value: "green_consumer"
      },
      {
        id: "practice-community",
        text: "Participating in community sustainability initiatives",
        value: "community_oriented"
      },
      {
        id: "practice-advocacy",
        text: "Advocating for policy changes and corporate accountability",
        value: "change_advocate"
      }
    ]
  }
];

// Digital behavior profile questions
const digitalQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "When a new technology or app becomes available, you typically:",
    options: [
      {
        id: "tech-early",
        text: "Download or try it immediately to be among the first users",
        value: "early_adopter"
      },
      {
        id: "tech-wait",
        text: "Wait to see if it gains popularity before trying it",
        value: "mainstream_adopter"
      },
      {
        id: "tech-necessity",
        text: "Only adopt it when it becomes necessary or widely used",
        value: "late_adopter"
      },
      {
        id: "tech-avoid",
        text: "Stick with familiar technologies rather than switching to new ones",
        value: "tech_hesitant"
      }
    ]
  },
  {
    id: 2,
    type: "multiple-choice",
    question: "How do you typically handle online privacy settings?",
    options: [
      {
        id: "privacy-strict",
        text: "Carefully review and restrict all access to your data",
        value: "privacy_conscious"
      },
      {
        id: "privacy-balance",
        text: "Find a balance between convenience and protecting sensitive information",
        value: "privacy_moderate"
      },
      {
        id: "privacy-basic",
        text: "Accept default settings with minimal adjustments",
        value: "privacy_relaxed"
      },
      {
        id: "privacy-share",
        text: "Share openly with minimal concerns about data collection",
        value: "privacy_open"
      }
    ]
  },
  {
    id: 3,
    type: "image",
    question: "Which digital environment do you prefer spending time in?",
    options: [
      {
        id: "digital-social",
        text: "Social media platforms",
        value: "social_media_oriented",
        image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "digital-productive",
        text: "Productivity and work apps",
        value: "productivity_oriented",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "digital-entertainment",
        text: "Entertainment and streaming",
        value: "entertainment_oriented",
        image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "digital-creative",
        text: "Creative and design tools",
        value: "creative_digital",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "When using digital devices, you generally prefer:",
    options: [
      {
        id: "device-seamless",
        text: "Seamless ecosystem across all devices (same brand/OS)",
        value: "ecosystem_oriented"
      },
      {
        id: "device-best",
        text: "Best-in-class devices regardless of brand compatibility",
        value: "feature_optimizing"
      },
      {
        id: "device-minimal",
        text: "Minimal number of devices with maximum functionality",
        value: "minimalist"
      },
      {
        id: "device-specialized",
        text: "Specialized devices for different purposes",
        value: "purpose_specific"
      }
    ]
  },
  {
    id: 5,
    type: "multiple-choice",
    question: "How do you typically discover new apps, sites, or digital tools?",
    options: [
      {
        id: "discover-search",
        text: "Actively search for solutions to specific needs",
        value: "need_driven"
      },
      {
        id: "discover-recommend",
        text: "Recommendations from friends or colleagues",
        value: "socially_influenced"
      },
      {
        id: "discover-trending",
        text: "Following tech news and trending releases",
        value: "trend_aware"
      },
      {
        id: "discover-ads",
        text: "Through targeted ads or promotions",
        value: "promotion_responsive"
      }
    ]
  },
  {
    id: 6,
    type: "multiple-choice",
    question: "When faced with a technical problem, you typically:",
    options: [
      {
        id: "tech-problem-self",
        text: "Try to solve it yourself through research and troubleshooting",
        value: "self_reliant"
      },
      {
        id: "tech-problem-community",
        text: "Search for answers in community forums or social media",
        value: "community_oriented"
      },
      {
        id: "tech-problem-support",
        text: "Contact technical support immediately",
        value: "support_seeking"
      },
      {
        id: "tech-problem-delegate",
        text: "Ask a more tech-savvy friend or family member for help",
        value: "help_delegating"
      }
    ]
  },
  {
    id: 7,
    type: "multiple-choice",
    question: "How do you manage your digital notifications?",
    options: [
      {
        id: "notify-all",
        text: "Keep all notifications on to stay fully informed",
        value: "notification_embracing"
      },
      {
        id: "notify-important",
        text: "Carefully curate notifications for only important updates",
        value: "notification_curating"
      },
      {
        id: "notify-minimal",
        text: "Turn off most notifications to minimize distractions",
        value: "distraction_minimizing"
      },
      {
        id: "notify-scheduled",
        text: "Use scheduled downtime or focus modes regularly",
        value: "digitally_balanced"
      }
    ]
  },
  {
    id: 8,
    type: "image",
    question: "Which digital content do you consume most frequently?",
    options: [
      {
        id: "content-news",
        text: "News and current events",
        value: "news_focused",
        image: "https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "content-educational",
        text: "Educational or self-improvement content",
        value: "knowledge_seeking",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "content-entertainment",
        text: "Entertainment (videos, games, etc.)",
        value: "entertainment_focused",
        image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "content-social",
        text: "Social content and connections",
        value: "socially_oriented",
        image: "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=400&h=300"
      }
    ]
  },
  {
    id: 9,
    type: "multiple-choice",
    question: "When using social media, you primarily:",
    options: [
      {
        id: "social-create",
        text: "Create and share original content",
        value: "content_creator"
      },
      {
        id: "social-engage",
        text: "Engage actively with others' content (commenting, sharing)",
        value: "active_engager"
      },
      {
        id: "social-observe",
        text: "Observe and consume content with minimal interaction",
        value: "passive_consumer"
      },
      {
        id: "social-selective",
        text: "Maintain a small, curated network of close connections",
        value: "selective_networker"
      }
    ]
  },
  {
    id: 10,
    type: "multiple-choice",
    question: "How would you describe your approach to digital accounts and passwords?",
    options: [
      {
        id: "password-unique",
        text: "Use unique, complex passwords for every account with a password manager",
        value: "security_prioritizing"
      },
      {
        id: "password-variation",
        text: "Use variations of a few strong passwords for different accounts",
        value: "security_balancing"
      },
      {
        id: "password-consistent",
        text: "Use consistent passwords across accounts for convenience",
        value: "convenience_prioritizing"
      },
      {
        id: "password-biometric",
        text: "Prefer biometric authentication wherever available",
        value: "biometric_preferring"
      }
    ]
  }
];

// Emotional intelligence questions
const emotionalQuestions: SurveyQuestion[] = [
  {
    id: 1,
    type: "multiple-choice",
    question: "When you experience strong emotions, you typically:",
    options: [
      {
        id: "emotion-identify",
        text: "Can clearly identify and name what you're feeling",
        value: "emotionally_aware"
      },
      {
        id: "emotion-physical",
        text: "Notice physical sensations before recognizing the emotion",
        value: "somatically_attuned"
      },
      {
        id: "emotion-analyze",
        text: "Analyze the situation that triggered the feeling",
        value: "analytical_processor"
      },
      {
        id: "emotion-distract",
        text: "Try to distract yourself or move on quickly",
        value: "emotion_avoiding"
      }
    ]
  },
  {
    id: 2,
    type: "multiple-choice",
    question: "In emotionally charged conversations, you're most likely to:",
    options: [
      {
        id: "convo-listen",
        text: "Focus on listening and understanding the other person's perspective",
        value: "empathetic_listener"
      },
      {
        id: "convo-facts",
        text: "Try to keep the discussion focused on facts rather than feelings",
        value: "fact_orienting"
      },
      {
        id: "convo-mediate",
        text: "Look for ways to resolve tension or find common ground",
        value: "harmony_seeking"
      },
      {
        id: "convo-express",
        text: "Express your feelings openly and authentically",
        value: "emotionally_expressive"
      }
    ]
  },
  {
    id: 3,
    type: "image",
    question: "Which scenario would be most challenging for you to navigate?",
    options: [
      {
        id: "challenge-conflict",
        text: "Direct confrontation or conflict",
        value: "conflict_sensitive",
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "challenge-rejection",
        text: "Potential rejection or criticism",
        value: "rejection_sensitive",
        image: "https://images.unsplash.com/photo-1575672214129-e21685420459?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "challenge-uncertainty",
        text: "Ambiguity or uncertainty",
        value: "ambiguity_sensitive",
        image: "https://images.unsplash.com/photo-1527833296831-2dcbf098d66f?auto=format&fit=crop&w=400&h=300"
      },
      {
        id: "challenge-emotional",
        text: "Others' intense emotions",
        value: "emotion_overwhelmed",
        image: "https://images.unsplash.com/photo-1623771702313-39dc4f71d275?auto=format&fit=crop&w=400&h=300"
      }
    ]
  }
];

// Learning & Development questions (simplified for demo)
const learningQuestions: SurveyQuestion[] = generalQuestions.slice(0, 5);

// Big Five personality assessment questions (simplified for demo)
const bigfiveQuestions: SurveyQuestion[] = careerQuestions.slice(0, 5);

// Business context assessment questions
const businessContextQuestions: SurveyQuestion[] = [
  {
    id: 1001,
    type: "multiple-choice",
    question: "How would you prioritize your budget allocation for business tools and services?",
    options: [
      {
        id: "budget-innovation",
        text: "Innovation and R&D - investing in cutting-edge solutions",
        value: "innovation_focused"
      },
      {
        id: "budget-operations",
        text: "Operational efficiency - streamlining existing processes",
        value: "efficiency_focused"
      },
      {
        id: "budget-marketing",
        text: "Marketing and customer acquisition - growing customer base",
        value: "growth_focused"
      },
      {
        id: "budget-training",
        text: "Training and development - enhancing team capabilities",
        value: "talent_focused"
      }
    ]
  },
  {
    id: 1002,
    type: "multiple-choice",
    question: "What industry-specific challenges impact your business decisions most significantly?",
    options: [
      {
        id: "challenge-regulation",
        text: "Regulatory compliance and legal requirements",
        value: "regulatory_challenges"
      },
      {
        id: "challenge-competition",
        text: "Intense competition and market saturation",
        value: "competitive_challenges"
      },
      {
        id: "challenge-technology",
        text: "Rapid technological changes requiring constant adaptation",
        value: "technological_challenges"
      },
      {
        id: "challenge-talent",
        text: "Talent acquisition and retention difficulties",
        value: "talent_challenges"
      },
      {
        id: "challenge-supply",
        text: "Supply chain or resource constraints",
        value: "resource_challenges"
      }
    ]
  },
  {
    id: 1003,
    type: "multiple-choice",
    question: "Which best describes your organization's current growth stage?",
    options: [
      {
        id: "stage-startup",
        text: "Early-stage startup (1-10 employees)",
        value: "startup"
      },
      {
        id: "stage-growth",
        text: "Growth-stage company (11-50 employees)",
        value: "growth"
      },
      {
        id: "stage-established",
        text: "Established mid-market (51-200 employees)",
        value: "midmarket"
      },
      {
        id: "stage-enterprise",
        text: "Enterprise organization (201+ employees)",
        value: "enterprise"
      }
    ]
  },
  {
    id: 1004,
    type: "multiple-choice",
    question: "Which tools or software categories are most critical to your current operations?",
    options: [
      {
        id: "tools-crm",
        text: "CRM and customer management solutions",
        value: "crm_focused"
      },
      {
        id: "tools-finance",
        text: "Financial management and accounting tools",
        value: "finance_focused"
      },
      {
        id: "tools-productivity",
        text: "Team collaboration and productivity suites",
        value: "productivity_focused"
      },
      {
        id: "tools-analytics",
        text: "Data analytics and business intelligence",
        value: "analytics_focused"
      },
      {
        id: "tools-marketing",
        text: "Marketing automation and campaign management",
        value: "marketing_focused"
      }
    ]
  },
  {
    id: 1005,
    type: "multiple-choice",
    question: "What are your preferred communication channels for vendor interactions?",
    options: [
      {
        id: "comm-email",
        text: "Email correspondence (asynchronous)",
        value: "email_preference"
      },
      {
        id: "comm-phone",
        text: "Phone calls and direct conversations",
        value: "phone_preference"
      },
      {
        id: "comm-video",
        text: "Video meetings and screen sharing",
        value: "video_preference"
      },
      {
        id: "comm-messaging",
        text: "Instant messaging and chat platforms",
        value: "chat_preference"
      },
      {
        id: "comm-inperson",
        text: "In-person meetings and site visits",
        value: "inperson_preference"
      }
    ]
  },
  {
    id: 1006,
    type: "multiple-choice",
    question: "What service level expectations are most important to your business?",
    options: [
      {
        id: "service-response",
        text: "Rapid response times to inquiries and issues",
        value: "response_priority"
      },
      {
        id: "service-availability",
        text: "24/7 availability and support coverage",
        value: "availability_priority"
      },
      {
        id: "service-expertise",
        text: "Deep technical expertise and knowledge",
        value: "expertise_priority"
      },
      {
        id: "service-proactive",
        text: "Proactive monitoring and issue prevention",
        value: "proactive_priority"
      },
      {
        id: "service-relationship",
        text: "Consistent relationship with dedicated contacts",
        value: "relationship_priority"
      }
    ]
  },
  {
    id: 1007,
    type: "multiple-choice",
    question: "How would you characterize your organization's approach to support tickets?",
    options: [
      {
        id: "support-minimal",
        text: "We minimize support requests and prefer self-service",
        value: "self_service_oriented"
      },
      {
        id: "support-critical",
        text: "We only create tickets for critical issues",
        value: "critical_only"
      },
      {
        id: "support-thorough",
        text: "We document all issues thoroughly to ensure resolution",
        value: "documentation_focused"
      },
      {
        id: "support-collaborative",
        text: "We prefer collaborative troubleshooting with vendors",
        value: "collaboration_focused"
      }
    ]
  },
  {
    id: 1008,
    type: "multiple-choice",
    question: "What factors most influence your contract renewal decisions?",
    options: [
      {
        id: "renewal-roi",
        text: "Measurable ROI and value delivered",
        value: "roi_driven"
      },
      {
        id: "renewal-relationship",
        text: "Quality of relationship and service received",
        value: "relationship_driven"
      },
      {
        id: "renewal-innovation",
        text: "Continued innovation and new capabilities",
        value: "innovation_driven"
      },
      {
        id: "renewal-integration",
        text: "Integration with our evolving tech ecosystem",
        value: "integration_driven"
      },
      {
        id: "renewal-price",
        text: "Competitive pricing and cost management",
        value: "price_driven"
      }
    ]
  },
  {
    id: 1009,
    type: "multiple-choice",
    question: "How do you prefer to handle product/service implementation?",
    options: [
      {
        id: "implement-guided",
        text: "Fully guided implementation with dedicated support",
        value: "guided_implementation"
      },
      {
        id: "implement-self",
        text: "Self-implementation with documentation/resources",
        value: "self_implementation"
      },
      {
        id: "implement-phased",
        text: "Phased approach with milestone-based deployment",
        value: "phased_implementation"
      },
      {
        id: "implement-customized",
        text: "Customized implementation tailored to our processes",
        value: "customized_implementation"
      }
    ]
  },
  {
    id: 1010,
    type: "multiple-choice",
    question: "What is your typical decision-making process for business solutions?",
    options: [
      {
        id: "decision-centralized",
        text: "Centralized with a small executive team",
        value: "centralized_decision"
      },
      {
        id: "decision-department",
        text: "Department-led with budget authority",
        value: "departmental_decision"
      },
      {
        id: "decision-committee",
        text: "Committee-based with multiple stakeholders",
        value: "committee_decision"
      },
      {
        id: "decision-data",
        text: "Data-driven evaluation against defined criteria",
        value: "data_driven_decision"
      }
    ]
  }
];

// Collection of all survey types with their questions
export const surveyTypes = {
  general: { name: "Personality Profile", questions: generalQuestions },
  career: { name: "Professional Profile", questions: careerQuestions },
  consumer: { name: "Consumer Behavior", questions: consumerQuestions },
  innovation: { name: "Innovation Mindset", questions: innovationQuestions },
  sustainability: { name: "Sustainability Orientation", questions: sustainabilityQuestions },
  digital: { name: "Digital Behavior Profile", questions: digitalQuestions },
  emotional: { name: "Emotional Intelligence", questions: emotionalQuestions },
  learning: { name: "Learning & Development", questions: learningQuestions },
  bigfive: { name: "Big Five Personality", questions: bigfiveQuestions }
};

// Default export is the general personality assessment
export default generalQuestions;
