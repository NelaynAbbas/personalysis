import { PersonalityTrait, SimulatedFocusGroup, User } from "../shared/schema";

export interface CompetitorAnalysis {
  name: string;
  marketShare: number;
  strengthScore: number;
  weaknessScore: number;
  overallThreatLevel: number;
  primaryCompetitiveAdvantage: string;
  keyWeakness: string;
  customerSentiment: number;
  pricingPosition: string;
  strengths: string[];
  weaknesses: string[];
  productFeatureComparison: {
    [feature: string]: {
      competitor: number;
      our: number;
    };
  };
}

export interface MarketFitAnalysis {
  productId: string;
  overallFitScore: number;
  problemSolutionFit: number;
  productMarketFit: number;
  marketSizePotential: {
    total: number;
    addressable: number;
    serviceable: number;
  };
  customerNeedAlignment: number;
  valuePropositionClarity: number;
  priceToValuePerception: number;
  productDifferentiation: number;
  competitiveAdvantage: string[];
  marketChallenges: string[];
  customerPainPoints: {
    painPoint: string;
    severity: number;
    frequency: number;
    addressedByProduct: number;
  }[];
  recommendations: string[];
}

export interface CustomerSegment {
  name: string;
  size: number;
  percentageOfCustomers: number;
  growthRate: number;
  dominantTraits: PersonalityTrait[];
  keyDemographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    incomeRange: Record<string, number>;
    education: Record<string, number>;
    location: Record<string, number>;
  };
  demographicSummary?: {
    topInterests: string[];
    dominantGender: string;
    averageIncome: string;
    averageAge: number;
    loyaltyScore: number;
  };
  purchasingBehaviors: string[];
  productPreferences: string[];
  communicationChannels: Record<string, number>;
  customerLifetimeValue: number;
  acquisitionCost: number;
  targetFit: number;
}

export interface ProductFeaturePriority {
  featureName: string;
  importance: number;
  currentSatisfaction: number;
  developmentCost: number;
  timeToImplement: string;
  impactOnSales: number;
  competitiveNecessity: number;
  customerSegmentRelevance: Record<string, number>;
  technicalFeasibility: number;
  strategicAlignment: number;
  overallPriority: number;
}

export interface PricingStrategy {
  strategyName: string;
  appropriateness: number;
  potentialRevenue: number;
  customerAcceptance: number;
  competitiveSustainability: number;
  implementationComplexity: number;
  profitMargin: number;
  marketPenetration: number;
  customerSegmentImpact: Record<string, number>;
  overallScore: number;
  priceElasticity?: number; // Added for price elasticity data
  pricingStructure: {
    base: number;
    tiers: Array<{
      name: string;
      tierName?: string; // Optional property for frontend
      price: number;
      features: string[];
    }>;
  };
}

export interface MarketingStrategy {
  strategyName: string;
  effectiveness: number;
  costEfficiency: number;
  implementationTimeline: string;
  revenueImpact: number;
  brandAlignment: number;
  customerReach: number;
  competitiveAdvantage: number;
  channelBreakdown: Record<string, number>;
  messagingThemes: string[];
  targetedPersonas: string[];
  overallScore: number;
}

export interface RevenueForecasting {
  scenario: string;
  probabilityOfOccurrence: number;
  timeframe: string;
  projectedRevenue: number;
  growthRate: number;
  marketShareProjection: number;
  customerAdoption: number;
  contributingFactors: string[];
  riskFactors: string[];
  confidenceLevel: number;
  monthlyBreakdown: Record<string, number>;
  revenueStreams?: Array<{
    name: string;
    percentage: number;
    growth: number;
  }>;
  totalProjectedRevenue?: number;
}



export interface CollaborationSession {
  id: number;
  name: string;
  companyId: number;
  createdAt: Date;
  status: string;
  type: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface CollaborationParticipant {
  id: number;
  sessionId: number;
  userId: number;
  role: string;
  status: string;
  joinedAt: Date;
  lastActive?: Date;
  cursorPosition?: { x: number, y: number };
  viewingEntity?: { type: string, id: number };
}

export interface CollaborationChange {
  id: number;
  sessionId: number;
  userId: number;
  entityType: string;
  entityId: number;
  changeType: string;
  changeData: any;
  timestamp: Date;
}

export interface CollaborationComment {
  id: number;
  sessionId: number;
  userId: number;
  entityType: string;
  entityId: number;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: number;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined>;
  deactivateUser(id: number): Promise<User | undefined>;
  
  // User authentication and security
  setPasswordResetToken(userId: number, token: string, expiryHours: number): Promise<boolean>;
  validatePasswordResetToken(token: string): Promise<User | undefined>;
  resetPassword(userId: number, newPassword: string): Promise<boolean>;
  setEmailVerificationToken(userId: number, token: string, expiryHours: number): Promise<boolean>;
  verifyEmail(token: string): Promise<boolean>;
  
  // User activity logging
  logUserActivity(userId: number, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void>;
  getUserActivityLogs(userId: number, limit?: number): Promise<any[]>;
  
  // User invitations and onboarding
  createUserInvitation(email: string, role: string, companyId: number, invitedBy: number): Promise<any>;
  getInvitationByToken(token: string): Promise<any | undefined>;
  acceptInvitation(token: string, userData: Partial<User>): Promise<User | undefined>;
  
  // Company operations
  getCompany(id: number): Promise<any>;
  getCompanyByApiKey(apiKey: string): Promise<any>;
  
  // Survey operations
  getSurvey(id: number): Promise<any>;
  getSurveyResponse(id: number): Promise<any>;
  getSurveyResponsesByCompany(companyId: number): Promise<any[]>;
  createSurveyResponse(responseData: any): Promise<any>;
  
  // Client operations
  getClientById(id: number): Promise<any>;
  
  // License operations
  getLicenseById(id: number): Promise<any>;
  
  // Client Survey Deployment operations
  getClientSurveyDeployments(): Promise<any[]>;
  getClientSurveyDeploymentsByClient(clientId: number): Promise<any[]>;
  getClientSurveyDeploymentsBySurvey(surveyId: number): Promise<any[]>;
  getClientSurveyDeploymentById(id: number): Promise<any>;
  createClientSurveyDeployment(deploymentData: any): Promise<any>;
  updateClientSurveyDeployment(id: number, data: any): Promise<any>;
  
  // Audit logging
  createAuditLog(logData: any): Promise<any>;
  
  // Basic analytics operations
  getCompanyStats(companyId: number): Promise<any>;
  getSurveyAnalytics(surveyId: number): Promise<any>;
  
  // Advanced business analysis operations
  getCompetitorAnalysis(companyId: number): Promise<CompetitorAnalysis[]>;
  getMarketFitAnalysis(companyId: number, productId: string): Promise<MarketFitAnalysis>;
  getCustomerSegments(companyId: number): Promise<CustomerSegment[]>;
  getProductFeaturePriorities(companyId: number): Promise<ProductFeaturePriority[]>;
  getPricingStrategies(companyId: number): Promise<PricingStrategy[]>;
  getMarketingStrategies(companyId: number): Promise<MarketingStrategy[]>;
  getRevenueForecasts(companyId: number): Promise<RevenueForecasting[]>;
  getFocusGroupSimulation(companyId: number, productConcept: string): Promise<SimulatedFocusGroup>;
  
  // GDPR-compliant cookie consent operations
  createCookieConsent(consent: any): Promise<any>;
  getCookieConsentBySession(sessionId: string): Promise<any | undefined>;
  updateCookieConsent(sessionId: string, consent: Partial<any>): Promise<any | undefined>;
  withdrawCookieConsent(sessionId: string): Promise<boolean>;
  getCookieConsents(filters?: any): Promise<any[]>;
  
  // Collaboration operations
  getCollaborationSessions(): Promise<CollaborationSession[]>;
  getCollaborationSession(id: number): Promise<CollaborationSession | undefined>;
  createCollaborationSession(session: Omit<CollaborationSession, 'id' | 'createdAt'>): Promise<CollaborationSession>;
  getCollaborationParticipants(sessionId: number): Promise<CollaborationParticipant[]>;
  getCollaborationParticipant(sessionId: number, userId: number): Promise<CollaborationParticipant | undefined>;
  createCollaborationParticipant(participant: Omit<CollaborationParticipant, 'id'>): Promise<CollaborationParticipant>;
  updateCollaborationParticipant(sessionId: number, userId: number, data: Partial<Omit<CollaborationParticipant, 'id' | 'sessionId' | 'userId'>>): Promise<CollaborationParticipant | undefined>;
  updateParticipantCursor(sessionId: number, userId: number, cursorPosition: { x: number, y: number }): Promise<CollaborationParticipant | undefined>;
  updateParticipantStatus(sessionId: number, userId: number, status: string): Promise<CollaborationParticipant | undefined>;
  getCollaborationChanges(sessionId: number): Promise<CollaborationChange[]>;
  getCollaborationChangesByEntity(sessionId: number, entityType: string, entityId: number): Promise<CollaborationChange[]>;
  createCollaborationChange(change: Omit<CollaborationChange, 'id' | 'timestamp'>): Promise<CollaborationChange>;
  getCollaborationComments(sessionId: number): Promise<CollaborationComment[]>;
  createCollaborationComment(comment: Omit<CollaborationComment, 'id' | 'createdAt'>): Promise<CollaborationComment>;
  updateCollaborationComment(id: string, data: Partial<Omit<CollaborationComment, 'id' | 'sessionId' | 'userId'>>): Promise<CollaborationComment | undefined>;
}

export class DatabaseStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, any>;
  private surveyResponses: Map<number, any>;
  private collaborationSessions: Map<number, CollaborationSession>;
  private collaborationParticipants: Map<number, CollaborationParticipant[]>;
  private collaborationChanges: Map<number, CollaborationChange[]>;
  private collaborationComments: Map<number, CollaborationComment[]>;
  private currentId: number;
  private sessionId: number;
  private participantId: number;
  private changeId: number;
  private commentId: number;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.surveyResponses = new Map();
    this.collaborationSessions = new Map();
    this.collaborationParticipants = new Map();
    this.collaborationChanges = new Map();
    this.collaborationComments = new Map();
    this.currentId = 1;
    this.sessionId = 1;
    this.participantId = 1;
    this.changeId = 1;
    this.commentId = 1;

    // Initialize demo users with plain text passwords
    const demoPassword = "password";
    
    const adminUser: User = {
      id: this.currentId++,
      username: "admin@personalysispro.com",
      password: demoPassword,
      email: "admin@personalysispro.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      companyId: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      isActive: true,
      lastLogin: null,
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      passwordLastChanged: null,
      mfaEnabled: false,
      mfaSecret: null,
      loginAttempts: 0,
      lastFailedLogin: null,
      accountLocked: false,
      accountLockedUntil: null,
      profilePic: null,
      jobTitle: null,
      department: null,
      passwordSalt: null
    };
    
    const demoUser: User = {
      id: this.currentId++,
      username: "demo@personalysispro.com",
      password: demoPassword,
      email: "demo@personalysispro.com",
      firstName: "Demo",
      lastName: "User",
      role: "client",
      companyId: 2,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      isActive: true,
      lastLogin: null,
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      passwordLastChanged: null,
      mfaEnabled: false,
      mfaSecret: null,
      loginAttempts: 0,
      lastFailedLogin: null,
      accountLocked: false,
      accountLockedUntil: null,
      profilePic: null,
      jobTitle: null,
      department: null,
      passwordSalt: null
    };
    
    this.users.set(adminUser.id, adminUser);
    this.users.set(demoUser.id, demoUser);

    // Initialize demo companies
    this.companies.set(1, {
      id: 1,
      name: "DEMO - PersonalysisPro Admin",
      industry: "Technology",
      size: "51-200",
      apiKey: "demo-admin-key-12345",
      createdAt: new Date("2024-01-01"),
      status: "active",
      plan: "enterprise"
    });

    this.companies.set(2, {
      id: 2,
      name: "DEMO - PersonalysisPro Client",
      industry: "Software",
      size: "10-50",
      apiKey: "demo-client-key-67890",
      createdAt: new Date("2024-01-01"),
      status: "active",
      plan: "professional"
    });

    // Add some DEMO survey responses
    for (let i = 1; i <= 50; i++) {
      const demoResponse = this.generateDemoResponse(i, i % 2 === 0 ? 1 : 2, `test-${i}@example.com`);
      this.surveyResponses.set(demoResponse.id, demoResponse);
    }
  }

  private generateDemoResponse(id: number, companyId: number, email: string) {
    const traits = [
      { name: "Openness", score: Math.floor(Math.random() * 40) + 50, category: "personality" },
      { name: "Conscientiousness", score: Math.floor(Math.random() * 40) + 50, category: "personality" },
      { name: "Extraversion", score: Math.floor(Math.random() * 40) + 50, category: "personality" },
      { name: "Agreeableness", score: Math.floor(Math.random() * 40) + 50, category: "personality" },
      { name: "Neuroticism", score: Math.floor(Math.random() * 40) + 50, category: "personality" },
      { name: "Analytical Thinking", score: Math.floor(Math.random() * 40) + 50, category: "business" },
      { name: "Creativity", score: Math.floor(Math.random() * 40) + 50, category: "business" },
      { name: "Leadership", score: Math.floor(Math.random() * 40) + 50, category: "business" },
      { name: "Risk Tolerance", score: Math.floor(Math.random() * 40) + 50, category: "business" },
      { name: "Decision Making", score: Math.floor(Math.random() * 40) + 50, category: "business" }
    ];

    return {
      id,
      companyId,
      surveyId: companyId === 1 ? 1 : 2,
      email,
      traits,
      answers: [],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random date in last 90 days
      demographics: {
        age: Math.floor(Math.random() * 40) + 20,
        gender: ["Male", "Female", "Non-binary"][Math.floor(Math.random() * 3)],
        location: ["US", "UK", "Canada", "Australia", "Germany"][Math.floor(Math.random() * 5)],
        occupation: ["Manager", "Developer", "Designer", "Marketing", "Sales"][Math.floor(Math.random() * 5)],
        education: ["High School", "Bachelor's", "Master's", "PhD"][Math.floor(Math.random() * 4)],
        income: ["Under $50k", "$50k-$100k", "$100k-$150k", "Over $150k"][Math.floor(Math.random() * 4)]
      }
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(user => user.username === username);
    return user || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = this.currentId++;
    const user = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user as User);
    return user as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const deactivatedUser = { ...user, isActive: false, updatedAt: new Date() };
    this.users.set(id, deactivatedUser);
    return deactivatedUser;
  }

  async setPasswordResetToken(userId: number, token: string, expiryHours: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    
    const updatedUser = { 
      ...user, 
      passwordResetToken: token, 
      passwordResetTokenExpiry: expiryDate,
      updatedAt: new Date() 
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
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return true;
  }

  async setEmailVerificationToken(userId: number, token: string, _expiryHours: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      emailVerificationToken: token,
      updatedAt: new Date() 
    };
    this.users.set(userId, updatedUser);
    return true;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.emailVerificationToken === token);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      emailVerified: true,
      emailVerificationToken: null,
      updatedAt: new Date() 
    };
    this.users.set(user.id, updatedUser);
    return true;
  }

  async logUserActivity(userId: number, action: string, details: any, ipAddress?: string, userAgent?: string): Promise<void> {
    // Implementation for logging user activity - storing in memory for demo
    console.log(`User ${userId} performed action: ${action}`, { details, ipAddress, userAgent });
  }

  async getUserActivityLogs(_userId: number, _limit?: number): Promise<any[]> {
    // Return empty array for demo - in real implementation would query activity logs
    return [];
  }

  async createUserInvitation(email: string, role: string, companyId: number, invitedBy: number): Promise<any> {
    return {
      id: this.currentId++,
      email,
      role,
      companyId,
      invitedBy,
      token: `invitation-${Date.now()}`,
      createdAt: new Date(),
      status: 'pending'
    };
  }

  async getInvitationByToken(_token: string): Promise<any | undefined> {
    // Return undefined for demo - in real implementation would query invitations
    return undefined;
  }

  async acceptInvitation(_token: string, _userData: Partial<User>): Promise<User | undefined> {
    // Return undefined for demo - in real implementation would process invitation
    return undefined;
  }

  async getCompany(id: number): Promise<any> {
    return this.companies.get(id);
  }

  async getCompanyByApiKey(apiKey: string): Promise<any> {
    return Array.from(this.companies.values()).find(company => company.apiKey === apiKey);
  }

  async getSurveyResponse(id: number): Promise<any> {
    return this.surveyResponses.get(id);
  }

  async getSurveyResponsesByCompany(companyId: number): Promise<any[]> {
    return Array.from(this.surveyResponses.values()).filter(response => response.companyId === companyId);
  }

  async createSurveyResponse(responseData: any): Promise<any> {
    const id = responseData.id || (Math.max(...Array.from(this.surveyResponses.keys()), 0) + 1);
    const response = { ...responseData, id, createdAt: new Date() };
    this.surveyResponses.set(id, response);
    return response;
  }

  async getSurvey(id: number): Promise<any> {
    // Return undefined for demo - surveys would be stored in a separate map in real implementation
    return undefined;
  }

  async getClientById(id: number): Promise<any> {
    // Return undefined for demo - clients would be stored in a separate map in real implementation
    return undefined;
  }

  async getLicenseById(id: number): Promise<any> {
    // Return undefined for demo - licenses would be stored in a separate map in real implementation
    return undefined;
  }

  async getClientSurveyDeployments(): Promise<any[]> {
    // Return empty array for demo - deployments would be stored in a separate map in real implementation
    return [];
  }

  async getClientSurveyDeploymentsByClient(clientId: number): Promise<any[]> {
    // Return empty array for demo - would filter deployments by client ID in real implementation
    return [];
  }

  async getClientSurveyDeploymentsBySurvey(surveyId: number): Promise<any[]> {
    // Return empty array for demo - would filter deployments by survey ID in real implementation
    return [];
  }

  async getClientSurveyDeploymentById(id: number): Promise<any> {
    // Return undefined for demo - would retrieve specific deployment in real implementation
    return undefined;
  }

  async createClientSurveyDeployment(deploymentData: any): Promise<any> {
    // Return the deployment data with an ID for demo - would store in database in real implementation
    return { ...deploymentData, id: Date.now() };
  }

  async updateClientSurveyDeployment(id: number, data: any): Promise<any> {
    // Return updated deployment for demo - would update in database in real implementation
    return { ...data, id, updatedAt: new Date() };
  }

  async createAuditLog(logData: any): Promise<any> {
    // Return the log data with an ID for demo - would store in database in real implementation
    return { ...logData, id: Date.now(), createdAt: new Date() };
  }

  async getCollaborationSessions(): Promise<CollaborationSession[]> {
    return Array.from(this.collaborationSessions.values());
  }

  async getCollaborationSession(id: number): Promise<CollaborationSession | undefined> {
    return this.collaborationSessions.get(id);
  }

  async createCollaborationSession(sessionData: Omit<CollaborationSession, 'id' | 'createdAt'>): Promise<CollaborationSession> {
    const id = this.sessionId++;
    const session = { ...sessionData, id, createdAt: new Date() };
    this.collaborationSessions.set(id, session as CollaborationSession);
    this.collaborationParticipants.set(id, []);
    this.collaborationChanges.set(id, []);
    this.collaborationComments.set(id, []);
    return session as CollaborationSession;
  }

  async getCollaborationParticipants(sessionId: number): Promise<CollaborationParticipant[]> {
    return this.collaborationParticipants.get(sessionId) || [];
  }

  async getCollaborationParticipant(sessionId: number, userId: number): Promise<CollaborationParticipant | undefined> {
    const participants = this.collaborationParticipants.get(sessionId) || [];
    return participants.find(p => p.userId === userId);
  }

  async createCollaborationParticipant(participantData: Omit<CollaborationParticipant, 'id'>): Promise<CollaborationParticipant> {
    const id = this.participantId++;
    const participant = { ...participantData, id };
    const participants = this.collaborationParticipants.get(participantData.sessionId) || [];
    participants.push(participant as CollaborationParticipant);
    this.collaborationParticipants.set(participantData.sessionId, participants);
    return participant as CollaborationParticipant;
  }

  async updateCollaborationParticipant(
    sessionId: number,
    userId: number,
    data: Partial<Omit<CollaborationParticipant, 'id' | 'sessionId' | 'userId'>>
  ): Promise<CollaborationParticipant | undefined> {
    const participants = this.collaborationParticipants.get(sessionId) || [];
    const index = participants.findIndex(p => p.userId === userId);
    if (index >= 0) {
      participants[index] = { ...participants[index], ...data };
      this.collaborationParticipants.set(sessionId, participants);
      return participants[index];
    }
    return undefined;
  }

  async updateParticipantCursor(
    sessionId: number,
    userId: number,
    cursorPosition: { x: number, y: number }
  ): Promise<CollaborationParticipant | undefined> {
    return this.updateCollaborationParticipant(sessionId, userId, { cursorPosition });
  }

  async updateParticipantStatus(
    sessionId: number,
    userId: number,
    status: string
  ): Promise<CollaborationParticipant | undefined> {
    return this.updateCollaborationParticipant(sessionId, userId, { status });
  }

  async getCollaborationChanges(sessionId: number): Promise<CollaborationChange[]> {
    return this.collaborationChanges.get(sessionId) || [];
  }

  async getCollaborationChangesByEntity(
    sessionId: number,
    entityType: string,
    entityId: number
  ): Promise<CollaborationChange[]> {
    const changes = this.collaborationChanges.get(sessionId) || [];
    return changes.filter(c => c.entityType === entityType && c.entityId === entityId);
  }

  async createCollaborationChange(changeData: Omit<CollaborationChange, 'id' | 'timestamp'>): Promise<CollaborationChange> {
    const id = this.changeId++;
    const change = { ...changeData, id, timestamp: new Date() };
    const changes = this.collaborationChanges.get(changeData.sessionId) || [];
    changes.push(change as CollaborationChange);
    this.collaborationChanges.set(changeData.sessionId, changes);
    return change as CollaborationChange;
  }

  async getCollaborationComments(sessionId: number): Promise<CollaborationComment[]> {
    return this.collaborationComments.get(sessionId) || [];
  }

  async createCollaborationComment(commentData: Omit<CollaborationComment, 'id' | 'createdAt'>): Promise<CollaborationComment> {
    const id = this.commentId++;
    const comment = { ...commentData, id, createdAt: new Date() };
    const comments = this.collaborationComments.get(commentData.sessionId) || [];
    comments.push(comment as CollaborationComment);
    this.collaborationComments.set(commentData.sessionId, comments);
    return comment as CollaborationComment;
  }

  async updateCollaborationComment(
    id: string,
    data: Partial<Omit<CollaborationComment, 'id' | 'sessionId' | 'userId'>>
  ): Promise<CollaborationComment | undefined> {
    try {
      const numId = parseInt(id);
      // We'd have to iterate through all session comments to find this one
      for (const [sessionId, comments] of this.collaborationComments.entries()) {
        const index = comments.findIndex(c => c.id === numId);
        if (index >= 0) {
          comments[index] = { ...comments[index], ...data, updatedAt: new Date() };
          this.collaborationComments.set(sessionId, comments);
          return comments[index];
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error updating collaboration comment:', error);
      throw error;
    }
  }
  
  private getDemoCompanyStats(companyId: number): any {
    // Create complete hardcoded demo data for demo@personalysispro.com
    // This follows exactly the same template/design as original client accounts
    // Adding activities array to fix "Cannot read properties of undefined (reading 'map')" error
    
    return {
      companyId: companyId,
      totalResponses: 523,
      responseCount: 523,
      completionRate: 92,
      averageCompletionTime: 240,
      completedResponses: 480,
      averageSatisfactionScore: 8.7,
      responseRateChange: 15.4,
      
      // Trait data for chart components with consistent structure and categories
      topTraits: [
        { name: "Openness", score: 72, category: "personality" },
        { name: "Conscientiousness", score: 68, category: "personality" },
        { name: "Agreeableness", score: 64, category: "personality" },
        { name: "Enthusiasm", score: 73, category: "business" },
        { name: "Analytical Thinking", score: 74, category: "business" },
        { name: "Creative Thinking", score: 68, category: "business" },
        { name: "Adaptability", score: 62, category: "business" }
      ],
      
      // Demographics data structured to work with demographics charts
      demographics: {
        age: {
          "18-24": 84,
          "25-34": 156,
          "35-44": 120,
          "45-54": 87,
          "55-64": 53,
          "65+": 22
        },
        gender: {
          "Male": 267,
          "Female": 243,
          "Non-binary": 12
        },
        genderDistribution: [
          { label: "Male", value: 267, percentage: 51 },
          { label: "Female", value: 243, percentage: 47 },
          { label: "Non-binary", value: 12, percentage: 2 }
        ],
        ageDistribution: [
          { range: "18-24", percentage: 16 },
          { range: "25-34", percentage: 30 },
          { range: "35-44", percentage: 23 },
          { range: "45-54", percentage: 17 },
          { range: "55-64", percentage: 10 },
          { range: "65+", percentage: 4 }
        ],
        ageGroups: { 
          "18-24": 84,
          "25-34": 156,
          "35-44": 120,
          "45-54": 87,
          "55-64": 53,
          "65+": 22
        },
        locationDistribution: [
          { location: "United States", count: 220 },
          { location: "United Kingdom", count: 95 },
          { location: "Canada", count: 78 },
          { location: "Australia", count: 65 },
          { location: "Germany", count: 45 }
        ],
        educationDistribution: [
          { label: "High School", value: 67, percentage: 13 },
          { label: "Bachelor's", value: 258, percentage: 49 },
          { label: "Master's", value: 156, percentage: 30 },
          { label: "PhD", value: 42, percentage: 8 }
        ],
        incomeDistribution: [
          { label: "Under $50k", value: 98, percentage: 19 },
          { label: "$50k-$100k", value: 245, percentage: 47 },
          { label: "$100k-$150k", value: 132, percentage: 25 },
          { label: "Over $150k", value: 48, percentage: 9 }
        ]
      },
      
      // Engagement metrics including activities array which was missing
      engagementMetrics: {
        dailyActiveUsers: 145,
        monthlyActiveUsers: 2230,
        averageSessionLength: 7.8,
        questionsPerMinute: 1.6,
        bounceRate: 22,
        retentionRate: 78,
        completionByDevice: [
          { device: "Desktop", percentage: 58 },
          { device: "Mobile", percentage: 36 },
          { device: "Tablet", percentage: 6 }
        ],
        deviceUsage: [
          { name: "Desktop", percentage: 58 },
          { name: "Mobile", percentage: 36 },
          { name: "Tablet", percentage: 6 }
        ],
        dropOffPoints: [
          { questionNumber: 5, dropOffRate: 8 },
          { questionNumber: 10, dropOffRate: 12 },
          { questionNumber: 15, dropOffRate: 18 }
        ],
        peakEngagementTimes: [
          { time: "9am-12pm", percentage: 28 },
          { time: "1pm-4pm", percentage: 35 },
          { time: "6pm-9pm", percentage: 25 },
          { time: "Other", percentage: 12 }
        ],
        peakUsageTimes: [
          { time: "Morning", percentage: 28 },
          { time: "Afternoon", percentage: 42 },
          { time: "Evening", percentage: 25 },
          { time: "Night", percentage: 5 }
        ],
        userGrowth: [
          { month: "Jan", users: 1450 },
          { month: "Feb", users: 1680 },
          { month: "Mar", users: 1920 },
          { month: "Apr", users: 2230 }
        ],
        activities: [
          { name: "Survey Completion", count: 184, trend: "up" },
          { name: "Account Creation", count: 76, trend: "up" },
          { name: "Result Sharing", count: 42, trend: "neutral" },
          { name: "Team Invites", count: 38, trend: "up" },
          { name: "Report Downloads", count: 29, trend: "down" }
        ]
      },
      
      // Business context data properly structured
      businessContext: {
        industries: [
          { industry: "Technology", percentage: 42, growth: 15.2 },
          { industry: "Finance", percentage: 28, growth: 9.5 },
          { industry: "Healthcare", percentage: 15, growth: 12.8 },
          { industry: "Education", percentage: 10, growth: 6.4 },
          { industry: "Other", percentage: 5, growth: 8.3 }
        ],
        companySizes: [
          { companySize: "1-50 employees", percentage: 25, budget: "Low to Medium" },
          { companySize: "51-200 employees", percentage: 35, budget: "Medium" },
          { companySize: "201-1000 employees", percentage: 25, budget: "Medium to High" },
          { companySize: "1000+ employees", percentage: 15, budget: "High" }
        ],
        departments: [
          { department: "Management", percentage: 30, influence: 75 },
          { department: "Sales", percentage: 20, influence: 65 },
          { department: "Marketing", percentage: 15, influence: 60 },
          { department: "Product", percentage: 15, influence: 55 },
          { department: "Engineering", percentage: 10, influence: 50 },
          { department: "Other", percentage: 10, influence: 35 }
        ],
        roles: [
          { role: "Executive", percentage: 15, influence: 85 },
          { role: "Middle Management", percentage: 35, influence: 65 },
          { role: "Team Lead", percentage: 25, influence: 45 },
          { role: "Individual Contributor", percentage: 25, influence: 20 }
        ],
        decisionStyles: [
          { style: "Data-driven", percentage: 45, description: "Relies on quantitative analysis and metrics" },
          { style: "Intuitive", percentage: 25, description: "Trusts gut feeling and experience" },
          { style: "Collaborative", percentage: 20, description: "Seeks input from multiple stakeholders" },
          { style: "Authoritative", percentage: 10, description: "Makes decisive calls with limited consultation" }
        ],
        // New Decision Timeframes section
        decisionTimeframes: [
          { timeframe: "Immediate", percentage: 15, count: 78 },
          { timeframe: "1-3 months", percentage: 35, count: 183 },
          { timeframe: "3-6 months", percentage: 25, count: 131 },
          { timeframe: "6-12 months", percentage: 15, count: 78 },
          { timeframe: "1+ year", percentage: 5, count: 26 },
          { timeframe: "No timeline", percentage: 5, count: 27 }
        ],
        // New Growth Stages section
        growthStages: [
          { stage: "Startup", percentage: 20, count: 104 },
          { stage: "Early growth", percentage: 30, count: 157 },
          { stage: "Expansion", percentage: 35, count: 183 },
          { stage: "Mature", percentage: 10, count: 53 },
          { stage: "Renewal/Decline", percentage: 5, count: 26 }
        ],
        // New Learning Preferences section
        learningPreferences: [
          { preference: "Video tutorials", percentage: 32, count: 167 },
          { preference: "Hands-on practice", percentage: 28, count: 146 },
          { preference: "Written documentation", percentage: 18, count: 94 },
          { preference: "Interactive workshops", percentage: 15, count: 78 },
          { preference: "One-on-one coaching", percentage: 7, count: 38 }
        ],
        // New Skills section
        skills: [
          { skill: "Strategic planning", percentage: 75, count: 392 },
          { skill: "Leadership", percentage: 68, count: 356 },
          { skill: "Communication", percentage: 62, count: 324 },
          { skill: "Analytical thinking", percentage: 58, count: 303 },
          { skill: "Problem solving", percentage: 52, count: 272 },
          { skill: "Technical expertise", percentage: 45, count: 235 }
        ],
        // New Challenges section
        challenges: [
          { challenge: "Finding qualified talent", percentage: 42, count: 220 },
          { challenge: "Market competition", percentage: 38, count: 199 },
          { challenge: "Technology adoption", percentage: 32, count: 167 },
          { challenge: "Customer acquisition", percentage: 28, count: 146 },
          { challenge: "Operational efficiency", percentage: 25, count: 131 },
          { challenge: "Regulatory compliance", percentage: 22, count: 115 },
          { challenge: "Digital transformation", percentage: 18, count: 94 },
          { challenge: "Supply chain management", percentage: 15, count: 78 },
          { challenge: "Financial management", percentage: 12, count: 63 }
        ]
      },
      
      // Gender stereotype data with male/female traits
      genderStereotypes: {
        femaleAssociated: [
          { trait: "Emotional", score: 72, description: "Ability to understand and process emotions" },
          { trait: "Nurturing", score: 68, description: "Tendency to care for and support others" },
          { trait: "Empathetic", score: 65, description: "Ability to share and understand feelings of others" },
          { trait: "Collaborative", score: 58, description: "Preference for working together" },
          { trait: "Communicative", score: 56, description: "Open and expressive in sharing information" }
        ],
        maleAssociated: [
          { trait: "Assertive", score: 74, description: "Confidently expressing opinions and needs" },
          { trait: "Analytical", score: 70, description: "Methodical problem-solving approach" },
          { trait: "Competitive", score: 67, description: "Driven to outperform others" },
          { trait: "Independent", score: 64, description: "Self-reliant decision making" },
          { trait: "Confident", score: 62, description: "Strong belief in one's abilities" }
        ],
        neutralAssociated: [
          { trait: "Adaptability", score: 68, description: "Ability to adjust to new conditions" },
          { trait: "Creativity", score: 65, description: "Generating innovative ideas" },
          { trait: "Curiosity", score: 63, description: "Desire to learn and explore" },
          { trait: "Ambition", score: 62, description: "Strong desire to achieve goals" },
          { trait: "Resilience", score: 60, description: "Ability to recover from difficulties" }
        ]
      },
      
      // Market segments data
      marketSegments: [
        { segment: "Enterprise Innovators", percentage: 35, growth: 12.5, averageValue: 8750 },
        { segment: "Growth-Stage Businesses", percentage: 25, growth: 15.2, averageValue: 6200 },
        { segment: "Small Business Owners", percentage: 22, growth: 8.7, averageValue: 3800 },
        { segment: "Startups", percentage: 18, growth: 22.3, averageValue: 4500 }
      ],
      
      // User segments data
      userSegments: [
        { segment: "Power Users", percentage: 22, engagementScore: 9.2, retentionRate: 95 },
        { segment: "Regular Users", percentage: 45, engagementScore: 7.4, retentionRate: 82 },
        { segment: "Occasional Users", percentage: 28, engagementScore: 4.8, retentionRate: 63 },
        { segment: "At-Risk Users", percentage: 5, engagementScore: 2.1, retentionRate: 35 }
      ],
      
      // Monthly growth data
      monthlyGrowth: {
        previousMonth: 3450,
        currentMonth: 3850,
        growthRate: 11.6,
        projectedNext: 4250
      },
      
      // Product recommendation data
      productRecommendations: {
        categories: {
          "Enterprise Solutions": 38,
          "Growth Tools": 32,
          "Productivity Software": 18,
          "Communication Tools": 12
        },
        topProducts: [
          {
            name: "Enterprise Suite Pro",
            category: "Enterprise Solutions",
            confidence: 92,
            description: "All-in-one solution for large organizations with advanced analytics and team collaboration features",
            attributes: ["Advanced Analytics", "Team Collaboration", "API Access", "Enterprise-grade Security"]
          },
          {
            name: "Growth Accelerator",
            category: "Growth Tools",
            confidence: 87,
            description: "Perfect for mid-size companies looking to scale operations and improve performance",
            attributes: ["Performance Tracking", "Basic Analytics", "Multi-user Access", "CRM Integration"]
          },
          {
            name: "Startup Essentials",
            category: "Productivity Software",
            confidence: 78,
            description: "Affordable solution for small businesses and startups with essential functionality",
            attributes: ["Core Features", "Single-user License", "Email Support", "Easy Onboarding"]
          }
        ]
      },
      
      // Advanced analytics section data
      advancedAnalytics: {
        // Personality correlation with purchase behavior
        personalityPurchaseCorrelation: [
          { trait: "Openness", purchaseFrequency: 7.8, averageOrderValue: 950, featureUsage: 8.5 },
          { trait: "Conscientiousness", purchaseFrequency: 6.9, averageOrderValue: 780, featureUsage: 9.2 },
          { trait: "Extraversion", purchaseFrequency: 8.2, averageOrderValue: 840, featureUsage: 7.4 },
          { trait: "Agreeableness", purchaseFrequency: 6.5, averageOrderValue: 720, featureUsage: 6.8 },
          { trait: "Neuroticism", purchaseFrequency: 5.4, averageOrderValue: 620, featureUsage: 5.9 }
        ],
        
        // Decision-making styles and their business impact
        decisionMakingStyles: [
          { style: "Analytical", percentage: 42, successRate: 78, implementationTime: 1.2 },
          { style: "Intuitive", percentage: 28, successRate: 62, implementationTime: 0.7 },
          { style: "Collaborative", percentage: 18, successRate: 71, implementationTime: 1.5 },
          { style: "Directive", percentage: 12, successRate: 65, implementationTime: 0.9 }
        ],
        
        // Trait-based team composition effectiveness
        teamComposition: [
          { composition: "Diverse Traits", effectiveness: 8.7, innovationScore: 9.2, executionSpeed: 7.8 },
          { composition: "Similar Traits", effectiveness: 6.5, innovationScore: 5.8, executionSpeed: 8.9 },
          { composition: "Complementary Traits", effectiveness: 9.1, innovationScore: 8.7, executionSpeed: 8.5 }
        ],
        
        // Predictive behavior models
        predictiveBehaviors: [
          { scenario: "Feature Adoption", accuracy: 82, leadingIndicators: ["Openness", "Tech Savviness"] },
          { scenario: "Churn Risk", accuracy: 76, leadingIndicators: ["Engagement Level", "Support Requests"] },
          { scenario: "Upsell Potential", accuracy: 68, leadingIndicators: ["Usage Patterns", "Decision Style"] }
        ]
      }
    };
  }

  async getCompanyStats(companyId: number): Promise<any> {
    console.log(`[DEBUG] getCompanyStats called with companyId: ${companyId}`);

    // Handle any company ID dynamically - generate demo data for development/testing
    // In production, this would query real company data from the database
    if (companyId && companyId > 0) {
      console.log(`[DEBUG] Generating demo company stats for company ID ${companyId}`);

      // Get the survey responses to include in the analytics format
      const responses = await this.getSurveyResponsesByCompany(companyId);
      console.log(`[DEBUG] Found ${responses?.length || 0} responses for company account`);

      console.log(`[DEBUG] Returning comprehensive demo analytics for company ID ${companyId}`);
      return this.getDemoCompanyStats(companyId);
    }

    // For non-demo accounts, calculate stats from actual data
    const responses = await this.getSurveyResponsesByCompany(companyId);
    if (!responses || responses.length === 0) {
      return {
        companyId,
        totalResponses: 0,
        responseCount: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        completedResponses: 0
      };
    }

    // Here we'd analyze the responses to generate statistics
    const traitCounts: Record<string, { total: number, count: number, category: string }> = {};
    const traitsByCategory: Record<string, Array<{ name: string, score: number }>> = {
      personality: [],
      business: []
    };

    responses.forEach(response => {
      console.log(`[DEBUG] Processing response with ${response.traits.length} traits`);
      response.traits.forEach((trait: PersonalityTrait) => {
        // Use the correct property name from the PersonalityTrait interface
        const traitName = (trait as any).name || (trait as any).trait || 'Unknown';
        const traitCategory = 'personality'; // Default category
        
        console.log(`[DEBUG] Processing trait: ${traitName} with score: ${trait.score}`);
        
        if (!traitCounts[traitName]) {
          traitCounts[traitName] = { total: 0, count: 0, category: traitCategory };
        }
        traitCounts[traitName].total += trait.score;
        traitCounts[traitName].count += 1;
      });
    });

    // Calculate average scores for each trait
    Object.entries(traitCounts).forEach(([name, { total, count, category }]) => {
      const avgScore = Math.round(total / count);
      if (traitsByCategory[category]) {
        traitsByCategory[category].push({ name, score: avgScore });
      }
    });

    // Sort traits by score in each category and take top ones
    const topTraits = [
      ...traitsByCategory.personality.sort((a, b) => b.score - a.score).slice(0, 10).map(t => ({ ...t, category: 'personality' })),
      ...traitsByCategory.business.sort((a, b) => b.score - a.score).slice(0, 10).map(t => ({ ...t, category: 'business' }))
    ];

    console.log(`[DEBUG] Generated topTraits:`, topTraits);
    console.log(`[DEBUG] Total trait counts:`, Object.keys(traitCounts).length);

    return {
      companyId,
      totalResponses: responses.length,
      responseCount: responses.length,
      completionRate: Math.round((responses.filter(r => r.completedAt).length / responses.length) * 100),
      averageCompletionTime: Math.round(responses.reduce((acc, r) => acc + (r.completionTime || 0), 0) / responses.length),
      completedResponses: responses.filter(r => r.completedAt).length,
      topTraits,
      personalityTraits: topTraits // Add this for backward compatibility
    };
  }

  async getSurveyAnalytics(surveyId: number): Promise<any> {
    // For simplicity, we're just returning demo data for this example
    // In a real implementation, this would analyze the survey responses
    
    // For demo purposes, treat any surveyId as returning standardized data
    // This ensures consistent visualization in the frontend
    
    const traitData = {
      openness: {
        average: 68,
        distribution: [
          { range: "0-19", label: "Very Low", count: 5 },
          { range: "20-39", label: "Low", count: 32 },
          { range: "40-59", label: "Average", count: 167 },
          { range: "60-79", label: "High", count: 216 },
          { range: "80-100", label: "Very High", count: 103 }
        ]
      },
      conscientiousness: {
        average: 72,
        distribution: [
          { range: "0-19", label: "Very Low", count: 8 },
          { range: "20-39", label: "Low", count: 41 },
          { range: "40-59", label: "Average", count: 132 },
          { range: "60-79", label: "High", count: 237 },
          { range: "80-100", label: "Very High", count: 105 }
        ]
      },
      extraversion: {
        average: 61,
        distribution: [
          { range: "0-19", label: "Very Low", count: 23 },
          { range: "20-39", label: "Low", count: 78 },
          { range: "40-59", label: "Average", count: 187 },
          { range: "60-79", label: "High", count: 158 },
          { range: "80-100", label: "Very High", count: 77 }
        ]
      },
      agreeableness: {
        average: 66,
        distribution: [
          { range: "0-19", label: "Very Low", count: 12 },
          { range: "20-39", label: "Low", count: 54 },
          { range: "40-59", label: "Average", count: 176 },
          { range: "60-79", label: "High", count: 205 },
          { range: "80-100", label: "Very High", count: 76 }
        ]
      },
      neuroticism: {
        average: 48,
        distribution: [
          { range: "0-19", label: "Very Low", count: 56 },
          { range: "20-39", label: "Low", count: 134 },
          { range: "40-59", label: "Average", count: 201 },
          { range: "60-79", label: "High", count: 97 },
          { range: "80-100", label: "Very High", count: 35 }
        ]
      }
    };
    
    const responses = Array.from(this.surveyResponses.values()).filter(response => response.surveyId === surveyId);
    
    // If no real responses, use demo data
    if (responses.length === 0) {
      return {
        surveyId,
        responseCount: 523,
        completionRate: 92,
        averageCompletionTime: 240,
        completedResponses: 480,
        traitData,
        averageTraits: [
          { name: "Openness", score: 68, category: "personality" },
          { name: "Conscientiousness", score: 72, category: "personality" },
          { name: "Extraversion", score: 61, category: "personality" },
          { name: "Agreeableness", score: 66, category: "personality" },
          { name: "Neuroticism", score: 48, category: "personality" },
          { name: "Analytical Thinking", score: 74, category: "business" },
          { name: "Creativity", score: 70, category: "business" },
          { name: "Leadership", score: 65, category: "business" },
          { name: "Risk Tolerance", score: 58, category: "business" },
          { name: "Decision Making", score: 69, category: "business" }
        ]
      };
    }
    
    // Calculate real analytics from responses
    const traitCounts: Record<string, { total: number, count: number, category: string }> = {};
    
    responses.forEach(response => {
      if (response.traits) {
        response.traits.forEach((trait: PersonalityTrait) => {
          if (!traitCounts[trait.name]) {
            traitCounts[trait.name] = { total: 0, count: 0, category: trait.category };
          }
          traitCounts[trait.name].total += trait.score;
          traitCounts[trait.name].count += 1;
        });
      }
    });
    
    const averageTraits = Object.entries(traitCounts).map(([name, { total, count, category }]) => ({
      name,
      score: Math.round(total / count),
      category
    }));
    
    return {
      surveyId,
      responseCount: responses.length,
      completionRate: Math.round((responses.filter(r => r.completedAt).length / responses.length) * 100),
      averageCompletionTime: Math.round(responses.reduce((acc, r) => acc + (r.completionTime || 0), 0) / responses.length),
      completedResponses: responses.filter(r => r.completedAt).length,
      traitData,
      averageTraits
    };
  }

  async getCompetitorAnalysis(companyId: number): Promise<CompetitorAnalysis[]> {
    // Demo data for competitor analysis - handle any company ID dynamically
    if (companyId && companyId > 0) {
      // Demo data
      return [
        {
          name: "TechInsight Inc.",
          marketShare: 32.5,
          strengthScore: 8.7,
          weaknessScore: 6.2,
          overallThreatLevel: 8.1,
          primaryCompetitiveAdvantage: "Advanced AI analytics integration",
          keyWeakness: "Higher pricing structure",
          customerSentiment: 7.8,
          pricingPosition: "Premium",
          strengths: [
            "Advanced AI capabilities",
            "Strong enterprise support",
            "Robust security features",
            "Extensive API ecosystem"
          ],
          weaknesses: [
            "Expensive pricing",
            "Complex user interface",
            "Steep learning curve",
            "Limited flexibility"
          ],
          productFeatureComparison: {
            "User Interface": { competitor: 9, our: 8 },
            "Data Security": { competitor: 9, our: 9 },
            "Integration Capabilities": { competitor: 7, our: 9 },
            "Reporting Depth": { competitor: 9, our: 8 },
            "Customization": { competitor: 6, our: 9 }
          }
        },
        {
          name: "DataPulse Analytics",
          marketShare: 24.8,
          strengthScore: 8.3,
          weaknessScore: 7.1,
          overallThreatLevel: 7.5,
          primaryCompetitiveAdvantage: "Extensive third-party integrations",
          keyWeakness: "Limited customization options",
          customerSentiment: 8.2,
          pricingPosition: "Mid-range",
          strengths: [
            "Excellent third-party integrations",
            "Modern user interface",
            "Competitive pricing",
            "Good customer support"
          ],
          weaknesses: [
            "Limited customization",
            "Fewer advanced features",
            "Occasional performance issues",
            "Less robust security"
          ],
          productFeatureComparison: {
            "User Interface": { competitor: 8, our: 8 },
            "Data Security": { competitor: 8, our: 9 },
            "Integration Capabilities": { competitor: 9, our: 9 },
            "Reporting Depth": { competitor: 8, our: 8 },
            "Customization": { competitor: 5, our: 9 }
          }
        },
        {
          name: "MindMap Solutions",
          marketShare: 18.2,
          strengthScore: 7.5,
          weaknessScore: 6.8,
          overallThreatLevel: 6.8,
          primaryCompetitiveAdvantage: "Specialized industry templates",
          keyWeakness: "Slower update cycle",
          customerSentiment: 7.5,
          pricingPosition: "Value",
          strengths: [
            "Industry-specific solutions",
            "Strong reporting capabilities",
            "Simplified user experience",
            "Affordable pricing structure"
          ],
          weaknesses: [
            "Slow feature releases",
            "Limited advanced functionality",
            "Poor API documentation",
            "Basic integration options"
          ],
          productFeatureComparison: {
            "User Interface": { competitor: 7, our: 8 },
            "Data Security": { competitor: 7, our: 9 },
            "Integration Capabilities": { competitor: 6, our: 9 },
            "Reporting Depth": { competitor: 8, our: 8 },
            "Customization": { competitor: 7, our: 9 }
          }
        },
        {
          name: "CoreProfile",
          marketShare: 12.5,
          strengthScore: 6.9,
          weaknessScore: 5.2,
          overallThreatLevel: 5.7,
          primaryCompetitiveAdvantage: "Low pricing structure",
          keyWeakness: "Limited advanced features",
          customerSentiment: 6.8,
          pricingPosition: "Budget",
          strengths: [
            "Very competitive pricing",
            "Simple setup process",
            "Fast implementation time",
            "Good basic functionality"
          ],
          weaknesses: [
            "Lacks advanced features",
            "Poor scalability",
            "Minimal support options",
            "Limited customization"
          ],
          productFeatureComparison: {
            "User Interface": { competitor: 6, our: 8 },
            "Data Security": { competitor: 7, our: 9 },
            "Integration Capabilities": { competitor: 5, our: 9 },
            "Reporting Depth": { competitor: 6, our: 8 },
            "Customization": { competitor: 5, our: 9 }
          }
        }
      ];
    }
    
    // In a real implementation, analyze company's market segment to generate competitor data
    return [];
  }



  async getMarketFitAnalysis(companyId: number, productId: string): Promise<any> {
    // Demo data for market fit analysis - handle any company ID dynamically
    if (companyId && companyId > 0) {
      // Create demo market fit analysis
      const responses = await this.getSurveyResponsesByCompany(companyId);
      let overallSentiment = 0;
      let problemSolutionFit = 0;
      let marketFit = 0;
      
      // Analyze responses to gather insights
      if (responses.length > 0) {
        // Dummy analysis based on traits
        let creativitySum = 0;
        let creativityCount = 0;
        let analyticSum = 0;
        let analyticCount = 0;
        
        responses.forEach(response => {
          response.traits.forEach((trait: PersonalityTrait) => {
            if (trait.name === "Creativity" || trait.name === "Creative Thinking") {
              creativitySum += trait.score;
              creativityCount++;
            }
            if (trait.name === "Analytical Thinking") {
              analyticSum += trait.score;
              analyticCount++;
            }
          });
        });
        
        // Calculate metrics based on personality traits
        const avgCreativity = creativityCount > 0 ? creativitySum / creativityCount : 65;
        const avgAnalytic = analyticCount > 0 ? analyticSum / analyticCount : 70;
        
        // Generate metrics based on these averages
        overallSentiment = (avgCreativity * 0.4 + avgAnalytic * 0.6) / 10;
        problemSolutionFit = (avgAnalytic * 0.7 + avgCreativity * 0.3) / 10;
        marketFit = (avgCreativity * 0.5 + avgAnalytic * 0.5) / 10;
      } else {
        // Default values if no responses
        overallSentiment = 7.8;
        problemSolutionFit = 8.2;
        marketFit = 7.6;
      }
      
      return {
        productId,
        overallFitScore: ((overallSentiment + problemSolutionFit + marketFit) / 3).toFixed(1),
        problemSolutionFit: problemSolutionFit.toFixed(1),
        productMarketFit: marketFit.toFixed(1),
        marketSizePotential: {
          total: 875000000,
          addressable: 143000000,
          serviceable: 32000000
        },
        customerNeedAlignment: 8.4,
        valuePropositionClarity: 7.9,
        priceToValuePerception: 7.2,
        productDifferentiation: 8.3,
        competitiveAdvantage: [
          "Personalized user experience",
          "Advanced analytics integration",
          "Cross-platform compatibility",
          "Real-time data processing"
        ],
        marketChallenges: [
          "High customer acquisition costs",
          "Increasing market saturation",
          "Complex regulatory environment",
          "Rapid technological evolution"
        ],
        customerPainPoints: [
          {
            painPoint: "Time-consuming data analysis",
            severity: 8.5,
            frequency: 9.2,
            addressedByProduct: 8.7
          },
          {
            painPoint: "Difficulty integrating systems",
            severity: 8.2,
            frequency: 7.8,
            addressedByProduct: 8.9
          },
          {
            painPoint: "Limited user customization",
            severity: 7.6,
            frequency: 8.4,
            addressedByProduct: 9.1
          },
          {
            painPoint: "Inadequate reporting capabilities",
            severity: 8.3,
            frequency: 7.9,
            addressedByProduct: 8.5
          }
        ],
        recommendations: [
          "Enhance onboarding process to improve time-to-value",
          "Develop industry-specific templates to target key verticals",
          "Expand integration capabilities with popular third-party tools",
          "Implement tiered pricing structure to capture cost-sensitive segments"
        ]
      };
    }
    
    // For a real implementation, analyze the company's product-market fit
    return {};
  }

  async getCustomerSegments(companyId: number): Promise<any> {
    // Demo data for customer segments - handle any company ID dynamically
    if (companyId && companyId > 0) {
      const responses = await this.getSurveyResponsesByCompany(companyId);
      
      // Default segments if no real data
      const segments = [
        {
          name: "Enterprise Innovators",
          size: 42500,
          percentageOfCustomers: 28,
          growthRate: 18.5,
          dominantTraits: [
            { name: "Openness", score: 78, category: "personality" },
            { name: "Analytical Thinking", score: 83, category: "business" },
            { name: "Risk Tolerance", score: 72, category: "business" }
          ],
          keyDemographics: {
            ageGroups: { "25-34": 15, "35-44": 42, "45-54": 31, "55-64": 12 },
            genderDistribution: { "Male": 62, "Female": 35, "Non-binary": 3 },
            incomeRange: { "Under $50k": 5, "$50k-$100k": 22, "$100k-$150k": 45, "Over $150k": 28 },
            education: { "High School": 2, "Bachelor's": 41, "Master's": 46, "PhD": 11 },
            location: { "United States": 48, "Europe": 26, "Asia": 18, "Other": 8 }
          },
          demographicSummary: {
            topInterests: ["Technology", "Innovation", "Digital Transformation", "AI/ML"],
            dominantGender: "Male",
            averageIncome: "$125,000",
            averageAge: 42,
            loyaltyScore: 8.7
          },
          purchasingBehaviors: [
            "Data-driven decision making",
            "Seeks comprehensive features",
            "Values integration capabilities",
            "Prioritizes scalability"
          ],
          productPreferences: [
            "Advanced analytics",
            "Enterprise-grade security",
            "API access",
            "Custom deployment options"
          ],
          communicationChannels: {
            "Email": 35,
            "LinkedIn": 28,
            "Industry Events": 22,
            "Direct Sales": 15
          },
          customerLifetimeValue: 135000,
          acquisitionCost: 12500,
          targetFit: 9.2
        },
        {
          name: "Growth-Stage Businesses",
          size: 67800,
          percentageOfCustomers: 45,
          growthRate: 23.7,
          dominantTraits: [
            { name: "Conscientiousness", score: 74, category: "personality" },
            { name: "Leadership", score: 76, category: "business" },
            { name: "Adaptability", score: 81, category: "business" }
          ],
          keyDemographics: {
            ageGroups: { "18-24": 8, "25-34": 37, "35-44": 42, "45-54": 13 },
            genderDistribution: { "Male": 58, "Female": 40, "Non-binary": 2 },
            incomeRange: { "Under $50k": 8, "$50k-$100k": 35, "$100k-$150k": 42, "Over $150k": 15 },
            education: { "High School": 5, "Bachelor's": 58, "Master's": 33, "PhD": 4 },
            location: { "United States": 52, "Europe": 23, "Asia": 17, "Other": 8 }
          },
          demographicSummary: {
            topInterests: ["Marketing", "Growth Hacking", "SaaS", "Scaling"],
            dominantGender: "Balanced",
            averageIncome: "$95,000",
            averageAge: 36,
            loyaltyScore: 7.9
          },
          purchasingBehaviors: [
            "Cost-conscious but value-focused",
            "Seeks ease of implementation",
            "Values quick ROI",
            "Prefers subscription models"
          ],
          productPreferences: [
            "User-friendly interface",
            "Onboarding support",
            "Scalable pricing",
            "Mobile access"
          ],
          communicationChannels: {
            "Email": 42,
            "Social Media": 25,
            "Content Marketing": 18,
            "Webinars": 15
          },
          customerLifetimeValue: 65000,
          acquisitionCost: 5200,
          targetFit: 8.7
        },
        {
          name: "Small Business Owners",
          size: 40700,
          percentageOfCustomers: 27,
          growthRate: 15.4,
          dominantTraits: [
            { name: "Extraversion", score: 68, category: "personality" },
            { name: "Decision Making", score: 75, category: "business" },
            { name: "Creativity", score: 73, category: "business" }
          ],
          keyDemographics: {
            ageGroups: { "18-24": 5, "25-34": 28, "35-44": 41, "45-54": 18, "55-64": 8 },
            genderDistribution: { "Male": 54, "Female": 45, "Non-binary": 1 },
            incomeRange: { "Under $50k": 18, "$50k-$100k": 42, "$100k-$150k": 32, "Over $150k": 8 },
            education: { "High School": 12, "Bachelor's": 62, "Master's": 24, "PhD": 2 },
            location: { "United States": 58, "Europe": 20, "Asia": 12, "Other": 10 }
          },
          demographicSummary: {
            topInterests: ["Entrepreneurship", "Small Business", "Local Marketing", "Operations"],
            dominantGender: "Balanced",
            averageIncome: "$75,000",
            averageAge: 41,
            loyaltyScore: 8.4
          },
          purchasingBehaviors: [
            "Price-sensitive",
            "Prefers all-in-one solutions",
            "Values simplicity",
            "Researches extensively before purchase"
          ],
          productPreferences: [
            "Easy setup",
            "Templates and presets",
            "Affordable pricing tiers",
            "Responsive support"
          ],
          communicationChannels: {
            "Email": 38,
            "Social Media": 32,
            "Word of Mouth": 18,
            "Online Reviews": 12
          },
          customerLifetimeValue: 32000,
          acquisitionCost: 3800,
          targetFit: 7.9
        }
      ];
      
      // If we have real data, enhance the segments
      if (responses.length > 0) {
        // Analyze real responses to enhance segments
        // This is a simplified example - in a real implementation, you'd
        // use clustering algorithms to identify and refine segments
        let creativitySum = 0;
        let creativityCount = 0;
        let leadershipSum = 0;
        let leadershipCount = 0;
        
        responses.forEach(response => {
          if (response.traits) {
            response.traits.forEach((trait: PersonalityTrait) => {
              if (trait.name === "Creativity" || trait.name === "Creative Thinking") {
                creativitySum += trait.score;
                creativityCount++;
              }
              if (trait.name === "Leadership") {
                leadershipSum += trait.score;
                leadershipCount++;
              }
            });
          }
        });
        
        // Adjust segments based on real data insights
        if (creativityCount > 0) {
          const avgCreativity = creativitySum / creativityCount;
          // Adjust target fit based on creativity scores
          segments.forEach(segment => {
            if (segment.name === "Enterprise Innovators") {
              segment.targetFit = Math.min(10, segment.targetFit * (avgCreativity / 70));
            }
          });
        }
        
        if (leadershipCount > 0) {
          const avgLeadership = leadershipSum / leadershipCount;
          // Adjust growth rate based on leadership scores
          segments.forEach(segment => {
            if (segment.name === "Growth-Stage Businesses") {
              segment.growthRate = Math.min(30, segment.growthRate * (avgLeadership / 75));
            }
          });
        }
      }
      
      return segments;
    }
    
    // For a real implementation, identify and analyze customer segments
    return [];
  }

  async getProductFeaturePriorities(companyId: number): Promise<ProductFeaturePriority[]> {
    // Demo data for product feature priorities - handle any company ID dynamically
    if (companyId && companyId > 0) {
      const responses = await this.getSurveyResponsesByCompany(companyId);
      
      // Default priorities
      const priorities = [
        {
          featureName: "Advanced Analytics Dashboard",
          importance: 9.2,
          currentSatisfaction: 7.5,
          developmentCost: 8.4,
          timeToImplement: "3-4 months",
          impactOnSales: 8.7,
          competitiveNecessity: 9.3,
          customerSegmentRelevance: {
            "Enterprise Innovators": 9.5,
            "Growth-Stage Businesses": 8.2,
            "Small Business Owners": 6.4
          },
          technicalFeasibility: 7.8,
          strategicAlignment: 9.1,
          overallPriority: 8.8
        },
        {
          featureName: "Mobile Application",
          importance: 8.5,
          currentSatisfaction: 6.2,
          developmentCost: 7.8,
          timeToImplement: "4-6 months",
          impactOnSales: 7.9,
          competitiveNecessity: 8.6,
          customerSegmentRelevance: {
            "Enterprise Innovators": 7.2,
            "Growth-Stage Businesses": 8.7,
            "Small Business Owners": 8.9
          },
          technicalFeasibility: 8.2,
          strategicAlignment: 8.8,
          overallPriority: 8.3
        },
        {
          featureName: "AI-Powered Recommendations",
          importance: 8.9,
          currentSatisfaction: 5.8,
          developmentCost: 9.2,
          timeToImplement: "5-7 months",
          impactOnSales: 8.5,
          competitiveNecessity: 7.9,
          customerSegmentRelevance: {
            "Enterprise Innovators": 9.4,
            "Growth-Stage Businesses": 8.5,
            "Small Business Owners": 6.8
          },
          technicalFeasibility: 7.2,
          strategicAlignment: 9.3,
          overallPriority: 8.6
        },
        {
          featureName: "Integrated Messaging System",
          importance: 7.8,
          currentSatisfaction: 6.5,
          developmentCost: 6.2,
          timeToImplement: "2-3 months",
          impactOnSales: 7.2,
          competitiveNecessity: 7.5,
          customerSegmentRelevance: {
            "Enterprise Innovators": 7.8,
            "Growth-Stage Businesses": 8.6,
            "Small Business Owners": 8.2
          },
          technicalFeasibility: 8.7,
          strategicAlignment: 7.9,
          overallPriority: 7.7
        },
        {
          featureName: "Customizable Report Templates",
          importance: 8.4,
          currentSatisfaction: 7.2,
          developmentCost: 5.8,
          timeToImplement: "1-2 months",
          impactOnSales: 7.6,
          competitiveNecessity: 8.2,
          customerSegmentRelevance: {
            "Enterprise Innovators": 8.7,
            "Growth-Stage Businesses": 8.3,
            "Small Business Owners": 9.1
          },
          technicalFeasibility: 9.2,
          strategicAlignment: 8.4,
          overallPriority: 8.2
        },
        {
          featureName: "API Integration Framework",
          importance: 9.1,
          currentSatisfaction: 6.9,
          developmentCost: 7.5,
          timeToImplement: "3-5 months",
          impactOnSales: 7.8,
          competitiveNecessity: 9.4,
          customerSegmentRelevance: {
            "Enterprise Innovators": 9.6,
            "Growth-Stage Businesses": 8.8,
            "Small Business Owners": 5.7
          },
          technicalFeasibility: 8.1,
          strategicAlignment: 9.2,
          overallPriority: 8.7
        }
      ];
      
      // If we have real data, adjust priorities
      if (responses.length > 0) {
        // In a real implementation, analyze response data to refine priorities
        // Here we'll just make some simple adjustments based on trait averages
        let analyticSum = 0;
        let analyticCount = 0;
        let adaptabilitySum = 0;
        let adaptabilityCount = 0;
        
        responses.forEach(response => {
          if (response.traits) {
            response.traits.forEach((trait: PersonalityTrait) => {
              if (trait.name === "Analytical Thinking") {
                analyticSum += trait.score;
                analyticCount++;
              }
              if (trait.name === "Adaptability") {
                adaptabilitySum += trait.score;
                adaptabilityCount++;
              }
            });
          }
        });
        
        // Adjust priorities based on traits
        if (analyticCount > 0) {
          const avgAnalytic = analyticSum / analyticCount;
          // Adjust AI and Analytics features based on analytical trait
          priorities.forEach(priority => {
            if (priority.featureName === "Advanced Analytics Dashboard" || 
                priority.featureName === "AI-Powered Recommendations") {
              priority.importance = Math.min(10, priority.importance * (avgAnalytic / 75));
              priority.overallPriority = Math.min(10, priority.overallPriority * (avgAnalytic / 75));
            }
          });
        }
        
        if (adaptabilityCount > 0) {
          const avgAdaptability = adaptabilitySum / adaptabilityCount;
          // Adjust mobile and API features based on adaptability trait
          priorities.forEach(priority => {
            if (priority.featureName === "Mobile Application" || 
                priority.featureName === "API Integration Framework") {
              priority.importance = Math.min(10, priority.importance * (avgAdaptability / 70));
              priority.overallPriority = Math.min(10, priority.overallPriority * (avgAdaptability / 70));
            }
          });
        }
      }
      
      return priorities;
    }
    
    // For a real implementation, analyze actual user needs and feedback
    return [];
  }

  async getPricingStrategies(companyId: number): Promise<PricingStrategy[]> {
    // Demo data for pricing strategies - handle any company ID dynamically
    if (companyId && companyId > 0) {
      return [
        {
          strategyName: "Premium Tier-Based Model",
          appropriateness: 8.7,
          potentialRevenue: 9.2,
          customerAcceptance: 7.5,
          competitiveSustainability: 8.4,
          implementationComplexity: 6.8,
          profitMargin: 8.9,
          marketPenetration: 7.6,
          customerSegmentImpact: {
            "Enterprise Innovators": 9.3,
            "Growth-Stage Businesses": 7.8,
            "Small Business Owners": 5.2
          },
          overallScore: 8.5,
          priceElasticity: 0.8, // Added price elasticity
          pricingStructure: {
            base: 99,
            tiers: [
              {
                name: "Basic",
                tierName: "Basic", // Added tierName property for frontend
                price: 99,
                features: ["Core Analytics", "Standard Reports", "Email Support"]
              },
              {
                name: "Professional",
                tierName: "Professional", // Added tierName property for frontend
                price: 249,
                features: ["Advanced Analytics", "Custom Reports", "Priority Support", "API Access"]
              },
              {
                name: "Enterprise",
                tierName: "Enterprise", // Added tierName property for frontend
                price: 599,
                features: ["Full Analytics Suite", "Custom Integration", "Dedicated Support", "White Labeling"]
              }
            ]
          }
        },
        {
          strategyName: "Usage-Based Pricing",
          appropriateness: 7.9,
          potentialRevenue: 8.6,
          customerAcceptance: 8.3,
          competitiveSustainability: 7.8,
          implementationComplexity: 8.2,
          profitMargin: 8.5,
          marketPenetration: 8.4,
          customerSegmentImpact: {
            "Enterprise Innovators": 8.1,
            "Growth-Stage Businesses": 8.7,
            "Small Business Owners": 7.9
          },
          overallScore: 8.2,
          priceElasticity: 1.2, // Added price elasticity
          pricingStructure: {
            base: 49,
            tiers: [
              {
                name: "Starter",
                tierName: "Starter", // Added tierName property for frontend
                price: 49,
                features: ["Pay per use", "No monthly commitment", "Basic features"]
              },
              {
                name: "Growth",
                tierName: "Growth", // Added tierName property for frontend
                price: 0,
                features: ["$0.05 per analysis", "Volume discounts", "All features"]
              },
              {
                name: "Enterprise",
                tierName: "Enterprise", // Added tierName property for frontend
                price: 0,
                features: ["Custom pricing", "Unlimited analyses", "Priority processing"]
              }
            ]
          }
        },
        {
          strategyName: "Freemium Model",
          appropriateness: 7.2,
          potentialRevenue: 6.8,
          customerAcceptance: 9.4,
          competitiveSustainability: 6.9,
          implementationComplexity: 7.5,
          profitMargin: 6.2,
          marketPenetration: 9.2,
          customerSegmentImpact: {
            "Enterprise Innovators": 5.8,
            "Growth-Stage Businesses": 7.5,
            "Small Business Owners": 9.3
          },
          overallScore: 7.6,
          priceElasticity: 1.5, // Added price elasticity
          pricingStructure: {
            base: 0,
            tiers: [
              {
                name: "Free",
                tierName: "Free", // Added tierName property for frontend
                price: 0,
                features: ["Basic Analysis", "Limited Reports", "Community Support"]
              },
              {
                name: "Plus",
                tierName: "Plus", // Added tierName property for frontend
                price: 79,
                features: ["Full Analysis", "Standard Reports", "Email Support"]
              },
              {
                name: "Pro",
                tierName: "Pro", // Added tierName property for frontend
                price: 199,
                features: ["Advanced Analysis", "Custom Reports", "Priority Support", "API Access"]
              }
            ]
          }
        },
        {
          strategyName: "Annual Subscription Discount",
          appropriateness: 8.5,
          potentialRevenue: 8.3,
          customerAcceptance: 8.7,
          competitiveSustainability: 8.2,
          implementationComplexity: 5.8,
          profitMargin: 8.6,
          marketPenetration: 7.9,
          customerSegmentImpact: {
            "Enterprise Innovators": 8.5,
            "Growth-Stage Businesses": 8.8,
            "Small Business Owners": 7.6
          },
          overallScore: 8.3,
          pricingStructure: {
            base: 129,
            tiers: [
              {
                name: "Monthly",
                price: 129,
                features: ["Standard features", "Monthly billing", "No commitment"]
              },
              {
                name: "Annual",
                price: 99,
                features: ["Standard features", "23% savings", "Annual commitment"]
              },
              {
                name: "Enterprise",
                price: 499,
                features: ["All features", "Annual billing", "Custom integration"]
              }
            ]
          }
        }
      ];
    }
    
    // For a real implementation, analyze company market position and competitor pricing
    return [];
  }

  async getMarketingStrategies(companyId: number): Promise<MarketingStrategy[]> {
    // Demo data for marketing strategies - handle any company ID dynamically
    if (companyId && companyId > 0) {
      const responses = await this.getSurveyResponsesByCompany(companyId);
      
      // Analyze responses to refine marketing strategy recommendations
      let leadGenMultiplier = 1.0;
      let contentMarketingMultiplier = 1.0;
      
      if (responses.length > 0) {
        // Analyze personality traits to refine multipliers
        let creativitySum = 0;
        let creativityCount = 0;
        let extraversionSum = 0;
        let extraversionCount = 0;
        
        responses.forEach(response => {
          if (response.traits) {
            response.traits.forEach((trait: PersonalityTrait) => {
              if (trait.name === "Creativity" || trait.name === "Creative Thinking") {
                creativitySum += trait.score;
                creativityCount++;
              }
              if (trait.name === "Extraversion") {
                extraversionSum += trait.score;
                extraversionCount++;
              }
            });
          }
        });
        
        // Adjust multipliers based on trait averages
        if (creativityCount > 0) {
          const avgCreativity = creativitySum / creativityCount;
          contentMarketingMultiplier = avgCreativity / 70; // Normalize
        }
        
        if (extraversionCount > 0) {
          const avgExtraversion = extraversionSum / extraversionCount;
          leadGenMultiplier = avgExtraversion / 65; // Normalize
        }
      }
      
      // Define base strategies
      const leadGenStrategy: MarketingStrategy = {
        strategyName: "Targeted Lead Generation Campaign",
        effectiveness: Math.min(9.5, 8.7 * leadGenMultiplier),
        costEfficiency: 7.8,
        implementationTimeline: "1-2 months",
        revenueImpact: Math.min(9.2, 8.5 * leadGenMultiplier),
        brandAlignment: 8.3,
        customerReach: 8.6,
        competitiveAdvantage: 7.9,
        channelBreakdown: {
          "LinkedIn Advertising": 35,
          "Google Ads": 25,
          "Industry Partnerships": 20,
          "Email Campaigns": 20
        },
        messagingThemes: [
          "Data-Driven Decision Making",
          "Competitive Advantage Through Analytics",
          "Streamlined Business Intelligence",
          "ROI Impact Stories"
        ],
        targetedPersonas: [
          "Technology Decision Makers",
          "CMOs and Marketing Directors",
          "Business Intelligence Managers",
          "C-Suite Executives"
        ],
        overallScore: Math.min(9.0, 8.4 * leadGenMultiplier)
      };
      
      const contentStrategy: MarketingStrategy = {
        strategyName: "Content Marketing & Thought Leadership",
        effectiveness: Math.min(9.2, 8.6 * contentMarketingMultiplier),
        costEfficiency: 8.5,
        implementationTimeline: "3-6 months",
        revenueImpact: 7.8,
        brandAlignment: 9.3,
        customerReach: 8.2,
        competitiveAdvantage: 8.7,
        channelBreakdown: {
          "Industry Blog": 30,
          "Webinars": 25,
          "White Papers": 20,
          "Social Media": 25
        },
        messagingThemes: [
          "Industry Trends and Insights",
          "Best Practices in Analytics",
          "Case Studies and Success Stories",
          "Technology Innovation"
        ],
        targetedPersonas: [
          "Industry Influencers",
          "Analytics Professionals",
          "Business Strategists",
          "Research & Development Teams"
        ],
        overallScore: Math.min(9.0, 8.3 * contentMarketingMultiplier)
      };
      
      // Add more strategies based on industry and target market
      const company = await this.getCompany(companyId);
      const industry = company?.industry || "Technology";
      const targetMarket = company?.targetMarket || "Enterprise";
      
      const channelStrategy: MarketingStrategy = {
        strategyName: "Multi-Channel Engagement Program",
        effectiveness: 8.1,
        costEfficiency: 7.2,
        implementationTimeline: "2-3 months",
        revenueImpact: 8.3,
        brandAlignment: 8.6,
        customerReach: 9.1,
        competitiveAdvantage: 7.5,
        channelBreakdown: this.getDefaultChannels(industry, targetMarket).reduce((obj, item) => {
          obj[item.channel] = item.percentage;
          return obj;
        }, {} as Record<string, number>),
        messagingThemes: this.getMessagingForIndustry(industry),
        targetedPersonas: [
          "Product Managers",
          "Department Heads",
          "Technology Implementers",
          "Business Analysts"
        ],
        overallScore: 8.2
      };
      
      const eventStrategy: MarketingStrategy = {
        strategyName: "Industry Event & Conference Program",
        effectiveness: 7.9,
        costEfficiency: 6.8,
        implementationTimeline: "3-6 months",
        revenueImpact: 7.5,
        brandAlignment: 8.9,
        customerReach: 7.6,
        competitiveAdvantage: 8.3,
        channelBreakdown: {
          "Conference Sponsorships": 40,
          "Speaking Engagements": 25,
          "Demo Booths": 20,
          "Networking Events": 15
        },
        messagingThemes: [
          "Industry Innovation",
          "Platform Capabilities",
          "Success Metrics",
          "Integration Ecosystem"
        ],
        targetedPersonas: [
          "Industry Decision Makers",
          "Technology Evaluators",
          "Partner Organizations",
          "Potential Clients"
        ],
        overallScore: 7.8
      };
      
      const partnerStrategy: MarketingStrategy = {
        strategyName: "Strategic Partnership & Co-Marketing",
        effectiveness: 8.4,
        costEfficiency: 8.1,
        implementationTimeline: "3-4 months",
        revenueImpact: 8.6,
        brandAlignment: 8.2,
        customerReach: 8.7,
        competitiveAdvantage: 8.9,
        channelBreakdown: {
          "Joint Webinars": 30,
          "Co-Branded Content": 25,
          "Integration Marketplace": 25,
          "Partner Referrals": 20
        },
        messagingThemes: [
          "Ecosystem Value",
          "Expanded Capabilities",
          "Seamless Integration",
          "Combined Expertise"
        ],
        targetedPersonas: [
          "Existing Customers",
          "Partner Customers",
          "Integration Specialists",
          "Platform Evaluators"
        ],
        overallScore: 8.5
      };
      
      // Return strategies
      return [
        leadGenStrategy,
        contentStrategy,
        channelStrategy,
        eventStrategy,
        partnerStrategy
      ];
    }
    
    // For a real implementation, analyze company profile and audience
    return [];
  }

  private getDefaultChannels(industry: string, _targetMarket: string): Array<{
    channel: string;
    percentage: number;
  }> {
    // Define channel mix by industry
    const channelsByIndustry: Record<string, Array<{ channel: string, percentage: number }>> = {
      "Technology": [
        { channel: "LinkedIn", percentage: 30 },
        { channel: "Industry Publications", percentage: 25 },
        { channel: "Developer Forums", percentage: 20 },
        { channel: "Tech Conferences", percentage: 25 }
      ],
      "Finance": [
        { channel: "Financial Publications", percentage: 35 },
        { channel: "LinkedIn", percentage: 25 },
        { channel: "Industry Conferences", percentage: 25 },
        { channel: "Direct Marketing", percentage: 15 }
      ],
      "Healthcare": [
        { channel: "Healthcare Journals", percentage: 30 },
        { channel: "Industry Conferences", percentage: 25 },
        { channel: "LinkedIn", percentage: 20 },
        { channel: "Direct Outreach", percentage: 25 }
      ],
      "Retail": [
        { channel: "Trade Shows", percentage: 25 },
        { channel: "Industry Publications", percentage: 20 },
        { channel: "LinkedIn", percentage: 25 },
        { channel: "Email Campaigns", percentage: 30 }
      ]
    };
    
    // Return channels for the specified industry, defaulting to Technology
    return channelsByIndustry[industry] || channelsByIndustry["Technology"];
  }

  private getMessagingForIndustry(
    industry: string
  ): string[] {
    // Define messaging themes by industry
    const messagingByIndustry: Record<string, string[]> = {
      "Technology": [
        "Innovation Through Analytics",
        "Data-Driven Decision Making",
        "Scalable Technology Solutions",
        "Integration Ecosystem"
      ],
      "Finance": [
        "Risk Mitigation Strategies",
        "Regulatory Compliance",
        "Financial Performance Insights",
        "Investment Intelligence"
      ],
      "Healthcare": [
        "Patient Outcome Optimization",
        "Healthcare Efficiency Metrics",
        "Regulatory Compliance",
        "Care Quality Improvement"
      ],
      "Retail": [
        "Customer Experience Enhancement",
        "Inventory Optimization",
        "Omnichannel Performance",
        "Customer Loyalty Analytics"
      ]
    };
    
    // Return messaging for the specified industry, defaulting to Technology
    return messagingByIndustry[industry] || messagingByIndustry["Technology"];
  }



  async getRevenueForecasts(companyId: number): Promise<RevenueForecasting[]> {
    // Demo data for revenue forecasts - handle any company ID dynamically
    if (companyId && companyId > 0) {
      // Simulate different scenarios
      const conservativeScenario = this.generateForecastScenario(
        "Conservative Growth",
        0.7,
        15,
        6,
        24
      );
      
      const moderateScenario = this.generateForecastScenario(
        "Expected Growth",
        0.55,
        25,
        4,
        36
      );
      
      const optimisticScenario = this.generateForecastScenario(
        "Accelerated Growth",
        0.25,
        40,
        3,
        48
      );
      
      const expansionScenario = this.generateForecastScenario(
        "Market Expansion",
        0.15,
        35,
        8,
        36
      );
      
      // Return all scenarios
      return [
        moderateScenario,
        conservativeScenario,
        optimisticScenario,
        expansionScenario
      ];
    }
    
    // For a real implementation, analyze company data, market trends, etc.
    return [];
  }

  private generateForecastScenario(
    scenarioName: string,
    probability: number,
    growthRate: number,
    salesCycle: number,
    customerLifetime: number
  ): RevenueForecasting {
    // Generate monthly breakdown (last 6 months and next 6 months)
    const monthlyBreakdown: Record<string, number> = {};
    const baseRevenue = 150000 + Math.random() * 50000;
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    // Current month index
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    // Generate past 6 months
    for (let i = 6; i >= 1; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const pastFactor = 1 - (i * 0.03 * Math.random()); // Slight decrease for past months
      monthlyBreakdown[monthNames[monthIndex]] = Math.round(baseRevenue * pastFactor);
    }
    
    // Generate current and future 6 months
    for (let i = 0; i < 7; i++) {
      const monthIndex = (currentMonth + i) % 12;
      // Future growth includes compounding effect
      const growthFactor = 1 + (i * (growthRate / 100) * (0.8 + Math.random() * 0.4));
      monthlyBreakdown[monthNames[monthIndex]] = Math.round(baseRevenue * growthFactor);
    }
    
    // Calculate projected annual revenue from monthly values
    const projectedRevenue = Object.values(monthlyBreakdown).reduce((sum, value) => sum + value, 0) * 12 / Object.keys(monthlyBreakdown).length;
    
    // Generate contributing and risk factors
    const contributingFactors = this.getContributingFactors(scenarioName, growthRate, salesCycle);
    const riskFactors = this.getRiskFactors(scenarioName, growthRate, customerLifetime);
    
    // Generate revenue streams
    const revenueStreams = [
      {
        name: "Subscription Licenses",
        percentage: 45 + (Math.random() * 10 - 5),
        growth: growthRate + (Math.random() * 6 - 3)
      },
      {
        name: "Professional Services",
        percentage: 20 + (Math.random() * 8 - 4),
        growth: growthRate * 0.8 + (Math.random() * 5 - 2.5)
      },
      {
        name: "Premium Support",
        percentage: 15 + (Math.random() * 6 - 3),
        growth: growthRate * 0.7 + (Math.random() * 4 - 2)
      },
      {
        name: "Add-on Modules",
        percentage: 12 + (Math.random() * 6 - 3),
        growth: growthRate * 1.2 + (Math.random() * 8 - 4)
      },
      {
        name: "Training & Certification",
        percentage: 8 + (Math.random() * 4 - 2),
        growth: growthRate * 0.6 + (Math.random() * 4 - 2)
      }
    ];
    
    // Ensure percentages add up to 100%
    const totalPercentage = revenueStreams.reduce((sum, stream) => sum + stream.percentage, 0);
    revenueStreams.forEach(stream => {
      stream.percentage = Math.round((stream.percentage / totalPercentage) * 100);
      stream.growth = Math.round(stream.growth * 10) / 10; // Round to 1 decimal place
    });
    
    // Return forecast scenario
    return {
      scenario: scenarioName,
      probabilityOfOccurrence: probability,
      timeframe: "12 months",
      projectedRevenue: Math.round(projectedRevenue),
      growthRate: growthRate,
      marketShareProjection: 5 + (growthRate / 10),
      customerAdoption: 65 + (growthRate / 5),
      contributingFactors,
      riskFactors,
      confidenceLevel: 70 + (probability * 30),
      monthlyBreakdown,
      revenueStreams,
      totalProjectedRevenue: Math.round(projectedRevenue)
    };
  }

  private getContributingFactors(scenarioName: string, _growthRate: number, _salesCycle: number): string[] {
    // Base factors
    const baseFactors = [
      "Product feature expansion",
      "Marketing campaign effectiveness",
      "Sales team performance",
      "Customer retention initiatives"
    ];
    
    // Add scenario-specific factors
    if (scenarioName.includes("Conservative")) {
      return [
        ...baseFactors,
        "Stable customer retention",
        "Modest market growth",
        "Existing client upselling"
      ];
    } else if (scenarioName.includes("Accelerated")) {
      return [
        ...baseFactors,
        "New market penetration",
        "Product innovation adoption",
        "Competitive displacement",
        "Strategic partnerships"
      ];
    } else if (scenarioName.includes("Expansion")) {
      return [
        ...baseFactors,
        "Geographic expansion",
        "New product launches",
        "Channel partner activation",
        "Industry vertical focus"
      ];
    } else {
      return [
        ...baseFactors,
        "Balanced customer acquisition",
        "Product enhancements",
        "Pricing optimization",
        "Market demand growth"
      ];
    }
  }

  private getRiskFactors(scenarioName: string, _growthRate: number, _customerLifetime: number): string[] {
    // Base risk factors
    const baseRisks = [
      "Competitive market pressure",
      "Economic uncertainty",
      "Implementation challenges",
      "Resource constraints"
    ];
    
    // Add scenario-specific risks
    if (scenarioName.includes("Conservative")) {
      return [
        ...baseRisks,
        "Slow market adoption",
        "Extended sales cycles",
        "Budget constraints in target market"
      ];
    } else if (scenarioName.includes("Accelerated")) {
      return [
        ...baseRisks,
        "Scaling challenges",
        "Product quality maintenance",
        "Customer support bandwidth",
        "Market saturation risks"
      ];
    } else if (scenarioName.includes("Expansion")) {
      return [
        ...baseRisks,
        "New market entry barriers",
        "Regulatory challenges",
        "Cultural adaptation issues",
        "Extended break-even timelines"
      ];
    } else {
      return [
        ...baseRisks,
        "Changing market conditions",
        "Feature parity with competitors",
        "Customer acquisition costs",
        "Technology adaptation challenges"
      ];
    }
  }

  async getFocusGroupSimulation(companyId: number, productConcept: string): Promise<SimulatedFocusGroup> {
    // Demo data for focus group simulation - handle any company ID dynamically
    if (companyId && companyId > 0) {
      // Create a simulated focus group with varied participants
      const participants = Array.from({ length: 12 }, (_, i) => ({
        id: `p${i + 1}`,
        traits: [
          { 
            name: "Openness", 
            score: 40 + Math.floor(Math.random() * 40), 
            category: "personality" 
          },
          { 
            name: "Conscientiousness", 
            score: 40 + Math.floor(Math.random() * 40), 
            category: "personality" 
          },
          { 
            name: "Extraversion", 
            score: 40 + Math.floor(Math.random() * 40), 
            category: "personality" 
          },
          { 
            name: "Analytical Thinking", 
            score: 40 + Math.floor(Math.random() * 40), 
            category: "business" 
          }
        ],
        demographics: {
          age: 25 + Math.floor(Math.random() * 30),
          gender: ["Male", "Female", "Non-binary"][Math.floor(Math.random() * 2)],
          occupation: ["Manager", "Director", "Analyst", "Specialist", "Consultant"][Math.floor(Math.random() * 5)],
          education: ["Bachelor's", "Master's", "PhD"][Math.floor(Math.random() * 3)],
          industry: ["Technology", "Finance", "Healthcare", "Retail", "Education"][Math.floor(Math.random() * 5)]
        }
      }));
      
      // Simulate sentiment based on concept and participant traits
      const sentimentRange = productConcept.toLowerCase().includes("innovative") || 
                           productConcept.toLowerCase().includes("advanced") ? 
                           [6.5, 9.0] : [5.5, 8.5];
                           
      const overallSentiment = sentimentRange[0] + Math.random() * (sentimentRange[1] - sentimentRange[0]);
      
      // Generate key themes based on product concept
      const keyThemes: Record<string, number> = {
        "User Experience": 55 + Math.floor(Math.random() * 30),
        "Functionality": 60 + Math.floor(Math.random() * 25),
        "Value Perception": 50 + Math.floor(Math.random() * 35),
        "Innovation": 45 + Math.floor(Math.random() * 40),
        "Practical Application": 55 + Math.floor(Math.random() * 30)
      };
      
      // Add concept-specific themes
      if (productConcept.toLowerCase().includes("analytics")) {
        keyThemes["Data Visualization"] = 65 + Math.floor(Math.random() * 25);
        keyThemes["Report Customization"] = 60 + Math.floor(Math.random() * 30);
      } else if (productConcept.toLowerCase().includes("platform")) {
        keyThemes["Integration Capability"] = 70 + Math.floor(Math.random() * 20);
        keyThemes["Scalability"] = 65 + Math.floor(Math.random() * 25);
      }
      
      // Generate feature feedback
      const featureFeedback: Record<string, number> = {
        "User Interface": 7.2,
        "Data Analysis Tools": 8.1,
        "Collaboration Features": 6.5,
        "Mobile Access": 5.8,
        "Reporting": 7.8,
        "Integration": 7.5,
        "Performance": 8.0,
        "Security": 8.5
      };
      
      // Suggested improvements based on feedback
      const suggestedImprovements = [
        "Enhance mobile experience with dedicated app",
        "Add more customization options for reports",
        "Improve collaboration features with real-time editing",
        "Develop more intuitive onboarding process",
        "Include additional data visualization options"
      ];
      
      // Competitive comparisons
      const competitiveComparisons: Record<string, number> = {
        "TechInsight Analytics": 7.2,
        "DataPulse Platform": 8.1,
        "InsightForge Pro": 6.8,
        "AnalyticsFusion": 7.5
      };
      
      // Participant quotes
      const participantQuotes = [
        "The UI is clean and intuitive, but I'd like to see more customization options.",
        "Integration capabilities are impressive, especially with our existing tools.",
        "Reporting features are powerful, though there's a learning curve.",
        "This would significantly improve our team's productivity and insight generation.",
        "The pricing seems fair given the value it would bring to our organization.",
        "I appreciate the attention to data security and compliance features."
      ];
      
      // Return the simulated focus group
      return {
        productConcept,
        participants,
        overallSentiment,
        keyThemes,
        suggestedImprovements,
        purchaseIntent: overallSentiment - 1 + Math.random(),
        pricePerception: overallSentiment > 8 ? "Good value" : (overallSentiment > 6.5 ? "Fair pricing" : "Somewhat expensive"),
        valuePerception: overallSentiment * 10,
        featureFeedback,
        competitiveComparisons,
        participantQuotes
      };
    }
    
    // For a real implementation, analyze survey data to create a simulated focus group
    return {
      productConcept,
      participants: [],
      overallSentiment: 0,
      keyThemes: {},
      suggestedImprovements: [],
      purchaseIntent: 0,
      pricePerception: "",
      valuePerception: 0,
      featureFeedback: {},
      competitiveComparisons: {},
      participantQuotes: []
    };
  }
}

// IMPORTANT: While this in-memory storage is still present for compatibility,
// the application is now using the DatabaseStorage implementation from database-storage.ts
// This export is kept only for backward compatibility
// Use the working database storage implementation with real BI features
import { dbStorage } from './database-storage-clean';
export const storage = dbStorage;
