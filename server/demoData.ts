// Demo data for the DEMO BUSINESS COMPANY (company ID: 1)
// This is used specifically for the demo account to show populated BI data

// Demo data for competitor analysis
export const demoCompetitors = [
  {
    id: 1,
    name: "MarketInsight Pro",
    marketShare: 34,
    strengthScore: 86,
    weaknessScore: 45,
    overallThreatLevel: 68,
    primaryCompetitiveAdvantage: "Enterprise-grade security features",
    keyWeakness: "High pricing point",
    customerSentiment: 72,
    pricingPosition: "Premium",
    productFeatureComparison: {
      "Analytics Depth": { competitor: 80, our: 75 },
      "User Experience": { competitor: 65, our: 82 },
      "Integration Options": { competitor: 90, our: 78 },
      "Customization": { competitor: 72, our: 85 }
    }
  },
  {
    id: 2,
    name: "SurveyMaster",
    marketShare: 28,
    strengthScore: 73,
    weaknessScore: 52,
    overallThreatLevel: 61,
    primaryCompetitiveAdvantage: "User-friendly interface",
    keyWeakness: "Limited advanced analytics",
    customerSentiment: 68,
    pricingPosition: "Mid-tier",
    productFeatureComparison: {
      "Analytics Depth": { competitor: 60, our: 75 },
      "User Experience": { competitor: 85, our: 82 },
      "Integration Options": { competitor: 72, our: 78 },
      "Customization": { competitor: 68, our: 85 }
    }
  },
  {
    id: 3,
    name: "Persona Insight",
    marketShare: 16,
    strengthScore: 91,
    weaknessScore: 38,
    overallThreatLevel: 74,
    primaryCompetitiveAdvantage: "Advanced personality modeling",
    keyWeakness: "Limited survey tools",
    customerSentiment: 81,
    pricingPosition: "Premium",
    productFeatureComparison: {
      "Analytics Depth": { competitor: 95, our: 75 },
      "User Experience": { competitor: 70, our: 82 },
      "Integration Options": { competitor: 65, our: 78 },
      "Customization": { competitor: 68, our: 85 }
    }
  }
];

// Demo data for market fit analysis
export const demoMarketFit = {
  productId: "prod-1",
  overallFitScore: 82,
  problemSolutionFit: 86,
  productMarketFit: 79,
  targetMarketSize: {
    total: 8900000000, // $8.9B
    addressable: 2100000000, // $2.1B
    serviceable: 450000000 // $450M
  },
  customerNeedAlignment: 84,
  valuePropositionClarity: 78,
  priceToValuePerception: 76,
  productDifferentiation: 81,
  competitiveAdvantage: [
    "Rich personality data for business contexts",
    "Real-time collaboration features",
    "Seamless integration with existing HR systems"
  ],
  marketChallenges: [
    "Increasing competition in data analytics space",
    "Privacy concerns around personality data",
    "Resistance to changing existing HR processes"
  ],
  customerPainPoints: [
    {
      painPoint: "Lack of data-driven team composition tools",
      severity: 78,
      frequency: 86,
      addressedByProduct: 91
    },
    {
      painPoint: "Difficulty understanding employee motivation",
      severity: 82,
      frequency: 74,
      addressedByProduct: 88
    },
    {
      painPoint: "Poor tools for predicting cultural fit",
      severity: 76,
      frequency: 69,
      addressedByProduct: 85
    }
  ],
  recommendations: [
    "Focus marketing on ROI from improved team dynamics",
    "Develop simplified onboarding workflows for HR departments",
    "Enhance data privacy features to address market concerns"
  ]
};

// Demo data for customer segments
export const demoSegments = [
  {
    name: "Enterprise Innovators",
    size: 28,
    percentageOfCustomers: 28,
    growthRate: 12.5,
    dominantTraits: [
      { name: "Risk Tolerance", score: 82 },
      { name: "Technology Adoption", score: 91 },
      { name: "Data-Driven Decision Making", score: 87 }
    ],
    keyDemographics: {
      ageGroups: { "25-34": 35, "35-44": 42, "45-54": 23 },
      genderDistribution: { "Male": 58, "Female": 40, "Non-binary": 2 },
      incomeRange: { "$75k-$100k": 18, "$100k-$150k": 52, "$150k+": 30 },
      education: { "Bachelor's": 45, "Master's": 48, "PhD": 7 },
      location: { "Urban": 65, "Suburban": 32, "Rural": 3 }
    },
    purchasingBehaviors: [
      "Prefer annual contracts",
      "High adoption of premium features",
      "Often buy at enterprise scale"
    ],
    productPreferences: [
      "Advanced data visualization",
      "Team management features",
      "API integration capabilities"
    ],
    communicationChannels: {
      "Email": 72,
      "LinkedIn": 85,
      "Industry Events": 68,
      "Direct Sales": 93
    },
    customerLifetimeValue: 28500,
    acquisitionCost: 2700,
    targetFit: 92
  },
  {
    name: "Growth-Focused SMBs",
    size: 41,
    percentageOfCustomers: 41,
    growthRate: 18.7,
    dominantTraits: [
      { name: "Value Sensitivity", score: 76 },
      { name: "Practicality", score: 88 },
      { name: "Growth Mindset", score: 92 }
    ],
    keyDemographics: {
      ageGroups: { "25-34": 48, "35-44": 38, "45-54": 14 },
      genderDistribution: { "Male": 52, "Female": 46, "Non-binary": 2 },
      incomeRange: { "$50k-$75k": 25, "$75k-$100k": 45, "$100k-$150k": 30 },
      education: { "High School": 5, "Bachelor's": 72, "Master's": 23 },
      location: { "Urban": 45, "Suburban": 48, "Rural": 7 }
    },
    purchasingBehaviors: [
      "Price sensitive",
      "Prefer monthly subscriptions",
      "Gradual feature adoption"
    ],
    productPreferences: [
      "Ease of use",
      "Quick setup",
      "Practical reporting"
    ],
    communicationChannels: {
      "Email": 85,
      "Social Media": 78,
      "Content Marketing": 62,
      "Webinars": 72
    },
    customerLifetimeValue: 9200,
    acquisitionCost: 850,
    targetFit: 87
  },
  {
    name: "Specialist Consultants",
    size: 31,
    percentageOfCustomers: 31,
    growthRate: 9.2,
    dominantTraits: [
      { name: "Analytical Thinking", score: 94 },
      { name: "Autonomy", score: 89 },
      { name: "Client-Centric Focus", score: 91 }
    ],
    keyDemographics: {
      ageGroups: { "35-44": 42, "45-54": 38, "55-64": 20 },
      genderDistribution: { "Male": 48, "Female": 52 },
      incomeRange: { "$100k-$150k": 65, "$150k+": 35 },
      education: { "Bachelor's": 30, "Master's": 58, "PhD": 12 },
      location: { "Urban": 55, "Suburban": 40, "Rural": 5 }
    },
    purchasingBehaviors: [
      "Value depth of insights",
      "Willing to pay premium for quality",
      "Longer sales cycle"
    ],
    productPreferences: [
      "White-labeling options",
      "Advanced analytics",
      "Client-ready reporting"
    ],
    communicationChannels: {
      "Email": 65,
      "LinkedIn": 82,
      "Professional Associations": 72,
      "Referrals": 89
    },
    customerLifetimeValue: 16500,
    acquisitionCost: 1100,
    targetFit: 91
  }
];

// Demo data for feature priorities
export const demoFeatures = [
  {
    featureName: "AI-Powered Personality Insights",
    importance: 92,
    currentSatisfaction: 76,
    developmentCost: 210000,
    timeToImplement: "4-6 months",
    impactOnSales: 89,
    competitiveNecessity: 86,
    customerSegmentRelevance: {
      "Enterprise Innovators": 94,
      "Growth-Focused SMBs": 86,
      "Specialist Consultants": 97
    },
    technicalFeasibility: 82,
    strategicAlignment: 95,
    overallPriority: 91
  },
  {
    featureName: "Team Compatibility Analysis",
    importance: 87,
    currentSatisfaction: 72,
    developmentCost: 125000,
    timeToImplement: "2-3 months",
    impactOnSales: 82,
    competitiveNecessity: 78,
    customerSegmentRelevance: {
      "Enterprise Innovators": 91,
      "Growth-Focused SMBs": 88,
      "Specialist Consultants": 82
    },
    technicalFeasibility: 88,
    strategicAlignment: 90,
    overallPriority: 86
  },
  {
    featureName: "Custom Integration APIs",
    importance: 76,
    currentSatisfaction: 62,
    developmentCost: 180000,
    timeToImplement: "3-5 months",
    impactOnSales: 68,
    competitiveNecessity: 74,
    customerSegmentRelevance: {
      "Enterprise Innovators": 89,
      "Growth-Focused SMBs": 64,
      "Specialist Consultants": 72
    },
    technicalFeasibility: 82,
    strategicAlignment: 78,
    overallPriority: 73
  },
  {
    featureName: "Real-time Collaboration Dashboard",
    importance: 81,
    currentSatisfaction: 58,
    developmentCost: 95000,
    timeToImplement: "1-2 months",
    impactOnSales: 75,
    competitiveNecessity: 68,
    customerSegmentRelevance: {
      "Enterprise Innovators": 78,
      "Growth-Focused SMBs": 82,
      "Specialist Consultants": 84
    },
    technicalFeasibility: 90,
    strategicAlignment: 84,
    overallPriority: 81
  }
];

// Demo data for pricing strategies
export const demoPricingStrategies = [
  {
    strategyName: "Premium Tiered Model",
    appropriateness: 86,
    potentialRevenue: 1224000,
    customerAcceptance: 78,
    competitiveSustainability: 82,
    implementationComplexity: 64,
    profitMargin: 72,
    marketPenetration: 68,
    customerSegmentImpact: {
      "Enterprise Innovators": 86,
      "Growth-Focused SMBs": 52,
      "Specialist Consultants": 78
    },
    overallScore: 84,
    pricingStructure: {
      base: 599,
      tiers: [
        {
          name: "Starter",
          price: 599,
          features: ["Basic personality assessment", "Limited reports", "Email support"]
        },
        {
          name: "Professional",
          price: 1299,
          features: ["Advanced personality analytics", "Team compatibility", "Priority support", "Custom reporting"]
        },
        {
          name: "Enterprise",
          price: 2499,
          features: ["Full platform access", "API integrations", "Dedicated account manager", "Custom development"]
        }
      ]
    }
  },
  {
    strategyName: "Value-Based Pricing",
    appropriateness: 78,
    potentialRevenue: 970000,
    customerAcceptance: 84,
    competitiveSustainability: 75,
    implementationComplexity: 68,
    profitMargin: 65,
    marketPenetration: 82,
    customerSegmentImpact: {
      "Enterprise Innovators": 62,
      "Growth-Focused SMBs": 86,
      "Specialist Consultants": 72
    },
    overallScore: 76,
    pricingStructure: {
      base: 299,
      tiers: [
        {
          name: "Basic",
          price: 299,
          features: ["Core personality assessment", "Standard reports", "Community support"]
        },
        {
          name: "Business",
          price: 999,
          features: ["Advanced assessment tools", "Team analysis", "Email support", "Basic integrations"]
        },
        {
          name: "Premium",
          price: 1999,
          features: ["Full platform access", "Custom integrations", "Phone support", "Custom training"]
        }
      ]
    }
  }
];

// Demo data for marketing strategies
export const demoMarketingStrategies = [
  {
    strategyName: "Thought Leadership Content Strategy",
    effectiveness: 87,
    costEfficiency: 73,
    implementationTimeline: "3-6 months",
    revenueImpact: 78,
    brandAlignment: 92,
    customerReach: 76,
    competitiveAdvantage: 85,
    channelBreakdown: {
      "Industry Publications": 24,
      "Podcast Sponsorships": 18,
      "Webinar Series": 22,
      "LinkedIn Content": 26,
      "Email Newsletter": 10
    },
    messagingThemes: [
      "Transform team dynamics with science-backed personality insights",
      "Reduce turnover by 28% through better team alignment",
      "Make data-driven people decisions with confidence"
    ],
    targetedPersonas: ["HR Directors", "People Operations Leaders", "Executive Coaches"],
    overallScore: 82
  },
  {
    strategyName: "Growth-Focused Value Campaign",
    effectiveness: 84,
    costEfficiency: 82,
    implementationTimeline: "1-3 months",
    revenueImpact: 75,
    brandAlignment: 79,
    customerReach: 86,
    competitiveAdvantage: 72,
    channelBreakdown: {
      "LinkedIn Advertising": 28,
      "Google Search": 25,
      "Email Nurture Campaigns": 22,
      "Partner Co-marketing": 15,
      "Content Marketing": 10
    },
    messagingThemes: [
      "Accelerate team performance and cohesion",
      "Affordable personality insights for growing businesses",
      "Simple implementation, powerful results"
    ],
    targetedPersonas: ["Startup Founders", "SMB Managers", "Team Leaders"],
    overallScore: 78
  }
];

// Demo data for revenue forecasts
export const demoRevenueForecasts = [
  {
    scenario: "Conservative Growth Model",
    probabilityOfOccurrence: 65,
    timeframe: "12 months",
    projectedRevenue: 507000,
    growthRate: 28,
    marketShareProjection: 5.2,
    customerAdoption: 390,
    contributingFactors: [
      "Increased inbound marketing effectiveness",
      "Expanded partner channel",
      "New product features"
    ],
    riskFactors: [
      "Emerging competitive products",
      "Economic downturn affecting HR budgets",
      "Implementation challenges"
    ],
    confidenceLevel: 76,
    monthlyBreakdown: {
      "Month 1": 23400,
      "Month 2": 28600,
      "Month 3": 33800,
      "Month 4": 36400,
      "Month 5": 39000,
      "Month 6": 41600,
      "Month 7": 44200,
      "Month 8": 46800,
      "Month 9": 49400,
      "Month 10": 52000,
      "Month 11": 54600,
      "Month 12": 57200
    }
  },
  {
    scenario: "Aggressive Expansion Plan",
    probabilityOfOccurrence: 35,
    timeframe: "12 months",
    projectedRevenue: 942500,
    growthRate: 45,
    marketShareProjection: 8.8,
    customerAdoption: 725,
    contributingFactors: [
      "Major enterprise client acquisition",
      "Successful product launch events",
      "New industry partnerships"
    ],
    riskFactors: [
      "High customer acquisition costs",
      "Slower than anticipated onboarding",
      "Technical scaling challenges"
    ],
    confidenceLevel: 62,
    monthlyBreakdown: {
      "Month 1": 32500,
      "Month 2": 41600,
      "Month 3": 52000,
      "Month 4": 62400,
      "Month 5": 71500,
      "Month 6": 78000,
      "Month 7": 84500,
      "Month 8": 91000,
      "Month 9": 97500,
      "Month 10": 104000,
      "Month 11": 110500,
      "Month 12": 117000
    }
  }
];

export const demoFocusGroup = {
  productConcept: "AI-powered personality assessment tool for hiring",
  participants: [
    {
      id: "p1",
      traits: [
        { name: "Openness", score: 82 },
        { name: "Conscientiousness", score: 75 },
        { name: "Extraversion", score: 62 },
        { name: "Agreeableness", score: 68 },
        { name: "Neuroticism", score: 45 }
      ],
      demographics: {
        age: 34,
        gender: "Female",
        occupation: "HR Manager",
        industry: "Technology"
      }
    },
    {
      id: "p2",
      traits: [
        { name: "Openness", score: 65 },
        { name: "Conscientiousness", score: 88 },
        { name: "Extraversion", score: 45 },
        { name: "Agreeableness", score: 72 },
        { name: "Neuroticism", score: 38 }
      ],
      demographics: {
        age: 42,
        gender: "Male",
        occupation: "Talent Acquisition Director",
        industry: "Finance"
      }
    },
    {
      id: "p3",
      traits: [
        { name: "Openness", score: 78 },
        { name: "Conscientiousness", score: 62 },
        { name: "Extraversion", score: 85 },
        { name: "Agreeableness", score: 70 },
        { name: "Neuroticism", score: 52 }
      ],
      demographics: {
        age: 29,
        gender: "Female",
        occupation: "Recruiter",
        industry: "Healthcare"
      }
    },
    {
      id: "p4",
      traits: [
        { name: "Openness", score: 72 },
        { name: "Conscientiousness", score: 80 },
        { name: "Extraversion", score: 58 },
        { name: "Agreeableness", score: 65 },
        { name: "Neuroticism", score: 42 }
      ],
      demographics: {
        age: 38,
        gender: "Male",
        occupation: "HR Director",
        industry: "Manufacturing"
      }
    },
    {
      id: "p5",
      traits: [
        { name: "Openness", score: 85 },
        { name: "Conscientiousness", score: 72 },
        { name: "Extraversion", score: 68 },
        { name: "Agreeableness", score: 75 },
        { name: "Neuroticism", score: 40 }
      ],
      demographics: {
        age: 32,
        gender: "Non-binary",
        occupation: "People Operations Manager",
        industry: "Technology"
      }
    }
  ],
  overallSentiment: 78,
  keyThemes: {
    "Accuracy of assessments": 85,
    "Ease of use": 82,
    "Time efficiency": 90,
    "Privacy concerns": 62,
    "Integration with existing systems": 70,
    "Cost effectiveness": 75
  },
  suggestedImprovements: [
    "Provide more customization options for different industries",
    "Add more detailed explanations of personality traits",
    "Improve the candidate experience during assessment",
    "Develop better integration with ATS platforms",
    "Create team compatibility reports"
  ],
  purchaseIntent: 82,
  pricePerception: "Premium but worth it",
  valuePerception: 85,
  featureFeedback: {
    "Personality assessment": {
      importance: 95,
      satisfaction: 85,
      comments: [
        "Very accurate results",
        "Wish there were more customization options",
        "Great insights for team building"
      ]
    },
    "Team compatibility analysis": {
      importance: 85,
      satisfaction: 78,
      comments: [
        "Helpful for reorganizing teams",
        "Would like more actionable recommendations",
        "Interesting visualization of team dynamics"
      ]
    },
    "Candidate matching": {
      importance: 90,
      satisfaction: 82,
      comments: [
        "Saves time in screening process",
        "Would like more weight adjustment options",
        "Good prediction of cultural fit"
      ]
    },
    "Analytics dashboard": {
      importance: 80,
      satisfaction: 75,
      comments: [
        "Good overview but could use more filtering options",
        "Export functionality is limited",
        "Visually appealing presentation"
      ]
    }
  },
  competitiveComparisons: {
    "Traditional assessment tools": 85,
    "Other AI-powered solutions": 78,
    "In-house developed tools": 90,
    "Manual screening processes": 95
  },
  participantQuotes: [
    "This would cut our hiring time in half and improve quality.",
    "I'm concerned about algorithm bias in personality assessment.",
    "The team compatibility feature could transform how we organize projects.",
    "We would need better integration with our current ATS.",
    "This is exactly what we've been looking for to improve our talent acquisition."
  ]
};

export function generateFocusGroupSimulation(productConcept: string): any {
  // Create a new focus group simulation with the provided product concept
  const result = { ...demoFocusGroup };
  
  // Update the product concept if provided
  if (productConcept && productConcept.trim() !== '') {
    result.productConcept = productConcept;
    
    // Adjust some values based on the product concept to make it seem dynamic
    const conceptLower = productConcept.toLowerCase();
    
    // Adjust sentiment based on keywords in product concept
    if (conceptLower.includes('ai') || conceptLower.includes('machine learning')) {
      result.overallSentiment = Math.min(85, result.overallSentiment + 5);
      result.keyThemes["Innovation factor"] = 88;
    }
    
    if (conceptLower.includes('dashboard') || conceptLower.includes('analytics')) {
      result.overallSentiment = Math.min(82, result.overallSentiment + 3);
      result.keyThemes["Data visualization"] = 84;
    }
    
    if (conceptLower.includes('mobile') || conceptLower.includes('app')) {
      result.overallSentiment = Math.min(80, result.overallSentiment + 2);
      result.keyThemes["Accessibility"] = 86;
    }
    
    // Add a product-specific suggestion
    result.suggestedImprovements.unshift(`Consider enhancing ${productConcept} with more collaborative features`);
    
    // Adjust purchase intent based on product concept length (just as a simple dynamic factor)
    const lengthFactor = Math.min(5, Math.floor(productConcept.length / 10));
    result.purchaseIntent = Math.min(95, result.purchaseIntent + lengthFactor);
  }
  
  return result;
}