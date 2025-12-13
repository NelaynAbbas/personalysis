import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Logger } from './utils/Logger';
import { PersonalityTrait, SurveyResponse, SimulatedFocusGroup } from '../shared/schema';
import { 
  CompetitorAnalysis, 
  MarketFitAnalysis, 
  CustomerSegment, 
  ProductFeaturePriority, 
  PricingStrategy, 
  MarketingStrategy,
  RevenueForecasting
} from './storage';

// Initialize logger
const logger = new Logger('BusinessIntelligence');

// Initialize Gemini AI with API key
const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn('AI API key (OPENAI_API_KEY or GEMINI_API_KEY) environment variable is not set. Business intelligence features will not work properly.');
}

// Determine which AI provider to use
const aiProvider = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';
let genAI: GoogleGenerativeAI;

// Create the AI instance with error handling
try {
  genAI = new GoogleGenerativeAI(apiKey || '');
  logger.info(`Initialized ${aiProvider} for business intelligence`);
} catch (error) {
  logger.error(`Failed to initialize AI (${aiProvider}):`, error);
  // Create a fallback instance that will throw meaningful errors when used
  genAI = new GoogleGenerativeAI('invalid_key_placeholder');
}

// Configure the model
const modelName = "gemini-1.5-pro";
const generationConfig = {
  temperature: 0.2, // Lower temperature for more consistent, factual responses
  topK: 1,
  topP: 0.95,
  maxOutputTokens: 4096,
};

// Configure safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Create a model instance
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig,
  safetySettings,
});

// Helper function to extract demographic data from responses
function extractDemographicsFromResponses(responses: SurveyResponse[]): Record<string, any> {
  const allDemographics: Record<string, any> = {};
  
  responses.forEach(response => {
    if (response.demographics && typeof response.demographics === 'object') {
      Object.entries(response.demographics as Record<string, any>).forEach(([key, value]) => {
        if (!allDemographics[key]) {
          allDemographics[key] = {};
        }
        
        const strValue = String(value);
        if (!allDemographics[key][strValue]) {
          allDemographics[key][strValue] = 0;
        }
        
        allDemographics[key][strValue]++;
      });
    }
  });
  
  return allDemographics;
}

// Helper function to extract trait data from responses
function extractTraitsFromResponses(responses: SurveyResponse[]): Record<string, number> {
  const traitAverages: Record<string, number> = {};
  const traitCounts: Record<string, number> = {};
  
  responses.forEach(response => {
    if (response.traits && Array.isArray(response.traits)) {
      (response.traits as PersonalityTrait[]).forEach((trait: PersonalityTrait) => {
        if (!traitAverages[trait.name]) {
          traitAverages[trait.name] = 0;
          traitCounts[trait.name] = 0;
        }
        
        traitAverages[trait.name] += trait.score;
        traitCounts[trait.name]++;
      });
    }
  });
  
  // Calculate averages
  const normalizedTraits: Record<string, number> = {};
  Object.keys(traitAverages).forEach(traitName => {
    normalizedTraits[traitName] = traitAverages[traitName] / traitCounts[traitName];
  });
  
  return normalizedTraits;
}

// Function to generate competitor analysis
export async function generateCompetitorAnalysis(
  surveyResponses: SurveyResponse[],
  companyName: string,
  productName: string,
  industry: string
): Promise<CompetitorAnalysis[]> {
  logger.info(`Generating competitor analysis for ${companyName} (${industry})`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for competitor analysis');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a market research expert, analyze the following customer data for ${companyName} in the ${industry} industry, focusing on their product ${productName}:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate a detailed competitor analysis. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "competitorName": "Competitor A",
    "marketShare": 25,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "targetAudience": "Description of target audience",
    "products": ["product1", "product2"],
    "pricingStrategy": "Description of pricing strategy",
    "customersPerception": "How customers perceive this competitor based on the survey data",
    "competitiveThreatLevel": 8
  },
  {
    "competitorName": "Competitor B",
    ...
  }
]

Include 3-5 realistic competitors that would likely exist in this market based on the data. Do not include actual brand names, but create fictional company names appropriate for the industry. Ensure all scores and percentages are realistic. The competitiveThreatLevel should be on a scale of 1-10.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.3
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const competitorData = JSON.parse(text);
      logger.info(`Successfully generated competitor analysis with ${competitorData.length} competitors`);
      return competitorData;
    } catch (parseError) {
      logger.error('Failed to parse competitor analysis JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating competitor analysis:', error);
    return [];
  }
}

// Function to generate market fit analysis
export async function generateMarketFitAnalysis(
  surveyResponses: SurveyResponse[],
  companyName: string,
  productId: string,
  productName: string,
  industry: string
): Promise<MarketFitAnalysis> {
  logger.info(`Generating market fit analysis for ${productName} (ID: ${productId})`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for market fit analysis');
    return {
      productId,
      overallFitScore: 0,
      problemSolutionFit: 0,
      productMarketFit: 0,
      marketSizePotential: {
        total: 0,
        addressable: 0,
        serviceable: 0
      },
      customerNeedAlignment: 0,
      valuePropositionClarity: 0,
      priceToValuePerception: 0,
      productDifferentiation: 0,
      competitiveAdvantage: [],
      marketChallenges: [],
      customerPainPoints: [],
      recommendations: []
    };
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a product-market fit analyst, evaluate the following customer data for ${companyName}'s product "${productName}" (ID: ${productId}) in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate a detailed market fit analysis. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

{
  "productId": "${productId}",
  "overallFitScore": 7.5,
  "problemSolutionFit": 8.2,
  "productMarketFit": 7.1,
  "marketSizePotential": {
    "total": 5000000000,
    "addressable": 1200000000,
    "serviceable": 350000000
  },
  "customerNeedAlignment": 7.8,
  "valuePropositionClarity": 6.9,
  "priceToValuePerception": 7.3,
  "productDifferentiation": 8.0,
  "competitiveAdvantage": [
    "advantage1",
    "advantage2",
    "advantage3"
  ],
  "marketChallenges": [
    "challenge1",
    "challenge2",
    "challenge3"
  ],
  "customerPainPoints": [
    "painPoint1",
    "painPoint2",
    "painPoint3"
  ],
  "recommendations": [
    "recommendation1",
    "recommendation2",
    "recommendation3",
    "recommendation4"
  ]
}

Ensure all scores are on a scale of 0-10, with two decimal places of precision. Market size numbers should be realistic for the ${industry} industry. Provide 3-5 items for each list field. Make the analysis insightful and specific to the data provided.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.2
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const marketFitData = JSON.parse(text);
      logger.info(`Successfully generated market fit analysis for ${productName}`);
      return marketFitData;
    } catch (parseError) {
      logger.error('Failed to parse market fit analysis JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return {
        productId,
        overallFitScore: 0,
        problemSolutionFit: 0,
        productMarketFit: 0,
        marketSizePotential: {
          total: 0,
          addressable: 0,
          serviceable: 0
        },
        customerNeedAlignment: 0,
        valuePropositionClarity: 0,
        priceToValuePerception: 0,
        productDifferentiation: 0,
        competitiveAdvantage: [],
        marketChallenges: [],
        customerPainPoints: [],
        recommendations: []
      };
    }
  } catch (error) {
    logger.error('Error generating market fit analysis:', error);
    return {
      productId,
      overallFitScore: 0,
      problemSolutionFit: 0,
      productMarketFit: 0,
      marketSizePotential: {
        total: 0,
        addressable: 0,
        serviceable: 0
      },
      customerNeedAlignment: 0,
      valuePropositionClarity: 0,
      priceToValuePerception: 0,
      productDifferentiation: 0,
      competitiveAdvantage: [],
      marketChallenges: [],
      customerPainPoints: [],
      recommendations: []
    };
  }
}

// Function to generate customer segments
export async function generateCustomerSegments(
  surveyResponses: SurveyResponse[],
  companyName: string,
  industry: string
): Promise<CustomerSegment[]> {
  logger.info(`Generating customer segments for ${companyName}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for customer segmentation');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a customer segmentation expert, analyze the following customer data for ${companyName} in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate detailed customer segments. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "segmentId": "segment1",
    "segmentName": "Segment Name 1",
    "percentageOfCustomers": 35,
    "demographics": {
      "ageRange": "25-34",
      "primaryGender": "Female",
      "income": "High",
      "education": "College degree",
      "location": "Urban",
      "occupation": "Professional"
    },
    "psychographics": {
      "traits": ["trait1", "trait2", "trait3"],
      "interests": ["interest1", "interest2"],
      "values": ["value1", "value2"],
      "painPoints": ["painPoint1", "painPoint2"]
    },
    "purchaseBehavior": {
      "decisionFactors": ["factor1", "factor2"],
      "pricePerception": "Quality-focused",
      "brandLoyalty": "High",
      "purchaseFrequency": "Monthly"
    },
    "marketingApproach": {
      "channels": ["channel1", "channel2"],
      "messaging": "Description of effective messaging",
      "contentPreferences": ["preference1", "preference2"]
    },
    "growthPotential": 8.5,
    "retentionRisk": 3.2
  },
  {
    "segmentId": "segment2",
    ...
  }
]

Identify 3-5 distinct customer segments. Ensure the percentageOfCustomers across all segments adds up to 100%. Make growth potential and retention risk scores on a scale of 0-10, with two decimal places.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.3
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const segmentData = JSON.parse(text);
      logger.info(`Successfully generated ${segmentData.length} customer segments`);
      return segmentData;
    } catch (parseError) {
      logger.error('Failed to parse customer segments JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating customer segments:', error);
    return [];
  }
}

// Function to generate product feature priorities
export async function generateProductFeaturePriorities(
  surveyResponses: SurveyResponse[],
  productName: string,
  industry: string
): Promise<ProductFeaturePriority[]> {
  logger.info(`Generating feature priorities for ${productName}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for feature prioritization');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a product management expert, analyze the following customer data for the product "${productName}" in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate a prioritized list of product features. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "featureId": "feature1",
    "featureName": "Feature Name 1",
    "category": "Category 1",
    "description": "Detailed description of the feature",
    "priorityScore": 85,
    "implementationComplexity": "Medium",
    "developmentCost": "Medium",
    "customerImpact": "High",
    "competitiveAdvantage": "High",
    "timeToMarket": "2-3 months",
    "targetSegments": ["segment1", "segment2"],
    "keyBenefits": ["benefit1", "benefit2", "benefit3"],
    "risksAndChallenges": ["risk1", "risk2"]
  },
  {
    "featureId": "feature2",
    ...
  }
]

Include 8-12 features sorted by priority score (0-100). Ensure the features are realistic for a product in the ${industry} industry. For each feature, provide implementation complexity (Low/Medium/High), development cost (Low/Medium/High), customer impact (Low/Medium/High), and competitive advantage (Low/Medium/High).
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.2
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const featuresData = JSON.parse(text);
      logger.info(`Successfully generated ${featuresData.length} feature priorities`);
      return featuresData;
    } catch (parseError) {
      logger.error('Failed to parse feature priorities JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating feature priorities:', error);
    return [];
  }
}

// Function to generate pricing strategies
export async function generatePricingStrategies(
  surveyResponses: SurveyResponse[],
  productName: string,
  industry: string
): Promise<PricingStrategy[]> {
  logger.info(`Generating pricing strategies for ${productName}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for pricing strategies');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a pricing strategy expert, analyze the following customer data for the product "${productName}" in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate pricing strategies. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "strategyId": "strategy1",
    "strategyName": "Strategy Name 1",
    "strategyType": "Type (e.g., Premium, Value, Tiered)",
    "description": "Detailed description of the pricing strategy",
    "recommendedBasePrice": 99.99,
    "pricingSensitivity": 7.5,
    "implementationComplexity": "Medium",
    "applicableSegments": ["segment1", "segment2"],
    "competitivePositioning": "Above market average",
    "projectedRevenue": "High",
    "projectedAdoption": "Medium",
    "keyConsiderations": ["consideration1", "consideration2", "consideration3"],
    "recommendedDiscounts": ["discount1", "discount2"],
    "upsellOpportunities": ["upsell1", "upsell2"],
    "metricsToTrack": ["metric1", "metric2", "metric3"]
  },
  {
    "strategyId": "strategy2",
    ...
  }
]

Include 3-5 different pricing strategies appropriate for the ${industry} industry. Use realistic price points. The pricingSensitivity score should be on a scale of 0-10, with higher numbers indicating more price-sensitive customers. Provide implementation complexity as Low/Medium/High.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.3
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const pricingData = JSON.parse(text);
      logger.info(`Successfully generated ${pricingData.length} pricing strategies`);
      return pricingData;
    } catch (parseError) {
      logger.error('Failed to parse pricing strategies JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating pricing strategies:', error);
    return [];
  }
}

// Function to generate marketing strategies
export async function generateMarketingStrategies(
  surveyResponses: SurveyResponse[],
  companyName: string,
  productName: string,
  industry: string
): Promise<MarketingStrategy[]> {
  logger.info(`Generating marketing strategies for ${productName}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for marketing strategies');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a marketing strategist, analyze the following customer data for ${companyName}'s product "${productName}" in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate marketing strategies. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "strategyId": "strategy1",
    "strategyName": "Strategy Name 1",
    "channelType": "Digital",
    "primaryChannel": "Social Media",
    "secondaryChannels": ["Email", "Content Marketing"],
    "description": "Detailed description of the marketing strategy",
    "targetSegments": ["segment1", "segment2"],
    "estimatedCost": "Medium",
    "estimatedROI": "High",
    "timeframe": "3-6 months",
    "implementationComplexity": "Medium",
    "keyMessages": ["message1", "message2", "message3"],
    "contentThemes": ["theme1", "theme2"],
    "callToAction": "Primary call to action description",
    "kpis": ["KPI1", "KPI2", "KPI3"],
    "creativeApproach": "Description of creative approach",
    "competitiveAdvantage": "How this strategy leverages competitive advantage",
    "potentialChallenges": ["challenge1", "challenge2"]
  },
  {
    "strategyId": "strategy2",
    ...
  }
]

Provide 4-6 marketing strategies across different channels appropriate for the ${industry} industry. Ensure there's a mix of digital and traditional channels if appropriate. For costs, ROI, and complexity, use Low/Medium/High.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.3
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const marketingData = JSON.parse(text);
      logger.info(`Successfully generated ${marketingData.length} marketing strategies`);
      return marketingData;
    } catch (parseError) {
      logger.error('Failed to parse marketing strategies JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating marketing strategies:', error);
    return [];
  }
}

// Function to generate revenue forecasts
export async function generateRevenueForecasts(
  surveyResponses: SurveyResponse[],
  companyName: string,
  productName: string,
  industry: string
): Promise<RevenueForecasting[]> {
  logger.info(`Generating revenue forecasts for ${productName}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for revenue forecasting');
    return [];
  }
  
  try {
    // Extract and prepare data from survey responses
    const demographics = extractDemographicsFromResponses(surveyResponses);
    const traits = extractTraitsFromResponses(surveyResponses);
    
    // Format the data for the AI
    const demographicsStr = Object.entries(demographics)
      .map(([category, values]) => {
        const valuesStr = Object.entries(values as Record<string, number>)
          .map(([value, count]) => `${value}: ${count}`)
          .join(', ');
        return `${category}: ${valuesStr}`;
      })
      .join('\n');
    
    const traitsStr = Object.entries(traits)
      .map(([trait, score]) => `${trait}: ${score.toFixed(2)}/10`)
      .join('\n');
    
    // Create the prompt
    const prompt = `
As a revenue forecasting expert, analyze the following customer data for ${companyName}'s product "${productName}" in the ${industry} industry:

CUSTOMER DEMOGRAPHICS:
${demographicsStr}

PERSONALITY TRAITS OF CUSTOMERS:
${traitsStr}

Based solely on this data, generate revenue forecasts. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

[
  {
    "scenarioId": "scenario1",
    "scenarioName": "Scenario Name 1 (e.g., Base Case)",
    "timeframe": "12 months",
    "confidenceLevel": 75,
    "description": "Detailed description of the forecast scenario",
    "totalRevenue": 1500000,
    "monthlyData": [
      {"month": 1, "revenue": 85000, "customers": 120, "cac": 350, "churn": 5},
      {"month": 2, "revenue": 92000, "customers": 135, "cac": 340, "churn": 4.8},
      {"month": 3, "revenue": 103000, "customers": 155, "cac": 330, "churn": 4.5}
    ],
    "growthRate": 15.5,
    "assumptionsUsed": ["assumption1", "assumption2", "assumption3"],
    "marketShareProjection": 8.5,
    "keyDrivers": ["driver1", "driver2", "driver3"],
    "riskFactors": ["risk1", "risk2", "risk3"],
    "mitigationStrategies": ["strategy1", "strategy2"]
  },
  {
    "scenarioId": "scenario2",
    ...
  }
]

Generate 3 scenarios: Conservative (Pessimistic), Base Case (Expected), and Optimistic. For each, provide realistic revenue forecasts for a product in the ${industry} industry over a 12-month period. Include monthly data for the first 3 months and assumtions for the full year. The monthlyData should include revenue (in USD), customer count, customer acquisition cost (CAC), and churn rate (%).
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.2
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const forecastsData = JSON.parse(text);
      logger.info(`Successfully generated ${forecastsData.length} revenue forecast scenarios`);
      return forecastsData;
    } catch (parseError) {
      logger.error('Failed to parse revenue forecasts JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return [];
    }
  } catch (error) {
    logger.error('Error generating revenue forecasts:', error);
    return [];
  }
}

// Function to generate focus group simulation
export async function generateFocusGroupSimulation(
  companyId: number,
  productConcept: string
): Promise<SimulatedFocusGroup> {
  logger.info(`Generating focus group simulation for company ID ${companyId}`);
  
  if (!apiKey) {
    logger.warn('No AI API key available for focus group simulation');
    return {
      productConcept,
      participants: [],
      overallSentiment: 0,
      keyThemes: {},
      suggestedImprovements: [],
      purchaseIntent: 0,
      pricePerception: '',
      valuePerception: 0,
      featureFeedback: {},
      competitiveComparisons: {},
      participantQuotes: []
    };
  }
  
  try {
    // Create the prompt
    const prompt = `
As a focus group moderator, simulate a focus group discussion about the following product concept:

PRODUCT CONCEPT:
${productConcept}

Generate a simulated focus group session with 5-8 diverse participants. Format your response as JSON that can be parsed by JavaScript. Use the following structure:

{
  "productConcept": "${productConcept.replace(/"/g, '\\"')}",
  "participants": [
    {
      "id": "p1",
      "name": "Participant Name",
      "demographics": {
        "age": 35,
        "gender": "Female",
        "occupation": "Marketing Manager",
        "location": "Urban"
      },
      "personality": ["trait1", "trait2", "trait3"],
      "consumerProfile": "Description of their consumer behavior"
    }
  ],
  "overallSentiment": 7.8,
  "keyThemes": {
    "theme1": {"mentions": 15, "sentiment": 8.5, "description": "Description of this theme"},
    "theme2": {"mentions": 12, "sentiment": 6.2, "description": "Description of this theme"}
  },
  "suggestedImprovements": [
    {"suggestion": "Suggestion 1", "mentions": 4, "priority": "High"},
    {"suggestion": "Suggestion 2", "mentions": 3, "priority": "Medium"}
  ],
  "purchaseIntent": 7.2,
  "pricePerception": "Moderately high but justified",
  "valuePerception": 7.5,
  "featureFeedback": {
    "feature1": {"importance": 8.2, "satisfaction": 7.4, "comments": ["comment1", "comment2"]},
    "feature2": {"importance": 7.8, "satisfaction": 8.1, "comments": ["comment1", "comment2"]}
  },
  "competitiveComparisons": {
    "competitor1": {"mentions": 8, "sentiment": 5.6, "comments": ["comment1", "comment2"]},
    "competitor2": {"mentions": 6, "sentiment": 6.2, "comments": ["comment1", "comment2"]}
  },
  "participantQuotes": [
    {"participantId": "p1", "quote": "Participant quote 1", "sentiment": "Positive", "topic": "topic1"},
    {"participantId": "p2", "quote": "Participant quote 2", "sentiment": "Negative", "topic": "topic2"}
  ]
}

Make the participants diverse and realistic. All sentiment and perception scores should be on a scale of 0-10 with one decimal place. Include at least 3 key themes, 5 suggested improvements, 4 features with feedback, and 10 participant quotes. Do not use actual brand or company names for competitors.
`;

    // Get response from AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        temperature: 0.4
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const focusGroupData = JSON.parse(text);
      logger.info(`Successfully generated focus group simulation with ${focusGroupData.participants.length} participants`);
      return focusGroupData;
    } catch (parseError) {
      logger.error('Failed to parse focus group simulation JSON:', parseError);
      logger.debug('Raw AI response:', text);
      return {
        productConcept,
        participants: [],
        overallSentiment: 0,
        keyThemes: {},
        suggestedImprovements: [],
        purchaseIntent: 0,
        pricePerception: '',
        valuePerception: 0,
        featureFeedback: {},
        competitiveComparisons: {},
        participantQuotes: []
      };
    }
  } catch (error) {
    logger.error('Error generating focus group simulation:', error);
    return {
      productConcept,
      participants: [],
      overallSentiment: 0,
      keyThemes: {},
      suggestedImprovements: [],
      purchaseIntent: 0,
      pricePerception: '',
      valuePerception: 0,
      featureFeedback: {},
      competitiveComparisons: {},
      participantQuotes: []
    };
  }
}