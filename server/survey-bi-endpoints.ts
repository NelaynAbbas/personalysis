// Survey-specific and company-level business intelligence endpoints
import { Request, Response, NextFunction } from 'express';
import { IStorage } from './storage';
import { db, sql } from './db';
import { surveys, companies } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { apiRateLimiter } from './utils/rateLimiter';
import { AppError } from './middleware/errorHandler';
// import sessionMiddleware from './middleware/sessionMiddleware'; // Unused middleware
import { Logger } from './utils/Logger';

// Initialize logger
const logger = new Logger('BusinessIntelligence');

/**
 * Add all business intelligence endpoints to the Express app
 * This includes both survey-specific and company-level endpoints
 * @param app Express application
 * @param storage Storage implementation
 */
// API validation schemas
const idParamSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)), {
    message: "ID must be a valid number"
  })
});

const productIdParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});

const focusGroupSchema = z.object({
  productConcept: z.string().min(10, "Product concept must be at least 10 characters").max(1000, "Product concept must be less than 1000 characters")
});

/**
 * Helper function to get companyId from surveyId
 * @param surveyId Survey ID to lookup
 * @returns Company ID associated with the survey
 * @throws Error if survey not found
 */
async function getCompanyIdFromSurvey(surveyId: number): Promise<number> {
  const survey = await db.query.surveys.findFirst({
    where: eq(surveys.id, surveyId)
  });
  
  if (!survey) {
    throw new Error(`Survey with ID ${surveyId} not found`);
  }
  
  return survey.companyId;
}

export function addSurveyBIEndpoints(app: any, storage: IStorage) {
  // Set up rate limiter for BI endpoints
  const biRateLimiter = apiRateLimiter({
    windowSec: 60,
    maxRequests: 60,
    message: 'Too many business intelligence requests. Please slow down.',
  });
  
  // Middleware to validate company access
  const validateCompanyAccess = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id } = idParamSchema.parse(req.params);
      const companyId = parseInt(id);
      
      // Check if user is authenticated - allow demo access for development
      if (!req.session || !req.session.userId) {
        // For demo purposes, create a temporary session if none exists
        if (process.env.NODE_ENV !== 'production') {
          req.session = req.session || {};
          req.session.userId = 2; // Demo user ID
          req.session.companyId = companyId; // Use the requested company ID
          req.session.userRole = 'client';
          logger.info('Demo session created for BI endpoint access', { companyId });
        } else {
          logger.warn('Unauthorized access attempt to BI endpoint', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.headers['user-agent']
          });
          return next(new AppError('Authentication required', 401));
        }
      }
      
      // Check if user has access to this company
      const userCompanyId = req.session.companyId;
      const userRole = req.session.userRole;
      
      // Allow platform admins to access any company
      const isPlatformAdmin = userRole === 'platform_admin' || 
                            userRole === 'platform_support';
                            
      if (!isPlatformAdmin && userCompanyId !== companyId) {
        logger.warn('Company access violation', {
          userId: req.session.userId,
          attemptedCompanyId: companyId,
          userCompanyId,
          userRole,
          ip: req.ip
        });
        return next(new AppError('You do not have access to this company data', 403));
      }
      
      // Add companyId to request for further use
      (req as any).companyId = companyId;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(error);
      }
      next(error);
    }
  };
  
  // Company-level endpoints for aggregated data
  
  // Get company details
  app.get('/api/company/:id', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching details for company ID: ${companyId}`);
    
    try {
      // Get company from database
      const [company] = await db.query.companies.findMany({
        where: eq(companies.id, companyId),
        limit: 1
      });
      
      if (!company) {
        return next(new AppError(`Company with ID ${companyId} not found`, 404));
      }
      
      // Format the response using actual DB data
      const companyData = {
        id: company.id,
        name: company.name,
        email: company.email,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt || null,
        industry: company.industry || null,
        size: company.size || null,
        website: company.website || null,
        // Map subscription/license data properly
        subscriptionTier: company.subscriptionTier,
        licenseStatus: company.licenseStatus
      };
      
      res.json({
        status: 'success',
        data: companyData
      });
    } catch (error) {
      logger.error(`Error fetching company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Get company usage metrics
  app.get('/api/company/:id/usage', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching usage for company ID: ${companyId}`);
    
    try {
      // Get company data from database
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: {
          id: true,
          maxStorage: true,
          maxUsers: true,
          maxSurveys: true,
          maxResponses: true,
          name: true,
          subscriptionTier: true,
          licenseStatus: true
        }
      });
      
      if (!company) {
        return next(new AppError(`Company with ID ${companyId} not found`, 404));
      }
      
      // Get company surveys from database
      const companySurveys = await db.query.surveys.findMany({
        where: eq(surveys.companyId, companyId),
        columns: {
          id: true,
          title: true,
          createdAt: true
        }
      });
      
      // Get survey responses stats from database
      const responsesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM survey_responses 
        WHERE company_id = ${companyId}
      `);
      
      const responsesCount = responsesResult.rows[0]?.count 
        ? parseInt(responsesResult.rows[0].count as string, 10) 
        : 0;
      
      // For storage calculation, estimate based on responses (in a real app, this would track actual file storage)
      // Assuming each response takes ~10KB of storage
      const responseStorageSize = 10 * 1024; // 10KB per response
      const usedStorage = responsesCount * responseStorageSize;
      
      // Max storage from company settings, default to 10MB if not set
      const totalStorage = company.maxStorage || (10 * 1024 * 1024); // 10MB default
      
      // Get API usage data from database
      // In a real app, this would be from an api_calls tracking table
      // For this example, we'll estimate based on # of responses (1 API call per response)
      const apiCallsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM survey_responses 
        WHERE company_id = ${companyId} AND created_at > NOW() - INTERVAL '30 days'
      `);
      
      const apiCallsCount = apiCallsResult.rows[0]?.count 
        ? parseInt(apiCallsResult.rows[0].count as string, 10) 
        : 0;
      
      // API limit from company settings, default to company max responses or 1000 if not set
      const apiLimit = company.maxResponses || 1000;
      
      // Get recent activity from database (most recent survey responses)
      const recentActivityResult = await db.execute(sql`
        SELECT 
          id, 
          survey_id as "surveyId", 
          created_at as "timestamp", 
          'survey_response' as action
        FROM survey_responses 
        WHERE company_id = ${companyId} 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      // Process recent activity data
      const recentActivity = recentActivityResult.rows.map(row => ({
        id: row.id,
        surveyId: row.surveyId,
        timestamp: row.timestamp,
        action: row.action
      }));
      
      // Prepare the usage data response
      const usageData = {
        responsesCount,
        surveysCount: companySurveys.length,
        storage: {
          used: usedStorage,
          total: totalStorage,
          percentage: Math.min((usedStorage / totalStorage) * 100, 100).toFixed(2)
        },
        apiUsage: {
          current: apiCallsCount,
          limit: apiLimit,
          percentage: Math.min((apiCallsCount / apiLimit) * 100, 100).toFixed(2)
        },
        recentActivity
      };
      
      res.json({
        status: 'success',
        data: usageData
      });
    } catch (error) {
      logger.error(`Error fetching usage data for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level competitor analysis
  app.get('/api/company/:id/competitors', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching competitors for company ID: ${companyId}`);
    
    try {
      // Get competitor analysis from the storage layer
      const competitorData = await storage.getCompetitorAnalysis(companyId);
      
      if (!competitorData || competitorData.length === 0) {
        return next(new AppError(`No competitor data available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: competitorData
      });
    } catch (error) {
      logger.error(`Error fetching competitor data for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level market fit analysis
  app.get('/api/company/:id/market-fit/:productId', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    
    try {
      // Validate productId parameter
      const { productId } = productIdParamSchema.parse(req.params);
      
      logger.info(`Fetching market fit for company ID: ${companyId}, product ID: ${productId}`);
      
      // Get market fit analysis from the storage layer
      const marketFitData = await storage.getMarketFitAnalysis(companyId, productId);
      
      if (!marketFitData) {
        return next(new AppError(`No market fit data available for company ${companyId} and product ${productId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: marketFitData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid product ID format', 400));
      }
      logger.error(`Error fetching market fit data for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level customer segments
  app.get('/api/company/:id/segments', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching segments for company ID: ${companyId}`);
    
    try {
      // Get customer segments from the storage layer
      const segmentsData = await storage.getCustomerSegments(companyId);
      
      if (!segmentsData || segmentsData.length === 0) {
        return next(new AppError(`No customer segments available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: segmentsData
      });
    } catch (error) {
      logger.error(`Error fetching customer segments for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level feature priorities
  app.get('/api/company/:id/feature-priorities', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching feature priorities for company ID: ${companyId}`);
    
    try {
      // Get feature priorities from the storage layer
      const featuresData = await storage.getProductFeaturePriorities(companyId);
      
      if (!featuresData || featuresData.length === 0) {
        return next(new AppError(`No feature priorities available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: featuresData
      });
    } catch (error) {
      logger.error(`Error fetching feature priorities for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level pricing strategies
  app.get('/api/company/:id/pricing-strategies', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching pricing strategies for company ID: ${companyId}`);
    
    try {
      // Get pricing strategies from the storage layer
      const pricingData = await storage.getPricingStrategies(companyId);
      
      if (!pricingData || pricingData.length === 0) {
        return next(new AppError(`No pricing strategies available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: pricingData
      });
    } catch (error) {
      logger.error(`Error fetching pricing strategies for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level marketing strategies
  app.get('/api/company/:id/marketing-strategies', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching marketing strategies for company ID: ${companyId}`);
    
    try {
      // Get marketing strategies from the storage layer
      const marketingData = await storage.getMarketingStrategies(companyId);
      
      if (!marketingData || marketingData.length === 0) {
        return next(new AppError(`No marketing strategies available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: marketingData
      });
    } catch (error) {
      logger.error(`Error fetching marketing strategies for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level revenue forecasts
  app.get('/api/company/:id/revenue-forecasts', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Fetching revenue forecasts for company ID: ${companyId}`);
    
    try {
      // Get revenue forecasts from the storage layer
      const forecastsData = await storage.getRevenueForecasts(companyId);
      
      if (!forecastsData || forecastsData.length === 0) {
        return next(new AppError(`No revenue forecasts available for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: forecastsData
      });
    } catch (error) {
      logger.error(`Error fetching revenue forecasts for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Company level focus group simulation
  app.post('/api/company/:id/focus-group', 
    biRateLimiter,
    validateCompanyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).companyId;
    logger.info(`Running focus group simulation for company ID: ${companyId}`);
    
    try {
      // Validate request body
      const { productConcept } = focusGroupSchema.parse(req.body);
      
      // Get focus group simulation from the storage layer
      const focusGroupData = await storage.getFocusGroupSimulation(companyId, productConcept);
      
      if (!focusGroupData) {
        return next(new AppError(`Failed to generate focus group simulation for company ${companyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: focusGroupData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid product concept format', 400));
      }
      logger.error(`Error generating focus group simulation for company ${companyId}:`, error);
      next(error);
    }
  });
  
  // Middleware to validate survey access permissions
  const validateSurveyAccess = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate parameters
      const { id } = idParamSchema.parse(req.params);
      const surveyId = parseInt(id);
      
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        logger.warn('Unauthorized access attempt to survey BI endpoint', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        });
        return next(new AppError('Authentication required', 401));
      }
      
      try {
        // Get the company ID for this survey
        const companyId = await getCompanyIdFromSurvey(surveyId);
        
        // Check if user has access to this company
        const userCompanyId = req.session.companyId;
        const userRole = req.session.userRole;
        
        // Allow platform admins to access any survey
        const isPlatformAdmin = userRole === 'platform_admin' || 
                              userRole === 'platform_support';
                              
        if (!isPlatformAdmin && userCompanyId !== companyId) {
          logger.warn('Survey access violation', {
            userId: req.session.userId,
            attemptedSurveyId: surveyId,
            surveyCompanyId: companyId,
            userCompanyId,
            userRole,
            ip: req.ip
          });
          return next(new AppError('You do not have access to this survey data', 403));
        }
        
        // Add survey ID and company ID to request for further use
        (req as any).surveyId = surveyId;
        (req as any).companyId = companyId;
        
        next();
      } catch (error) {
        // This is likely a "survey not found" error
        logger.error('Error validating survey access', error);
        return next(new AppError('Survey not found', 404));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(error);
      }
      next(error);
    }
  };
  
  // Survey-specific endpoints below
  // Survey specific competitor analysis
  app.get('/api/surveys/:id/competitors', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching competitors for survey ID: ${surveyId}`);
    
    try {
      // Get competitor analysis from the storage layer using company ID
      const competitorData = await storage.getCompetitorAnalysis(companyId);
      
      if (!competitorData || competitorData.length === 0) {
        return next(new AppError(`No competitor data available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: competitorData
      });
    } catch (error) {
      logger.error(`Error fetching competitor data for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific market fit analysis
  app.get('/api/surveys/:id/market-fit/:productId', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    
    try {
      // Validate productId parameter
      const { productId } = productIdParamSchema.parse(req.params);
      
      logger.info(`Fetching market fit for survey ID: ${surveyId}, product ID: ${productId}`);
      
      // Get market fit analysis from the storage layer using company ID
      const marketFitData = await storage.getMarketFitAnalysis(companyId, productId);
      
      if (!marketFitData) {
        return next(new AppError(`No market fit data available for survey ${surveyId} and product ${productId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: marketFitData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid product ID format', 400));
      }
      logger.error(`Error fetching market fit data for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific customer segments
  app.get('/api/surveys/:id/segments', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching segments for survey ID: ${surveyId}`);
    
    try {
      // Get customer segments from the storage layer using company ID
      const segmentsData = await storage.getCustomerSegments(companyId);
      
      if (!segmentsData || segmentsData.length === 0) {
        return next(new AppError(`No customer segments available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: segmentsData
      });
    } catch (error) {
      logger.error(`Error fetching customer segments for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific feature priorities
  app.get('/api/surveys/:id/feature-priorities', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching feature priorities for survey ID: ${surveyId}`);
    
    try {
      // Get feature priorities from the storage layer using company ID
      const featuresData = await storage.getProductFeaturePriorities(companyId);
      
      if (!featuresData || featuresData.length === 0) {
        return next(new AppError(`No feature priorities available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: featuresData
      });
    } catch (error) {
      logger.error(`Error fetching feature priorities for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific pricing strategies
  app.get('/api/surveys/:id/pricing-strategies', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching pricing strategies for survey ID: ${surveyId}`);
    
    try {
      // Get pricing strategies from the storage layer using company ID
      const pricingData = await storage.getPricingStrategies(companyId);
      
      if (!pricingData || pricingData.length === 0) {
        return next(new AppError(`No pricing strategies available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: pricingData
      });
    } catch (error) {
      logger.error(`Error fetching pricing strategies for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific marketing strategies
  app.get('/api/surveys/:id/marketing-strategies', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching marketing strategies for survey ID: ${surveyId}`);
    
    try {
      // Get marketing strategies from the storage layer using company ID
      const marketingData = await storage.getMarketingStrategies(companyId);
      
      if (!marketingData || marketingData.length === 0) {
        return next(new AppError(`No marketing strategies available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: marketingData
      });
    } catch (error) {
      logger.error(`Error fetching marketing strategies for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific revenue forecasts
  app.get('/api/surveys/:id/revenue-forecasts', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    logger.info(`Fetching revenue forecasts for survey ID: ${surveyId}`);
    
    try {
      // Get revenue forecasts from the storage layer using company ID
      const forecastsData = await storage.getRevenueForecasts(companyId);
      
      if (!forecastsData || forecastsData.length === 0) {
        return next(new AppError(`No revenue forecasts available for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: forecastsData
      });
    } catch (error) {
      logger.error(`Error fetching revenue forecasts for survey ${surveyId}:`, error);
      next(error);
    }
  });
  
  // Survey specific focus group simulation
  app.post('/api/surveys/:id/focus-group', 
    biRateLimiter,
    validateSurveyAccess,
    async (req: Request, res: Response, next: NextFunction) => {
    const surveyId = (req as any).surveyId;
    const companyId = (req as any).companyId;
    const { productConcept } = req.body;
    
    logger.info(`Running focus group simulation for survey ID: ${surveyId}`);
    
    if (!productConcept) {
      return next(new AppError('Product concept is required', 400));
    }
    
    try {
      // Validate the product concept length
      if (productConcept.length < 10 || productConcept.length > 1000) {
        return next(new AppError('Product concept must be between 10 and 1000 characters', 400));
      }
      
      // Get focus group simulation from the storage layer using company ID
      const focusGroupData = await storage.getFocusGroupSimulation(companyId, productConcept);
      
      if (!focusGroupData) {
        return next(new AppError(`Failed to generate focus group simulation for survey ${surveyId}`, 404));
      }
      
      res.json({
        status: 'success',
        data: focusGroupData
      });
    } catch (error) {
      logger.error(`Error generating focus group simulation for survey ${surveyId}:`, error);
      next(error);
    }
  });
}