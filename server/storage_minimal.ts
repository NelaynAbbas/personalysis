import { nanoid } from 'nanoid';
import { Company, InsertCompany, InsertSurveyResponse, InsertUser, MarketingStrategy, PersonalityTrait, PricingStrategy, ProductFeaturePriority, RevenueForecasting, SimulatedFocusGroup, SurveyResponse, User, CookieConsent, InsertCookieConsent } from '@shared/schema';
import { IStorage, CompetitorAnalysis, MarketFitAnalysis, CustomerSegment, CollaborationSession, CollaborationParticipant, CollaborationChange, CollaborationComment } from './storage';

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private companies: Map<number, Company> = new Map();
  private responses: Map<number, SurveyResponse> = new Map();
  
  constructor() {
    console.log('Initializing minimal in-memory storage');
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.users.size + 1;
    const newUser: User = { ...user, id, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isActive: false };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User authentication and security
  async setPasswordResetToken(userId: number, token: string, expiryHours: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    
    const updatedUser = { 
      ...user, 
      passwordResetToken: token, 
      passwordResetTokenExpiry: expiry 
    };
    this.users.set(userId, updatedUser);
    return true;
  }

  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(u => 
      u.passwordResetToken === token && 
      u.passwordResetTokenExpiry && 
      u.passwordResetTokenExpiry > new Date()
    );
    return user;
  }

  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      password: newPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      passwordLastChanged: new Date()
    };
    this.users.set(userId, updatedUser);
    return true;
  }

  async setEmailVerificationToken(userId: number, token: string, expiryHours: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    
    const updatedUser = { 
      ...user, 
      emailVerificationToken: token, 
      emailVerificationTokenExpiry: expiry 
    };
    this.users.set(userId, updatedUser);
    return true;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => 
      u.emailVerificationToken === token && 
      u.emailVerificationTokenExpiry && 
      u.emailVerificationTokenExpiry > new Date()
    );
    
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null
    };
    this.users.set(user.id, updatedUser);
    return true;
  }

  // User activity logging
  async logUserActivity(userId: number, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void> {
    console.log(`User ${userId} performed action: ${action}`, { details, ipAddress, userAgent });
  }

  async getUserActivityLogs(userId: number, limit?: number): Promise<any[]> {
    return [];
  }

  // User invitations and onboarding
  async createUserInvitation(email: string, role: string, companyId: number, invitedBy: number): Promise<any> {
    return {
      id: Date.now(),
      email,
      role,
      companyId,
      invitedBy,
      token: nanoid(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  async getInvitationByToken(token: string): Promise<any | undefined> {
    return undefined;
  }

  async acceptInvitation(token: string, userData: Partial<User>): Promise<User | undefined> {
    return undefined;
  }
  
  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }
  
  async getCompanyByApiKey(apiKey: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.apiKey === apiKey);
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.companies.size + 1;
    const newCompany: Company = { ...company, id, createdAt: new Date(), updatedAt: new Date() };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  // Survey operations
  async getSurvey(id: number): Promise<any> {
    return {
      id,
      title: "Demo Survey",
      description: "A demo survey for testing",
      questions: [],
      createdAt: new Date()
    };
  }

  async getSurveyResponse(id: number): Promise<SurveyResponse | undefined> {
    return this.responses.get(id);
  }
  
  async getSurveyResponsesByCompany(companyId: number): Promise<SurveyResponse[]> {
    return Array.from(this.responses.values()).filter(response => response.companyId === companyId);
  }
  
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const id = this.responses.size + 1;
    const newResponse: SurveyResponse = { ...response, id, createdAt: new Date(), updatedAt: new Date() };
    this.responses.set(id, newResponse);
    return newResponse;
  }

  // Client operations
  async getClientById(id: number): Promise<any> {
    return {
      id,
      name: "Demo Client",
      email: "demo@example.com",
      company: "Demo Company",
      status: "active"
    };
  }

  // License operations
  async getLicenseById(id: number): Promise<any> {
    return {
      id,
      name: "Demo License",
      type: "enterprise",
      status: "active",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
  }

  // Client Survey Deployment operations
  async getClientSurveyDeployments(): Promise<any[]> {
    return [];
  }

  async getClientSurveyDeploymentsByClient(clientId: number): Promise<any[]> {
    return [];
  }

  async getClientSurveyDeploymentsBySurvey(surveyId: number): Promise<any[]> {
    return [];
  }

  async getClientSurveyDeploymentById(id: number): Promise<any> {
    return {
      id,
      clientId: 1,
      surveyId: 1,
      status: "active",
      deployedAt: new Date()
    };
  }

  async createClientSurveyDeployment(deploymentData: any): Promise<any> {
    return {
      id: Date.now(),
      ...deploymentData,
      createdAt: new Date()
    };
  }

  async updateClientSurveyDeployment(id: number, data: any): Promise<any> {
    return {
      id,
      ...data,
      updatedAt: new Date()
    };
  }

  // Audit logging
  async createAuditLog(logData: any): Promise<any> {
    return {
      id: Date.now(),
      ...logData,
      createdAt: new Date()
    };
  }

  // Analytics operations
  async getCompanyStats(companyId: number): Promise<any> {
    return {
      totalResponses: 150,
      completionRate: 87.5,
      averageSatisfactionScore: 8.4,
      demographics: {
        gender: { male: 55, female: 42, other: 3 },
        age: { "18-24": 28, "25-34": 42, "35-44": 18, "45-54": 8, "55+": 4 }
      }
    };
  }

  async getSurveyAnalytics(surveyId: number): Promise<any> {
    return {
      totalResponses: 75,
      completionRate: 89.3,
      averageCompletionTime: 12.5,
      responseRate: 68.2,
      topTraits: ["Openness", "Conscientiousness", "Extraversion"],
      demographics: {
        gender: { male: 48, female: 50, other: 2 },
        age: { "18-24": 22, "25-34": 38, "35-44": 25, "45-54": 12, "55+": 3 }
      }
    };
  }

  // Advanced business analysis operations
  async getCompetitorAnalysis(companyId: number): Promise<CompetitorAnalysis[]> {
    return [
      {
        name: "Competitor A",
        marketShare: 25.8,
        strengthScore: 8.2,
        weaknessScore: 3.1,
        overallThreatLevel: 7.5,
        primaryCompetitiveAdvantage: "Strong brand recognition",
        keyWeakness: "Limited product innovation",
        customerSentiment: 7.3,
        pricingPosition: "Premium",
        strengths: ["Market leadership", "Brand loyalty", "Distribution network"],
        weaknesses: ["High prices", "Slow innovation", "Limited customization"],
        productFeatureComparison: {
          "User Interface": { competitor: 8, our: 9 },
          "Performance": { competitor: 7, our: 8 },
          "Price": { competitor: 6, our: 8 }
        }
      }
    ];
  }

  async getMarketFitAnalysis(companyId: number, productId: string): Promise<MarketFitAnalysis> {
    return {
      productId,
      overallFitScore: 8.3,
      problemSolutionFit: 8.7,
      productMarketFit: 7.9,
      marketSizePotential: {
        total: 50000000,
        addressable: 15000000,
        serviceable: 5000000
      },
      customerNeedAlignment: 8.5,
      valuePropositionClarity: 8.1,
      priceToValuePerception: 7.8,
      productDifferentiation: 8.4,
      competitiveAdvantage: ["Advanced AI-driven insights", "Superior user experience"],
      marketChallenges: ["High customer acquisition costs", "Intense competition"],
      customerPainPoints: [
        {
          painPoint: "Complex data analysis",
          severity: 8.5,
          frequency: 9.2,
          addressedByProduct: 8.8
        }
      ],
      recommendations: ["Focus on enterprise market segment", "Enhance mobile capabilities"]
    };
  }

  async getCustomerSegments(companyId: number): Promise<CustomerSegment[]> {
    return [
      {
        name: "Tech Innovators",
        size: 2500,
        percentageOfCustomers: 35.2,
        growthRate: 12.5,
        dominantTraits: [
          { name: "Openness", score: 8.7, category: "Big Five" },
          { name: "Conscientiousness", score: 8.2, category: "Big Five" },
          { name: "Neuroticism", score: 4.1, category: "Big Five" }
        ],
        keyDemographics: {
          ageGroups: { "25-34": 45, "35-44": 35, "18-24": 15, "45-54": 5 },
          genderDistribution: { male: 65, female: 33, other: 2 },
          incomeRange: { "75k-100k": 35, "100k-150k": 40, "150k+": 25 },
          education: { "Bachelor's": 45, "Master's": 35, "PhD": 15, "High School": 5 },
          location: { "Urban": 70, "Suburban": 25, "Rural": 5 }
        },
        demographicSummary: {
          topInterests: ["Technology", "Innovation", "Productivity"],
          dominantGender: "Male",
          averageIncome: "$120,000",
          averageAge: 32,
          loyaltyScore: 8.4
        },
        purchasingBehaviors: ["Early adopters", "Value premium features", "Research extensively"],
        productPreferences: ["Advanced functionality", "Customization options", "Integration capabilities"],
        communicationChannels: { "Email": 40, "Social Media": 30, "Webinars": 20, "Direct Sales": 10 },
        customerLifetimeValue: 15000,
        acquisitionCost: 1200,
        targetFit: 9.2
      }
    ];
  }

  async getProductFeaturePriorities(companyId: number): Promise<ProductFeaturePriority[]> {
    return [
      {
        featureName: "Advanced Analytics Dashboard",
        importance: 9.2,
        currentSatisfaction: 7.8,
        developmentCost: 8.5,
        timeToImplement: "3-4 months",
        impactOnSales: 8.7,
        competitiveNecessity: 9.1,
        customerSegmentRelevance: { "Enterprise": 9.5, "SMB": 7.2, "Startup": 8.1 },
        technicalFeasibility: 8.3,
        strategicAlignment: 9.0,
        overallPriority: 8.8
      }
    ];
  }

  async getPricingStrategies(companyId: number): Promise<PricingStrategy[]> {
    return [
      {
        strategyName: "Value-Based Pricing",
        appropriateness: 8.7,
        potentialRevenue: 2500000,
        customerAcceptance: 8.2,
        competitiveSustainability: 7.9,
        implementationComplexity: 6.5,
        profitMargin: 8.8,
        marketPenetration: 7.5,
        customerSegmentImpact: { "Enterprise": 9.1, "SMB": 7.3, "Startup": 6.8 },
        overallScore: 8.3
      }
    ];
  }

  async getMarketingStrategies(companyId: number): Promise<MarketingStrategy[]> {
    return [
      {
        strategyName: "Content Marketing & Thought Leadership",
        effectiveness: 8.5,
        cost: 75000,
        reach: 150000,
        conversionRate: 3.2,
        brandImpact: 8.8,
        timeToResults: "3-6 months",
        channelMix: { "Blog": 30, "Social Media": 25, "Webinars": 20, "Podcasts": 15, "Whitepapers": 10 },
        targetAudience: ["Tech Leaders", "Business Analysts", "Decision Makers"],
        expectedROI: 320,
        competitiveAdvantage: 7.9,
        overallScore: 8.2
      }
    ];
  }

  async getRevenueForecasts(companyId: number): Promise<RevenueForecasting[]> {
    return [
      {
        period: "Q1 2025",
        forecastType: "Conservative",
        projectedRevenue: 1250000,
        confidence: 85,
        assumptions: ["Market growth continues", "No major competitors enter", "Customer retention at 85%"],
        riskFactors: ["Economic downturn", "Competitive pressure", "Technology disruption"],
        contributingFactors: {
          "New Customers": 40,
          "Upsells": 35,
          "Renewals": 25
        },
        monthlyBreakdown: [
          { month: "January", revenue: 400000, confidence: 88 },
          { month: "February", revenue: 420000, confidence: 85 },
          { month: "March", revenue: 430000, confidence: 82 }
        ],
        keyMetrics: {
          customerAcquisitionCost: 1500,
          customerLifetimeValue: 25000,
          churnRate: 5.2,
          averageRevenuePerUser: 8500
        }
      }
    ];
  }

  async getFocusGroupSimulation(companyId: number, productConcept: string): Promise<SimulatedFocusGroup> {
    return {
      id: Date.now(),
      productConcept,
      participantCount: 12,
      duration: 90,
      overallReaction: 7.8,
      keyInsights: [
        "Strong interest in automation features",
        "Concerns about data privacy",
        "Desire for better mobile experience"
      ],
      participantFeedback: [
        {
          participantId: 1,
          demographics: { age: 32, gender: "Female", occupation: "Marketing Manager" },
          sentiment: 8.2,
          comments: ["Love the intuitive interface", "Would definitely recommend"],
          concerns: ["Pricing seems high"],
          suggestions: ["Add more customization options"]
        }
      ],
      thematicAnalysis: {
        "Usability": 8.5,
        "Value Proposition": 7.9,
        "Pricing": 6.8,
        "Features": 8.1
      },
      recommendedActions: [
        "Revise pricing strategy",
        "Enhance mobile capabilities",
        "Address privacy concerns"
      ],
      marketPotential: 8.3,
      purchaseIntent: 7.6
    };
  }

  // GDPR-compliant cookie consent operations
  async createCookieConsent(consent: InsertCookieConsent): Promise<CookieConsent> {
    const newConsent: CookieConsent = {
      id: Date.now(),
      ...consent,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newConsent;
  }

  async getCookieConsentBySession(sessionId: string): Promise<CookieConsent | undefined> {
    return undefined;
  }

  async updateCookieConsent(sessionId: string, consent: Partial<CookieConsent>): Promise<CookieConsent | undefined> {
    return undefined;
  }

  async withdrawCookieConsent(sessionId: string): Promise<boolean> {
    return true;
  }

  async getCookieConsents(filters?: any): Promise<CookieConsent[]> {
    return [];
  }

  // Collaboration operations
  async getCollaborationSessions(): Promise<CollaborationSession[]> {
    return [];
  }

  async getCollaborationSession(id: number): Promise<CollaborationSession | undefined> {
    return undefined;
  }

  async createCollaborationSession(session: Omit<CollaborationSession, 'id' | 'createdAt'>): Promise<CollaborationSession> {
    const newSession: CollaborationSession = {
      id: Date.now(),
      ...session,
      createdAt: new Date()
    };
    return newSession;
  }

  async getCollaborationParticipants(sessionId: number): Promise<CollaborationParticipant[]> {
    return [];
  }

  async getCollaborationParticipant(sessionId: number, userId: number): Promise<CollaborationParticipant | undefined> {
    return undefined;
  }

  async createCollaborationParticipant(participant: Omit<CollaborationParticipant, 'id'>): Promise<CollaborationParticipant> {
    const newParticipant: CollaborationParticipant = {
      id: Date.now(),
      ...participant
    };
    return newParticipant;
  }

  async updateCollaborationParticipant(sessionId: number, userId: number, data: Partial<Omit<CollaborationParticipant, 'id' | 'sessionId' | 'userId'>>): Promise<CollaborationParticipant | undefined> {
    return undefined;
  }

  async updateParticipantCursor(sessionId: number, userId: number, cursorPosition: { x: number, y: number }): Promise<CollaborationParticipant | undefined> {
    return undefined;
  }

  async updateParticipantStatus(sessionId: number, userId: number, status: string): Promise<CollaborationParticipant | undefined> {
    return undefined;
  }

  async getCollaborationChanges(sessionId: number): Promise<CollaborationChange[]> {
    return [];
  }

  async getCollaborationChangesByEntity(sessionId: number, entityType: string, entityId: number): Promise<CollaborationChange[]> {
    return [];
  }

  async createCollaborationChange(change: Omit<CollaborationChange, 'id' | 'timestamp'>): Promise<CollaborationChange> {
    const newChange: CollaborationChange = {
      id: Date.now(),
      ...change,
      timestamp: new Date()
    };
    return newChange;
  }

  async getCollaborationComments(sessionId: number): Promise<CollaborationComment[]> {
    return [];
  }

  async createCollaborationComment(comment: Omit<CollaborationComment, 'id' | 'createdAt'>): Promise<CollaborationComment> {
    const newComment: CollaborationComment = {
      id: Date.now(),
      ...comment,
      createdAt: new Date()
    };
    return newComment;
  }

  async updateCollaborationComment(id: string, data: Partial<Omit<CollaborationComment, 'id' | 'sessionId' | 'userId'>>): Promise<CollaborationComment | undefined> {
    return undefined;
  }
}

export const storage = new MemStorage();