import { db, pool } from './db';
import { surveys, surveyResponses, companies, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Direct database interactions for generating demo data
export async function generateDemoData() {
  console.log('Starting demo data generation...');
  try {
    // Step 1: Find the demo company
    const demoCompanyResult = await db.select().from(companies).where(eq(companies.id, 1));
    const demoCompany = demoCompanyResult[0];
    
    if (!demoCompany) {
      console.error('Demo company not found');
      return { success: false, message: 'Demo company not found' };
    }
    
    console.log('Found demo company:', demoCompany.name);
    
    // Step 2: Find or create a demo user to assign as the creator
    console.log('Looking for demo users...');
    
    // Attempt to find existing users for the demo company
    const demoUsers = await db.select().from(users).where(eq(users.companyId, demoCompany.id));
    console.log(`Found ${demoUsers.length} demo users`);
    
    let demoUser;
    
    if (demoUsers.length === 0) {
      console.log('No users found, creating a demo user');
      
      try {
        // Use direct SQL to create the user since we've verified it works
        const { rows } = await pool.query(`
          INSERT INTO users (
            username, 
            password, 
            email, 
            first_name, 
            last_name, 
            company_id, 
            role, 
            is_active, 
            last_login
          )
          VALUES (
            'demouser', 
            'demo123', 
            'demo@personalysispro.com', 
            'Demo', 
            'User', 
            $1, 
            'admin', 
            true, 
            NOW()
          )
          RETURNING id, username, email, company_id, role
        `, [demoCompany.id]);
        
        // Get the newly created user
        if (rows.length === 0) {
          console.error('Failed to create demo user - no rows returned');
          return { success: false, message: 'Failed to create demo user - no rows returned' };
        }
        
        // Convert the returned values to match our schema
        demoUser = {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          companyId: rows[0].company_id,
          role: rows[0].role,
          firstName: 'Demo',
          lastName: 'User'
        };
        
        console.log(`Created demo user with ID: ${demoUser.id}`);
      } catch (error) {
        console.error('Error creating demo user:', error);
        return { 
          success: false, 
          message: 'Failed to create demo user', 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    } else {
      // Use the first user found
      demoUser = demoUsers[0];
      console.log(`Using existing demo user: ${demoUser.email} (ID: ${demoUser.id})`);
    }
    
    // Step 3: Create sample surveys if they don't exist
    const existingSurveys = await db.select().from(surveys).where(eq(surveys.companyId, demoCompany.id));
    console.log(`Found ${existingSurveys.length} existing surveys`);
    
    // Only create new surveys if we don't have enough
    if (existingSurveys.length < 3) {
      console.log('Creating new sample surveys...');
      
      const demoSurveys = [
        {
          title: "Professional Brand Personality Assessment",
          description: "Uncover how your professional brand is perceived by colleagues and clients",
          companyId: demoCompany.id,
          createdById: demoUser.id, // Use the actual user ID
          surveyType: "personality",
          isPublic: true,
          isActive: true,
          estimatedTime: 8,
          customTheme: JSON.stringify({
            primaryColor: "#3a86ff",
            secondaryColor: "#8338ec",
            backgroundColor: "#ffffff",
            textColor: "#333333"
          }),
          collectDemographics: true
        },
        {
          title: "Leadership Decision-Making Profile",
          description: "Analyze executive decision patterns and leadership styles",
          companyId: demoCompany.id,
          createdById: demoUser.id, // Use the actual user ID
          surveyType: "leadership",
          isPublic: true,
          isActive: true,
          estimatedTime: 12,
          customTheme: JSON.stringify({
            primaryColor: "#2a9d8f",
            secondaryColor: "#264653",
            backgroundColor: "#f8f9fa",
            textColor: "#333333"
          }),
          collectDemographics: true
        },
        {
          title: "Product Market Fit Analysis",
          description: "Evaluate how well your products align with customer needs and market demands",
          companyId: demoCompany.id,
          createdById: demoUser.id, // Use the actual user ID
          surveyType: "market research",
          isPublic: true,
          isActive: true,
          estimatedTime: 10,
          customTheme: JSON.stringify({
            primaryColor: "#e76f51",
            secondaryColor: "#f4a261",
            backgroundColor: "#ffffff",
            textColor: "#333333"
          }),
          collectDemographics: true
        }
      ];
      
      // Insert surveys one by one
      for (const survey of demoSurveys) {
        await db.insert(surveys).values(survey);
      }
      
      console.log('Sample surveys created successfully');
    }
    
    // Step 3: Get all surveys again (including newly created ones)
    const allSurveys = await db.select().from(surveys).where(eq(surveys.companyId, demoCompany.id));
    console.log(`Total surveys after creation: ${allSurveys.length}`);
    
    // Step 4: Check if we already have sufficient responses
    const existingResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.companyId, demoCompany.id));
    console.log(`Found ${existingResponses.length} existing responses`);
    
    // Create responses to build up the demo data gradually - always create at least a few new ones
    // so we can see progress with each call, but limit the batch size for performance
    if (true) { // Always generate responses when this endpoint is called
      console.log('Creating new sample responses...');
      
      // Generate multiple responses per call to provide more meaningful data
      try {
        // Use all surveys evenly to create varied data
        const responsesToCreate = 10; // Generate 10 responses per call
        const industries = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Consulting", "Media", "Energy", "Real Estate"];
        
        console.log(`Generating ${responsesToCreate} responses across all surveys`);
        
        for (let i = 0; i < responsesToCreate; i++) {
          try {
            // Select a survey in rotation
            const targetSurvey = allSurveys[i % allSurveys.length];
            
            // Select an industry with variation
            const industry = industries[i % industries.length];
            
            // Generate a full set of traits based on industry
            const traits = generateTraitsByIndustry(industry);
            
            // Generate gender with some variation
            const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];
            const gender = genders[Math.floor(Math.random() * genders.length)];
            
            // Generate age with variation by industry
            let age = 30 + Math.floor(Math.random() * 25); // 30-55 base range
            if (industry === "Technology") age = 25 + Math.floor(Math.random() * 20); // younger for tech
            if (industry === "Finance") age = 35 + Math.floor(Math.random() * 20); // older for finance
            
            // Generate varied locations
            const locations = [
              "San Francisco", "New York", "London", "Singapore", 
              "Tokyo", "Berlin", "Sydney", "Toronto", "Paris", "Seattle"
            ];
            const location = locations[Math.floor(Math.random() * locations.length)];
            
            // Education levels with industry-specific weighting
            const educationLevels = [
              "High School", "Bachelor's Degree", "Master's Degree", 
              "MBA", "PhD", "Professional Certification"
            ];
            let educationIndex = Math.floor(Math.random() * educationLevels.length);
            if (industry === "Finance" || industry === "Healthcare") {
              // Higher education more common in finance/healthcare
              educationIndex = Math.min(2 + Math.floor(Math.random() * 4), educationLevels.length - 1);
            }
            const education = educationLevels[educationIndex];
            
            // Varied occupations by industry
            const occupationsByIndustry: Record<string, string[]> = {
              "Technology": ["Software Engineer", "Product Manager", "CTO", "Data Scientist", "UX Designer"],
              "Finance": ["Financial Analyst", "Investment Banker", "CFO", "Risk Manager", "Financial Advisor"],
              "Healthcare": ["Physician", "Hospital Administrator", "Researcher", "Nurse Practitioner", "Healthcare IT"],
              "Education": ["Professor", "Administrator", "Researcher", "EdTech Specialist", "Department Head"],
              "Retail": ["Store Manager", "Buyer", "Marketing Director", "Operations Manager", "E-commerce Director"]
            };
            
            const occupations = occupationsByIndustry[industry] || ["Manager", "Director", "Specialist", "Analyst", "Executive"];
            const occupation = occupations[Math.floor(Math.random() * occupations.length)];
            
            // Company sizes with industry-specific weighting
            const companySizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
            let sizeIndex = Math.floor(Math.random() * companySizes.length);
            // Larger companies more common in finance
            if (industry === "Finance") {
              sizeIndex = Math.min(3 + Math.floor(Math.random() * 3), companySizes.length - 1);
            }
            // Startups more common in tech
            if (industry === "Technology") {
              sizeIndex = Math.floor(Math.random() * 4); // Weighted toward smaller companies
            }
            const companySize = companySizes[sizeIndex];
            
            // Department types with industry weighting
            const departmentsByIndustry: Record<string, string[]> = {
              "Technology": ["Engineering", "Product", "Design", "Data Science", "IT Operations"],
              "Finance": ["Investment", "Risk", "Compliance", "Trading", "Advisory"],
              "Healthcare": ["Clinical", "Research", "Administration", "Patient Care", "Operations"],
              "Education": ["Faculty", "Administration", "Research", "Student Affairs", "IT"],
              "Retail": ["Merchandising", "Operations", "Marketing", "eCommerce", "Supply Chain"]
            };
            
            const departments = departmentsByIndustry[industry] || ["Operations", "Sales", "Marketing", "HR", "Finance"];
            const department = departments[Math.floor(Math.random() * departments.length)];
            
            // Role types
            const roles = ["Individual Contributor", "Team Lead", "Manager", "Director", "Executive", "Decision Maker"];
            const role = roles[Math.floor(Math.random() * roles.length)];
            
            // Generate comprehensive demographics
            const demographics = {
              age: age,
              gender: gender,
              location: location,
              education: education,
              occupation: occupation,
              businessContext: {
                industry: industry,
                companySize: companySize,
                department: department,
                role: role
              }
            };
            
            // Generate product recommendations based on industry and traits
            const productRecommendations = generateProductRecommendations(industry, traits);
            
            // Generate market segment based on traits
            const marketSegment = determineMarketSegment(traits);
            
            // Create varied timestamps for responses over the past 3 months
            const now = Date.now();
            const minTime = now - (90 * 24 * 60 * 60 * 1000); // 90 days ago
            const randomStartTime = new Date(minTime + Math.random() * (now - minTime));
            const completionDuration = (5 + Math.floor(Math.random() * 25)) * 60 * 1000; // 5-30 minutes
            const completeTime = new Date(randomStartTime.getTime() + completionDuration);
            
            // Use a unique respondent ID to avoid conflicts
            const timestamp = Date.now();
            const uniqueId = `demo-${targetSurvey.id}-${timestamp}-${i}`;
            
            // Generate more realistic responses with weighted answers
            const responses = generateSampleResponses(10 + Math.floor(Math.random() * 15)); // 10-25 questions
            
            // Create the response record using direct SQL for better performance
            await pool.query(`
              INSERT INTO survey_responses (
                survey_id, company_id, respondent_id, respondent_email,
                responses, traits, demographics, gender_stereotypes,
                product_recommendations, market_segment, completed,
                start_time, complete_time, satisfaction_score
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
              )
            `, [
              targetSurvey.id,
              demoCompany.id,
              uniqueId,
              `respondent${timestamp}${i}@example.com`,
              JSON.stringify(responses),
              JSON.stringify(traits),
              JSON.stringify(demographics),
              JSON.stringify([]),
              JSON.stringify(productRecommendations),
              marketSegment,
              true,
              randomStartTime,
              completeTime,
              5 + Math.floor(Math.random() * 6) // Rating 5-10
            ]);
            
            console.log(`Created response ${i+1}/${responsesToCreate} for survey: ${targetSurvey.title} (${industry})`);
          } catch (error) {
            // Log error but continue execution of other responses
            console.error(`Error creating response ${i+1}:`, error);
          }
        }
        
        console.log('Demo responses created successfully');
      } catch (error) {
        console.error('Error in response generation process:', error);
        // Continue execution despite errors
      }
    }
    
    // Count final stats
    const finalSurveys = await db.select().from(surveys).where(eq(surveys.companyId, demoCompany.id));
    const finalResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.companyId, demoCompany.id));
    
    return {
      success: true,
      message: 'Demo data populated successfully',
      data: {
        surveys: finalSurveys.length,
        responses: finalResponses.length
      }
    };
  } catch (error) {
    console.error('Error generating demo data:', error);
    return {
      success: false,
      message: 'Error generating demo data',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Helper function to generate traits based on industry
function generateTraitsByIndustry(industry: string): any[] {
  const traits = [];
  
  // Add core traits that are always included
  traits.push({
    name: "Analytical Thinking",
    score: industry === "Technology" || industry === "Finance" ? 
      70 + Math.floor(Math.random() * 30) : // Higher for tech/finance
      40 + Math.floor(Math.random() * 40),  // More varied for others
    category: "cognitive"
  });
  
  traits.push({
    name: "Risk Tolerance",
    score: industry === "Finance" ? 
      40 + Math.floor(Math.random() * 30) : // Lower for finance (more risk-averse)
      50 + Math.floor(Math.random() * 50),  // More varied for others
    category: "decision-making"
  });
  
  traits.push({
    name: "Innovation Adoption",
    score: industry === "Technology" ? 
      60 + Math.floor(Math.random() * 40) : // Higher for tech
      40 + Math.floor(Math.random() * 60),  // More varied for others
    category: "professional"
  });
  
  // Industry-specific traits
  if (industry === "Technology") {
    traits.push(
      {
        name: "Technical Complexity Tolerance",
        score: 65 + Math.floor(Math.random() * 35),
        category: "professional"
      },
      {
        name: "Rapid Adaptation",
        score: 70 + Math.floor(Math.random() * 30),
        category: "behavioral"
      }
    );
  } else if (industry === "Finance") {
    traits.push(
      {
        name: "Detail Orientation",
        score: 75 + Math.floor(Math.random() * 25),
        category: "professional"
      },
      {
        name: "Regulatory Compliance Focus",
        score: 80 + Math.floor(Math.random() * 20),
        category: "behavioral"
      }
    );
  } else if (industry === "Healthcare") {
    traits.push(
      {
        name: "Empathy",
        score: 70 + Math.floor(Math.random() * 30),
        category: "interpersonal"
      },
      {
        name: "Precision",
        score: 75 + Math.floor(Math.random() * 25),
        category: "professional"
      }
    );
  }
  
  // Additional general traits
  const generalTraits = [
    {
      name: "Decision Confidence",
      score: 40 + Math.floor(Math.random() * 60),
      category: "decision-making"
    },
    {
      name: "Collaborative Leadership",
      score: 45 + Math.floor(Math.random() * 55),
      category: "interpersonal"
    },
    {
      name: "Strategic Vision",
      score: 50 + Math.floor(Math.random() * 50),
      category: "professional"
    },
    {
      name: "Communication Style",
      score: 40 + Math.floor(Math.random() * 60),
      category: "interpersonal"
    },
    {
      name: "Value Consciousness",
      score: 55 + Math.floor(Math.random() * 45),
      category: "financial"
    },
    {
      name: "Budget Sensitivity",
      score: 60 + Math.floor(Math.random() * 40),
      category: "financial"
    },
    {
      name: "Timeline Flexibility",
      score: 35 + Math.floor(Math.random() * 65),
      category: "operational"
    }
  ];
  
  // Add remaining traits to reach 8-12 traits total
  const traitsCount = 8 + Math.floor(Math.random() * 5); // 8-12 traits
  while (traits.length < traitsCount) {
    const randomTrait = generalTraits[Math.floor(Math.random() * generalTraits.length)];
    // Check if trait is already added
    if (!traits.some(t => t.name === randomTrait.name)) {
      traits.push({...randomTrait});
    }
  }
  
  return traits;
}

// Helper function to generate product recommendations
function generateProductRecommendations(industry: string, traits: any[]): any[] {
  const recommendations = [];
  
  // Find key traits for personalized recommendations
  const analyticalThinking = traits.find(t => t.name === "Analytical Thinking")?.score || 50;
  const riskTolerance = traits.find(t => t.name === "Risk Tolerance")?.score || 50;
  const innovationAdoption = traits.find(t => t.name === "Innovation Adoption")?.score || 50;
  const decisionConfidence = traits.find(t => t.name === "Decision Confidence")?.score || 50;
  
  // Add a second category of recommendations based on traits
  const hasHighAnalytical = analyticalThinking > 70;
  const isRiskAverse = riskTolerance < 40;
  const isInnovative = innovationAdoption > 65;
  const isConfident = decisionConfidence > 70;
  
  if (industry === "Technology") {
    // Primary technology recommendations
    recommendations.push({
      category: "Enterprise Software",
      products: [
        {
          name: "PersonalysisPro Enterprise Analytics Suite",
          confidence: 70 + Math.floor(analyticalThinking / 5),
          description: "Advanced analytics platform with customizable reporting and AI-driven insights",
          attributes: ["scalable", "integration-friendly", "ai-powered", "secure"]
        },
        {
          name: "PersonalysisPro Developer API",
          confidence: 65 + Math.floor(innovationAdoption / 4),
          description: "Robust API access for custom implementations and system integrations",
          attributes: ["flexible", "documented", "developer-friendly"]
        },
        {
          name: isInnovative ? "TechInnovation Platform" : "TechFoundation Suite",
          confidence: 60 + Math.floor((analyticalThinking + innovationAdoption) / 6),
          description: isInnovative 
            ? "Cutting-edge tech stack with advanced features for innovators" 
            : "Stable, proven technology foundation with reliable performance",
          attributes: isInnovative 
            ? ["cutting-edge", "dynamic", "feature-rich"] 
            : ["stable", "reliable", "proven"]
        }
      ],
      reason: hasHighAnalytical 
        ? "Your exceptional analytical thinking profile indicates a preference for data-driven technology solutions" 
        : "Based on your technology profile and decision-making approach"
    });
    
    // Secondary tech recommendations
    recommendations.push({
      category: isRiskAverse ? "Secure Technologies" : "Innovation Technologies",
      products: [
        {
          name: isRiskAverse ? "SecureFoundation Platform" : "InnovationLab Suite",
          confidence: isRiskAverse ? 75 + Math.floor((100 - riskTolerance) / 5) : 70 + Math.floor(innovationAdoption / 4),
          description: isRiskAverse 
            ? "Security-focused platform with advanced protection features" 
            : "Experimental technology platform for rapid innovation and testing",
          attributes: isRiskAverse 
            ? ["secure", "protected", "compliant"] 
            : ["experimental", "rapid", "cutting-edge"]
        }
      ],
      reason: isRiskAverse 
        ? "Your cautious approach to risk suggests a preference for security-focused solutions" 
        : "Your openness to innovation indicates a willingness to explore emerging technologies"
    });
  } else if (industry === "Finance") {
    // Primary finance recommendations
    recommendations.push({
      category: "Financial Intelligence Solutions",
      products: [
        {
          name: "PersonalysisPro Compliance Analytics",
          confidence: 75 + Math.floor((100 - riskTolerance) / 5),
          description: "Regulatory-focused analytics solution with audit-ready reporting",
          attributes: ["compliant", "secure", "auditable", "comprehensive"]
        },
        {
          name: "PersonalysisPro Risk Assessment Framework",
          confidence: 70 + Math.floor(analyticalThinking / 4),
          description: "Integrated risk profiling and assessment platform",
          attributes: ["risk-focused", "data-driven", "predictive"]
        },
        {
          name: isConfident ? "Decision Intelligence Platform" : "Decision Support System",
          confidence: 65 + Math.floor(decisionConfidence / 4),
          description: isConfident 
            ? "Advanced decision analytics for confident financial leaders" 
            : "Comprehensive decision support with scenario modeling",
          attributes: isConfident 
            ? ["decisive", "streamlined", "executive"] 
            : ["supportive", "detailed", "thorough"]
        }
      ],
      reason: isRiskAverse 
        ? "Your strong focus on compliance and careful risk assessment aligns with these solutions" 
        : "Based on your analytical approach to financial decisions and risk management style"
    });
    
    // Secondary finance recommendations
    recommendations.push({
      category: hasHighAnalytical ? "Financial Analytics" : "Financial Management",
      products: [
        {
          name: hasHighAnalytical ? "Advanced Financial Modeling Suite" : "Streamlined Financial Operations Platform",
          confidence: hasHighAnalytical ? 80 + Math.floor(analyticalThinking / 10) : 75 + Math.floor((100 - analyticalThinking) / 8),
          description: hasHighAnalytical 
            ? "Sophisticated financial modeling and predictive analytics" 
            : "Simplified financial operations management with intuitive dashboards",
          attributes: hasHighAnalytical 
            ? ["advanced", "complex", "powerful"] 
            : ["simple", "intuitive", "streamlined"]
        }
      ],
      reason: hasHighAnalytical 
        ? "Your strong analytical capabilities suggest you can leverage complex financial modeling tools" 
        : "Your practical approach to finance indicates a preference for streamlined operational tools"
    });
  } else if (industry === "Healthcare") {
    // Primary healthcare recommendations
    recommendations.push({
      category: "Healthcare Analytics",
      products: [
        {
          name: "PersonalysisPro Patient Insights Platform",
          confidence: 75 + Math.floor(analyticalThinking / 5),
          description: "HIPAA-compliant patient experience and outcome analytics",
          attributes: ["patient-centered", "HIPAA-compliant", "outcome-focused"]
        },
        {
          name: "PersonalysisPro Care Provider Dashboard",
          confidence: 70 + Math.floor(decisionConfidence / 4),
          description: "Interactive analytics dashboard for healthcare professionals",
          attributes: ["intuitive", "real-time", "integrative"]
        },
        {
          name: isInnovative ? "NextGen Care Innovation Suite" : "Established Care Management Platform",
          confidence: isInnovative ? 75 + Math.floor(innovationAdoption / 8) : 70 + Math.floor((100 - innovationAdoption) / 6),
          description: isInnovative 
            ? "Cutting-edge healthcare technology with emerging clinical tools" 
            : "Proven healthcare management system with reliable clinical workflows",
          attributes: isInnovative 
            ? ["innovative", "emerging", "transformative"] 
            : ["established", "reliable", "consistent"]
        }
      ],
      reason: isInnovative 
        ? "Your openness to innovation in healthcare suggests a preference for progressive clinical tools" 
        : "Your careful approach to healthcare indicates a focus on proven clinical solutions"
    });
    
    // Secondary healthcare recommendations
    recommendations.push({
      category: "Clinical Decision Support",
      products: [
        {
          name: hasHighAnalytical ? "Advanced Clinical Analytics Platform" : "Streamlined Clinical Decision Support",
          confidence: hasHighAnalytical ? 80 + Math.floor(analyticalThinking / 8) : 70 + Math.floor(decisionConfidence / 5),
          description: hasHighAnalytical 
            ? "Comprehensive clinical data analytics with advanced statistical modeling" 
            : "Intuitive clinical decision support with actionable recommendations",
          attributes: hasHighAnalytical 
            ? ["comprehensive", "detailed", "analytical"] 
            : ["intuitive", "actionable", "supportive"]
        }
      ],
      reason: hasHighAnalytical 
        ? "Your analytical mindset is well-suited for complex clinical data analysis tools" 
        : "Your practical clinical approach aligns with straightforward decision support tools"
    });
  } else {
    // Generic recommendation for other industries
    recommendations.push({
      category: "Business Analytics",
      products: [
        {
          name: "PersonalysisPro Business Insights",
          confidence: 75 + Math.floor(Math.random() * 20),
          description: "Scalable analytics platform for businesses of all sizes",
          attributes: ["versatile", "user-friendly", "adaptable"]
        }
      ],
      reason: "Matches your business profile and decision-making approach"
    });
  }
  
  // Add a second generic recommendation
  recommendations.push({
    category: "Business Intelligence",
    products: [
      {
        name: "PersonalysisPro Executive Dashboard",
        confidence: 75 + Math.floor(Math.random() * 20),
        description: "Custom executive reporting with key business insights",
        attributes: ["executive-focused", "strategic", "comprehensive"]
      },
      {
        name: "PersonalysisPro Team Analytics",
        confidence: 70 + Math.floor(Math.random() * 25),
        description: "Team performance and collaboration analytics platform",
        attributes: ["team-oriented", "performance-focused", "actionable"]
      }
    ],
    reason: "Matches your strategic vision and decision-making profile"
  });
  
  return recommendations;
}

// Helper function to determine market segment
function determineMarketSegment(traits: any[]): string {
  // Find key traits that determine market segments
  const analyticalThinking = traits.find(t => t.name === "Analytical Thinking")?.score || 50;
  const riskTolerance = traits.find(t => t.name === "Risk Tolerance")?.score || 50;
  const innovationAdoption = traits.find(t => t.name === "Innovation Adoption")?.score || 50;
  const valueCon = traits.find(t => t.name === "Value Consciousness")?.score || 50;
  
  // Determine segment based on trait combinations
  if (innovationAdoption > 70 && riskTolerance > 60) {
    return "Early Adopter";
  } else if (analyticalThinking > 75 && valueCon > 70) {
    return "Value Researcher";
  } else if (riskTolerance < 40 && valueCon > 80) {
    return "Cautious Consumer";
  } else if (innovationAdoption < 40 && valueCon > 75) {
    return "Traditional Buyer";
  } else if (innovationAdoption > 60 && valueCon > 70) {
    return "Smart Innovator";
  } else if (analyticalThinking > 70 && riskTolerance > 65) {
    return "Calculated Risk-Taker";
  } else {
    return "Balanced Consumer";
  }
}

// Helper function to generate sample question responses
function generateSampleResponses(count: number): any[] {
  const responses = [];
  
  // Question templates with weighted answers
  const questionTemplates = [
    {
      question: "How comfortable are you with taking professional risks?",
      answers: ["Very uncomfortable", "Somewhat uncomfortable", "Neutral", "Somewhat comfortable", "Very comfortable"],
      weights: [0.1, 0.2, 0.3, 0.3, 0.1] // Weight distribution for answers
    },
    {
      question: "How quickly do you adopt new technologies?",
      answers: ["I wait until technologies are mainstream", "I adopt after seeing others succeed", "I'm somewhere in the middle", "I adopt fairly quickly", "I'm an early adopter"],
      weights: [0.1, 0.2, 0.3, 0.3, 0.1]
    },
    {
      question: "How important is brand reputation when making purchase decisions?",
      answers: ["Not important", "Slightly important", "Moderately important", "Very important", "Extremely important"],
      weights: [0.05, 0.15, 0.3, 0.3, 0.2]
    },
    {
      question: "How would you describe your decision-making process?",
      answers: ["Mostly intuitive", "Somewhat intuitive", "Balanced", "Somewhat analytical", "Highly analytical"],
      weights: [0.1, 0.2, 0.3, 0.25, 0.15]
    },
    {
      question: "How important is cost versus quality in your purchasing decisions?",
      answers: ["Cost is much more important", "Cost is somewhat more important", "They are equally important", "Quality is somewhat more important", "Quality is much more important"],
      weights: [0.05, 0.15, 0.3, 0.3, 0.2]
    },
    {
      question: "How do you prefer to communicate in professional settings?",
      answers: ["In-person meetings", "Video calls", "Phone calls", "Emails", "Messaging apps"],
      weights: [0.2, 0.25, 0.15, 0.3, 0.1]
    },
    {
      question: "When presented with a new problem, how do you typically approach it?",
      answers: ["Rely on past experience", "Consult with peers", "Research best practices", "Try multiple approaches", "Develop a unique solution"],
      weights: [0.2, 0.2, 0.25, 0.2, 0.15]
    },
    {
      question: "How would you rate your work-life balance?",
      answers: ["Poor", "Below average", "Average", "Good", "Excellent"],
      weights: [0.1, 0.2, 0.4, 0.2, 0.1]
    },
    {
      question: "How do you prefer to learn new skills?",
      answers: ["Formal training/courses", "On-the-job experience", "Self-directed learning", "Mentorship", "Collaborative learning"],
      weights: [0.2, 0.3, 0.25, 0.15, 0.1]
    },
    {
      question: "How do you approach team collaboration?",
      answers: ["I prefer working independently", "I collaborate when necessary", "I enjoy a mix of both", "I prefer collaborative work", "I thrive in highly collaborative environments"],
      weights: [0.1, 0.2, 0.3, 0.25, 0.15]
    },
    {
      question: "How do you handle tight deadlines?",
      answers: ["I get very stressed", "I feel some pressure but manage", "I'm used to them", "I work well under pressure", "I thrive under tight deadlines"],
      weights: [0.1, 0.2, 0.3, 0.25, 0.15]
    },
    {
      question: "How do you prefer to receive feedback?",
      answers: ["Written detailed feedback", "In-person private conversation", "Regular scheduled reviews", "Immediate in the moment", "Public recognition/criticism"],
      weights: [0.2, 0.3, 0.25, 0.2, 0.05]
    },
    {
      question: "How important is company culture when considering a job?",
      answers: ["Not important", "Slightly important", "Moderately important", "Very important", "Extremely important"],
      weights: [0.05, 0.1, 0.25, 0.4, 0.2]
    },
    {
      question: "How do you approach conflicts in the workplace?",
      answers: ["Avoid them", "Accommodate others' needs", "Seek compromise", "Address them directly", "Escalate to management"],
      weights: [0.1, 0.2, 0.3, 0.3, 0.1]
    },
    {
      question: "How do you stay current in your field?",
      answers: ["Professional training", "Industry publications", "Networking events", "Online courses", "Social media and blogs"],
      weights: [0.2, 0.2, 0.2, 0.2, 0.2]
    },
    {
      question: "What's your preferred work environment?",
      answers: ["Traditional office setting", "Open collaborative space", "Flexible hybrid arrangement", "Primarily remote with occasional office", "Fully remote"],
      weights: [0.15, 0.2, 0.25, 0.25, 0.15]
    },
    {
      question: "How do you handle unexpected changes to projects?",
      answers: ["I resist changes", "I accept them reluctantly", "I'm adaptable", "I look for the opportunities", "I thrive on change"],
      weights: [0.1, 0.15, 0.3, 0.3, 0.15]
    },
    {
      question: "How important is work-related travel to you?",
      answers: ["I prefer no travel", "Minimal travel is acceptable", "Moderate travel is fine", "I enjoy regular travel", "I seek positions with significant travel"],
      weights: [0.2, 0.3, 0.25, 0.15, 0.1]
    },
    {
      question: "What's your preferred leadership style?",
      answers: ["Directive", "Authoritative", "Democratic", "Coaching", "Laissez-faire"],
      weights: [0.15, 0.2, 0.35, 0.2, 0.1]
    },
    {
      question: "How important is having clear processes and procedures?",
      answers: ["Not important", "Somewhat important", "Moderately important", "Very important", "Extremely important"],
      weights: [0.05, 0.15, 0.3, 0.35, 0.15]
    }
  ];
  
  // Use unique questions (no duplicates) up to the count requested
  const usedQuestions = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    // Find a question we haven't used yet
    let questionIndex;
    do {
      questionIndex = Math.floor(Math.random() * questionTemplates.length);
    } while (usedQuestions.has(questionIndex) && usedQuestions.size < questionTemplates.length);
    
    // If we've used all questions, allow repeats
    if (usedQuestions.size >= questionTemplates.length) {
      questionIndex = Math.floor(Math.random() * questionTemplates.length);
    } else {
      usedQuestions.add(questionIndex);
    }
    
    const template = questionTemplates[questionIndex];
    
    // Generate a weighted random answer based on the weights
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedAnswerIndex = 0;
    
    for (let j = 0; j < template.weights.length; j++) {
      cumulativeWeight += template.weights[j];
      if (randomValue <= cumulativeWeight) {
        selectedAnswerIndex = j;
        break;
      }
    }
    
    // Add response with both question and answer plus metadata
    responses.push({
      question: template.question,
      answer: template.answers[selectedAnswerIndex],
      questionId: `q-${questionIndex + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 1000000).toISOString(),
      timeSpent: 5 + Math.floor(Math.random() * 20), // 5-25 seconds per question
      confidenceLevel: 60 + Math.floor(Math.random() * 40) // 60-100% confidence
    });
  }
  
  return responses;
}