import { Router } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Helper to check if the request is from the demo account
const isDemoAccount = async (req: any): Promise<boolean> => {
  const demoEmails = ['testdemo@personalysispro.com', 'admin@personalysispro.com', 'demo@personalysispro.com'];
  
  try {
    // Check if this is a company-specific endpoint with companyId
    const companyId = req.params.companyId;
    if (companyId) {
      // If requesting company data for company ID 1 (DEMO BUSINESS COMPANY), return true
      return companyId === '1';
    }
    
    // If no company ID in params, check user information
    const userId = req.headers['x-user-id'] || (req.session?.user?.id);
    
    if (!userId) {
      return false;
    }
    
    // Check if this user is one of the demo accounts
    const [user] = await db.select().from(users).where(eq(users.id, Number(userId)));
    
    return demoEmails.includes(user?.email) || user?.company_id === 1;
  } catch (error) {
    console.error('Error checking for demo account:', error);
    return false;
  }
};

// Basic analytics data for demo account
router.get('/company/:companyId/analytics', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      // If not demo account, continue with normal processing
      return res.status(200).json({
        status: 'success',
        data: {
          totalResponses: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          responsesByDate: {},
          uniqueRespondents: 0
        }
      });
    }
    
    // Generate demo analytics data
    const today = new Date();
    const responsesByDate: Record<string, number> = {};
    
    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Generate random responses between 5-30
      responsesByDate[dateString] = 5 + Math.floor(Math.random() * 25);
    }
    
    // Calculate total responses
    const totalResponses = Object.values(responsesByDate).reduce((sum, val) => sum + val, 0);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalResponses,
        completionRate: 87 + Math.floor(Math.random() * 10), // 87-96%
        averageCompletionTime: 180 + Math.floor(Math.random() * 120), // 3-5 minutes
        responsesByDate,
        uniqueRespondents: Math.floor(totalResponses * 0.9) // Assume 90% unique respondents
      }
    });
  } catch (error) {
    console.error('Error serving demo analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve analytics data'
    });
  }
});

// Competitor analysis for demo account
router.get('/company/:companyId/competitors', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for competitor analysis
    const competitors = [
      {
        id: 1,
        name: "MarketInsight Pro",
        marketShare: 34,
        strengthScore: 86,
        keyStrengths: [
          "Enterprise-grade security features",
          "Cross-platform integration",
          "Custom reporting capabilities"
        ],
        keyWeaknesses: [
          "High pricing point",
          "Complex user interface",
          "Slow performance on mobile"
        ],
        pricePoint: "Premium",
        targetMarkets: ["Financial Services", "Healthcare", "Technology"],
        recentDevelopments: "Recently launched an AI-powered predictive analytics module."
      },
      {
        id: 2,
        name: "SurveyMaster",
        marketShare: 28,
        strengthScore: 73,
        keyStrengths: [
          "User-friendly interface",
          "Low barrier to entry",
          "Expansive template library"
        ],
        keyWeaknesses: [
          "Limited advanced analytics",
          "Poor API documentation",
          "Subpar customer support"
        ],
        pricePoint: "Mid-tier",
        targetMarkets: ["Education", "Retail", "Small Business"],
        recentDevelopments: "Acquired a small data visualization company to enhance reporting features."
      },
      {
        id: 3,
        name: "Persona Insight",
        marketShare: 16,
        strengthScore: 91,
        keyStrengths: [
          "Advanced personality modeling",
          "Scientific research backing",
          "Deep industry expertise"
        ],
        keyWeaknesses: [
          "Limited survey tools",
          "Narrow application focus",
          "Weak integration options"
        ],
        pricePoint: "Premium",
        targetMarkets: ["HR & Recruitment", "Executive Coaching", "Team Development"],
        recentDevelopments: "Partnered with three major universities for ongoing psychological research."
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: competitors
    });
  } catch (error) {
    console.error('Error serving demo competitor data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve competitor data'
    });
  }
});

// Market fit analysis for demo account
router.get('/company/:companyId/market-fit/:productId', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: null
      });
    }
    
    // Demo data for market fit analysis
    const marketFit = {
      productId: req.params.productId,
      productName: "PersonalysisPro Platform",
      overallFitScore: 82,
      segmentFitScores: [
        {
          segmentName: "Enterprise HR",
          score: 89,
          potential: 92
        },
        {
          segmentName: "Mid-sized Business",
          score: 76,
          potential: 84
        },
        {
          segmentName: "Consultants",
          score: 91,
          potential: 94
        },
        {
          segmentName: "Educational Institutions",
          score: 67,
          potential: 78
        }
      ],
      traitAlignments: [
        {
          trait: "Technical Complexity",
          alignment: 72
        },
        {
          trait: "User-Friendliness",
          alignment: 86
        },
        {
          trait: "Data Depth",
          alignment: 94
        },
        {
          trait: "Integration Capabilities",
          alignment: 77
        },
        {
          trait: "Value Perception",
          alignment: 81
        }
      ],
      marketSizePotential: {
        total: 8900000000, // $8.9B
        addressable: 2100000000, // $2.1B
        serviceable: 450000000 // $450M
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: marketFit
    });
  } catch (error) {
    console.error('Error serving demo market fit data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve market fit data'
    });
  }
});

// Customer segments for demo account
router.get('/company/:companyId/segments', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for customer segments
    const segments = [
      {
        id: "seg-1",
        name: "Enterprise Innovators",
        size: 28,
        percentOfTotal: 28,
        dominantTraits: [
          {
            trait: "Risk Tolerance",
            score: 82
          },
          {
            trait: "Technology Adoption",
            score: 91
          },
          {
            trait: "Data-Driven Decision Making",
            score: 87
          }
        ],
        demographicSummary: {
          averageAge: 42,
          dominantGender: "Mixed (55% Male)",
          averageIncome: "$125,000+",
          topLocations: ["San Francisco", "New York", "Boston", "London"],
          topInterests: ["Technology", "Innovation", "Business Strategy"]
        },
        purchaseBehavior: {
          averageOrderValue: 18500,
          purchaseFrequency: 1.2,
          loyaltyScore: 76
        }
      },
      {
        id: "seg-2",
        name: "Growth-Focused SMBs",
        size: 41,
        percentOfTotal: 41,
        dominantTraits: [
          {
            trait: "Value Sensitivity",
            score: 76
          },
          {
            trait: "Practicality",
            score: 88
          },
          {
            trait: "Growth Mindset",
            score: 92
          }
        ],
        demographicSummary: {
          averageAge: 38,
          dominantGender: "Mixed (48% Male)",
          averageIncome: "$85,000-115,000",
          topLocations: ["Austin", "Denver", "Atlanta", "Toronto"],
          topInterests: ["Business Growth", "Productivity", "Team Management"]
        },
        purchaseBehavior: {
          averageOrderValue: 5200,
          purchaseFrequency: 2.4,
          loyaltyScore: 64
        }
      },
      {
        id: "seg-3",
        name: "Specialist Consultants",
        size: 31,
        percentOfTotal: 31,
        dominantTraits: [
          {
            trait: "Analytical Thinking",
            score: 94
          },
          {
            trait: "Autonomy",
            score: 89
          },
          {
            trait: "Client-Centric Focus",
            score: 91
          }
        ],
        demographicSummary: {
          averageAge: 45,
          dominantGender: "Mixed (52% Female)",
          averageIncome: "$150,000+",
          topLocations: ["Chicago", "London", "Sydney", "Singapore"],
          topInterests: ["Psychology", "Business Consulting", "Professional Development"]
        },
        purchaseBehavior: {
          averageOrderValue: 3800,
          purchaseFrequency: 3.2,
          loyaltyScore: 88
        }
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: segments
    });
  } catch (error) {
    console.error('Error serving demo segment data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve segment data'
    });
  }
});

// Feature priorities for demo account
router.get('/company/:companyId/feature-priorities', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for feature priorities
    const features = [
      {
        featureId: "feat-1",
        featureName: "AI-Powered Personality Insights",
        description: "Advanced artificial intelligence that generates detailed personality insights from minimal data inputs.",
        overallAppeal: 92,
        segmentAppeal: {
          "Enterprise Innovators": 94,
          "Growth-Focused SMBs": 86,
          "Specialist Consultants": 97
        },
        developmentCost: 210000,
        timeToImplement: 4.5, // months
        roi: 4.2, // 4.2x return
        alignedTraits: [
          {
            trait: "Analytical Thinking",
            strength: 95
          },
          {
            trait: "Technology Adoption",
            strength: 89
          }
        ]
      },
      {
        featureId: "feat-2",
        featureName: "Team Compatibility Analysis",
        description: "Tools to measure and improve team dynamics based on personality compatibility metrics.",
        overallAppeal: 87,
        segmentAppeal: {
          "Enterprise Innovators": 91,
          "Growth-Focused SMBs": 88,
          "Specialist Consultants": 82
        },
        developmentCost: 125000,
        timeToImplement: 3, // months
        roi: 3.8, // 3.8x return
        alignedTraits: [
          {
            trait: "Team Orientation",
            strength: 93
          },
          {
            trait: "Collaborative Style",
            strength: 87
          }
        ]
      },
      {
        featureId: "feat-3",
        featureName: "Custom Integration APIs",
        description: "Enterprise-grade APIs allowing deep integration with existing HR and business intelligence systems.",
        overallAppeal: 76,
        segmentAppeal: {
          "Enterprise Innovators": 89,
          "Growth-Focused SMBs": 64,
          "Specialist Consultants": 72
        },
        developmentCost: 180000,
        timeToImplement: 5, // months
        roi: 2.9, // 2.9x return
        alignedTraits: [
          {
            trait: "Technical Complexity",
            strength: 82
          },
          {
            trait: "System Integration",
            strength: 91
          }
        ]
      },
      {
        featureId: "feat-4",
        featureName: "Real-time Collaboration Dashboard",
        description: "Interactive dashboard allowing multiple team members to analyze and comment on personality data in real-time.",
        overallAppeal: 81,
        segmentAppeal: {
          "Enterprise Innovators": 78,
          "Growth-Focused SMBs": 82,
          "Specialist Consultants": 84
        },
        developmentCost: 95000,
        timeToImplement: 2.5, // months
        roi: 3.5, // 3.5x return
        alignedTraits: [
          {
            trait: "Collaboration",
            strength: 88
          },
          {
            trait: "Communication Style",
            strength: 85
          }
        ]
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: features
    });
  } catch (error) {
    console.error('Error serving demo feature data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve feature data'
    });
  }
});

// Pricing strategies for demo account
router.get('/company/:companyId/pricing-strategies', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for pricing strategies
    const pricingStrategies = [
      {
        strategyId: "price-1",
        name: "Premium Tiered Model",
        tiers: [
          {
            tierName: "Starter",
            price: 599,
            features: ["Basic personality assessment", "Limited reports", "Email support"],
            targetSegments: ["Individual Practitioners", "Small Teams"],
            estimatedAdoption: 45,
            estimatedRevenue: 269550
          },
          {
            tierName: "Professional",
            price: 1299,
            features: ["Advanced personality analytics", "Team compatibility", "Priority support", "Custom reporting"],
            targetSegments: ["Growth-Focused SMBs", "Mid-sized Teams"],
            estimatedAdoption: 35,
            estimatedRevenue: 454650
          },
          {
            tierName: "Enterprise",
            price: 2499,
            features: ["Full platform access", "API integrations", "Dedicated account manager", "Custom development"],
            targetSegments: ["Enterprise Innovators", "Large Organizations"],
            estimatedAdoption: 20,
            estimatedRevenue: 499800
          }
        ],
        optimalPrice: 1299,
        priceElasticity: 0.76,
        willingness: [
          {
            segment: "Enterprise Innovators",
            price: 2150
          },
          {
            segment: "Growth-Focused SMBs",
            price: 950
          },
          {
            segment: "Specialist Consultants",
            price: 1450
          }
        ]
      },
      {
        strategyId: "price-2",
        name: "Value-Based Pricing",
        tiers: [
          {
            tierName: "Basic",
            price: 299,
            features: ["Core personality assessment", "Standard reports", "Community support"],
            targetSegments: ["Solo Practitioners", "Startups"],
            estimatedAdoption: 55,
            estimatedRevenue: 164450
          },
          {
            tierName: "Business",
            price: 999,
            features: ["Advanced assessment tools", "Team analysis", "Email support", "Basic integrations"],
            targetSegments: ["Growth-Focused SMBs", "Growing Teams"],
            estimatedAdoption: 30,
            estimatedRevenue: 299700
          },
          {
            tierName: "Premium",
            price: 1999,
            features: ["Full platform access", "Custom integrations", "Phone support", "Custom training"],
            targetSegments: ["Mid-sized Organizations", "Enterprise Departments"],
            estimatedAdoption: 15,
            estimatedRevenue: 299850
          }
        ],
        optimalPrice: 999,
        priceElasticity: 1.2,
        willingness: [
          {
            segment: "Enterprise Innovators",
            price: 1750
          },
          {
            segment: "Growth-Focused SMBs",
            price: 799
          },
          {
            segment: "Specialist Consultants",
            price: 1199
          }
        ]
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: pricingStrategies
    });
  } catch (error) {
    console.error('Error serving demo pricing data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve pricing data'
    });
  }
});

// Marketing strategies for demo account
router.get('/company/:companyId/marketing-strategies', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for marketing strategies
    const marketingStrategies = [
      {
        strategyId: "mkt-1",
        name: "Thought Leadership Content Strategy",
        targetSegments: ["Enterprise Innovators", "Specialist Consultants"],
        channels: [
          {
            channelName: "Industry Publications",
            effectiveness: 87,
            costPerAcquisition: 210,
            recommendedBudget: 35000
          },
          {
            channelName: "Podcast Sponsorships",
            effectiveness: 82,
            costPerAcquisition: 180,
            recommendedBudget: 28000
          },
          {
            channelName: "Webinar Series",
            effectiveness: 91,
            costPerAcquisition: 135,
            recommendedBudget: 42000
          }
        ],
        messaging: {
          keyMessages: [
            "Transform team dynamics with science-backed personality insights",
            "Reduce turnover by 28% through better team alignment",
            "Make data-driven people decisions with confidence"
          ],
          toneOfVoice: "Authoritative, scientific, visionary",
          valuePropositions: [
            "Industry-leading accuracy in personality assessment",
            "Integrated with major enterprise HR systems",
            "ROI-focused implementation methodology"
          ]
        },
        campaignIdeas: [
          {
            name: "Personality at Work Summit",
            description: "Virtual conference featuring HR thought leaders discussing personality impact on workplace performance",
            targetTrait: "Analytical Thinking",
            estimatedResponse: 4.2
          },
          {
            name: "Building High-Performance Teams Guide",
            description: "Comprehensive whitepaper and assessment toolkit for executives",
            targetTrait: "Leadership Ability",
            estimatedResponse: 3.8
          }
        ]
      },
      {
        strategyId: "mkt-2",
        name: "Growth-Focused Value Campaign",
        targetSegments: ["Growth-Focused SMBs"],
        channels: [
          {
            channelName: "LinkedIn Advertising",
            effectiveness: 84,
            costPerAcquisition: 145,
            recommendedBudget: 30000
          },
          {
            channelName: "Google Search",
            effectiveness: 79,
            costPerAcquisition: 125,
            recommendedBudget: 25000
          },
          {
            channelName: "Email Nurture Campaigns",
            effectiveness: 88,
            costPerAcquisition: 95,
            recommendedBudget: 18000
          }
        ],
        messaging: {
          keyMessages: [
            "Accelerate team performance and cohesion",
            "Affordable personality insights for growing businesses",
            "Simple implementation, powerful results"
          ],
          toneOfVoice: "Practical, approachable, results-oriented",
          valuePropositions: [
            "Quick setup with immediate insights",
            "Scales with your team growth",
            "Concrete action plans for team improvement"
          ]
        },
        campaignIdeas: [
          {
            name: "7-Day Team Transformation Challenge",
            description: "Free mini-course showing quick team improvement techniques",
            targetTrait: "Efficiency Focus",
            estimatedResponse: 5.2
          },
          {
            name: "Growth Accelerator Case Studies",
            description: "Series of success stories from high-growth companies",
            targetTrait: "Growth Mindset",
            estimatedResponse: 4.7
          }
        ]
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: marketingStrategies
    });
  } catch (error) {
    console.error('Error serving demo marketing data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve marketing data'
    });
  }
});

// Revenue forecasts for demo account
router.get('/company/:companyId/revenue-forecasts', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Demo data for revenue forecasts
    const revenueForecasts = [
      {
        scenarioId: "forecast-1",
        scenarioName: "Conservative Growth Model",
        timeframe: 12, // months
        customerAcquisition: {
          monthly: [18, 22, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
          cumulative: [18, 40, 66, 94, 124, 156, 190, 226, 264, 304, 346, 390]
        },
        revenue: {
          monthly: [23400, 28600, 33800, 36400, 39000, 41600, 44200, 46800, 49400, 52000, 54600, 57200],
          cumulative: [23400, 52000, 85800, 122200, 161200, 202800, 247000, 293800, 343200, 395200, 449800, 507000]
        },
        costs: {
          acquisition: 350, // per customer
          retention: 85,   // per customer per month
          overhead: 18500  // fixed monthly overhead
        },
        profitability: {
          breakevenPoint: 7, // months
          roi: 2.2,         // 2.2x return
          margin: 0.28      // 28% profit margin by end of timeframe
        }
      },
      {
        scenarioId: "forecast-2",
        scenarioName: "Aggressive Expansion Plan",
        timeframe: 12, // months
        customerAcquisition: {
          monthly: [25, 32, 40, 48, 55, 60, 65, 70, 75, 80, 85, 90],
          cumulative: [25, 57, 97, 145, 200, 260, 325, 395, 470, 550, 635, 725]
        },
        revenue: {
          monthly: [32500, 41600, 52000, 62400, 71500, 78000, 84500, 91000, 97500, 104000, 110500, 117000],
          cumulative: [32500, 74100, 126100, 188500, 260000, 338000, 422500, 513500, 611000, 715000, 825500, 942500]
        },
        costs: {
          acquisition: 485, // higher CAC for aggressive growth
          retention: 95,   // per customer per month
          overhead: 22500  // fixed monthly overhead
        },
        profitability: {
          breakevenPoint: 8, // months
          roi: 2.8,         // 2.8x return
          margin: 0.32      // 32% profit margin by end of timeframe
        }
      }
    ];
    
    res.status(200).json({
      status: 'success',
      data: revenueForecasts
    });
  } catch (error) {
    console.error('Error serving demo revenue data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve revenue data'
    });
  }
});

// Focus group simulation for demo account
router.post('/company/:companyId/focus-group', async (req, res) => {
  try {
    // Check if this is the demo account
    const isDemo = await isDemoAccount(req);
    
    if (!isDemo) {
      return res.status(200).json({
        status: 'success',
        data: null
      });
    }
    
    // Extract the product concept from the request
    const { productConcept } = req.body;
    
    if (!productConcept) {
      return res.status(400).json({
        status: 'error',
        message: 'Product concept is required'
      });
    }
    
    // Generate a simulated focus group response based on the concept
    const focusGroup = {
      id: `focus-${Date.now()}`,
      productConcept,
      segments: ["Enterprise Innovators", "Growth-Focused SMBs", "Specialist Consultants"],
      feedback: [
        {
          segmentName: "Enterprise Innovators",
          positivePoints: [
            "Strong data-driven approach",
            "Integration potential with existing systems",
            "Scalability for large organizations"
          ],
          negativePoints: [
            "Potential privacy concerns",
            "Implementation complexity",
            "Training requirements for staff"
          ],
          adoptionLikelihood: 76,
          suggestedImprovements: [
            "Add SSO and enterprise security features",
            "Provide implementation consultants",
            "Develop more robust data privacy controls"
          ]
        },
        {
          segmentName: "Growth-Focused SMBs",
          positivePoints: [
            "Potential for team optimization",
            "Cost-effective solution",
            "Quick implementation"
          ],
          negativePoints: [
            "Uncertain ROI measurement",
            "Limited customization options",
            "Potential disruption to workflows"
          ],
          adoptionLikelihood: 68,
          suggestedImprovements: [
            "Create more flexible pricing options",
            "Develop ROI calculator and case studies",
            "Offer simplified onboarding process"
          ]
        },
        {
          segmentName: "Specialist Consultants",
          positivePoints: [
            "Deep personality insights",
            "Scientific foundation",
            "Client presentation tools"
          ],
          negativePoints: [
            "Limited branding options",
            "Need more specialized reports",
            "More comparative data needed"
          ],
          adoptionLikelihood: 84,
          suggestedImprovements: [
            "Add white-labeling capabilities",
            "Develop consultant partner program",
            "Create industry-specific benchmarks"
          ]
        }
      ],
      overallSentiment: 76,
      keyInsights: [
        "Strong appeal across multiple segments with some customization needs",
        "Enterprise security and integration are critical success factors",
        "ROI demonstration will drive adoption in cost-conscious segments",
        "Consultants represent highest adoption potential with proper tools"
      ]
    };
    
    res.status(200).json({
      status: 'success',
      data: focusGroup
    });
  } catch (error) {
    console.error('Error serving demo focus group data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve focus group data'
    });
  }
});

export const demoDataRouter = router;