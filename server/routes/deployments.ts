import type { Express, Response } from "express";
import { storage } from "../storage";
import { Logger } from "../utils/Logger";
import { 
  insertClientSurveyDeploymentSchema,
  UserRole,
  LicenseType
} from "../../shared/schema";
import { AuthenticatedRequest } from "../auth";

const logger = new Logger('Deployments');

export function registerDeploymentRoutes(app: Express) {
  // ============================================================================
  // CLIENT SURVEY DEPLOYMENT ROUTES
  // ============================================================================

  // Get all client survey deployments
  app.get('/api/deployments', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || (req.user.role !== UserRole.PLATFORM_ADMIN && req.user.role !== UserRole.BUSINESS_ADMIN)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Only administrators can view all deployments"
        });
      }

      const deployments = await storage.getClientSurveyDeployments();
      
      return res.json({
        success: true,
        deployments
      });
    } catch (error) {
      logger.error(`Error fetching deployments: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch deployments"
      });
    }
  });

  // Get client survey deployments for a specific client
  app.get('/api/clients/:clientId/deployments', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID format"
        });
      }

      // Check if client exists
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found"
        });
      }

      // Check permissions - only platform admins or the business admin who owns the client
      if (req.user.role !== UserRole.PLATFORM_ADMIN && 
          (req.user.role !== UserRole.BUSINESS_ADMIN || req.user.companyId !== client.companyId)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: You don't have access to this client's deployments"
        });
      }

      const deployments = await storage.getClientSurveyDeploymentsByClient(clientId);
      
      // Get survey details for each deployment to include in response
      const deploymentsWithDetails = await Promise.all(deployments.map(async (deployment) => {
        const survey = await storage.getSurvey(deployment.surveyId);
        return {
          ...deployment,
          survey: survey ? {
            id: survey.id,
            name: survey.name,
            description: survey.description,
            type: survey.type
          } : null
        };
      }));
      
      return res.json({
        success: true,
        deployments: deploymentsWithDetails
      });
    } catch (error) {
      logger.error(`Error fetching client deployments: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch client deployments"
      });
    }
  });

  // Get survey deployments for a specific survey
  app.get('/api/surveys/:surveyId/deployments', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const surveyId = parseInt(req.params.surveyId);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid survey ID format"
        });
      }

      // Check if survey exists
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({
          success: false,
          message: "Survey not found"
        });
      }

      // Check permissions - only platform admins or the business admin who owns the survey
      if (req.user.role !== UserRole.PLATFORM_ADMIN && 
          (req.user.role !== UserRole.BUSINESS_ADMIN || req.user.companyId !== survey.companyId)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: You don't have access to this survey's deployments"
        });
      }

      const deployments = await storage.getClientSurveyDeploymentsBySurvey(surveyId);
      
      // Get client details for each deployment to include in response
      const deploymentsWithDetails = await Promise.all(deployments.map(async (deployment) => {
        const client = await storage.getClientById(deployment.clientId);
        return {
          ...deployment,
          client: client ? {
            id: client.id,
            name: client.name,
            company: client.company,
            email: client.email
          } : null
        };
      }));
      
      return res.json({
        success: true,
        deployments: deploymentsWithDetails
      });
    } catch (error) {
      logger.error(`Error fetching survey deployments: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch survey deployments"
      });
    }
  });

  // Get a specific deployment by ID
  app.get('/api/deployments/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const deploymentId = parseInt(req.params.id);
      if (isNaN(deploymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid deployment ID format"
        });
      }

      const deployment = await storage.getClientSurveyDeploymentById(deploymentId);
      if (!deployment) {
        return res.status(404).json({
          success: false,
          message: "Deployment not found"
        });
      }

      // Get associated survey and client
      const survey = await storage.getSurvey(deployment.surveyId);
      const client = await storage.getClientById(deployment.clientId);

      // Check permissions - only platform admins or the business admin who owns the client or survey
      if (req.user.role !== UserRole.PLATFORM_ADMIN && 
          (req.user.role !== UserRole.BUSINESS_ADMIN || 
           (survey && req.user.companyId !== survey.companyId) || 
           (client && req.user.companyId !== client.companyId))) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: You don't have access to this deployment"
        });
      }

      return res.json({
        success: true,
        deployment: {
          ...deployment,
          survey: survey ? {
            id: survey.id,
            name: survey.name,
            description: survey.description,
            type: survey.type
          } : null,
          client: client ? {
            id: client.id,
            name: client.name,
            company: client.company,
            email: client.email
          } : null
        }
      });
    } catch (error) {
      logger.error(`Error fetching deployment: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch deployment"
      });
    }
  });

  // Create a new client survey deployment
  app.post('/api/deployments', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || (req.user.role !== UserRole.PLATFORM_ADMIN && req.user.role !== UserRole.BUSINESS_ADMIN)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Only administrators can create deployments"
        });
      }

      try {
        // Validate the request body
        const deploymentData = insertClientSurveyDeploymentSchema.parse(req.body);
        
        // Check if client exists
        const client = await storage.getClientById(deploymentData.clientId);
        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Client not found"
          });
        }
        
        // Check if survey exists
        const survey = await storage.getSurvey(deploymentData.surveyId);
        if (!survey) {
          return res.status(404).json({
            success: false,
            message: "Survey not found"
          });
        }
        
        // Check if client has the necessary license for the survey
        const license = client.licenseId ? await storage.getLicenseById(client.licenseId) : null;
        
        if (!license) {
          return res.status(400).json({
            success: false,
            message: "Client does not have an active license"
          });
        }
        
        // For Project License type, check if client already has a deployment
        // and enforce the 1-survey limit
        if (license.type === LicenseType.PROJECT) {
          const existingDeployments = await storage.getClientSurveyDeploymentsByClient(client.id);
          
          if (existingDeployments.length >= 1) {
            return res.status(400).json({
              success: false,
              message: "Client has a Project License which allows only 1 survey deployment. Please upgrade their license or remove the existing deployment."
            });
          }
        }
        
        // Create the deployment
        const newDeployment = await storage.createClientSurveyDeployment({
          ...deploymentData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create audit log for this action
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'survey_deployed',
          entityType: 'deployment',
          entityId: newDeployment.id.toString(),
          details: {
            surveyId: newDeployment.surveyId,
            clientId: newDeployment.clientId,
            status: newDeployment.status
          }
        });
        
        return res.status(201).json({
          success: true,
          message: "Survey deployed successfully",
          deployment: newDeployment
        });
      } catch (validationError: any) {
        logger.error("Deployment validation error:", validationError);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.errors || validationError
        });
      }
    } catch (error) {
      logger.error(`Error creating deployment: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to create deployment"
      });
    }
  });

  // Update a client survey deployment
  app.put('/api/deployments/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const deploymentId = parseInt(req.params.id);
      if (isNaN(deploymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid deployment ID format"
        });
      }

      // Check if deployment exists
      const deployment = await storage.getClientSurveyDeploymentById(deploymentId);
      if (!deployment) {
        return res.status(404).json({
          success: false,
          message: "Deployment not found"
        });
      }

      // Get associated survey and client for permission checking
      const survey = await storage.getSurvey(deployment.surveyId);
      const client = await storage.getClientById(deployment.clientId);

      // Check permissions - only platform admins or the business admin who owns the client or survey
      if (req.user.role !== UserRole.PLATFORM_ADMIN && 
          (req.user.role !== UserRole.BUSINESS_ADMIN || 
           (survey && req.user.companyId !== survey.companyId) || 
           (client && req.user.companyId !== client.companyId))) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: You don't have access to update this deployment"
        });
      }

      try {
        // Parse and validate the request data
        const updateData = req.body;
        
        // If updating the survey, check if the survey exists
        if (updateData.surveyId) {
          const newSurvey = await storage.getSurvey(updateData.surveyId);
          if (!newSurvey) {
            return res.status(404).json({
              success: false,
              message: "Survey not found"
            });
          }
        }
        
        // Update the deployment
        const updatedDeployment = await storage.updateClientSurveyDeployment(deploymentId, {
          ...updateData,
          updatedAt: new Date()
        });
        
        if (!updatedDeployment) {
          return res.status(500).json({
            success: false,
            message: "Failed to update deployment"
          });
        }
        
        // Create audit log for this action
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'deployment_updated',
          entityType: 'deployment',
          entityId: deploymentId.toString(),
          details: {
            ...updateData,
            clientId: client?.id,
            surveyId: survey?.id
          }
        });
        
        return res.json({
          success: true,
          message: "Deployment updated successfully",
          deployment: updatedDeployment
        });
      } catch (validationError: any) {
        logger.error("Deployment update validation error:", validationError);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.errors || validationError
        });
      }
    } catch (error) {
      logger.error(`Error updating deployment: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to update deployment"
      });
    }
  });

  // Delete a client survey deployment
  app.delete('/api/deployments/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const deploymentId = parseInt(req.params.id);
      if (isNaN(deploymentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid deployment ID format"
        });
      }

      // Check if deployment exists
      const deployment = await storage.getClientSurveyDeploymentById(deploymentId);
      if (!deployment) {
        return res.status(404).json({
          success: false,
          message: "Deployment not found"
        });
      }

      // Get associated survey and client for permission checking
      const survey = await storage.getSurvey(deployment.surveyId);
      const client = await storage.getClientById(deployment.clientId);

      // Check permissions - only platform admins or business admins who own the client or survey
      if (req.user.role !== UserRole.PLATFORM_ADMIN && 
          (req.user.role !== UserRole.BUSINESS_ADMIN || 
           (survey && req.user.companyId !== survey.companyId) || 
           (client && req.user.companyId !== client.companyId))) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: You don't have access to delete this deployment"
        });
      }

      // Delete the deployment
      await storage.deleteClientSurveyDeployment(deploymentId);
      
      // Create audit log for this action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'deployment_deleted',
        entityType: 'deployment',
        entityId: deploymentId.toString(),
        details: {
          clientId: deployment.clientId,
          surveyId: deployment.surveyId,
          status: deployment.status
        }
      });
      
      return res.json({
        success: true,
        message: "Deployment deleted successfully"
      });
    } catch (error) {
      logger.error(`Error deleting deployment: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to delete deployment"
      });
    }
  });
}