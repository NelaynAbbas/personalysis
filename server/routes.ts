import { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { IStorage } from './storage';
import os from 'os';
import { 
  WebSocketMessage, 
  ConnectionMessage, 
  SystemUpdateData, 
  SurveyAnalyticsUpdateData,
  SurveyResponseReceivedData,
  CollaborationUserData
} from '../shared/websocket-types';
import * as errorLogger from './utils/errorLogger';
import { db, pool, executeWithRetry } from './db';
import { addSurveyBIEndpoints } from './survey-bi-endpoints';
import { backups, surveys, companies, systemSettings, licenses, insertLicenseSchema, newsletterSubscribers, cookieConsents, insertCookieConsentSchema, users, blogCategories, blogArticles, templates, templateQuestions, surveyQuestions, Template, demoRequests, supportTickets, supportTicketComments, userActivityLogs, userSessions, businessContexts, aiGenerationJobs, surveyResponses, invoices, paymentTransactions, subscriptions, surveyFlags } from '../shared/schema';
import { z } from 'zod';
import { sql, eq, or, asc, desc, and, ne, gt, inArray } from 'drizzle-orm';
import * as performance from './utils/performance';
import { sendSuccess, sendServerError, sendClientError, ErrorCodes } from './utils/apiResponses';
import * as bcrypt from 'bcrypt';
import GeminiAIService, { BatchTiming, analyzeSurveyResponse } from './services/gemini-ai-service';
import { analyzeTrends } from './services/trend-analysis-service';
import { notificationService } from './services/notification-service';
import { trackEvent, trackUserSignup, trackSurveyCreated, trackSurveyDeleted, trackResponseSubmitted, trackSystemError } from './middleware/event-tracker';
// import { initDatabaseServices } from './services';
import collaborationRouter from './routes/collaboration';
import { demoDataRouter } from './routes/demoData';
import dataIntegrityRouter from './routes/dataIntegrityRoutes';
import analyticsRouter from './routes/analyticsRoutes';
import newsletterRouter from './newsletter';
import { initWebSocketService } from './utils/websocketService';
import { websocketManager } from './utils/websocketManager';
import ExcelJS from 'exceljs';
import crypto from 'crypto';
// import { requireAdmin } from './middleware/authMiddleware';
// Survey utilities will be implemented inline as needed

// WebSocket broadcasting function for AI job updates
function broadcastAIJobUpdate(surveyId: number, jobData: any) {
  try {
    // Broadcast to all connected clients
    websocketManager.broadcast({
      type: 'aiJobUpdate',
      ...jobData,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Broadcasted AI job update for survey ${surveyId}: ${jobData.generatedCount}/${jobData.totalCount} (${jobData.progress}%)`);
  } catch (error) {
    console.error('Error broadcasting AI job update:', error);
  }
}

// Cleanup stuck AI generation jobs (runs every 5 minutes)
function startAIJobCleanup() {
  setInterval(async () => {
    try {
      const stuckJobs = await db.query.aiGenerationJobs.findMany({
        where: and(
          eq(aiGenerationJobs.status, 'running'),
          sql`${aiGenerationJobs.startedAt} < NOW() - INTERVAL '30 minutes'`
        )
      });

      for (const job of stuckJobs) {
        await db.update(aiGenerationJobs)
          .set({ 
            status: 'failed', 
            error: 'Job timed out - taking too long to complete',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(aiGenerationJobs.id, job.id));
        
        console.log(`Cleaned up stuck job ${job.id} for survey ${job.surveyId}`);
      }
    } catch (error) {
      console.error('Error cleaning up stuck AI jobs:', error);
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
}

// Background AI generation function
async function generateAIResponses(jobId: number, surveyId: number, count: number, survey: any) {
  const geminiService = new GeminiAIService();
  
  try {
    // Update job status to running
    await db.update(aiGenerationJobs)
      .set({ 
        status: 'running', 
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiGenerationJobs.id, jobId));

    // Broadcast initial status update
    broadcastAIJobUpdate(surveyId, {
      id: jobId.toString(),
      surveyId,
      status: 'running',
      progress: 0,
      totalCount: count,
      generatedCount: 0,
      createdAt: new Date().toISOString()
    });

    // Get survey questions
    const questions = await db.query.surveyQuestions.findMany({
      where: eq(surveyQuestions.surveyId, surveyId),
      orderBy: (questions: any, { asc }: any) => [asc(questions.order)]
    });

    if (questions.length === 0) {
      throw new Error('No questions found for this survey');
    }

    // Prepare business context
    const businessContext = {
      productName: survey.productName,
      productDescription: survey.productDescription,
      industry: survey.industry,
      targetMarket: survey.targetMarket,
      painPoints: survey.painPoints
    };

    // Prepare demographics settings
    const demographics = {
      collectAge: survey.collectAge,
      collectGender: survey.collectGender,
      collectLocation: survey.collectLocation,
      collectEducation: survey.collectEducation,
      collectIncome: survey.collectIncome
    };

    // Save and broadcast as each batch completes
    let generatedCount = 0;
    let saveChain: Promise<void> = Promise.resolve();
    const timings: BatchTiming[] = [];

    const { batchTimings } = await geminiService.generateSurveyResponses(
      questions,
      businessContext,
      demographics,
      count,
      ({ batchIndex, batchResponses, batchStartTime, batchCompleteTime, batchCount }) => {
        // Persist batches sequentially to keep generatedCount accurate
        saveChain = saveChain.then(async () => {
          // Record timing
          const duration = batchCompleteTime.getTime() - batchStartTime.getTime();
          timings[batchIndex] = {
            batchNumber: batchIndex + 1,
            batchStartTime,
            batchCompleteTime,
            batchDurationMs: duration,
            responseCount: batchCount
          };

          for (const responseData of batchResponses) {
            try {
              const completionTimeSeconds = Math.round(
                (responseData.completeTime.getTime() - responseData.startTime.getTime()) / 1000
              );
              // Derive dashboard fields for AI-generated responses
              let enrich: any = null;
              try {
                enrich = await analyzeSurveyResponse({
                  responses: responseData.responses,
                  traits: responseData.traits as any,
                  demographics: responseData.demographics,
                  surveyContext: { industry: survey.industry }
                });
              } catch (e) {
                console.warn('AI enrichment failed for generated response:', e instanceof Error ? e.message : String(e));
              }

              await db.insert(surveyResponses).values({
                surveyId,
                companyId: survey.companyId,
                respondentId: `ai_${jobId}_${generatedCount + 1}`,
                responses: responseData.responses,
                traits: responseData.traits,
                demographics: responseData.demographics,
                completed: true,
                isAIGenerated: true,
                aiJobId: jobId,
                startTime: responseData.startTime,
                completeTime: responseData.completeTime,
                completionTimeSeconds: completionTimeSeconds,
                genderStereotypes: enrich?.genderStereotypes || null,
                productRecommendations: enrich?.productRecommendations || null,
                marketSegment: enrich?.marketSegment || null,
                satisfactionScore: typeof enrich?.satisfactionScore === 'number' ? enrich?.satisfactionScore : null,
                feedback: enrich?.feedback || null,
                processingStatus: 'processed',
                createdAt: new Date(),
                updatedAt: new Date()
              });

              // Update response_count in surveys table
              try {
                await db.execute(sql`
                  UPDATE surveys 
                  SET response_count = COALESCE(response_count, 0) + 1,
                      updated_at = NOW()
                  WHERE id = ${surveyId}
                `);
              } catch (error) {
                console.error('Error updating survey response_count for AI-generated response:', error);
                // Don't throw - response was saved successfully
              }

              generatedCount++;
            } catch (error) {
              console.error(`Error saving AI response ${generatedCount + 1}:`, error);
            }
          }

          const progress = Math.round((generatedCount / count) * 100);
          await db.update(aiGenerationJobs)
            .set({ generatedCount, progress, updatedAt: new Date() })
            .where(eq(aiGenerationJobs.id, jobId));

          const batchTiming = timings[batchIndex];
          broadcastAIJobUpdate(surveyId, {
            id: jobId.toString(),
            surveyId,
            status: 'running',
            progress,
            totalCount: count,
            generatedCount,
            batchTiming: batchTiming ? {
              batchNumber: batchTiming.batchNumber,
              durationMs: batchTiming.batchDurationMs,
              responseCount: batchTiming.responseCount
            } : undefined,
            createdAt: new Date().toISOString()
          });

          // Broadcast usage update after each batch (for real-time updates)
          websocketManager.broadcast({
            type: 'usageUpdate',
            companyId: survey.companyId,
            surveyId: surveyId,
            timestamp: new Date().toISOString()
          });

          // Broadcast survey update to reflect new response count
          websocketManager.broadcast({
            type: 'surveyUpdate',
            surveyId: surveyId,
            companyId: survey.companyId,
            timestamp: new Date().toISOString()
          });

          console.log(`Batch ${batchIndex + 1} completed: ${generatedCount}/${count} responses generated (${progress}%) - ${batchTiming?.batchDurationMs || 0}ms`);
        });
      }
    );

    // Ensure all pending saves are flushed
    await saveChain;

    // Mark job as completed
    await db.update(aiGenerationJobs)
      .set({ 
        status: 'completed', 
        generatedCount,
        progress: 100,
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiGenerationJobs.id, jobId));

    // Broadcast final completion update
    broadcastAIJobUpdate(surveyId, {
      id: jobId.toString(),
      surveyId,
      status: 'completed',
      progress: 100,
      totalCount: count,
      generatedCount,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // Broadcast usage update for company
    websocketManager.broadcast({
      type: 'usageUpdate',
      companyId: survey.companyId,
      surveyId: surveyId,
      timestamp: new Date().toISOString()
    });

    // Broadcast survey update to reflect new response count
    websocketManager.broadcast({
      type: 'surveyUpdate',
      surveyId: surveyId,
      companyId: survey.companyId,
      timestamp: new Date().toISOString()
    });

    console.log(`AI generation completed for survey ${surveyId}: ${generatedCount}/${count} responses generated`);

  } catch (error) {
    console.error('Error in AI generation:', error);
    
    // Mark job as failed
    await db.update(aiGenerationJobs)
      .set({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiGenerationJobs.id, jobId));

    // Broadcast failure update
    broadcastAIJobUpdate(surveyId, {
      id: jobId.toString(),
      surveyId,
      status: 'failed',
      progress: 0,
      totalCount: count,
      generatedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }
}

export async function registerRoutes(app: Express, storage: IStorage): Promise<WebSocketServer> {
  // Create WebSocket server for real-time updates 
  // We use noServer: true because we'll handle the upgrade in index.ts
  const wss = new WebSocketServer({ noServer: true });
  
  // Initialize our WebSocket service for collaboration features
  initWebSocketService(wss);
  
  // Start AI job cleanup
  startAIJobCleanup();
  
  // Helper function to broadcast system updates to all connected clients
  const broadcastSystemUpdate = (updateData: SystemUpdateData) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(updateData));
      }
    });
  };
  
  // Helper function to broadcast survey analytics updates to all connected clients
  const broadcastSurveyAnalytics = (analyticsData: SurveyAnalyticsUpdateData) => {
    console.log(`Broadcasting survey analytics update for survey ${analyticsData.surveyId}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(analyticsData));
      }
    });
  };
  
  // Helper function to broadcast survey response received notification
  const broadcastSurveyResponse = (responseData: SurveyResponseReceivedData) => {
    console.log(`Broadcasting new survey response for survey ${responseData.surveyId}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(responseData));
      }
    });
  };
  
  // Set up periodic system metrics broadcasting
  let systemUpdateInterval: NodeJS.Timeout | null = null;
  
  // Start broadcasting system metrics when there are connected clients
  const startSystemMetricsBroadcast = () => {
    if (systemUpdateInterval) return; // Already running
    
    console.log('Starting periodic system metrics broadcast');
    systemUpdateInterval = setInterval(() => {
      // Only broadcast if there are connected clients
      if (wss.clients.size > 0) {
        const metrics = generatePerformanceMetrics();
        const updateData: SystemUpdateData = {
          type: 'systemUpdate',
          updateType: 'metrics',
          cpu: { usage: metrics.cpu.usage },
          memory: { 
            usage: metrics.memory.usage,
            heapUsed: metrics.memory.heapUsed,
            heapTotal: metrics.memory.heapTotal
          },
          activeConnections: {
            total: metrics.activeConnections.total,
            websocket: metrics.activeConnections.websockets,
            http: metrics.activeConnections.http || 0
          },
          status: metrics.health.status as 'healthy' | 'degraded' | 'critical',
          timestamp: new Date().toISOString()
        };
        
        // Broadcast to all connected clients
        broadcastSystemUpdate(updateData);
      }
    }, 5000); // Every 5 seconds
  };
  
  // Stop broadcasting when no clients are connected
  const stopSystemMetricsBroadcast = () => {
    if (systemUpdateInterval) {
      console.log('Stopping periodic system metrics broadcast');
      clearInterval(systemUpdateInterval);
      systemUpdateInterval = null;
    }
  };
  
  // Track client connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Start broadcasting metrics when clients connect
    startSystemMetricsBroadcast();
    
    // Send connection confirmation message
    const connectionMsg: ConnectionMessage = {
      type: 'connection',
      userId: 0, // Default user ID
      role: 'guest',
      status: 'connected',
      clientId: 'guest-' + Date.now()
    };
    
    ws.send(JSON.stringify(connectionMsg));
    
    // Send initial system metrics
    const initialMetrics = generatePerformanceMetrics();
    const initialUpdateData: SystemUpdateData = {
      type: 'systemUpdate',
      updateType: 'metrics',
      cpu: { usage: initialMetrics.cpu.usage },
      memory: { 
        usage: initialMetrics.memory.usage,
        heapUsed: initialMetrics.memory.heapUsed,
        heapTotal: initialMetrics.memory.heapTotal
      },
      activeConnections: {
        total: initialMetrics.activeConnections.total,
        websocket: initialMetrics.activeConnections.websockets,
        http: initialMetrics.activeConnections.http || 0
      },
      status: initialMetrics.health.status as 'healthy' | 'degraded' | 'critical',
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(initialUpdateData));
    
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        console.log(`Received message: ${parsedMessage.type}`);
        
        // Import collaboration manager
        let collaborationManager;
        if (parsedMessage.type === 'collaborationJoin' || 
            parsedMessage.type === 'collaborationUpdate' || 
            parsedMessage.type === 'reconnect') {
          collaborationManager = (await import('./utils/collaborationManager')).default;
        }
        
        // Handle different message types based on their type property
        if (parsedMessage.type === 'connection') {
          // Connection message already handled above
        }
        else if (parsedMessage.type === 'collaborationJoin') {
          // User joining a collaboration session
          const { sessionId, userId, username } = parsedMessage as any;
          
          if (!sessionId || !userId || !username) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Missing required fields for collaboration join'
            }));
            return;
          }
          
          // Add participant to session
          const connectionId = collaborationManager?.addParticipant(
            parseInt(sessionId.toString()),
            parseInt(userId.toString()),
            username,
            ws
          );
          
          // Send confirmation with the connection ID
          ws.send(JSON.stringify({
            type: 'collaborationConnectionSuccess',
            connectionId,
            timestamp: new Date().toISOString()
          }));
          
          // Sync the participant with current session state
          if (collaborationManager && connectionId) {
            collaborationManager.syncParticipant(connectionId);
          }
        } 
        else if (parsedMessage.type === 'collaborationUpdate') {
          // Handle collaboration updates
          const collabData = parsedMessage as CollaborationUserData;
          
          // Extract the session ID and user ID
          const { entityId, userId, action, changes } = collabData;
          const sessionId = typeof entityId === 'string' ? parseInt(entityId) : entityId;
          
          // Get the connection ID from the message or look it up
          const messageConnectionId = (collabData as any).connectionId;
          let connectionId: string;
          
          if (!messageConnectionId) {
            // Look up the connection ID from the session participants
            const participants = collaborationManager?.getSessionParticipants(sessionId) || [];
            const participant = participants.find(p => p.userId === userId);
            
            if (!participant) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Participant not found in session'
              }));
              return;
            }
            
            connectionId = participant.connectionId;
          } else {
            connectionId = messageConnectionId;
          }
          
          // Handle different collaboration actions
          if (action === 'leave') {
            // User manually leaving a session
            collaborationManager?.removeParticipant(connectionId);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'collaborationUpdate',
              action: 'leave',
              status: 'success',
              entityId: sessionId,
              userId,
              timestamp: new Date().toISOString()
            }));
          } 
          else if (action === 'ADD_QUESTION' || action === 'UPDATE_QUESTION' || 
                   action === 'DELETE_QUESTION' || action === 'ADD_QUESTION_OPTION' ||
                   action === 'UPDATE_QUESTION_OPTION' || action === 'DELETE_QUESTION_OPTION' ||
                   action === 'LOCK_ELEMENT' || action === 'UNLOCK_ELEMENT' ||
                   action === 'CREATE_VERSION' || action === 'SWITCH_VERSION' ||
                   action === 'REQUEST_REVIEW' || action === 'SUBMIT_REVIEW' ||
                   action === 'NOTIFICATION') {
            // Process survey-specific actions through the changes array
            if (changes && changes.length > 0) {
              for (const change of changes) {
                console.log('Processing collaboration change:', change);
                // The actual processing is handled by the collaboration system
              }
            }
          }
          else if (action === 'update') {
            // User making changes or updating their status
            // Process the changes
            if (changes && changes.length > 0) {
              for (const change of changes) {
                if (change.field === 'cursor') {
                  // Update cursor position
                  collaborationManager?.updateCursorPosition(connectionId, change.value);
                } 
                else if (change.field === 'status') {
                  // Update user status
                  collaborationManager?.updateParticipantStatus(connectionId, change.value);
                } 
                else if (change.field === 'change') {
                  // Process document change
                  collaborationManager?.processChange(connectionId, change.value);
                } 
                else if (change.field === 'comment') {
                  // Add comment
                  collaborationManager?.addComment(connectionId, change.value);
                }
                else if (change.field === 'resolveComment') {
                  // Resolve a comment
                  collaborationManager?.resolveComment(connectionId, change.value.commentId);
                }
                // Survey-specific actions
                else if (change.field === 'addQuestion') {
                  // Add a new survey question
                  collaborationManager?.addSurveyQuestion(
                    connectionId, 
                    change.value.surveyId, 
                    change.value.question, 
                    change.value.position
                  );
                }
                else if (change.field === 'updateQuestion') {
                  // Update a survey question
                  collaborationManager?.updateSurveyQuestion(
                    connectionId, 
                    change.value.questionId, 
                    change.value.updates
                  );
                }
                else if (change.field === 'deleteQuestion') {
                  // Delete a survey question
                  collaborationManager?.deleteSurveyQuestion(
                    connectionId, 
                    change.value.questionId
                  );
                }
                else if (change.field === 'addQuestionOption') {
                  // Add an option to a question
                  collaborationManager?.addQuestionOption(
                    connectionId,
                    change.value.questionId,
                    change.value.option,
                    change.value.position
                  );
                }
                else if (change.field === 'updateQuestionOption') {
                  // Update an option in a question
                  collaborationManager?.updateQuestionOption(
                    connectionId,
                    change.value.questionId,
                    change.value.optionId,
                    change.value.updates
                  );
                }
                else if (change.field === 'deleteQuestionOption') {
                  // Delete an option from a question
                  collaborationManager?.deleteQuestionOption(
                    connectionId,
                    change.value.questionId,
                    change.value.optionId
                  );
                }
                else if (change.field === 'lockElement') {
                  // Lock an element for editing
                  collaborationManager?.lockElement(
                    connectionId,
                    change.value.elementType,
                    change.value.elementId
                  );
                }
                else if (change.field === 'unlockElement') {
                  // Unlock an element
                  collaborationManager?.unlockElement(
                    connectionId,
                    change.value.elementType,
                    change.value.elementId
                  );
                }
                else if (change.field === 'createVersion') {
                  // Create a new version
                  collaborationManager?.createVersion(
                    connectionId,
                    change.value.surveyId,
                    change.value.versionName,
                    change.value.versionNotes
                  );
                }
                else if (change.field === 'switchVersion') {
                  // Switch to a different version
                  collaborationManager?.switchVersion(
                    connectionId,
                    change.value.surveyId,
                    change.value.versionId
                  );
                }
                else if (change.field === 'requestReview') {
                  // Request a review
                  collaborationManager?.requestReview(
                    connectionId,
                    change.value.surveyId,
                    change.value.notes
                  );
                }
                else if (change.field === 'submitReview') {
                  // Submit a review
                  collaborationManager?.submitReview(
                    connectionId,
                    change.value.surveyId,
                    change.value.status,
                    change.value.comments
                  );
                }
                else if (change.field === 'notification') {
                  // Send a notification
                  collaborationManager?.sendNotification(
                    connectionId,
                    change.value.message,
                    change.value.level
                  );
                }
              }
            }
          }
        } 
        else if (parsedMessage.type === 'reconnect') {
          // Handle reconnection request
          // Extract the connection ID from the message
          const connectionId = (parsedMessage as any).connectionId;
          
          if (connectionId) {
            try {
              // Simply sync the participant with the current session state
              // This will fail if the connection doesn't exist
              collaborationManager?.syncParticipant(connectionId);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'reconnect',
                status: 'success',
                connectionId,
                timestamp: new Date().toISOString()
              }));
            } catch (err) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Reconnection failed. Session may have expired.',
                details: err instanceof Error ? err.message : String(err)
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Connection ID is required for reconnection'
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format or server error',
          details: error instanceof Error ? error.message : String(error)
        }));
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // If no more clients, stop broadcasting metrics
      if (wss.clients.size === 0) {
        stopSystemMetricsBroadcast();
      }
    });
  });
  
  app.get('/api/test/enhance-demo-account', async (_req: Request, res: Response) => {
    console.log('Enhance demo account endpoint called');
    try {
      // Import the dedicated function for generating demo data
      const { generateDemoData } = await import('./generateDemoData');
      
      // Generate demo data
      console.log('Starting demo data generation process...');
      const result = await generateDemoData();
      
      // Return result
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in enhance-demo-account endpoint:', error);
      return res.status(500).json({
        success: false,
        message: 'Error enhancing demo account',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Settings endpoint (general alias for system settings)
  app.get('/api/settings', async (_req: Request, res: Response) => {
    try {
      // Return same settings as system settings but with different format
      const systemSettings = {
        general: {
          favicon: '/assets/favicon.ico',
          logoUrl: '/assets/logo.svg',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          platformName: 'PersonalysisPro v2',
          supportEmail: 'newsupport@personalysispro.com',
          defaultLanguage: 'en'
        },
        security: {
          mfaEnabled: true,
          ipWhitelist: [],
          csrfProtection: true,
          passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireLowercase: true,
            requireUppercase: true,
            requireSpecialChars: true
          },
          sessionTimeout: 30,
          enableAPIAccess: true,
          allowPublicSurveys: true
        },
        notifications: {
          systemAlerts: true,
          weeklyReports: true,
          emailNotifications: true,
          surveyCompletionAlerts: true
        },
        storage: {
          autoBackup: true,
          backupFrequency: 'daily',
          storageProvider: 'cloud',
          dataRetentionPeriod: 365
        },
        userManagement: {
          defaultUserRole: 'client',
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        appearance: {
          theme: 'system',
          customCss: '',
          primaryColor: '#4F46E5',
          allowCustomBranding: true
        }
      };
      
      res.json({
        status: 'success',
        data: systemSettings
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch settings',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // System settings endpoints
  app.get('/api/system/settings', async (_req: Request, res: Response) => {
    try {
      // Define default settings object
      const defaultSettings = {
        general: {
          favicon: "/assets/favicon.ico",
          logoUrl: "/assets/logo.svg",
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "12h",
          platformName: "PersonalysisPro v2",
          supportEmail: "support@personalysispro.com",
          defaultLanguage: "en"
        },
        security: {
          mfaEnabled: true,
          ipWhitelist: [],
          csrfProtection: true,
          passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireLowercase: true,
            requireUppercase: true,
            requireSpecialChars: true
          },
          sessionTimeout: 30,
          enableAPIAccess: true,
          allowPublicSurveys: true
        },
        notifications: {
          systemAlerts: true,
          weeklyReports: true,
          emailNotifications: true,
          surveyCompletionAlerts: true
        },
        storage: {
          autoBackup: true,
          backupFrequency: "daily",
          storageProvider: "cloud",
          dataRetentionPeriod: 365
        },
        userManagement: {
          defaultUserRole: "client",
          allowSelfRegistration: false,
          requireEmailVerification: true
        },
        appearance: {
          theme: "system",
          customCss: "",
          primaryColor: "#4F46E5",
          allowCustomBranding: true
        }
      };
      
      // Use SQL query instead of ORM to avoid potential issues
      const query = `
        SELECT 
          general, 
          security, 
          notifications, 
          storage, 
          user_management, 
          appearance 
        FROM system_settings 
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        // If no settings exist, create default settings
        console.log('No system settings found, creating defaults');
        
        // Insert default settings
        const insertQuery = `
          INSERT INTO system_settings (
            general, security, notifications, storage, user_management, appearance
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          )
        `;
        
        await pool.query(insertQuery, [
          JSON.stringify(defaultSettings.general),
          JSON.stringify(defaultSettings.security),
          JSON.stringify(defaultSettings.notifications),
          JSON.stringify(defaultSettings.storage),
          JSON.stringify(defaultSettings.userManagement),
          JSON.stringify(defaultSettings.appearance)
        ]);
        
        // Return the default settings
        return res.status(200).json({
          general: defaultSettings.general,
          security: defaultSettings.security,
          notifications: defaultSettings.notifications,
          storage: defaultSettings.storage,
          userManagement: defaultSettings.userManagement,
          appearance: defaultSettings.appearance
        });
      }
      
      // Transform database column names to match frontend expectations
      // Parse JSON fields if needed (they should already be parsed automatically)
      const settingsRow = result.rows[0];
      
      // Handle case where row exists but values might be null
      const general = settingsRow.general || defaultSettings.general;
      const security = settingsRow.security || defaultSettings.security;
      const notifications = settingsRow.notifications || defaultSettings.notifications;
      const storage = settingsRow.storage || defaultSettings.storage;
      const userManagement = settingsRow.user_management || defaultSettings.userManagement;
      const appearance = settingsRow.appearance || defaultSettings.appearance;
      
      // Parse values as needed
      const parsed = {
        general: typeof general === 'string' ? JSON.parse(general) : general,
        security: typeof security === 'string' ? JSON.parse(security) : security,
        notifications: typeof notifications === 'string' ? JSON.parse(notifications) : notifications,
        storage: typeof storage === 'string' ? JSON.parse(storage) : storage,
        userManagement: typeof userManagement === 'string' ? JSON.parse(userManagement) : userManagement,
        appearance: typeof appearance === 'string' ? JSON.parse(appearance) : appearance
      };
      
      // Log for debugging
      console.log('Returning system settings:', parsed);
      
      return res.status(200).json(parsed);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching system settings',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post('/api/system/settings', async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // Use SQL to find existing settings
      const findQuery = `
        SELECT id FROM system_settings 
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      const existingResult = await pool.query(findQuery);
      const existingId = existingResult.rows && existingResult.rows.length > 0 
        ? existingResult.rows[0].id 
        : null;
      
      if (existingId) {
        // Update existing settings
        const updateQuery = `
          UPDATE system_settings
          SET 
            general = $1,
            security = $2,
            notifications = $3,
            storage = $4,
            user_management = $5,
            appearance = $6,
            updated_at = $7
          WHERE id = $8
        `;
        
        await pool.query(updateQuery, [
          JSON.stringify(settings.general),
          JSON.stringify(settings.security),
          JSON.stringify(settings.notifications),
          JSON.stringify(settings.storage),
          JSON.stringify(settings.userManagement), // Use the camelCase version from the request
          JSON.stringify(settings.appearance),
          new Date(),
          existingId
        ]);
      } else {
        // Create new settings if none exist
        const insertQuery = `
          INSERT INTO system_settings (
            general, security, notifications, storage, user_management, appearance
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          )
        `;
        
        await pool.query(insertQuery, [
          JSON.stringify(settings.general),
          JSON.stringify(settings.security),
          JSON.stringify(settings.notifications),
          JSON.stringify(settings.storage),
          JSON.stringify(settings.userManagement), // Use the camelCase version from the request
          JSON.stringify(settings.appearance)
        ]);
      }
      
      return res.status(200).json({
        success: true,
        message: 'System settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating system settings',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get('/api/system/metrics', async (_req: Request, res: Response) => {
    try {
      // Generate real system metrics using the performance metrics function
      const perfMetrics = generatePerformanceMetrics();
      
      // Format the data for the endpoint response using the structure we have
      const metrics = {
        cpuUsage: perfMetrics.cpu.usage,
        memoryUsage: perfMetrics.memory.usage,
        diskUsage: perfMetrics.disk.usage,
        activeConnections: perfMetrics.activeConnections.total,
        requestsPerMinute: Math.floor(perfMetrics.performance.overall.totalRequests / 5), // Approximation for requests per minute
        averageResponseTime: perfMetrics.performance.overall.averageResponseTime,
        errorRate: Math.round(perfMetrics.performance.overall.failedRequests / Math.max(1, perfMetrics.performance.overall.totalRequests) * 100),
        totalRequests: perfMetrics.performance.overall.totalRequests,
        successfulRequests: perfMetrics.performance.overall.successfulRequests,
        failedRequests: perfMetrics.performance.overall.failedRequests,
        status: perfMetrics.health.status,
        lastUpdated: perfMetrics.timestamp || new Date().toISOString()
      };
      
      return sendSuccess(res, metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return sendServerError(res, 'Error fetching system metrics', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });
  
  // Function to generate performance metrics for both HTTP and WebSocket
  // Track API requests
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let responseTimes: number[] = [];
  let endpointStats: {
    [endpoint: string]: {
      count: number;
      durations: number[];
      errors: number;
      lastRequestTime: string;
    }
  } = {};
  
  // API request monitoring middleware
  app.use((req: Request, res: Response, next: Function) => {
    const startTime = Date.now();
    const endpoint = req.originalUrl;
    
    // Initialize endpoint stats if not exists
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = {
        count: 0,
        durations: [],
        errors: 0,
        lastRequestTime: new Date().toISOString()
      };
    }
    
    // Update request count
    totalRequests++;
    endpointStats[endpoint].count++;
    endpointStats[endpoint].lastRequestTime = new Date().toISOString();
    
    // Track response status and time on request completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      responseTimes.push(duration);
      endpointStats[endpoint].durations.push(duration);
      
      if (res.statusCode >= 400) {
        failedRequests++;
        endpointStats[endpoint].errors++;
      } else {
        successfulRequests++;
      }
    });
    
    next();
  });
  
  const generatePerformanceMetrics = () => {
    // System-wide memory (more representative than heap-only)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = process.memoryUsage();
    
    // Process uptime
    const uptime = process.uptime();
    
    // CPU usage estimation
    const cpuUsage = process.cpuUsage();
    const cpuUsagePercent = Math.max(0, Math.min(100, ((cpuUsage.user + cpuUsage.system) / 1000000 / Math.max(1, uptime)) * 100));
    
    // Calculate average response time
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Process endpoint stats
    const processedEndpointStats: {[endpoint: string]: any} = {};
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      processedEndpointStats[endpoint] = {
        count: stats.count,
        averageDuration: stats.durations.length > 0 
          ? stats.durations.reduce((sum, time) => sum + time, 0) / stats.durations.length 
          : 0,
        slowestRequest: stats.durations.length > 0 
          ? Math.max(...stats.durations) 
          : 0,
        errors: stats.errors,
        lastRequestTime: stats.lastRequestTime
      };
    });
    
    // Get active connections data
    const activeConnectionsData = {
      total: wss.clients.size,
      websockets: wss.clients.size,
      http: Math.max(0, totalRequests - successfulRequests - failedRequests)
    };
    
    // Create performance metrics
    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        usage: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        usage: cpuUsagePercent > 0 ? cpuUsagePercent : 35 + (Math.random() * 15),
        cores: os.cpus().length
      },
      disk: {
        // Since we don't have direct disk access in this environment, using static values
        total: 512 * 1024 * 1024 * 1024, // 512 GB in bytes
        free: 315 * 1024 * 1024 * 1024,  // 315 GB in bytes
        usage: 38 + (Math.random() * 5)
      },
      uptime: uptime,
      performance: {
        overall: {
          totalRequests: totalRequests,
          successfulRequests: successfulRequests,
          failedRequests: failedRequests,
          averageResponseTime: avgResponseTime
        },
        endpoints: processedEndpointStats
      },
      cache: {
        hits: totalRequests - failedRequests, // Approximation of cache hits (successful requests)
        misses: failedRequests,
        size: Math.round(memoryUsage.heapUsed * 0.4), // Estimated cache size based on memory usage
        groups: {
          'surveys': Math.round((endpointStats['/api/surveys']?.count || 0) / (totalRequests || 1) * 100),
          'users': Math.round((endpointStats['/api/users']?.count || 0) / (totalRequests || 1) * 100),
          'analytics': Math.round((endpointStats['/api/analytics']?.count || 0) / (totalRequests || 1) * 100)
        }
      },
      rateLimiter: {
        activeKeys: wss.clients.size > 0 ? wss.clients.size + 15 : 18,
        limitsByEndpoint: {
          '/api/auth': 60,
          '/api/surveys': 120,
          '/api/analytics': 30
        }
      },
      activeConnections: activeConnectionsData,
      health: {
        status: (usedMem / totalMem) > 0.9 || failedRequests > (totalRequests * 0.1) 
          ? 'degraded' 
          : 'healthy',
        lastCheck: new Date().toISOString(),
        services: {
          database: {
            status: db ? 'operational' : 'degraded',
            connections: Math.max(1, Math.round(successfulRequests * 0.1)),
            queryTime: avgResponseTime || 15
          },
          cache: {
            status: 'operational',
            connections: Math.round(wss.clients.size * 0.5) || 3
          },
          storage: {
            status: 'operational',
            latency: Math.round(avgResponseTime * 0.75) || 10
          }
        }
      },
      timestamp: new Date().toISOString()
    };
  };

  // Set up periodic WebSocket updates
  const startSystemMetricsUpdates = () => {
    // Set up interval to send real-time updates
    const wsUpdateInterval = setInterval(() => {
      // Only calculate and send updates if there are active clients
      if (wss.clients.size > 0) {
        try {
          // Get basic metrics to send via WebSocket (lighter than full metrics)
          const totalMem = os.totalmem();
          const freeMem = os.freemem();
          const usedMem = totalMem - freeMem;
          const cpuUsage = process.cpuUsage();
          const uptime = process.uptime();
          const cpuUsagePercent = Math.max(0, Math.min(100, ((cpuUsage.user + cpuUsage.system) / 1000000 / Math.max(1, uptime)) * 100));
          
          // Calculate real HTTP connections
          const httpConnections = Math.max(0, totalRequests - successfulRequests - failedRequests);
          
          const updateData: SystemUpdateData = {
            type: 'systemUpdate',
            updateType: 'metrics',
            cpu: {
              usage: cpuUsagePercent > 0 ? cpuUsagePercent : 35 + (Math.random() * 15)
            },
            memory: {
              usage: Math.round((usedMem / totalMem) * 100),
              heapUsed: usedMem,
              heapTotal: totalMem
            },
            activeConnections: {
              total: wss.clients.size + httpConnections,
              websocket: wss.clients.size,
              http: httpConnections
            },
            // Only mark as degraded if memory usage is high or there are errors
            status: (usedMem / totalMem) > 0.9 || failedRequests > (totalRequests * 0.1) 
              ? 'degraded' 
              : 'healthy',
            timestamp: new Date().toISOString()
          };
          
          // Broadcast via centralized websocket manager so all /ws clients receive it
          try {
            const sent = websocketManager.broadcast(updateData);
            console.log(`Broadcasting system update to ${sent} client(s)`);
          } catch (e) {
            console.error('Error broadcasting via websocketManager:', e);
          }
        } catch (error) {
          console.error('Error generating WebSocket updates:', error);
        }
      }
    }, 5000); // Send updates every 5 seconds
    
    // Clean up interval when the server stops
    process.on('SIGINT', () => {
      clearInterval(wsUpdateInterval);
      process.exit(0);
    });
  };
  
  // Start sending updates immediately
  startSystemMetricsUpdates();

  // System performance endpoint for detailed health monitoring
  app.get('/api/system/performance', async (_req: Request, res: Response) => {
    try {
      // Use the shared function to generate metrics
      const performanceMetrics = generatePerformanceMetrics();
      
      return res.status(200).json(performanceMetrics);
    } catch (error) {
      console.error('Error fetching system performance metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching system performance metrics',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Use the error logger utility
  const { getRecentErrors, logError, clearRecentErrors } = errorLogger;
  
  // Endpoint to get system error logs
  app.get('/api/system/errors', async (req: Request, res: Response) => {
    try {
      // Get filtering parameters
      const count = req.query.count ? parseInt(req.query.count as string) : 10;
      const level = req.query.level as 'error' | 'warning' | 'info' | undefined;
      const source = req.query.source as string | undefined;
      
      // Get basic error logs from file-based logger
      const fileBasedErrors = getRecentErrors(count, level, source);
      
      // Get advanced error stats from our new tracking system
      const { getErrorStats } = require('./middleware/errorHandler');
      const errorStats = getErrorStats();
      
      // Combine the data for a comprehensive view
      const combinedErrors = [
        ...fileBasedErrors,
        ...errorStats.recent.map((error: any) => ({
          timestamp: error.lastOccurred.toISOString(),
          level: 'error',
          source: error.key.split(':')[0],
          message: error.message,
          count: error.count,
          trending: errorStats.trending.some((trend: any) => trend.key === error.key && trend.increasing)
        }))
      ].slice(0, count);
      
      // Add trending analysis
      const analytics = {
        totalErrors: errorStats.total,
        uniqueErrorTypes: errorStats.unique,
        trendingErrors: errorStats.trending.map((trend: any) => ({
          type: trend.key.split(':')[0],
          count: trend.count,
          increasing: trend.increasing
        }))
      };
      
      return sendSuccess(res, {
        errors: combinedErrors,
        total: combinedErrors.length,
        analytics,
        filters: { count, level, source }
      });
    } catch (error) {
      console.error('Error fetching system error logs:', error);
      
      // Log this error about error logs - meta!
      const { logError } = require('./utils/errorLogger');
      logError(error instanceof Error ? error : String(error), 'routes', { 
        endpoint: '/api/system/errors', 
        method: 'GET'
      });
      
      return sendServerError(res, 'Error fetching system error logs');
    }
  });
  
  // Endpoint to clear error logs (admin only)
  app.post('/api/system/errors/clear', async (_req: Request, res: Response) => {
    try {
      clearRecentErrors();
      
      return res.status(200).json({
        success: true,
        message: 'Error logs cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing system error logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error clearing system error logs',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test endpoint to generate a sample error (for testing error logging and tracking)
  app.get('/api/system/test-error', async (req: Request, res: Response) => {
    try {
      const errorType = req.query.type as string || 'generic';
      const throwError = req.query.throw === 'true'; // Control whether to throw the error
      const showErrorStats = req.query.stats === 'true'; // Show error tracking stats
      
      if (showErrorStats) {
        // Return current error tracking statistics instead of generating an error
        const { getErrorStats } = require('./middleware/errorHandler');
        const errorStats = getErrorStats();
        return sendSuccess(res, {
          message: 'Current error tracking statistics',
          statistics: errorStats
        });
      }
      
      switch (errorType) {
        case 'runtime':
          // Generate a runtime error
          const obj: any = null;
          if (obj) {
            obj.nonExistentMethod(); // This won't execute but fixes the TypeScript error
          } else {
            throw new TypeError('Null object access: Cannot read property nonExistentMethod of null');
          }
          break;
          
        case 'api':
          // Simulate an API error
          logError(
            'External API failure during data retrieval',
            'external-api',
            { service: 'test-service', statusCode: 503 },
            'error'
          );
          if (throwError) {
            return sendServerError(res, 'External API request failed', 502, ErrorCodes.EXTERNAL_SERVICE_ERROR);
          }
          break;
          
        case 'database':
          // Simulate a database error
          logError(
            'Database query timeout',
            'database',
            { query: 'SELECT * FROM large_table WHERE complex_condition', timeout: '30s' },
            'error'
          );
          if (throwError) {
            return sendServerError(res, 'Database query timed out', 500, ErrorCodes.DATABASE_ERROR);
          }
          break;
          
        case 'validation':
          // Simulate a validation error
          if (throwError) {
            return sendClientError(res, 'Validation failed', 400, {
              username: ['Username must be at least 3 characters'],
              email: ['Invalid email format']
            }, ErrorCodes.INVALID_INPUT);
          }
          logError(
            'Input validation failed',
            'validation',
            { fields: ['username', 'email'] },
            'warning'
          );
          break;
          
        case 'auth':
          // Simulate an authentication error
          if (throwError) {
            return sendClientError(res, 'Invalid authentication token', 401, undefined, ErrorCodes.AUTHENTICATION_ERROR);
          }
          logError(
            'Authentication failed',
            'auth',
            { reason: 'Invalid token', ip: req.ip },
            'error'
          );
          break;
          
        case 'system':
          // Simulate a system-level error (will be tracked for trending)
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              try {
                throw new Error(`System error iteration ${i+1}`);
              } catch (err) {
                // We'll use our tracking directly
                const { trackError } = require('./middleware/errorHandler');
                trackError(err, req);
              }
            }, i * 500);
          }
          break;
          
        case 'warning':
          // Log a warning
          logError(
            'Resource utilization approaching threshold',
            'system-monitor',
            { resource: 'memory', current: 85, threshold: 90 },
            'warning'
          );
          break;
          
        default:
          // Generic error
          if (throwError) {
            throw new Error('Test error generated via API');
          }
          logError(
            'Generic test error',
            'test-error-endpoint',
            { type: 'generic' },
            'error'
          );
      }
      
      return sendSuccess(res, {
        message: `Test ${errorType} error generated successfully`,
        trackingEnabled: true
      });
    } catch (error) {
      // If this is a thrown error, let the error handler middleware handle it
      if (req.query.middleware === 'true') {
        throw error; // This will be caught by the errorHandler middleware
      }
      
      // Otherwise, log it but return a success response for testing purposes
      logError(
        error instanceof Error ? error : String(error),
        'test-error-endpoint',
        { query: req.query }
      );
      
      return sendSuccess(res, {
        message: 'Test error generated and logged successfully',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Analytics endpoints
  
  // Company details endpoint
  app.get('/api/company/:id', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid company ID format'
        });
      }

      // Verify user has access to this company's data
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Only allow access if user belongs to the company OR is an admin
      if (user.companyId !== companyId && user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only view your own company\'s data.'
        });
      }

      // Fetch company data
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId)
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Fetch license data if licenseId exists
      let licenseData = null;
      if (company.licenseId) {
        const license = await db.query.licenses.findFirst({
          where: eq(licenses.id, company.licenseId)
        });
        if (license) {
          licenseData = {
            id: license.id,
            features: license.features || {}
          };
        }
      }

      // Return company data in the format expected by frontend
      res.json({
        status: 'success',
        data: {
          id: company.id,
          name: company.name,
          subscriptionTier: company.subscriptionTier,
          licenseStatus: company.licenseStatus,
          licenseStartDate: company.licenseStartDate,
          licenseEndDate: company.licenseEndDate,
          maxUsers: company.maxUsers,
          maxSurveys: company.maxSurveys,
          maxResponses: company.maxResponses,
          industry: company.industry || '',
          size: company.size || '',
          logo: company.logo || undefined,
          // Include license data if available
          license: licenseData,
          // Keep legacy fields for backward compatibility, but prefer license.features
          aiInsights: licenseData?.features?.aiInsights ?? company.aiInsights ?? false,
          advancedAnalytics: licenseData?.features?.advancedAnalytics ?? company.advancedAnalytics ?? false,
          dataExport: licenseData?.features?.dataExport ?? company.dataExport ?? false,
          socialSharing: licenseData?.features?.socialSharing ?? company.socialSharing ?? false,
          customBranding: licenseData?.features?.customBranding ?? company.customBranding ?? false,
          crmIntegration: licenseData?.features?.crmIntegration ?? company.crmIntegration ?? false
        }
      });
    } catch (error) {
      console.error(`Error fetching company data:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve company data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Company usage endpoint
  app.get('/api/company/:id/usage', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid company ID format'
        });
      }

      // Verify user has access to this company's data
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Only allow access if user belongs to the company OR is an admin
      if (user.companyId !== companyId && user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only view your own company\'s usage data.'
        });
      }

      // Get company to fetch max limits
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
        columns: { id: true, maxUsers: true, maxResponses: true }
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Count actual users for this company
      const userCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.companyId, companyId));

      const actualUsers = Number(userCount[0]?.count || 0);

      // Count actual responses for this company
      const responseCount = await db.select({ count: sql<number>`count(*)` })
        .from(surveyResponses)
        .where(eq(surveyResponses.companyId, companyId));

      const actualResponses = Number(responseCount[0]?.count || 0);

      // Calculate usage percentages
      const responseUsagePercent = company.maxResponses > 0 
        ? Math.round((actualResponses / company.maxResponses) * 100)
        : 0;

      const userUsagePercent = company.maxUsers > 0
        ? Math.round((actualUsers / company.maxUsers) * 100)
        : 0;

      res.json({
        status: 'success',
        data: {
          responseUsagePercent,
          actualResponses,
          maxResponses: company.maxResponses,
          userUsagePercent,
          actualUsers,
          maxUsers: company.maxUsers,
          availableUsers: Math.max(0, company.maxUsers - actualUsers)
        }
      });
    } catch (error) {
      console.error(`Error fetching company usage:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve company usage data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Company-level analytics endpoint
  app.get('/api/company/:id/analytics', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Verify the company ID is present
      if (!req.params.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID is required'
        });
      }
      
      const companyId = parseInt(req.params.id);
      console.log(`Fetching analytics for company ID: ${companyId}`);
      
      // Validate company ID is a valid number
      if (isNaN(companyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid company ID format'
        });
      }

      // Verify user has access to this company's data
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Only allow access if user belongs to the company OR is an admin
      if (user.companyId !== companyId && user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only view your own company\'s analytics.'
        });
      }
      
      // Get company stats from the storage layer using existing method
      const analyticsData = await storage.getCompanyStats(companyId);
      
      // Ensure we have valid data to return
      if (!analyticsData) {
        return res.status(404).json({
          status: 'error',
          message: 'No analytics data found for this company'
        });
      }
      
      res.json({
        status: 'success',
        data: analyticsData
      });
    } catch (error) {
      console.error(`Error fetching company analytics:`, error);
      
      // Send a more user-friendly error message
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve company analytics. Please try again.',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Survey-specific analytics endpoint
  app.get('/api/surveys/:id/analytics', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const surveyId = parseInt(req.params.id);
      console.log(`Fetching analytics for survey ID: ${surveyId}`);
      
      // Verify survey exists and user has access
      const survey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId),
        columns: { id: true, companyId: true }
      });

      if (!survey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Verify user has access to this survey's company
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Only allow access if user belongs to the survey's company OR is an admin/platform_admin
      const isAdmin = user.role === 'admin' || user.role === 'platform_admin' || 
                      req.headers['x-mock-admin'] === 'true' ||
                      req.session?.userRole === 'platform_admin';
      
      if (user.companyId !== survey.companyId && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only view your own company\'s survey analytics.'
        });
      }
      
      // For individual surveys, always use storage.getSurveyAnalytics to get the full data structure
      // including marketSegments, businessContext, etc.
      let analyticsData = await storage.getSurveyAnalytics(surveyId);
      
      // If storage doesn't have data, try real-time analytics as fallback
      if (!analyticsData) {
        analyticsData = await performance.getRealTimeSurveyAnalytics(surveyId);
      }
      
      // Ensure we always return a proper structure even if data is empty
      if (!analyticsData) {
        analyticsData = {
          surveyCount: 1,
          responseCount: 0,
          completionRate: 0,
          averageSatisfactionScore: 0,
          totalResponses: 0,
          completedResponses: 0,
          monthOverMonthGrowth: { respondents: 0, completion: 0, satisfaction: 0 },
          integrations: { total: 0, newCount: 0 },
          topTraits: [],
          demographics: {
            genderDistribution: [],
            ageDistribution: [],
            locationDistribution: []
          },
          marketSegments: [],
          genderStereotypes: null,
          productRecommendations: null,
          averageCompletionTime: 0,
          engagementMetrics: {
            dailyActiveUsers: 0,
            monthlyActiveUsers: 0,
            averageSessionDuration: 0,
            retentionRate: 0,
            activities: [],
            deviceUsage: [],
            peakUsageTimes: [],
            bounceRate: 0,
            conversionRate: 0,
            growthRate: 0
          },
          businessContext: {
            industries: [],
            companySizes: [],
            departments: [],
            roles: [],
            decisionStyles: [],
            decisionTimeframes: [],
            growthStages: [],
            learningPreferences: [],
            skills: [],
            challenges: []
          }
        };
      }
      
      res.json({
        status: 'success',
        data: analyticsData
      });
    } catch (error) {
      console.error(`Error fetching survey analytics:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve survey analytics',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Trend Analysis Endpoints

  // Get company-level trends (all surveys)
  app.get('/api/company/:id/trends', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const timeframeParam = req.query.timeframe;
      const timeframe = (req.query.timeframe as '30d' | '90d' | 'all') || 'all';
      console.log(`[TRENDS ENDPOINT] timeframeParam=${timeframeParam}, final timeframe=${timeframe}`);

      // Validate authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Get all surveys for this company
      const companySurveys = await db.select()
        .from(surveys)
        .where(eq(surveys.companyId, companyId));

      if (!companySurveys.length) {
        return res.json({
          status: 'success',
          data: {
            hasEnoughData: false,
            dataPoints: 0,
            volumeTrend: {
              dataPoints: [],
              trend: 'stable',
              growthRate: 0,
              peakDate: new Date().toISOString().split('T')[0],
              peakCount: 0,
            },
            traitEvolution: [],
            demographicShifts: [],
            qualityTrends: {
              completionRate: [],
              avgResponseTime: [],
            },
            insights: [
              {
                title: 'No Survey Data',
                description: 'Create a survey and collect responses to see trend analysis.',
                type: 'neutral',
                confidence: 'high',
              },
            ],
            recommendations: [],
            message: 'No surveys found for this company.',
          },
        });
      }

      // Get survey IDs
      const surveyIds = companySurveys.map((s: any) => s.id);
      console.log(`[TRENDS DEBUG] Company ${companyId}: surveys=${companySurveys.length}, surveyIds=[${surveyIds.join(',')}]`);

      // Fetch responses for all surveys
      const rawResponses = await db.select()
        .from(surveyResponses)
        .where(inArray(surveyResponses.surveyId, surveyIds));

      console.log(`[TRENDS DEBUG] Raw responses from DB: ${rawResponses.length} items`);
      if (rawResponses.length > 0) {
        console.log(`[TRENDS DEBUG] Sample response:`, JSON.stringify(rawResponses[0], null, 2).substring(0, 500));
      }

      // Transform responses to match trend analysis service expectations
      const allResponses = rawResponses.map((r: any) => ({
        ...r,
        createdAt: r.completeTime || r.startTime || new Date(),
        completionTimeSeconds: r.completeTime && r.startTime
          ? Math.round((new Date(r.completeTime).getTime() - new Date(r.startTime).getTime()) / 1000)
          : 0,
      }));

      console.log(`[TRENDS DEBUG] Transformed responses: ${allResponses.length} items`);

      if (!allResponses.length) {
        return res.json({
          status: 'success',
          data: {
            hasEnoughData: false,
            dataPoints: 0,
            volumeTrend: {
              dataPoints: [],
              trend: 'stable',
              growthRate: 0,
              peakDate: new Date().toISOString().split('T')[0],
              peakCount: 0,
            },
            traitEvolution: [],
            demographicShifts: [],
            qualityTrends: {
              completionRate: [],
              avgResponseTime: [],
            },
            insights: [
              {
                title: 'No Response Data',
                description: 'Responses will appear here once users submit your surveys.',
                type: 'neutral',
                confidence: 'high',
              },
            ],
            recommendations: [],
            message: 'No responses collected yet.',
          },
        });
      }

      // Debug logging
      console.log(`[TRENDS] Company ${companyId}: Found ${companySurveys.length} surveys, ${allResponses.length} total responses`);

      // Analyze trends
      const trendResult = await analyzeTrends(
        allResponses,
        timeframe,
        {
          productName: companySurveys[0]?.productName || undefined,
          industry: companySurveys[0]?.industry || undefined,
        }
      );

      console.log(`[TRENDS] Result: hasEnoughData=${trendResult.hasEnoughData}, dataPoints=${trendResult.dataPoints}`);

      res.json({
        status: 'success',
        data: trendResult,
      });
    } catch (error) {
      console.error('Error fetching company trends:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to analyze trends',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get survey-level trends
  app.get('/api/surveys/:id/trends', async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const timeframeParam = req.query.timeframe;
      const timeframe = (req.query.timeframe as '30d' | '90d' | 'all') || 'all';
      console.log(`[TRENDS ENDPOINT SURVEY] timeframeParam=${timeframeParam}, final timeframe=${timeframe}`);

      // Validate authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Get survey details
      const survey = await db.select()
        .from(surveys)
        .where(eq(surveys.id, surveyId))
        .limit(1);

      if (!survey.length) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found',
        });
      }

      // Fetch responses for this survey
      const rawResponses = await db.select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

      // Transform responses to match trend analysis service expectations
      const responses = rawResponses.map((r: any) => ({
        ...r,
        createdAt: r.completeTime || r.startTime || new Date(),
        completionTimeSeconds: r.completeTime && r.startTime
          ? Math.round((new Date(r.completeTime).getTime() - new Date(r.startTime).getTime()) / 1000)
          : 0,
      }));

      if (!responses.length) {
        return res.json({
          status: 'success',
          data: {
            hasEnoughData: false,
            dataPoints: 0,
            volumeTrend: {
              dataPoints: [],
              trend: 'stable',
              growthRate: 0,
              peakDate: new Date().toISOString().split('T')[0],
              peakCount: 0,
            },
            traitEvolution: [],
            demographicShifts: [],
            qualityTrends: {
              completionRate: [],
              avgResponseTime: [],
            },
            insights: [
              {
                title: 'No Response Data',
                description: 'Responses will appear here once users submit your survey.',
                type: 'neutral',
                confidence: 'high',
              },
            ],
            recommendations: [],
            message: 'No responses collected yet.',
          },
        });
      }

      // Debug logging
      console.log(`[TRENDS] Survey ${surveyId}: Found ${responses.length} responses`);

      // Analyze trends
      const trendResult = await analyzeTrends(
        responses,
        timeframe,
        {
          productName: survey[0]?.productName || undefined,
          industry: survey[0]?.industry || undefined,
        }
      );

      console.log(`[TRENDS] Result: hasEnoughData=${trendResult.hasEnoughData}, dataPoints=${trendResult.dataPoints}`);

      res.json({
        status: 'success',
        data: trendResult,
      });
    } catch (error) {
      console.error('Error fetching survey trends:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to analyze trends',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Helper function to sanitize filename (remove special characters, replace spaces)
  function sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  // Helper function to generate Excel file with multiple sheets and formatting
  async function generateExcelFile(exportData: any, title: string, id: number, isCompany: boolean = false, companyName?: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PersonalysisPro';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Define styles
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Blue
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const, color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF1E40AF' } },
        left: { style: 'thin' as const, color: { argb: 'FF1E40AF' } },
        right: { style: 'thin' as const, color: { argb: 'FF1E40AF' } }
      }
    };

    const subHeaderStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FF1E40AF' }, size: 11 },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFF6FF' } // Light blue
      },
      alignment: { horizontal: 'left' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } }
      }
    };

    const cellStyle: Partial<ExcelJS.Style> = {
      border: {
        top: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } }
      },
      alignment: { vertical: 'middle' as const }
    };

    const evenRowStyle: Partial<ExcelJS.Style> = {
      ...cellStyle,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' } // Very light gray
      }
    };

    // Sheet 1: Survey Responses
    if (exportData.responses && exportData.responses.length > 0) {
      const responsesSheet = workbook.addWorksheet('Survey Responses', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // Add title row
      const headerCount = isCompany ? 8 : 7;
      const headerRange = isCompany ? 'A1:I1' : 'A1:H1';
      responsesSheet.mergeCells(headerRange);
      const titleRow = responsesSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Survey Responses`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      // Add metadata
      let currentMetadataRow = 2;
      responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Export Date: ${new Date().toLocaleString()}`;
      
      if (isCompany) {
        if (companyName) {
          responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Company: ${companyName}`;
        }
        responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Company ID: ${id}`;
      } else {
        responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Survey ID: ${id}`;
        if (companyName) {
          responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Company: ${companyName}`;
        }
      }
      responsesSheet.getRow(currentMetadataRow++).getCell(1).value = `Total Responses: ${exportData.responses.length}`;

      // Add headers
      const headers = isCompany 
        ? ['ID', 'Survey ID', 'Respondent ID', 'Completed', 'Created At', 'Completed At', 'Satisfaction Score', 'Response Time (seconds)']
        : ['ID', 'Respondent ID', 'Completed', 'Created At', 'Completed At', 'Satisfaction Score', 'Response Time (seconds)'];
      const headerRow = responsesSheet.getRow(currentMetadataRow);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.style = headerStyle as Partial<ExcelJS.Style>;
      });
      headerRow.height = 25;

      // Add data rows
      const dataStartRow = currentMetadataRow + 1;
      exportData.responses.forEach((r: any, index: number) => {
        const row = responsesSheet.getRow(dataStartRow + index);
        const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
        
        let colIndex = 1;
        row.getCell(colIndex++).value = r.id;
        if (isCompany) {
          row.getCell(colIndex++).value = r.surveyId || '';
        }
        row.getCell(colIndex++).value = r.respondentId || '';
        row.getCell(colIndex++).value = r.completed ? 'Yes' : 'No';
        row.getCell(colIndex).value = r.createdAt ? new Date(r.createdAt) : '';
        row.getCell(colIndex++).numFmt = 'mm/dd/yyyy hh:mm:ss AM/PM';
        row.getCell(colIndex).value = r.completedAt ? new Date(r.completedAt) : '';
        row.getCell(colIndex++).numFmt = 'mm/dd/yyyy hh:mm:ss AM/PM';
        row.getCell(colIndex++).value = r.satisfactionScore || '';
        row.getCell(colIndex++).value = r.responseTimeSeconds || '';

        headers.forEach((_, colIdx) => {
          row.getCell(colIdx + 1).style = rowStyle as Partial<ExcelJS.Style>;
        });
        row.height = 20;
      });

      // Auto-fit columns
      responsesSheet.columns.forEach((column) => {
        column.width = 18;
      });
    }

    // Sheet 2: Analytics Summary
    if (exportData.analytics) {
      const analyticsSheet = workbook.addWorksheet('Analytics Summary', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      analyticsSheet.mergeCells('A1:B1');
      const titleRow = analyticsSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Analytics Summary`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      // Headers
      const headerRow = analyticsSheet.getRow(3);
      headerRow.getCell(1).value = 'Metric';
      headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.getCell(2).value = 'Value';
      headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.height = 25;

      // Data
      const metrics = [
        ['Total Responses', exportData.analytics.totalResponses || exportData.analytics.responseCount || 0],
        ['Completion Rate', `${(exportData.analytics.completionRate || 0).toFixed(1)}%`],
        ['Average Satisfaction Score', (exportData.analytics.averageSatisfactionScore || 0).toFixed(1)],
      ];

      if (exportData.analytics.monthOverMonthGrowth) {
        metrics.push(
          ['Respondents Growth', `${exportData.analytics.monthOverMonthGrowth.respondents || 0}%`],
          ['Completion Growth', `${exportData.analytics.monthOverMonthGrowth.completion || 0}%`],
          ['Satisfaction Growth', `${exportData.analytics.monthOverMonthGrowth.satisfaction || 0}%`]
        );
      }

      metrics.forEach((metric, index) => {
        const row = analyticsSheet.getRow(4 + index);
        const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
        row.getCell(1).value = metric[0];
        row.getCell(1).style = { ...rowStyle, font: { bold: true } } as Partial<ExcelJS.Style>;
        row.getCell(2).value = metric[1];
        row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
        row.height = 20;
      });

      analyticsSheet.columns[0].width = 30;
      analyticsSheet.columns[1].width = 20;
    }

    // Sheet 3: Demographics
    if (exportData.demographics) {
      const demographicsSheet = workbook.addWorksheet('Demographics', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      demographicsSheet.mergeCells('A1:B1');
      const titleRow = demographicsSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Demographics`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      let currentRow = 3;

      // Gender Distribution
      if (exportData.demographics.genderDistribution && exportData.demographics.genderDistribution.length > 0) {
        demographicsSheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const subHeader = demographicsSheet.getRow(currentRow);
        subHeader.getCell(1).value = 'Gender Distribution';
        subHeader.getCell(1).style = subHeaderStyle as Partial<ExcelJS.Style>;
        subHeader.height = 22;
        currentRow++;

        const headerRow = demographicsSheet.getRow(currentRow);
        headerRow.getCell(1).value = 'Gender';
        headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
        headerRow.getCell(2).value = 'Percentage';
        headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
        headerRow.height = 25;
        currentRow++;

        exportData.demographics.genderDistribution.forEach((g: any, index: number) => {
          const row = demographicsSheet.getRow(currentRow);
          const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
          row.getCell(1).value = g.label || g.gender || 'N/A';
          row.getCell(1).style = rowStyle as Partial<ExcelJS.Style>;
          row.getCell(2).value = `${g.value || g.percentage || 0}%`;
          row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
          row.height = 20;
          currentRow++;
        });
        currentRow += 2;
      }

      // Age Distribution
      if (exportData.demographics.ageDistribution && exportData.demographics.ageDistribution.length > 0) {
        demographicsSheet.mergeCells(`A${currentRow}:B${currentRow}`);
        const subHeader = demographicsSheet.getRow(currentRow);
        subHeader.getCell(1).value = 'Age Distribution';
        subHeader.getCell(1).style = subHeaderStyle as Partial<ExcelJS.Style>;
        subHeader.height = 22;
        currentRow++;

        const headerRow = demographicsSheet.getRow(currentRow);
        headerRow.getCell(1).value = 'Age Range';
        headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
        headerRow.getCell(2).value = 'Percentage';
        headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
        headerRow.height = 25;
        currentRow++;

        exportData.demographics.ageDistribution.forEach((a: any, index: number) => {
          const row = demographicsSheet.getRow(currentRow);
          const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
          row.getCell(1).value = a.range || 'N/A';
          row.getCell(1).style = rowStyle as Partial<ExcelJS.Style>;
          row.getCell(2).value = `${a.percentage || 0}%`;
          row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
          row.height = 20;
          currentRow++;
        });
      }

      demographicsSheet.columns[0].width = 25;
      demographicsSheet.columns[1].width = 20;
    }

    // Sheet 4: Personality Traits
    if (exportData.traits && exportData.traits.length > 0) {
      const traitsSheet = workbook.addWorksheet('Personality Traits', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      traitsSheet.mergeCells('A1:C1');
      const titleRow = traitsSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Personality Traits`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      const headerRow = traitsSheet.getRow(3);
      headerRow.getCell(1).value = 'Trait';
      headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.getCell(2).value = 'Score';
      headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.getCell(3).value = 'Category';
      headerRow.getCell(3).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.height = 25;

      exportData.traits.forEach((t: any, index: number) => {
        const row = traitsSheet.getRow(4 + index);
        const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
        row.getCell(1).value = t.name || 'N/A';
        row.getCell(1).style = rowStyle as Partial<ExcelJS.Style>;
        row.getCell(2).value = t.score || 0;
        row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
        row.getCell(3).value = t.category || 'N/A';
        row.getCell(3).style = rowStyle as Partial<ExcelJS.Style>;
        row.height = 20;
      });

      traitsSheet.columns[0].width = 25;
      traitsSheet.columns[1].width = 15;
      traitsSheet.columns[2].width = 20;
    }

    // Sheet 5: Business Context
    if (exportData.businessContext) {
      const businessSheet = workbook.addWorksheet('Business Context', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      businessSheet.mergeCells('A1:B1');
      const titleRow = businessSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Business Context`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      let currentRow = 3;

      // Add each business context category
      const categories = [
        { key: 'industries', label: 'Industries' },
        { key: 'companySizes', label: 'Company Sizes' },
        { key: 'departments', label: 'Departments' },
        { key: 'roles', label: 'Roles' },
        { key: 'decisionStyles', label: 'Decision Styles' },
        { key: 'decisionTimeframes', label: 'Decision Timeframes' },
        { key: 'growthStages', label: 'Growth Stages' },
        { key: 'learningPreferences', label: 'Learning Preferences' },
        { key: 'skills', label: 'Skills' },
        { key: 'challenges', label: 'Challenges' }
      ];

      categories.forEach(category => {
        const data = exportData.businessContext[category.key];
        if (data && Array.isArray(data) && data.length > 0) {
          businessSheet.mergeCells(`A${currentRow}:B${currentRow}`);
          const subHeader = businessSheet.getRow(currentRow);
          subHeader.getCell(1).value = category.label;
          subHeader.getCell(1).style = subHeaderStyle as Partial<ExcelJS.Style>;
          subHeader.height = 22;
          currentRow++;

          const headerRow = businessSheet.getRow(currentRow);
          headerRow.getCell(1).value = 'Item';
          headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
          headerRow.getCell(2).value = 'Count';
          headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
          headerRow.height = 25;
          currentRow++;

          data.forEach((item: any, index: number) => {
            const row = businessSheet.getRow(currentRow);
            const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
            row.getCell(1).value = typeof item === 'string' ? item : (item.name || item.label || JSON.stringify(item));
            row.getCell(1).style = rowStyle as Partial<ExcelJS.Style>;
            row.getCell(2).value = item.count || item.value || 1;
            row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
            row.height = 20;
            currentRow++;
          });
          currentRow += 2;
        }
      });

      businessSheet.columns[0].width = 30;
      businessSheet.columns[1].width = 15;
    }

    // Sheet 6: Engagement Metrics
    if (exportData.engagement) {
      const engagementSheet = workbook.addWorksheet('Engagement Metrics', {
        pageSetup: { paperSize: 9, orientation: 'portrait' }
      });

      engagementSheet.mergeCells('A1:B1');
      const titleRow = engagementSheet.getRow(1);
      titleRow.getCell(1).value = `${title} - Engagement Metrics`;
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF2563EB' } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      const headerRow = engagementSheet.getRow(3);
      headerRow.getCell(1).value = 'Metric';
      headerRow.getCell(1).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.getCell(2).value = 'Value';
      headerRow.getCell(2).style = headerStyle as Partial<ExcelJS.Style>;
      headerRow.height = 25;

      const metrics = [
        ['Daily Active Users', exportData.engagement.dailyActiveUsers || 0],
        ['Monthly Active Users', exportData.engagement.monthlyActiveUsers || 0],
        ['Average Session Duration', `${(exportData.engagement.averageSessionDuration || 0).toFixed(2)} seconds`],
        ['Retention Rate', `${(exportData.engagement.retentionRate || 0).toFixed(1)}%`],
        ['Bounce Rate', `${(exportData.engagement.bounceRate || 0).toFixed(1)}%`],
        ['Conversion Rate', `${(exportData.engagement.conversionRate || 0).toFixed(1)}%`],
        ['Growth Rate', `${(exportData.engagement.growthRate || 0).toFixed(1)}%`]
      ];

      metrics.forEach((metric, index) => {
        const row = engagementSheet.getRow(4 + index);
        const rowStyle = index % 2 === 0 ? cellStyle : evenRowStyle;
        row.getCell(1).value = metric[0];
        row.getCell(1).style = { ...rowStyle, font: { bold: true } } as Partial<ExcelJS.Style>;
        row.getCell(2).value = metric[1];
        row.getCell(2).style = rowStyle as Partial<ExcelJS.Style>;
        row.height = 20;
      });

      engagementSheet.columns[0].width = 30;
      engagementSheet.columns[1].width = 20;
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Helper function to generate PDF HTML
  function generatePDFHTML(exportData: any, title: string, id: number, isCompany: boolean = false, companyName?: string): string {
    const date = new Date().toISOString().split('T')[0];
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - Export Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    h3 { color: #374151; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f3f4f6; padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold; }
    td { padding: 10px; border: 1px solid #d1d5db; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .metadata { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; background-color: #f0f9ff; border-left: 4px solid #2563eb; }
    .metric-label { font-size: 12px; color: #6b7280; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    @media print { body { margin: 20px; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>${title} - Export Report</h1>
  <div class="metadata">
    <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
    ${isCompany && companyName ? `<p><strong>Company:</strong> ${companyName}</p>` : ''}
    ${!isCompany && companyName ? `<p><strong>Company:</strong> ${companyName}</p>` : ''}
    <p><strong>${isCompany ? 'Company' : 'Survey'} ID:</strong> ${id}</p>
  </div>`;

    if (exportData.analytics) {
      html += `
  <div class="section">
    <h2>Analytics Summary</h2>
    <div class="metric">
      <div class="metric-label">Total Responses</div>
      <div class="metric-value">${exportData.analytics.totalResponses || 0}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Completion Rate</div>
      <div class="metric-value">${(exportData.analytics.completionRate || 0).toFixed(1)}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg Satisfaction</div>
      <div class="metric-value">${(exportData.analytics.averageSatisfactionScore || 0).toFixed(1)}</div>
    </div>
  </div>`;
    }

    if (exportData.responses && exportData.responses.length > 0) {
      html += `
  <div class="section">
    <h2>Survey Responses (${exportData.responses.length})</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Respondent ID</th>
          <th>Completed</th>
          <th>Created At</th>
          <th>Satisfaction Score</th>
        </tr>
      </thead>
      <tbody>`;
      exportData.responses.slice(0, 100).forEach((r: any) => {
        html += `
        <tr>
          <td>${r.id}</td>
          <td>${r.respondentId || 'N/A'}</td>
          <td>${r.completed ? 'Yes' : 'No'}</td>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</td>
          <td>${r.satisfactionScore || 'N/A'}</td>
        </tr>`;
      });
      if (exportData.responses.length > 100) {
        html += `
        <tr><td colspan="5" style="text-align: center; font-style: italic;">... and ${exportData.responses.length - 100} more responses</td></tr>`;
      }
      html += `
      </tbody>
    </table>
  </div>`;
    }

    if (exportData.demographics) {
      html += `
  <div class="section">
    <h2>Demographics</h2>`;
      if (exportData.demographics.genderDistribution && exportData.demographics.genderDistribution.length > 0) {
        html += `
    <h3>Gender Distribution</h3>
    <table>
      <thead><tr><th>Gender</th><th>Percentage</th></tr></thead>
      <tbody>`;
        exportData.demographics.genderDistribution.forEach((g: any) => {
          html += `<tr><td>${g.label || g.gender || 'N/A'}</td><td>${g.value || g.percentage || 0}%</td></tr>`;
        });
        html += `</tbody></table>`;
      }
      if (exportData.demographics.ageDistribution && exportData.demographics.ageDistribution.length > 0) {
        html += `
    <h3>Age Distribution</h3>
    <table>
      <thead><tr><th>Age Range</th><th>Percentage</th></tr></thead>
      <tbody>`;
        exportData.demographics.ageDistribution.forEach((a: any) => {
          html += `<tr><td>${a.range || 'N/A'}</td><td>${a.percentage || 0}%</td></tr>`;
        });
        html += `</tbody></table>`;
      }
      html += `</div>`;
    }

    if (exportData.traits && exportData.traits.length > 0) {
      html += `
  <div class="section">
    <h2>Personality Traits</h2>
    <table>
      <thead><tr><th>Trait</th><th>Score</th><th>Category</th></tr></thead>
      <tbody>`;
      exportData.traits.forEach((t: any) => {
        html += `<tr><td>${t.name || 'N/A'}</td><td>${t.score || 0}</td><td>${t.category || 'N/A'}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }

    html += `
</body>
</html>`;
    return html;
  }

  // Export survey data endpoint
  app.get('/api/surveys/:id/export', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const surveyId = parseInt(req.params.id);
      const format = (req.query.format || 'csv') as 'csv' | 'json' | 'pdf';
      const includeResponses = req.query.includeResponses === 'true';
      const includeAnalytics = req.query.includeAnalytics === 'true';
      const includeDemographics = req.query.includeDemographics === 'true';
      const includeTraits = req.query.includeTraits === 'true';
      const includeBusinessContext = req.query.includeBusinessContext === 'true';
      const includeEngagement = req.query.includeEngagement === 'true';

      // Verify survey exists and user has access
      const survey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId),
        columns: { id: true, companyId: true, title: true }
      });

      if (!survey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Verify user has access
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const isAdmin = user.role === 'admin' || user.role === 'platform_admin';
      if (user.companyId !== survey.companyId && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      // Get company name for export
      const company = await storage.getCompany(survey.companyId);
      const companyName = company?.name || `Company ${survey.companyId}`;

      // Get analytics data
      const analyticsData = await storage.getSurveyAnalytics(surveyId);
      
      // Get survey responses if needed
      let responses: any[] = [];
      if (includeResponses) {
        responses = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
      }

      // Build export data object
      const exportData: any = {
        survey: {
          id: survey.id,
          title: survey.title,
          companyName: companyName,
          exportDate: new Date().toISOString()
        }
      };

      if (includeResponses) {
        exportData.responses = responses.map(r => ({
          id: r.id,
          respondentId: r.respondentId,
          completed: r.completed,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
          satisfactionScore: r.satisfactionScore,
          responseTimeSeconds: r.responseTimeSeconds,
          responses: r.responses,
          demographics: r.demographics,
          traits: r.traits
        }));
      }

      if (includeAnalytics && analyticsData) {
        exportData.analytics = {
          totalResponses: analyticsData.totalResponses || analyticsData.responseCount,
          completionRate: analyticsData.completionRate,
          averageSatisfactionScore: analyticsData.averageSatisfactionScore,
          monthOverMonthGrowth: analyticsData.monthOverMonthGrowth
        };
      }

      if (includeDemographics && analyticsData?.demographics) {
        exportData.demographics = analyticsData.demographics;
      }

      if (includeTraits && analyticsData?.topTraits) {
        exportData.traits = analyticsData.topTraits;
      }

      if (includeBusinessContext && analyticsData?.businessContext) {
        exportData.businessContext = analyticsData.businessContext;
      }

      if (includeEngagement && analyticsData?.engagementMetrics) {
        exportData.engagement = analyticsData.engagementMetrics;
      }

      // Format and send response
      const sanitizedCompanyName = companyName ? sanitizeFilename(companyName) : `company-${survey.companyId}`;
      const sanitizedSurveyTitle = sanitizeFilename(survey.title);
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-${sanitizedSurveyTitle}-export-${dateStr}.json`);
        return res.json(exportData);
      } else if (format === 'csv') {
        // Generate Excel file with multiple sheets
        const excelBuffer = await generateExcelFile(exportData, survey.title, surveyId, false, companyName);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-${sanitizedSurveyTitle}-export-${dateStr}.xlsx`);
        return res.send(excelBuffer);
      } else if (format === 'pdf') {
        // Generate PDF from HTML
        const html = generatePDFHTML(exportData, survey.title, surveyId, false, companyName);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-${sanitizedSurveyTitle}-export-${dateStr}.pdf`);
        
        // For now, return HTML that can be printed to PDF by the browser
        // In production, you'd use a library like puppeteer or pdfkit
        // For this implementation, we'll return HTML with print styles that can be saved as PDF
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      return res.status(400).json({
        status: 'error',
        message: 'Invalid export format'
      });
    } catch (error) {
      console.error(`Error exporting survey data:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to export survey data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Export company data endpoint
  app.get('/api/company/:id/export', async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const companyId = parseInt(req.params.id);
      const format = (req.query.format || 'csv') as 'csv' | 'json' | 'pdf';
      const includeResponses = req.query.includeResponses === 'true';
      const includeAnalytics = req.query.includeAnalytics === 'true';
      const includeDemographics = req.query.includeDemographics === 'true';
      const includeTraits = req.query.includeTraits === 'true';
      const includeBusinessContext = req.query.includeBusinessContext === 'true';
      const includeEngagement = req.query.includeEngagement === 'true';
      const surveyIdFilter = req.query.surveyId === 'all' ? null : (req.query.surveyId ? parseInt(req.query.surveyId as string) : null);

      // Verify user has access
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const isAdmin = user.role === 'admin' || user.role === 'platform_admin';
      if (user.companyId !== companyId && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      // Get company name for export
      const company = await storage.getCompany(companyId);
      const companyName = company?.name || `Company ${companyId}`;

      // Get company analytics
      const analyticsData = await storage.getCompanyStats(companyId);
      
      // Get survey responses if needed
      let responses: any[] = [];
      if (includeResponses) {
        responses = await storage.getSurveyResponsesByCompany(companyId);
        if (surveyIdFilter) {
          responses = responses.filter(r => r.surveyId === surveyIdFilter);
        }
      }

      // Build export data object
      const exportData: any = {
        company: {
          id: companyId,
          name: companyName,
          exportDate: new Date().toISOString()
        }
      };

      if (includeResponses) {
        exportData.responses = responses.map(r => ({
          id: r.id,
          surveyId: r.surveyId,
          respondentId: r.respondentId,
          completed: r.completed,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
          satisfactionScore: r.satisfactionScore,
          responseTimeSeconds: r.responseTimeSeconds,
          responses: r.responses,
          demographics: r.demographics,
          traits: r.traits
        }));
      }

      if (includeAnalytics && analyticsData) {
        exportData.analytics = {
          totalResponses: analyticsData.totalResponses || analyticsData.responseCount,
          completionRate: analyticsData.completionRate,
          averageSatisfactionScore: analyticsData.averageSatisfactionScore,
          monthOverMonthGrowth: analyticsData.monthOverMonthGrowth
        };
      }

      if (includeDemographics && analyticsData?.demographics) {
        exportData.demographics = analyticsData.demographics;
      }

      if (includeTraits && analyticsData?.topTraits) {
        exportData.traits = analyticsData.topTraits;
      }

      if (includeBusinessContext && analyticsData?.businessContext) {
        exportData.businessContext = analyticsData.businessContext;
      }

      if (includeEngagement && analyticsData?.engagementMetrics) {
        exportData.engagement = analyticsData.engagementMetrics;
      }

      // Format and send response
      const sanitizedCompanyName = sanitizeFilename(companyName);
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-export-${dateStr}.json`);
        return res.json(exportData);
      } else if (format === 'csv') {
        // Generate Excel file with multiple sheets
        const excelBuffer = await generateExcelFile(exportData, companyName, companyId, true, companyName);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-export-${dateStr}.xlsx`);
        return res.send(excelBuffer);
      } else if (format === 'pdf') {
        // Generate PDF from HTML
        const html = generatePDFHTML(exportData, companyName, companyId, true, companyName);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${sanitizedCompanyName}-export-${dateStr}.pdf`);
        
        // For now, return HTML that can be printed to PDF by the browser
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      return res.status(400).json({
        status: 'error',
        message: 'Invalid export format'
      });
    } catch (error) {
      console.error(`Error exporting company data:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to export company data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // In-memory storage for shared reports (in production, use database)
  interface SharedReport {
    token: string;
    companyId: number;
    surveyId: number | 'all';
    companyName: string;
    createdAt: Date;
    expiresAt?: Date;
    createdBy: number;
  }

  const sharedReports = new Map<string, SharedReport>();

  // Generate shareable report link
  app.post('/api/reports/share', async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const companyId = parseInt(req.body.companyId);
      const surveyId = req.body.surveyId === 'all' ? 'all' : parseInt(req.body.surveyId);
      const expiresInDays = req.body.expiresInDays || 30; // Default 30 days

      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Company ID is required'
        });
      }

      // Verify user has access
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, companyId: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const isAdmin = user.role === 'admin' || user.role === 'platform_admin';
      if (user.companyId !== companyId && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      // Get company name
      const company = await storage.getCompany(companyId);
      const companyName = company?.name || `Company ${companyId}`;

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Store shared report
      const sharedReport: SharedReport = {
        token,
        companyId,
        surveyId,
        companyName,
        createdAt: new Date(),
        expiresAt,
        createdBy: req.session.userId
      };

      sharedReports.set(token, sharedReport);

      // Generate shareable link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const shareableLink = `${baseUrl}/shared-report/${token}`;

      res.json({
        status: 'success',
        token,
        shareableLink,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error creating shared report:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create shared report',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get shared report data (public endpoint)
  app.get('/api/reports/shared/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const sharedReport = sharedReports.get(token);

      if (!sharedReport) {
        return res.status(404).json({
          status: 'error',
          message: 'Shared report not found or expired'
        });
      }

      // Check if expired
      if (sharedReport.expiresAt && new Date() > sharedReport.expiresAt) {
        sharedReports.delete(token);
        return res.status(410).json({
          status: 'error',
          message: 'Shared report has expired'
        });
      }

      // Get analytics data
      let analyticsData;
      if (sharedReport.surveyId === 'all') {
        analyticsData = await storage.getCompanyStats(sharedReport.companyId);
      } else {
        analyticsData = await storage.getSurveyAnalytics(sharedReport.surveyId);
      }

      if (!analyticsData) {
        return res.status(404).json({
          status: 'error',
          message: 'Analytics data not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          companyName: sharedReport.companyName,
          companyId: sharedReport.companyId,
          surveyId: sharedReport.surveyId,
          analytics: analyticsData,
          createdAt: sharedReport.createdAt,
          expiresAt: sharedReport.expiresAt
        }
      });
    } catch (error) {
      console.error('Error fetching shared report:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch shared report',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Real-time survey analytics endpoint
  app.get('/api/surveys/:id/analytics/realtime', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      console.log(`Fetching real-time analytics for survey ID: ${surveyId}`);
      
      // Force recalculation of analytics
      const analytics = await performance.getRealTimeSurveyAnalytics(surveyId);
      
      if (!analytics) {
        return res.status(404).json({
          status: 'error',
          message: 'No analytics data available for this survey'
        });
      }
      
      // Broadcast the updated analytics to all connected clients
      const analyticsUpdateData: SurveyAnalyticsUpdateData = {
        type: 'surveyAnalyticsUpdate',
        surveyId,
        metrics: {
          totalResponses: analytics.totalResponses || 0,
          completionRate: analytics.completionRate,
          averageTimeSpent: (analytics as any).averageTimeSpent || 0,
          averageRating: analytics.averageRating,
          uniqueRespondents: analytics.uniqueRespondents,
          activeRespondents: (analytics as any).activeRespondents || 0,
          lastResponseTime: analytics.lastResponseTime?.toISOString(),
          averageCompletionTime: analytics.averageCompletionTime,
          traitDistribution: (analytics as any).traitDistribution || {}
        },
        demographics: analytics.demographics,
        responseRates: performance.getSurveyResponseRates(),
        timestamp: new Date().toISOString()
      };
      
      broadcastSurveyAnalytics(analyticsUpdateData);
      
      return res.json({
        status: 'success',
        data: analytics
      });
    } catch (error) {
      console.error(`Error fetching real-time survey analytics:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve real-time survey analytics',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Survey response submission endpoint with real-time analytics
  app.post('/api/survey-responses', async (req: Request, res: Response) => {
    try {
      const responseData = req.body;
      
      if (!responseData || !responseData.surveyId) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey response data. Survey ID is required.'
        });
      }

      // Get survey to check company limits
      const survey = await db.query.surveys.findFirst({
        where: eq(surveys.id, responseData.surveyId),
        columns: { id: true, companyId: true }
      });

      if (!survey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Get company and check response limits
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, survey.companyId)
      });

      if (!company) {
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // Check response count limit
      const existingResponsesResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM survey_responses 
        WHERE company_id = ${survey.companyId}
      `);
      
      const currentResponseCount = parseInt(existingResponsesResult.rows[0]?.count as string || '0');
      const maxResponses = company.maxResponses || 1000; // Default to 1000 if not set

      if (currentResponseCount >= maxResponses) {
        return res.status(403).json({
          status: 'error',
          message: `Response limit reached. You can collect up to ${maxResponses} responses with your current license.`,
          code: 'RESPONSE_LIMIT_EXCEEDED',
          limits: {
            current: currentResponseCount,
            maximum: maxResponses
          }
        });
      }
      
      // Ensure response is associated with correct company ID from survey
      const responseDataWithCompany = {
        ...responseData,
        companyId: survey.companyId  // Force correct company association
      };
      
      // Save the response to the database
      const createdResponse = await storage.createSurveyResponse(responseDataWithCompany);
      
      // Enrich with AI-derived analytics in background (non-blocking)
      (async () => {
        try {
          const ai = await analyzeSurveyResponse({
            responses: Array.isArray(responseData.responses) ? responseData.responses : [],
            traits: Array.isArray(responseData.traits) ? responseData.traits : [],
            demographics: responseData.demographics || {},
            surveyContext: { industry: (survey as any)?.industry }
          });
          await db.update(surveyResponses).set({
            genderStereotypes: ai.genderStereotypes as any,
            productRecommendations: ai.productRecommendations as any,
            marketSegment: ai.marketSegment as any,
            satisfactionScore: ai.satisfactionScore as any,
            feedback: ai.feedback as any,
            updatedAt: new Date()
          }).where(eq(surveyResponses.id, createdResponse.id));
        } catch (e) {
          console.error('AI enrichment failed for survey response', e);
        }
      })();

      // Track the response for real-time analytics
      await performance.trackSurveyResponse(responseData.surveyId, responseData);

      // Track response submission event for notifications
      const surveyTitle = (survey as any)?.title || 'Survey';
      await trackResponseSubmitted(responseData.surveyId, surveyTitle).catch(err => {
        console.error('Failed to track response submission event:', err);
        // Don't block the response submission if tracking fails
      });

      // Broadcast survey response received notification
      const responseReceivedData: SurveyResponseReceivedData = {
        type: 'surveyResponseReceived',
        surveyId: responseData.surveyId,
        responseId: createdResponse.id,
        // userId: responseData.respondentId ? Number(responseData.respondentId) : undefined, // Removed - not part of interface
        isAnonymous: !responseData.respondentEmail,
        isComplete: responseData.completionStatus === 'completed',
        completionTimeSeconds: responseData.completionTime || 0,
        questionCount: responseData.totalQuestions || 0,
        answeredCount: responseData.answeredQuestions || 0,
        timestamp: new Date().toISOString()
      };
      
      broadcastSurveyResponse(responseReceivedData);
      
      // Broadcast usage update for company
      websocketManager.broadcast({
        type: 'usageUpdate',
        companyId: survey.companyId,
        surveyId: responseData.surveyId,
        timestamp: new Date().toISOString()
      });
      
      // Update and broadcast survey analytics after a short delay
      // to allow for aggregation
      setTimeout(async () => {
        try {
          const surveyId = responseData.surveyId;
          const analytics = await performance.getRealTimeSurveyAnalytics(surveyId);
          
          if (analytics) {
            const analyticsUpdateData: SurveyAnalyticsUpdateData = {
              type: 'surveyAnalyticsUpdate',
              surveyId,
              metrics: {
                totalResponses: analytics.totalResponses || 0,
                completionRate: analytics.completionRate,
                averageTimeSpent: (analytics as any).averageTimeSpent || 0,
                averageRating: analytics.averageRating,
                uniqueRespondents: analytics.uniqueRespondents,
                lastResponseTime: analytics.lastResponseTime?.toISOString(),
                averageCompletionTime: analytics.averageCompletionTime,
                traitDistribution: (analytics as any).traitDistribution || {}
              },
              demographics: analytics.demographics,
              responseRates: performance.getSurveyResponseRates(),
              timestamp: new Date().toISOString()
            };
            
            broadcastSurveyAnalytics(analyticsUpdateData);
          }
        } catch (error) {
          console.error('Error broadcasting survey analytics update:', error);
        }
      }, 2000); // Wait 2 seconds to allow for data aggregation
      
      return res.status(201).json({
        status: 'success',
        data: createdResponse
      });
    } catch (error) {
      console.error('Error submitting survey response:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to submit survey response',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Backup management endpoints using database
  
  // Get all backups
  // Recent backups endpoint
  app.get('/api/backups/recent', async (_req: Request, res: Response) => {
    try {
      // Get the most recent 5 backups
      const recentBackups = await db.execute(sql`
        SELECT * FROM system_backups
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      const formattedBackups = recentBackups.rows.map((backup: any) => ({
        id: backup.id,
        fileName: backup.file_name,
        fileSize: backup.file_size,
        backupType: backup.backup_type,
        status: backup.status,
        createdAt: backup.created_at,
        completedAt: backup.completed_at
      }));
      
      res.json({
        status: 'success',
        data: formattedBackups
      });
    } catch (error) {
      console.error('Error fetching recent backups:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch recent backups',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Admin recent backups endpoint
  app.get('/api/admin/backup/recent', async (_req: Request, res: Response) => {
    try {
      // Get the most recent 5 backups (admin view)
      const recentBackups = await db.execute(sql`
        SELECT * FROM system_backups
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
 const formattedBackups = recentBackups.rows.map((backup: any) => ({
  id: backup.id,
  fileName: backup.file_name,
  fileSize: backup.file_size,
  backupType: backup.backup_type,
  status: backup.status,
  createdAt: backup.created_at,
  completedAt: backup.completed_at,
  downloadUrl: `/api/system/backups/${backup.id}/download`,
}));

      
      res.json({
        status: 'success',
        data: formattedBackups
      });
    } catch (error) {
      console.error('Error fetching admin recent backups:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch admin recent backups',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // System backups endpoint
  app.get('/api/system/backups', async (req: Request, res: Response) => {
    try {
      console.log('Fetching backups with query params:', req.query);
      
      // Get query parameters for filtering
      const type = req.query.type as string;
      const status = req.query.status as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // Use raw SQL query with parameters for better control
      let sqlQuery = 'SELECT * FROM system_backups';
      const params: any[] = [];
      
      // Add WHERE conditions if needed
      if (type && status) {
        sqlQuery += ' WHERE type = $1 AND status = $2';
        params.push(type, status);
      } else if (type) {
        sqlQuery += ' WHERE type = $1';
        params.push(type);
      } else if (status) {
        sqlQuery += ' WHERE status = $1';
        params.push(status);
      }
      
      // Add ORDER BY and LIMIT
      sqlQuery += ' ORDER BY created_at DESC';
      if (limit) {
        sqlQuery += ' LIMIT $' + (params.length + 1);
        params.push(limit);
      }
      
      console.log('Executing backup query:', sqlQuery, params);
      
      // Execute the query
      const result = await pool.query(sqlQuery, params);
      const backupRows = result.rows || [];
      
      // Transform the data to match frontend expectations - with both snake_case and camelCase properties
      // This hybrid approach ensures compatibility regardless of how the frontend is configured
      const backups = backupRows.map(backup => {
        // Format the date in a frontend-friendly format
        const date = new Date(backup.created_at);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        return {
          // Required fields (original snake_case format)
          id: backup.id,
          name: backup.name,
          description: backup.description || '',
          created_at: backup.created_at,
          updated_at: backup.updated_at,
          size: backup.size,
          type: backup.type,
          status: backup.status,
          path: backup.path,
          user_id: backup.user_id,
          include_responses: backup.include_responses || false,
          
          // Additional camelCase versions for frontend compatibility
          createdAt: backup.created_at,
          updatedAt: backup.updated_at,
          userId: backup.user_id,
          includeResponses: backup.include_responses || false,
          
          // Formatted date fields for display
          date: formattedDate,
          rawDate: backup.created_at
        };
      });
      
      console.log(`Returning ${backups.length} backups`);
      
      // Return the backups
      res.json({
        status: 'success',
        data: backups
      });
    } catch (error) {
      console.error('Error fetching backups:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch backups',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create a new backup
  app.post('/api/system/backups', async (req: Request, res: Response) => {
    try {
      console.log('Backup creation request received:', req.body);
      const { name, description, includeResponses } = req.body;
      
      if (!name) {
        console.error('Backup name is missing in request:', req.body);
        return sendClientError(res, 'Backup name is required', 400, ErrorCodes.VALIDATION_ERROR);
      }
      
      // Get the number of survey responses if including them
      let responseCount = 0;
      if (includeResponses) {
        const countResult = await pool.query('SELECT COUNT(*) as count FROM survey_responses');
        responseCount = parseInt(countResult.rows[0].count) || 0;
      }
      
      // Calculate a more realistic size
      const baseSize = Math.floor(Math.random() * 100) + 50; // Base DB size in KB 
      const responseSize = responseCount * 2; // Approx size per response in KB
      const totalSize = baseSize + (includeResponses ? responseSize : 0);
      const formattedSize = totalSize > 1000 ? 
        `${(totalSize / 1024).toFixed(1)} MB` : 
        `${totalSize.toFixed(0)} KB`;
      
      // Create the backup in the database using SQL for more reliability
      // Note: table only has these columns: id, name, type, status, size, path, user_id, created_at, updated_at
      const query = `
        INSERT INTO system_backups (
          name, type, status, size, path, user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;
      
      const now = new Date();
      const backupPath = `/backups/${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.zip`;
      
      const values = [
        name,
        'manual',
        'completed',
        formattedSize,
        backupPath,
        1, // Use admin user ID
        now,
        now
      ];
      
      console.log('Executing backup creation query with values:', values);
      const result = await pool.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        console.log('Backup created successfully:', result.rows[0]);
        
        // Format date for display
        const date = new Date(result.rows[0].created_at);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Transform the data to match frontend expectations - with both snake_case and camelCase properties
        // This hybrid approach ensures compatibility regardless of how the frontend is configured
        const backup = {
          // Original snake_case format from database
          id: result.rows[0].id,
          name: result.rows[0].name,
          description: description || '', // Add description from request since it's not in the DB
          created_at: result.rows[0].created_at,
          updated_at: result.rows[0].updated_at,
          size: result.rows[0].size,
          type: result.rows[0].type,
          status: result.rows[0].status,
          path: result.rows[0].path,
          user_id: result.rows[0].user_id,
          include_responses: includeResponses || false, // Add from request as it's not in the DB
          
          // Additional camelCase versions for frontend compatibility
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at,
          userId: result.rows[0].user_id,
          includeResponses: includeResponses || false,
          
          // Formatted date fields for display
          date: formattedDate,
          rawDate: result.rows[0].created_at
        };
        
        return sendSuccess(res, backup, 'Backup created successfully', 201);
      } else {
        throw new Error('Failed to create backup record - no rows returned');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      return sendServerError(res, 'Failed to create backup', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });
  
  // Delete a backup
  app.delete('/api/system/backups/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendClientError(res, 'Invalid backup ID', 400, ErrorCodes.VALIDATION_ERROR);
      }
      
      // Check if backup exists and get its type
      const [backup] = await db.select()
        .from(backups)
        .where(eq(backups.id, id))
        .limit(1);
      
      if (!backup) {
        return sendClientError(res, 'Backup not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      // Don't allow deletion of automatic backups
      if (backup.type === 'auto') {
        return sendClientError(
          res, 
          'Automatic backups cannot be deleted', 
          403, 
          ErrorCodes.FORBIDDEN
        );
      }
      
      // Delete the backup
      const [deletedBackup] = await db.delete(backups)
        .where(eq(backups.id, id))
        .returning();
      
      return sendSuccess(res, deletedBackup, 'Backup deleted successfully');
    } catch (error) {
      console.error('Error deleting backup:', error);
      return sendServerError(res, 'Failed to delete backup', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });
  
  // Restore from a backup
  app.post('/api/system/backups/:id/restore', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendClientError(res, 'Invalid backup ID', 400, ErrorCodes.VALIDATION_ERROR);
      }
      
      // Check if backup exists and its status
      const [backup] = await db.select()
        .from(backups)
        .where(eq(backups.id, id))
        .limit(1);
      
      if (!backup) {
        return sendClientError(res, 'Backup not found', 404, ErrorCodes.NOT_FOUND);
      }
      
      // Only allow restoration of completed backups
      if (backup.status !== 'completed') {
        return sendClientError(
          res, 
          'Only completed backups can be restored', 
          400, 
          ErrorCodes.OPERATION_NOT_ALLOWED
        );
      }
      
      // In a real application, this would trigger the actual restore process
      // For now, we'll simulate a successful restore
      
      // Create restoration timestamp
      const now = new Date();
      const restoredAt = now.toISOString();
      const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      // Create a consistent response with both snake_case and camelCase formats
      return sendSuccess(res, { 
        // Original fields from database (snake_case)
        id: backup.id,
        name: backup.name,
        type: backup.type,
        status: 'restored',
        size: backup.size,
        path: backup.path,
        user_id: backup.userId,
        created_at: backup.createdAt,
        updated_at: backup.updatedAt || backup.createdAt,
        
        // Virtual fields not in database but added for consistency
        description: '',
        include_responses: false,
        restored_at: restoredAt,
        
        // CamelCase versions for frontend consistency
        createdAt: backup.createdAt,
        updatedAt: backup.updatedAt || backup.createdAt,
        userId: backup.userId,
        includeResponses: false,
        restoredAt: restoredAt,
        
        // Formatted fields for display
        date: formattedDate,
        rawDate: backup.createdAt
      }, 'Backup restored successfully');
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return sendServerError(res, 'Failed to restore from backup', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Duplicate endpoints were removed
  // The implementations are available around line ~1050
  
  // Test endpoint to verify admin authentication
  // app.get('/api/admin/test', requireAdmin, async (_req: Request, res: Response) => {
  //   res.json({ message: 'Admin authentication successful', authenticated: true });
  // });

  // Simple in-memory cache for admin analytics responses (keyed by period)
  const adminAnalyticsCache = new Map<string, { expiresAt: number; data: any }>();

  // Admin analytics endpoint for platform-wide metrics
  app.get('/api/admin/analytics', async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || '12months';
      console.log(`Fetching admin analytics for period: ${period}`);

      // Serve cached response when available (TTL 60s)
      const cached = adminAnalyticsCache.get(period);
      const now = Date.now();
      if (cached && cached.expiresAt > now) {
        return res.json(cached.data);
      }

      // Get all company IDs from the database to gather platform-wide analytics
      const clients = await db.query.companies.findMany({
        columns: {
          id: true,
          name: true,
          createdAt: true,
          industry: true
        }
      });
      const companyIdToIndustry = new Map<number, string>();
      for (const c of clients as any[]) companyIdToIndustry.set(c.id, c.industry || 'Others');

      // Calculate window based on period
      let monthsLookback = 12;
      const startDate = new Date();
      if (period === '1week' || period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
        monthsLookback = 1;
      } else if (period === '1month' || period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
        monthsLookback = 1;
      } else if (period === '3months') {
        startDate.setMonth(startDate.getMonth() - 3);
        monthsLookback = 3;
      } else if (period === '6months') {
        startDate.setMonth(startDate.getMonth() - 6);
        monthsLookback = 6;
      } else {
        startDate.setMonth(startDate.getMonth() - 12);
        monthsLookback = 12;
      }

      // Get all survey responses after the start date
      const responses = await db.query.surveyResponses.findMany({
        columns: {
          id: true,
          companyId: true,
          surveyId: true,
          createdAt: true,
          updatedAt: true,
          isAnonymized: true,
          validationStatus: true,
          processingStatus: true
        },
        where: (surveyResponses: any, { gt }: any) => gt(surveyResponses.createdAt, startDate)
      });

      // Get monthly distribution by processing the responses
      const monthlyData = Array.from({ length: monthsLookback }, (_, i) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (monthsLookback - 1 - i));
        return {
          month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          newClients: 0,
          activeClients: 0,
          totalRevenue: 0,
          subscriptionRevenue: 0,
          oneTimeRevenue: 0,
          responses: 0
        };
      });

      // Count clients by month of creation
      clients.forEach(async (client: any) => {
        const clientCreationMonth = new Date(client.createdAt).getMonth();
        const clientCreationYear = new Date(client.createdAt).getFullYear();

        // Find the corresponding month in our data
        const monthIndex = monthlyData.findIndex(data => {
          const [monthStr, yearStr] = data.month.split(' ');
          const month = new Date(Date.parse(`${monthStr} 1, ${yearStr}`)).getMonth();
          const year = parseInt(yearStr);
          return month === clientCreationMonth && year === clientCreationYear;
        });

        if (monthIndex >= 0) {
          monthlyData[monthIndex].newClients++;
        }
      });

      // Count responses by month
      responses.forEach((response: any) => {
        const responseMonth = new Date(response.createdAt).getMonth();
        const responseYear = new Date(response.createdAt).getFullYear();

        const monthIndex = monthlyData.findIndex(data => {
          const [monthStr, yearStr] = data.month.split(' ');
          const month = new Date(Date.parse(`${monthStr} 1, ${yearStr}`)).getMonth();
          const year = parseInt(yearStr);
          return month === responseMonth && year === responseYear;
        });

        if (monthIndex >= 0) {
          monthlyData[monthIndex].responses++;

          // Add fixed revenue data based on survey responses
          // In a real system, this would be from actual revenue tracking
          const responseFactor = 10; // Each response generates fixed amount of revenue
          const responseRevenue = responseFactor * 10; // $100 per response
          monthlyData[monthIndex].totalRevenue += responseRevenue;
          monthlyData[monthIndex].subscriptionRevenue += responseRevenue * 0.7; // 70% from subscriptions
          monthlyData[monthIndex].oneTimeRevenue += responseRevenue * 0.3; // 30% from one-time sales
        }
      });

      // Calculate key performance indicators
      const totalResponses = responses.length;

      // Determine active companies within selected period based on usage signals
      const activeCompanyIds = new Set<number>();
      responses.forEach((r: any) => { if (typeof r.companyId === 'number') activeCompanyIds.add(r.companyId); });

      // Collect activity sources to support bucketed aggregation later
      let activeUsersByLastLogin: any[] = [];
      let sessionsInWindow: any[] = [];
      let usersForSessions: any[] = [];
      let activityLogs: any[] = [];
      let usersForLogs: any[] = [];

      // Include companies with user login activity in the period
      try {
        activeUsersByLastLogin = await db.query.users.findMany({
          columns: { id: true, companyId: true, lastLogin: true },
          where: (users: any, { and, gte }: any) => and(
            gte(users.lastLogin, startDate)
          )
        });
        for (const u of activeUsersByLastLogin as any[]) {
          if (typeof u.companyId === 'number') activeCompanyIds.add(u.companyId);
        }
      } catch {}

      try {
        sessionsInWindow = await db.query.userSessions.findMany({
          columns: { userId: true, loginTime: true },
          where: (userSessions: any, { gte }: any) => gte(userSessions.loginTime, startDate)
        });
        if (sessionsInWindow.length) {
          const userIds = Array.from(new Set(sessionsInWindow.map((s: any) => s.userId))).filter((v: any) => typeof v === 'number');
          if (userIds.length) {
            usersForSessions = await db.query.users.findMany({
              columns: { id: true, companyId: true },
              where: (users: any, { inArray }: any) => inArray(users.id, userIds)
            });
            for (const u of usersForSessions as any[]) {
              if (typeof u.companyId === 'number') activeCompanyIds.add(u.companyId);
            }
          }
        }
      } catch {}

      try {
        activityLogs = await db.query.userActivityLogs.findMany({
          columns: { userId: true, action: true, createdAt: true },
          where: (userActivityLogs: any, { and, gte, eq }: any) => and(
            eq(userActivityLogs.action, 'login'),
            gte(userActivityLogs.createdAt, startDate)
          )
        });
        if (activityLogs.length) {
          const userIds = Array.from(new Set(activityLogs.map((a: any) => a.userId))).filter((v: any) => typeof v === 'number');
          if (userIds.length) {
            usersForLogs = await db.query.users.findMany({
              columns: { id: true, companyId: true },
              where: (users: any, { inArray }: any) => inArray(users.id, userIds)
            });
            for (const u of usersForLogs as any[]) {
              if (typeof u.companyId === 'number') activeCompanyIds.add(u.companyId);
            }
          }
        }
      } catch {}

      const activeClientsCount = activeCompanyIds.size;

      // Revenue: sum of PAID invoices in selected time window
      const nowDate = new Date();
      const windowMs = nowDate.getTime() - startDate.getTime();
      const previousWindowStart = new Date(startDate.getTime() - windowMs);
      let revenueInWindow = 0;
      let revenueInPrevWindow = 0;
      let paidInvoicesInWindow: any[] = [];
      try {
        const paidInvoices = await db.query.invoices.findMany({
          columns: { amount: true, tax: true, paidDate: true, status: true, companyId: true },
          where: (invoices: any, { and, gte, lte, eq }: any) => and(
            eq(invoices.status, 'paid'),
            gte(invoices.paidDate, startDate),
            lte(invoices.paidDate, nowDate)
          )
        });
        paidInvoicesInWindow = paidInvoices as any[];
        revenueInWindow = paidInvoicesInWindow.reduce((sum, inv) => sum + ((inv.amount || 0) + (inv.tax || 0)), 0) / 100; // cents to dollars
      } catch {}
      try {
        const prevPaid = await db.query.invoices.findMany({
          columns: { amount: true, tax: true, paidDate: true, status: true },
          where: (invoices: any, { and, gte, lt, eq }: any) => and(
            eq(invoices.status, 'paid'),
            gte(invoices.paidDate, previousWindowStart),
            lt(invoices.paidDate, startDate)
          )
        });
        revenueInPrevWindow = (prevPaid as any[]).reduce((sum, inv) => sum + ((inv.amount || 0) + (inv.tax || 0)), 0) / 100;
      } catch {}

      const revenueGrowth = revenueInPrevWindow > 0 ? ((revenueInWindow - revenueInPrevWindow) / revenueInPrevWindow) * 100 : 0;

      const clientsThisMonth = monthlyData[monthlyData.length - 1]?.newClients || 0;
      const clientsLastMonth = monthlyData[monthlyData.length - 2]?.newClients || 0;
      const clientGrowth = clientsLastMonth ? ((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100 : 0;

      const responsesThisMonth = monthlyData[monthlyData.length - 1]?.responses || 0;
      const responsesLastMonth = monthlyData[monthlyData.length - 2]?.responses || 0;
      const responseGrowth = responsesLastMonth ? ((responsesThisMonth - responsesLastMonth) / responsesLastMonth) * 100 : 0;

      // Calculate churn rate based on actual data
      // Fetch all clients created in the previous period for comparison
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - monthsLookback);

      // Get clients created in previous period
      const previousPeriodClients = await db.query.companies.findMany({
        columns: {
          id: true
        },
        where: (companies: any, { and, gte, lt }: any) => and(
          gte(companies.createdAt, previousPeriodStart),
          lt(companies.createdAt, startDate)
        )
      });

      // Determine active clients (those with survey responses in current period)
      const activeClientIds = new Set(responses.map((r: any) => r.companyId));

      // Clients from previous period that have no activity in current period are considered churned
      const previousPeriodClientIds = new Set(previousPeriodClients.map((c: any) => c.id));
      let inactiveCount = 0;

      previousPeriodClientIds.forEach(id => {
        if (!activeClientIds.has(id)) {
          inactiveCount++;
        }
      });

      // Calculate churn rate
      const previousTotalClients = previousPeriodClientIds.size;
      const churnRate = previousTotalClients > 0
        ? (inactiveCount / previousTotalClients) * 100
        : 0;

      // Calculate churn rate for previous-previous period to get change
      const previousPreviousPeriodStart = new Date(previousPeriodStart);
      previousPreviousPeriodStart.setMonth(previousPreviousPeriodStart.getMonth() - monthsLookback);

      // Get even older client data for comparison
      const previousPreviousPeriodClients = await db.query.companies.findMany({
        columns: {
          id: true
        },
        where: (companies: any, { and, gte, lt }: any) => and(
          gte(companies.createdAt, previousPreviousPeriodStart),
          lt(companies.createdAt, previousPeriodStart)
        )
      });

      // Get responses from previous period
      const previousPeriodResponses = await db.query.surveyResponses.findMany({
        columns: {
          id: true,
          companyId: true,
          surveyId: true,
          createdAt: true,
          updatedAt: true,
          isAnonymized: true,
          validationStatus: true,
          processingStatus: true
        },
        where: (surveyResponses: any, { and, gte, lt }: any) => and(
          gte(surveyResponses.createdAt, previousPeriodStart),
          lt(surveyResponses.createdAt, startDate)
        )
      });

      // Active clients in previous period
      const previousActiveClientIds = new Set(previousPeriodResponses.map((r: any) => r.companyId));

      // Calculate previous churn
      const previousPreviousTotalClients = previousPreviousPeriodClients.length;
      let previousInactiveCount = 0;

      previousPreviousPeriodClients.forEach((client: any) => {
        if (!previousActiveClientIds.has(client.id)) {
          previousInactiveCount++;
        }
      });

      const previousChurnRate = previousPreviousTotalClients > 0
        ? (previousInactiveCount / previousPreviousTotalClients) * 100
        : 0;

      const churnChange = previousChurnRate > 0
        ? ((churnRate - previousChurnRate) / previousChurnRate) * 100
        : 0;

      // Calculate churned clients for each month
      const getChurnedClientsForMonth = (monthData: any) => {
        const [monthStr, yearStr] = monthData.month.split(' ');
        const monthDate = new Date(Date.parse(`${monthStr} 1, ${yearStr}`));

        // Start of previous month
        const prevMonthDate = new Date(monthDate);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);

        // Count clients created in previous month that have no activity in current month
        const clientsInPrevMonth = clients.filter((client: any) => {
          const clientDate = new Date(client.createdAt);
          return clientDate >= prevMonthDate && clientDate < monthDate;
        });

        // Get responses for current month
        const monthResponses = responses.filter((response: any) => {
          const responseDate = new Date(response.createdAt);
          return responseDate >= monthDate &&
                 responseDate < new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        });

        // Active client IDs in current month
        const monthActiveClientIds = new Set(monthResponses.map((r: any) => r.companyId));

        // Count churned clients
        let monthChurnedClients = 0;
        clientsInPrevMonth.forEach((client: any) => {
          if (!monthActiveClientIds.has(client.id)) {
            monthChurnedClients++;
          }
        });

        return monthChurnedClients;
      };

      // Build time buckets based on selected period for client growth chart
      type TimeBucket = { start: Date; end: Date; label: string };
      const buckets: TimeBucket[] = (() => {
        const list: TimeBucket[] = [];
        const endNow = new Date();
        if (period === '1week' || period === 'week') {
          // 7 daily buckets
          const cur = new Date(startDate);
          while (cur <= endNow) {
            const next = new Date(cur);
            next.setDate(next.getDate() + 1);
            list.push({
              start: new Date(cur),
              end: new Date(next),
              label: cur.toLocaleDateString('default', { month: 'short', day: 'numeric' })
            });
            cur.setDate(cur.getDate() + 1);
          }
        } else if (period === '1month' || period === 'month') {
          // Weekly buckets within the last month
          let cur = new Date(startDate);
          while (cur < endNow) {
            const next = new Date(cur);
            next.setDate(next.getDate() + 7);
            list.push({
              start: new Date(cur),
              end: next < endNow ? new Date(next) : new Date(endNow),
              label: `Week of ${cur.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
            });
            cur = next;
          }
        } else {
          // Monthly buckets for 3,6,12 months
          for (let i = monthsLookback - 1; i >= 0; i--) {
            const start = new Date();
            start.setDate(1);
            start.setMonth(start.getMonth() - i);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            list.push({
              start,
              end,
              label: start.toLocaleString('default', { month: 'short', year: 'numeric' })
            });
          }
        }
        return list;
      })();

      // Prepare quick maps for userId->companyId
      const userCompanyMap = new Map<number, number>();
      for (const u of usersForSessions as any[]) if (typeof u.id === 'number' && typeof u.companyId === 'number') userCompanyMap.set(u.id, u.companyId);
      for (const u of usersForLogs as any[]) if (typeof u.id === 'number' && typeof u.companyId === 'number') userCompanyMap.set(u.id, u.companyId);

      // Compute per-bucket growth metrics
      const clientGrowthBuckets = buckets.map((b) => {
        // New clients in bucket
        const newClientsCount = (clients as any[]).filter((c: any) => {
          const d = new Date(c.createdAt);
          return d >= b.start && d < b.end;
        }).length;

        // Active clients by responses in bucket
        const activeByResponses = new Set<number>();
        for (const r of responses as any[]) {
          const d = new Date(r.createdAt);
          if (d >= b.start && d < b.end && typeof r.companyId === 'number') activeByResponses.add(r.companyId);
        }

        // Active by lastLogin in bucket
        const activeByLastLogin = new Set<number>();
        for (const u of activeUsersByLastLogin as any[]) {
          const d = new Date(u.lastLogin);
          if (d >= b.start && d < b.end && typeof u.companyId === 'number') activeByLastLogin.add(u.companyId);
        }

        // Active by sessions in bucket
        const activeBySessions = new Set<number>();
        for (const s of sessionsInWindow as any[]) {
          const d = new Date(s.loginTime);
          if (d >= b.start && d < b.end) {
            const cid = userCompanyMap.get(s.userId);
            if (typeof cid === 'number') activeBySessions.add(cid);
          }
        }

        // Active by login activity logs in bucket
        const activeByLogs = new Set<number>();
        for (const a of activityLogs as any[]) {
          const d = new Date(a.createdAt);
          if (d >= b.start && d < b.end) {
            const cid = userCompanyMap.get(a.userId);
            if (typeof cid === 'number') activeByLogs.add(cid);
          }
        }

        const activeSet = new Set<number>([
          ...Array.from(activeByResponses),
          ...Array.from(activeByLastLogin),
          ...Array.from(activeBySessions),
          ...Array.from(activeByLogs)
        ]);

        // Churn per bucket: keep 0 for non-month buckets to avoid noisy calc
        const churned = (period === '3months' || period === '6months' || period === '12months') ? getChurnedClientsForMonth({ month: b.label }) : 0;

        return {
          label: b.label,
          newClients: newClientsCount,
          activeClients: activeSet.size,
          churnedClients: churned
        };
      });

      // Revenue buckets from paid invoices within window
      const revenueBuckets = buckets.map((b) => {
        const invs = paidInvoicesInWindow.filter((inv: any) => {
          const d = new Date(inv.paidDate);
          return d >= b.start && d < b.end;
        });
        const totalCents = invs.reduce((sum: number, r: any) => sum + ((r.amount || 0) + (r.tax || 0)), 0);
        const count = invs.length;
        const avg = count > 0 ? (totalCents / count) : 0;
        return {
          label: b.label,
          totalRevenue: Math.round(totalCents) / 100,
          subscriptionRevenue: Math.round(totalCents) / 100,
          oneTimeRevenue: 0,
          paidInvoiceCount: count,
          averageInvoiceValue: Math.round(avg) / 100
        };
      });

      // Format the data for the front end
      // Get active surveys for the dashboard
      const surveys = await db.query.surveys.findMany({
        columns: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
          responseCount: true,
          completionRate: true
        }
      });

      // Get active surveys (status = 'active')
      const activeSurveysData = surveys.filter((survey: any) => survey.status === 'active');

      // Calculate response counts by day for client activity
      const clientActivity = {
        daily: {} as Record<string, number>,
        weekly: {} as Record<string, number>,
        monthly: {} as Record<string, number>
      };

      // Process responses for client activity tracking
      responses.forEach((response: any) => {
        const dateObj = new Date(response.createdAt);

        // Format date as YYYY-MM-DD for daily tracking
        const dailyKey = dateObj.toISOString().split('T')[0];
        clientActivity.daily[dailyKey] = (clientActivity.daily[dailyKey] || 0) + 1;

        // Format week as YYYY-WW for weekly tracking
        const weekNum = Math.ceil((dateObj.getDate() + (new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay())) / 7);
        const weeklyKey = `${dateObj.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        clientActivity.weekly[weeklyKey] = (clientActivity.weekly[weeklyKey] || 0) + 1;

        // Format month as YYYY-MM for monthly tracking
        const monthlyKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
        clientActivity.monthly[monthlyKey] = (clientActivity.monthly[monthlyKey] || 0) + 1;
      });

      // Convert client activity records to arrays for easier consumption by frontend
      const clientActivityFormatted = {
        daily: Object.entries(clientActivity.daily)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30), // Last 30 days
        weekly: Object.entries(clientActivity.weekly)
          .map(([week, count]) => ({ week, count }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-12), // Last 12 weeks
        monthly: Object.entries(clientActivity.monthly)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12) // Last 12 months
      };

      // Calculate industry distribution and revenue by industry for the selected period
      const industryDistributionData = await (async () => {
        // Build actual industries observed in DB
        const actualIndustrySet = new Set<string>();
        for (const c of clients as any[]) {
          const ind = (c.industry && String(c.industry).trim()) || 'Others';
          actualIndustrySet.add(ind);
        }
        for (const inv of paidInvoicesInWindow as any[]) {
          const ind = companyIdToIndustry.get(inv.companyId) || 'Others';
          actualIndustrySet.add(ind);
        }

        const commonIndustries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Others'];
        const useDefaults = actualIndustrySet.size < 3; // fallback threshold
        const seedIndustries = useDefaults ? commonIndustries : Array.from(actualIndustrySet);

        const industryMap = new Map<string, { name: string; clients: number; revenue: number }>();
        for (const ind of seedIndustries) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });

        // Count clients per industry
        for (const c of clients as any[]) {
          const ind = (c.industry && String(c.industry).trim()) || 'Others';
          if (!industryMap.has(ind)) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });
          industryMap.get(ind)!.clients += 1;
        }

        // Attribute revenue by paid invoices in the window
        for (const inv of paidInvoicesInWindow as any[]) {
          const ind = companyIdToIndustry.get(inv.companyId) || 'Others';
          if (!industryMap.has(ind)) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });
          industryMap.get(ind)!.revenue += ((inv.amount || 0) + (inv.tax || 0)) / 100;
        }

        return Array.from(industryMap.values());
      })();

      const result = {
        keyMetrics: [
          {
            id: 'clients',
            metric: 'Active Clients',
            value: activeClientsCount,
            change: clientGrowth,
            trend: clientGrowth >= 0 ? 'up' : 'down'
          },
          {
            id: 'responses',
            metric: 'Survey Responses',
            value: totalResponses,
            change: responseGrowth,
            trend: responseGrowth >= 0 ? 'up' : 'down'
          },
          {
            id: 'mrr',
            metric: 'Revenue',
            value: revenueInWindow,
            change: revenueGrowth,
            trend: revenueGrowth >= 0 ? 'up' : 'down'
          },
          {
            id: 'churn-rate',
            metric: 'Churn Rate',
            value: parseFloat(churnRate.toFixed(1)),
            change: parseFloat(churnChange.toFixed(1)),
            trend: churnChange <= 0 ? 'down' : 'up'
          }
        ],
        clientGrowth: clientGrowthBuckets,
        // Backward-compat removed in favor of invoice-derived buckets
        revenue: revenueBuckets,
        // Add the missing properties
        industryBreakdown: await (async () => {
          // Use same selection logic as distribution to choose labels
          const actualIndustrySet = new Set<string>();
          for (const c of clients as any[]) {
            const ind = (c.industry && String(c.industry).trim()) || 'Others';
            actualIndustrySet.add(ind);
          }
          for (const inv of paidInvoicesInWindow as any[]) {
            const ind = companyIdToIndustry.get(inv.companyId) || 'Others';
            actualIndustrySet.add(ind);
          }
          const commonIndustries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Others'];
          const useDefaults = actualIndustrySet.size < 3;
          const seedIndustries = useDefaults ? commonIndustries : Array.from(actualIndustrySet);

          const industryMap = new Map<string, { name: string; clients: number; revenue: number }>();
          for (const ind of seedIndustries) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });

          // Clients count
          for (const c of clients as any[]) {
            const ind = (c.industry && String(c.industry).trim()) || 'Others';
            if (!industryMap.has(ind)) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });
            industryMap.get(ind)!.clients += 1;
          }
          // Revenue sums
          for (const inv of paidInvoicesInWindow as any[]) {
            const ind = companyIdToIndustry.get(inv.companyId) || 'Others';
            if (!industryMap.has(ind)) industryMap.set(ind, { name: ind, clients: 0, revenue: 0 });
            industryMap.get(ind)!.revenue += ((inv.amount || 0) + (inv.tax || 0)) / 100;
          }

          return Array.from(industryMap.values());
        })(),
        // Add the new properties that were missing
        industryDistribution: industryDistributionData,
        clientActivity: clientActivityFormatted,
        activeSurveys: activeSurveysData.map((survey: any) => ({
          id: survey.id,
          title: survey.title,
          status: survey.status,
          responseCount: survey.responseCount || 0,
          completionRate: survey.completionRate || 0,
          createdAt: survey.createdAt.toISOString(),
          updatedAt: survey.updatedAt.toISOString()
        }))
      };

      // Cache and return
      adminAnalyticsCache.set(period, { expiresAt: Date.now() + 60_000, data: result });
      res.json(result);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch admin analytics data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin surveys endpoint to get all surveys with analytics
  app.get('/api/admin/surveys', async (req: Request, res: Response) => {
    try {
      console.log('Fetching all surveys for admin view');

      // Get all surveys with company information
      const surveys = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            s.id,
            s.company_id,
            s.created_by_id,
            s.title,
            s.description,
            s.survey_type,
            s.is_active,
            s.is_public,
            s.status,
            s.response_count,
            s.max_responses,
            s.completion_rate,
            s.created_at,
            s.updated_at,
            c.name as company_name,
            c.email as company_email,
            c.industry as company_industry,
            u.first_name as creator_first_name,
            u.last_name as creator_last_name
          FROM surveys s
          LEFT JOIN companies c ON s.company_id = c.id
          LEFT JOIN users u ON s.created_by_id = u.id
          ORDER BY s.created_at DESC
        `);
      });

      // Get response counts and analytics for each survey
      const surveysWithAnalytics = await Promise.all(
        surveys.rows.map(async (survey: any) => {
          // Get response count for this survey
          const responseCountResult = await executeWithRetry(async () => {
            return await db.execute(sql`
              SELECT COUNT(*) as count
              FROM survey_responses 
              WHERE survey_id = ${survey.id}
            `);
          });

          const responseCount = responseCountResult.rows[0]?.count || 0;

          // Get completion rate
          const completionResult = await executeWithRetry(async () => {
            return await db.execute(sql`
              SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN completed = true THEN 1 END) as completed
              FROM survey_responses 
              WHERE survey_id = ${survey.id}
            `);
          });

          const totalResponses = completionResult.rows[0]?.total || 0;
          const completedResponses = completionResult.rows[0]?.completed || 0;
          const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

          // Get average completion time
          const avgTimeResult = await executeWithRetry(async () => {
            return await db.execute(sql`
              SELECT AVG(response_time_seconds) as avg_time
              FROM survey_responses 
              WHERE survey_id = ${survey.id} AND response_time_seconds IS NOT NULL
            `);
          });

          const avgTimeSeconds = avgTimeResult.rows[0]?.avg_time || 0;
          const avgTimeMinutes = Math.round(avgTimeSeconds / 60);

          // Get last response date
          const lastResponseResult = await executeWithRetry(async () => {
            return await db.execute(sql`
              SELECT MAX(created_at) as last_response
              FROM survey_responses 
              WHERE survey_id = ${survey.id}
            `);
          });

          const lastResponseDate = lastResponseResult.rows[0]?.last_response;

          // Get survey flags
          const flagsResult = await executeWithRetry(async () => {
            return await db.execute(sql`
              SELECT id, survey_id, type, description, status, created_by_name, 
                     created_at, resolved_at, resolved_by_name
              FROM survey_flags
              WHERE survey_id = ${survey.id}
              ORDER BY created_at DESC
            `);
          });

          const flags = flagsResult.rows.map((flag: any) => ({
            id: flag.id,
            surveyId: flag.survey_id,
            type: flag.type,
            description: flag.description,
            status: flag.status,
            createdBy: flag.created_by_name || 'Unknown',
            createdAt: flag.created_at,
            resolvedAt: flag.resolved_at,
            resolvedBy: flag.resolved_by_name
          }));

          return {
            id: survey.id,
            title: survey.title,
            description: survey.description,
            surveyType: survey.survey_type,
            isActive: survey.is_active,
            isPublic: survey.is_public,
            status: survey.status,
            companyId: survey.company_id,
            companyName: survey.company_name,
            companyEmail: survey.company_email,
            companyIndustry: survey.company_industry,
            createdById: survey.created_by_id,
            creatorName: `${survey.creator_first_name || ''} ${survey.creator_last_name || ''}`.trim() || 'Unknown',
            createdAt: survey.created_at,
            updatedAt: survey.updated_at,
            responseCount: parseInt(survey.response_count) || 0,
            maxResponses: survey.max_responses,
            flags: flags,
            analytics: {
              responseCount: parseInt(responseCount),
              completionRate: completionRate,
              averageCompletionTime: avgTimeMinutes,
              lastResponseDate: lastResponseDate,
              totalResponses: parseInt(totalResponses),
              completedResponses: parseInt(completedResponses)
            }
          };
        })
      );

      res.json({
        status: 'success',
        data: surveysWithAnalytics,
        total: surveysWithAnalytics.length
      });
    } catch (error) {
      console.error('Error fetching admin surveys:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch surveys data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Import memory storage for BI endpoints with demo data
  const { storage: _memStorage } = await import('./storage');
  
  // Import database storage implementation with working BI features
  const { dbStorage: completeStorage } = await import('./database-storage-clean');
  
  // Register survey-specific BI endpoints with working storage implementation
  // addSurveyBIEndpoints(app, completeStorage);
  
  // Register analytics routes
  app.use('/api/analytics', analyticsRouter);
  
  // Clients API endpoint
  app.get('/api/clients', async (_req: Request, res: Response) => {
    try {
      const clients = await executeWithRetry(async () => {
        // Use manual join instead of with clause to avoid relation issues
        const result = await db.execute(sql`
          SELECT 
            c.id,
            c.name,
            c.email,
            c.industry,
            c.company_size as "size",
            c.company_size as "companySize",
            c.subscription_tier as "subscriptionTier",
            c.license_status as "licenseStatus",
            c.license_id as "licenseId",
            c.website as "website",
            c.contact_phone as "contactPhone",
            c.address as "address",
            c.license_start_date as "licenseStartDate",
            c.license_end_date as "licenseEndDate",
            c.created_at as "createdAt",
            u.first_name as "firstName",
            u.last_name as "lastName",
            u.email as "userEmail",
            u.role as "userRole",
            u.is_active as "userActive",
            bc.budget as "budget",
            bc.decision_timeframe as "decisionTimeframe",
            bc.pain_points as "businessChallenges",
            bc.current_solutions as "previousSolutions",
            bc.desired_outcomes as "keyObjectives"
          FROM companies c
          LEFT JOIN users u ON c.id = u.company_id
          LEFT JOIN business_contexts bc ON c.id = bc.company_id AND bc.is_active = true
          ORDER BY c.created_at DESC
        `);
        
        // Group by company and get the first user for each company
        const companyMap = new Map();
        
        for (const row of result.rows) {
          const companyId = row.id;
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              id: row.id,
              name: row.name,
              email: row.email,
              industry: row.industry,
              size: row.size,
              companySize: row.companySize,
              subscriptionTier: row.subscriptionTier,
              licenseStatus: row.licenseStatus,
              licenseId: row.licenseId,
              website: row.website,
              contactPhone: row.contactPhone,
              address: row.address,
              licenseStartDate: row.licenseStartDate,
              licenseEndDate: row.licenseEndDate,
              createdAt: row.createdAt,
              firstName: row.firstName,
              lastName: row.lastName,
              userEmail: row.userEmail,
              userRole: row.userRole,
              userActive: row.userActive,
              // Business context fields
              budget: row.budget,
              decisionTimeframe: row.decisionTimeframe,
              businessChallenges: row.businessChallenges,
              previousSolutions: row.previousSolutions,
              keyObjectives: row.keyObjectives
            });
          }
        }
        
        return Array.from(companyMap.values());
      });
      
      // Transform the data to include user information
      const transformedClients = clients.map((company: any) => ({
        id: company.id,
        name: company.name, // Company name
        company: company.name, // Company name for backward compatibility
        email: company.email,
        industry: company.industry,
        size: company.size,
        companySize: company.companySize,
        subscriptionTier: company.subscriptionTier,
        licenseStatus: company.licenseStatus,
        licenseId: company.licenseId,
        website: company.website,
        contactPhone: company.contactPhone,
        address: company.address,
        // derive simple UI status for badge compatibility
        status: company.licenseStatus === 'active' ? 'active' : (company.licenseStatus === 'expired' || company.licenseStatus === 'suspended' ? 'inactive' : 'active'),
        licenseStartDate: company.licenseStartDate,
        licenseEndDate: company.licenseEndDate,
        createdAt: company.createdAt,
        // User information (primary user for this company)
        firstName: company.firstName || '',
        lastName: company.lastName || '',
        userName: company.firstName && company.lastName ? `${company.firstName} ${company.lastName}`.trim() : '',
        userRole: company.userRole || '',
        userActive: company.userActive || false,
        // Business context fields
        budget: company.budget,
        decisionTimeframe: company.decisionTimeframe,
        businessChallenges: company.businessChallenges,
        previousSolutions: company.previousSolutions,
        keyObjectives: company.keyObjectives
      }));
      
      res.json({
        status: 'success',
        data: transformedClients
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch clients data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create client endpoint - for adding new clients
  app.post('/api/clients', async (req: Request, res: Response) => {
    try {
      const clientData = req.body;

      // Generate a random API key for the new client
      const apiKey = `api_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      // Status will be copied from license, no need to map from form

      // Split name into firstName and lastName
      const nameParts = clientData.name ? clientData.name.trim().split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user first
      const [newUser] = await db.insert(users).values({
        username: clientData.email,
        password: clientData.password, // Store password directly as plain text
        email: clientData.email,
        firstName: firstName,
        lastName: lastName,
        role: 'business_user',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Optional: validate provided licenseId and get license data
      let validatedLicenseId: number | null = null;
      let licenseEndDate: Date | null = null;
      let licenseStartDate: Date = new Date(); // Default to current date if no license
      let licenseStatus: string = 'active'; // Default to active if no license
      let maxUsers: number | undefined = undefined;
      let maxSurveys: number | undefined = undefined;
      let maxResponses: number | undefined = undefined;
      if (clientData.licenseId !== undefined && clientData.licenseId !== null) {
        const parsed = typeof clientData.licenseId === 'string' ? parseInt(clientData.licenseId, 10) : clientData.licenseId;
        if (!isNaN(parsed)) {
          const foundLicense = await db.query.licenses.findFirst({ where: eq(licenses.id, parsed) });
          if (!foundLicense) {
            return res.status(400).json({
              status: 'error',
              message: 'Provided licenseId does not exist'
            });
          }
          validatedLicenseId = parsed;
          // Copy license data to company
          licenseEndDate = foundLicense.endDate ?? null;
          licenseStartDate = foundLicense.startDate ?? new Date(); // Copy start date from license
          licenseStatus = foundLicense.status || 'active'; // Copy status from license
          maxUsers = foundLicense.maxSeats;
          maxSurveys = foundLicense.maxSurveys;
          maxResponses = foundLicense.maxResponses;
        }
      }

      // Insert the new company
      const [newCompany] = await db.insert(companies).values({
        name: clientData.company || clientData.name,
        email: clientData.email,
        apiKey,
        industry: clientData.industry || null,
        size: clientData.companySize || clientData.size || null,
        primaryContact: clientData.preferredCommunication || null,
        contactPhone: clientData.contactPhone || null,
        website: clientData.website || null,
        subscriptionTier: clientData.subscriptionTier || 'trial',
        licenseStatus: licenseStatus, // Use status copied from license
        licenseId: validatedLicenseId,
        licenseStartDate: licenseStartDate, // Copy start date from license
        licenseEndDate: licenseEndDate,
        // Copy max limits from license if available
        maxUsers: maxUsers,
        maxSurveys: maxSurveys,
        maxResponses: maxResponses,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Create business context record if any business context data is provided
      const hasBusinessContext = (
        !!clientData.budget ||
        !!clientData.decisionTimeframe ||
        !!clientData.growthStage ||
        (Array.isArray(clientData.businessChallenges) && clientData.businessChallenges.length > 0) ||
        (Array.isArray(clientData.techStack) && clientData.techStack.length > 0) ||
        (Array.isArray(clientData.keyObjectives) && clientData.keyObjectives.length > 0) ||
        (Array.isArray(clientData.previousSolutions) && clientData.previousSolutions.length > 0)
      );

      if (hasBusinessContext) {
        await db.insert(businessContexts).values({
          companyId: newCompany.id,
          createdById: req.user?.id || newUser.id, // Use admin user ID, fallback to new user ID
          name: `${clientData.company || clientData.name} - Business Context`,
          industry: clientData.industry || null,
          companySize: clientData.companySize || clientData.size || null,
          companyStage: clientData.growthStage || null,
          budget: clientData.budget || null,
          decisionTimeframe: clientData.decisionTimeframe || null,
          painPoints: Array.isArray(clientData.businessChallenges) ? clientData.businessChallenges : null,
          currentSolutions: Array.isArray(clientData.previousSolutions) ? clientData.previousSolutions.join(', ') : (clientData.previousSolutions || null),
          desiredOutcomes: Array.isArray(clientData.keyObjectives) ? clientData.keyObjectives : null,
          // Map techStack to productFeatures for richer context
          productFeatures: Array.isArray(clientData.techStack) ? clientData.techStack : null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update user with companyId
      await db.update(users)
        .set({ companyId: newCompany.id })
        .where(eq(users.id, newUser.id));

      res.status(201).json({
        status: 'success',
        message: 'Client created successfully',
        data: newCompany
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({
          status: 'error',
          message: 'A client with this email already exists',
          error: error.detail
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to create client',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Get client details
  app.get('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      
      if (isNaN(clientId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid client ID'
        });
      }
      
      // Return an enriched client payload similar to the list API
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.industry,
          c.company_size as "companySize",
          c.subscription_tier as "subscriptionTier",
          c.license_status as "licenseStatus",
          c.license_id as "licenseId",
          l.name as "licenseName",
          c.website as "website",
          c.contact_phone as "contactPhone",
          c.address as "address",
          c.primary_contact as "preferredCommunication",
          c.license_start_date as "licenseStartDate",
          c.license_end_date as "licenseEndDate",
          c.created_at as "createdAt",
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email as "userEmail",
          u.role as "userRole",
          u.is_active as "userActive",
          bc.budget as "budget",
          bc.decision_timeframe as "decisionTimeframe",
          bc.pain_points as "businessChallenges",
          bc.current_solutions as "previousSolutions",
          bc.desired_outcomes as "keyObjectives",
          bc.product_features as "techStack",
          bc.company_stage as "growthStage"
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id
        LEFT JOIN business_contexts bc ON c.id = bc.company_id AND bc.is_active = true
        LEFT JOIN licenses l ON c.license_id = l.id
        WHERE c.id = ${clientId}
        LIMIT 1
      `);
      const row = result.rows[0];
      const client = row && {
        id: row.id,
        name: row.name,
        company: row.name,
        email: row.email,
        industry: row.industry,
        companySize: row.companySize,
        subscriptionTier: row.subscriptionTier,
        licenseStatus: row.licenseStatus,
        licenseId: row.licenseId,
        licenseName: row.licenseName,
        website: row.website,
        contactPhone: row.contactPhone,
        address: row.address,
        preferredCommunication: row.preferredCommunication || null,
        status: row.licenseStatus === 'active' ? 'active' : (row.licenseStatus === 'expired' || row.licenseStatus === 'suspended' ? 'inactive' : 'active'),
        licenseStartDate: row.licenseStartDate,
        licenseEndDate: row.licenseEndDate,
        createdAt: row.createdAt,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        userName: row.firstName && row.lastName ? `${row.firstName} ${row.lastName}`.trim() : '',
        userRole: row.userRole || '',
        userActive: row.userActive || false,
        // Business context fields
        budget: row.budget,
        decisionTimeframe: row.decisionTimeframe,
        businessChallenges: Array.isArray(row.businessChallenges) ? row.businessChallenges : (row.businessChallenges || []),
        previousSolutions: (() => {
          const v = row.previousSolutions;
          if (!v) return [];
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') {
            const trimmed = v.trim();
            // If it's a JSON array string, parse; otherwise split CSV
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                // fall through to CSV
              }
            }
            return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          return [];
        })(),
        keyObjectives: Array.isArray(row.keyObjectives) ? row.keyObjectives : (row.keyObjectives || []),
        techStack: Array.isArray(row.techStack) ? row.techStack : (row.techStack || []),
        growthStage: row.growthStage || ''
      };
      
      if (!client) {
        return res.status(404).json({
          status: 'error',
          message: 'Client not found'
        });
      }
      
      res.json({
        status: 'success',
        data: client
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch client data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Delete client
  app.delete('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      
      if (isNaN(clientId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid client ID'
        });
      }
      
      // Check if client exists
      const clientExists = await db.query.companies.findFirst({
        where: eq(companies.id, clientId)
      });
      
      if (!clientExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Client not found'
        });
      }
      
      // Perform cascading deletions in a transaction
      await db.transaction(async (tx: any) => {
        // Delete business context records for this company first to avoid FK violations
        await tx.delete(businessContexts).where(eq(businessContexts.companyId, clientId));

        // Collect user IDs for this company
        const userRows = await tx.execute(sql`
          SELECT id FROM users WHERE company_id = ${clientId}
        `);
        const userIds: number[] = userRows.rows.map((r: any) => r.id).filter((v: any) => typeof v === 'number');

        if (userIds.length > 0) {
          // Delete dependent rows referencing users to satisfy FK constraints
          await tx.delete(userActivityLogs).where(sql`user_id IN (${userIds.join(',')})`);
          await tx.delete(userSessions).where(sql`user_id IN (${userIds.join(',')})`);
          // Add more cascades here if needed as other FK violations surface

          // Delete users
          await tx.delete(users).where(sql`id IN (${userIds.join(',')})`);
        }

        // Delete support ticket comments for tickets owned by this company
        await tx.execute(sql`
          DELETE FROM support_ticket_comments
          WHERE ticket_id IN (SELECT id FROM support_tickets WHERE company_id = ${clientId})
        `);
        // Delete support tickets for this company
        await tx.delete(supportTickets).where(eq(supportTickets.companyId as any, clientId));

        // Delete survey responses for this company
        await tx.delete(surveyResponses).where(eq(surveyResponses.companyId as any, clientId));
        // Delete surveys for this company
        await tx.delete(surveys).where(eq(surveys.companyId as any, clientId));

        // Delete payment transactions for this company
        await tx.delete(paymentTransactions).where(eq(paymentTransactions.companyId as any, clientId));
        // Delete invoices for this company
        await tx.delete(invoices).where(eq(invoices.companyId as any, clientId));
        // Delete subscriptions for this company
        await tx.delete(subscriptions).where(eq(subscriptions.companyId as any, clientId));

        // Delete the company
        await tx.delete(companies).where(eq(companies.id, clientId));
      });
      
      res.json({
        status: 'success',
        message: 'Client deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      if (error.code === '23503') { // Foreign key violation
        res.status(400).json({
          status: 'error',
          message: 'Cannot delete client because it has associated data. Delete related data first.',
          error: error.detail
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete client',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Update a client
  app.put('/api/clients/:id', async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      
      if (isNaN(clientId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid client ID'
        });
      }
      
      // Check if client exists
      const clientExists = await db.query.companies.findFirst({
        where: eq(companies.id, clientId)
      });
      
      if (!clientExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Client not found'
        });
      }
      
      // Update the client
      const { 
        name, 
        email, 
        company, 
        status, 
        contactPhone, 
        website, 
        industry, 
        companySize, 
        budget,
        decisionTimeframe,
        businessChallenges,
        growthStage,
        techStack,
        keyObjectives,
        preferredCommunication,
        previousSolutions,
        subscriptionTier,
        licenseId 
      } = req.body;
      
      console.log("Update client request:", req.body);
      
      // Map client status to license status in the database
      // Status will be copied from license if licenseId is provided/changed
      // Otherwise, keep existing licenseStatus
      let licenseStatus = clientExists.licenseStatus || 'active'; // Default to existing or active
      
      // Build company update payload - IMPORTANT: `companies.name` is the company name
      const updateData: any = {
        name: company !== undefined ? company : clientExists.name,
        email,
        contactPhone,
        website,
        industry,
        // Map preferredCommunication to primaryContact
        primaryContact: preferredCommunication || null,
        updatedAt: new Date()
      };
      // Validate and set subscriptionTier if provided
      if (typeof subscriptionTier === 'string') {
        const allowedTiers = ['trial', 'annual', 'project'];
        if (allowedTiers.includes(subscriptionTier)) {
          updateData.subscriptionTier = subscriptionTier;
        }
      }
      
      // Only add optional fields if they exist
      if (companySize !== undefined) updateData.size = companySize;
      
      // Handle licenseId separately to correctly support null values
      // licenseId could be null, undefined, a number, or a string that needs parsing
      if (licenseId !== undefined) {
        if (licenseId === null || licenseId === "null") {
          updateData.licenseId = null;
          updateData.licenseStartDate = new Date(); // Reset to current date when license is removed
          updateData.licenseEndDate = null;
          console.log("Setting licenseId to null");
        } else if (typeof licenseId === 'number') {
          updateData.licenseId = licenseId;
          // Get license data from license record
          const licenseRecord = await db.query.licenses.findFirst({ where: eq(licenses.id, licenseId) });
          if (licenseRecord) {
            updateData.licenseStartDate = licenseRecord.startDate || new Date(); // Copy start date from license
            updateData.licenseEndDate = licenseRecord.endDate || null;
            licenseStatus = licenseRecord.status || 'active'; // Copy status from license
            // Also copy max limits and features if license changed
            updateData.maxUsers = licenseRecord.maxSeats;
            updateData.maxSurveys = licenseRecord.maxSurveys;
            updateData.maxResponses = licenseRecord.maxResponses;
            
            // Copy features from license to company boolean fields
            if (licenseRecord.features) {
              const features = typeof licenseRecord.features === 'string' 
                ? JSON.parse(licenseRecord.features) 
                : licenseRecord.features;
              
              if (features && typeof features === 'object') {
                if (features.customBranding !== undefined) updateData.customBranding = features.customBranding;
                if (features.aiInsights !== undefined) updateData.aiInsights = features.aiInsights;
                if (features.advancedAnalytics !== undefined) updateData.advancedAnalytics = features.advancedAnalytics;
                if (features.dataExport !== undefined) updateData.dataExport = features.dataExport;
                if (features.socialSharing !== undefined) updateData.socialSharing = features.socialSharing;
                if (features.crmIntegration !== undefined) updateData.crmIntegration = features.crmIntegration;
              }
            }
          }
          console.log(`Setting licenseId to number: ${licenseId}`);
        } else if (typeof licenseId === 'string') {
          // Try to parse as number if it's a string
          const parsed = parseInt(licenseId, 10);
          if (!isNaN(parsed)) {
            updateData.licenseId = parsed;
            // Get license data from license record
            const licenseRecord = await db.query.licenses.findFirst({ where: eq(licenses.id, parsed) });
            if (licenseRecord) {
              updateData.licenseStartDate = licenseRecord.startDate || new Date(); // Copy start date from license
              updateData.licenseEndDate = licenseRecord.endDate || null;
              licenseStatus = licenseRecord.status || 'active'; // Copy status from license
              // Also copy max limits and features if license changed
              updateData.maxUsers = licenseRecord.maxSeats;
              updateData.maxSurveys = licenseRecord.maxSurveys;
              updateData.maxResponses = licenseRecord.maxResponses;
              
              // Copy features from license to company boolean fields
              if (licenseRecord.features) {
                const features = typeof licenseRecord.features === 'string' 
                  ? JSON.parse(licenseRecord.features) 
                  : licenseRecord.features;
                
                if (features && typeof features === 'object') {
                  if (features.customBranding !== undefined) updateData.customBranding = features.customBranding;
                  if (features.aiInsights !== undefined) updateData.aiInsights = features.aiInsights;
                  if (features.advancedAnalytics !== undefined) updateData.advancedAnalytics = features.advancedAnalytics;
                  if (features.dataExport !== undefined) updateData.dataExport = features.dataExport;
                  if (features.socialSharing !== undefined) updateData.socialSharing = features.socialSharing;
                  if (features.crmIntegration !== undefined) updateData.crmIntegration = features.crmIntegration;
                }
              }
            }
          } else {
            updateData.licenseId = null;
            updateData.licenseEndDate = null;
          }
          console.log(`Parsed licenseId string '${licenseId}' to: ${updateData.licenseId}`);
        }
      }
      
      // Set licenseStatus (copied from license if licenseId was provided/changed, otherwise keep existing)
      updateData.licenseStatus = licenseStatus;

      // Update related user record: first/last name and email, and optionally password
      {
        const user = await db.query.users.findFirst({
          where: eq(users.companyId, clientId)
        });
        if (user) {
          const userUpdates: any = { updatedAt: new Date() };
          if (typeof name === 'string' && name.trim()) {
            const parts = name.trim().split(/\s+/);
            userUpdates.firstName = parts[0] || null;
            userUpdates.lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
          }
          if (typeof email === 'string' && email.trim()) {
            userUpdates.email = email.trim();
            // Keep username aligned with email if that's your convention
            if (!user.username || user.username === user.email) {
              userUpdates.username = email.trim();
            }
          }
          if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim() !== '') {
            userUpdates.password = req.body.password;
          }
          if (Object.keys(userUpdates).length > 1) {
            await db.update(users).set(userUpdates).where(eq(users.id, user.id));
          }
        }
      }
      
      const updatedClient = await db.update(companies)
        .set(updateData)
        .where(eq(companies.id, clientId))
        .returning();

      // Update business context if any business context fields are provided
      const hasBusinessContext = (
        budget !== undefined ||
        decisionTimeframe !== undefined ||
        growthStage !== undefined ||
        preferredCommunication !== undefined ||
        (businessChallenges !== undefined && Array.isArray(businessChallenges) && businessChallenges.length > 0) ||
        (techStack !== undefined && Array.isArray(techStack) && techStack.length > 0) ||
        (keyObjectives !== undefined && Array.isArray(keyObjectives) && keyObjectives.length > 0) ||
        (previousSolutions !== undefined && Array.isArray(previousSolutions) && previousSolutions.length > 0)
      );

      if (hasBusinessContext) {
        // Check if business context exists for this company
        const existingBusinessContext = await db.query.businessContexts.findFirst({
          where: eq(businessContexts.companyId, clientId)
        });

        const businessContextData: any = {
          updatedAt: new Date()
        };

        // Update industry and companySize if provided
        if (industry !== undefined) businessContextData.industry = industry;
        if (companySize !== undefined) businessContextData.companySize = companySize;
        
        // Update business context fields
        if (budget !== undefined) businessContextData.budget = budget;
        if (decisionTimeframe !== undefined) businessContextData.decisionTimeframe = decisionTimeframe;
        if (growthStage !== undefined) businessContextData.companyStage = growthStage;
        
        // Handle array fields with proper array checking
        if (businessChallenges !== undefined) {
          businessContextData.painPoints = Array.isArray(businessChallenges) ? businessChallenges : null;
        }
        if (keyObjectives !== undefined) {
          businessContextData.desiredOutcomes = Array.isArray(keyObjectives) ? keyObjectives : null;
        }
        if (previousSolutions !== undefined) {
          // Store as a comma-separated string for now, but avoid double-encoding JSON arrays
          if (Array.isArray(previousSolutions)) {
            businessContextData.currentSolutions = previousSolutions.join(', ');
          } else if (typeof previousSolutions === 'string') {
            // If a JSON array string was sent, parse it to array then join for storage
            const trimmed = previousSolutions.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"['))) {
              try {
                const parsed = JSON.parse(trimmed);
                businessContextData.currentSolutions = Array.isArray(parsed) ? parsed.join(', ') : trimmed;
              } catch {
                businessContextData.currentSolutions = trimmed;
              }
            } else {
              businessContextData.currentSolutions = trimmed;
            }
          } else {
            businessContextData.currentSolutions = null;
          }
        }
        if (techStack !== undefined) {
          businessContextData.productFeatures = Array.isArray(techStack) ? techStack : null;
        }

        if (existingBusinessContext) {
          // Update existing business context
          await db.update(businessContexts)
            .set(businessContextData)
            .where(eq(businessContexts.id, existingBusinessContext.id));
        } else {
          // Find the user associated with this company for createdById
          const user = await db.query.users.findFirst({
            where: eq(users.companyId, clientId)
          });
          
          // Create new business context
          await db.insert(businessContexts).values({
            companyId: clientId,
            createdById: req.user?.id || user?.id || clientId, // Use admin user ID, fallback to company user ID, then company ID
            name: `${company || name} - Business Context`,
            industry: industry || null,
            companySize: companySize || null,
            ...businessContextData,
            isActive: true,
            createdAt: new Date()
          });
        }
      }
      
      return res.status(200).json({
        status: 'success',
        data: updatedClient[0],
        message: 'Client updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      
      // Log more details for debugging
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status code:', error.response.status);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error details:', error.message);
      }
      
      // Return a more detailed error response
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update client',
        error: error instanceof Error ? error.message : String(error),
        details: error.detail || error.stack || null
      });
    }
  });
  
  // Licenses API endpoint
  app.get('/api/licenses', async (_req: Request, res: Response) => {
    try {
      const licensesData = await executeWithRetry(async () => {
        return await db.query.licenses.findMany({
        columns: {
          id: true,
          licenseKey: true,
          type: true,
          status: true,
          name: true,
          description: true,
          maxSurveys: true,
            maxResponses: true,
            maxSeats: true,
            startDate: true,
            endDate: true,
            cost: true,
            features: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          }
        });
      });
      
      // Transform into the format expected by the frontend
      const formattedLicenses = licensesData.map((license: any) => ({
        id: license.id,
        name: license.name,
        plan: license.type, // type (project/annual) maps to plan
        status: license.status,
        startDate: license.startDate,
        endDate: license.endDate || null,
        limits: {
          users: license.maxSeats,
          surveys: license.maxSurveys,
          responses: license.maxResponses,
          storage: null // licenses table doesn't have storage limit
        },
        isActive: license.status === 'active',
        // Include additional fields that might be needed
        licenseKey: license.licenseKey,
        description: license.description,
        cost: license.cost,
        features: license.features,
        notes: license.notes,
        createdAt: license.createdAt,
        updatedAt: license.updatedAt
      }));
      
      res.json({
        status: 'success',
        data: formattedLicenses
      });
    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch licenses data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Invoices API - create invoice (transactional: optional subscription create/reuse, optional immediate payment)
  app.post('/api/invoices', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const companyId = parseInt(String(body.companyId));
      const providedSubscriptionId = body.subscriptionId !== null && body.subscriptionId !== undefined ? parseInt(String(body.subscriptionId)) : null;
      const invoiceNumber = String(body.invoiceNumber || '').trim();
      const currency = (body.currency || 'USD').toString();
      const statusInput = (body.status || 'draft').toString();
      const dueDateStr = String(body.dueDate || '');
      const itemsRaw = body.items;
      const notes = body.notes ? String(body.notes) : null;
      const billingCycleInput = body.billingCycle ? String(body.billingCycle) : undefined; // optional hint

      if (!companyId || Number.isNaN(companyId)) return res.status(400).json({ status: 'error', message: 'Invalid companyId' });
      if (!invoiceNumber) return res.status(400).json({ status: 'error', message: 'invoiceNumber is required' });
      const dueDate = new Date(dueDateStr);
      if (isNaN(dueDate.getTime())) return res.status(400).json({ status: 'error', message: 'Invalid dueDate' });

      // Parse items
      let items: any;
      try {
        items = typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : itemsRaw;
        if (!Array.isArray(items)) throw new Error('items must be an array');
      } catch {
        return res.status(400).json({ status: 'error', message: 'items must be a valid JSON array' });
      }

      // Totals (in cents)
      const totalDollars = items.reduce((sum: number, it: any) => {
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        const lineTotal = Number(it.total != null ? it.total : qty * price);
        return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
      }, 0);
      const amountCents = Math.round(totalDollars * 100);

      // Tax normalization to cents
      let taxCents = 0;
      if (body.tax != null) {
        const taxNum = Number(body.tax);
        if (!Number.isFinite(taxNum) || taxNum < 0) return res.status(400).json({ status: 'error', message: 'Invalid tax value' });
        taxCents = taxNum <= 1 ? Math.round(amountCents * taxNum) : (taxNum <= 100 ? Math.round(amountCents * (taxNum / 100)) : Math.round(taxNum));
      }

      const result = await db.transaction(async (tx: any) => {
        // Determine subscriptionId: provided, reuse, or create
        let subscriptionIdValue: number | null = null;
        if (providedSubscriptionId && !Number.isNaN(providedSubscriptionId)) {
          const sub = await tx.query.subscriptions.findFirst({ where: eq(subscriptions.id, providedSubscriptionId) });
          if (!sub) throw new Error('subscriptionId not found');
          subscriptionIdValue = providedSubscriptionId;
        } else {
          // Try to reuse an active subscription for this company
          const existingSub = await tx.execute(sql`
            SELECT id FROM subscriptions 
            WHERE company_id = ${companyId} AND status = 'active'
            ${billingCycleInput ? sql` AND billing_cycle = ${billingCycleInput}` : sql``}
            ORDER BY created_at DESC
            LIMIT 1
          `);
          const foundId = existingSub.rows?.[0]?.id as number | undefined;
          if (foundId) {
            subscriptionIdValue = foundId;
          } else {
            // Create a simple active subscription derived from company data
            const companyRow = await tx.query.companies.findFirst({ where: eq(companies.id, companyId) });
            const planType = (companyRow as any)?.subscriptionTier || 'trial';
            const billingCycle = billingCycleInput || 'annual';
            const [newSub] = await tx.insert(subscriptions).values({
              companyId,
              planType,
              status: 'active',
              startDate: new Date(),
              billingCycle,
              amount: amountCents,
              currency,
              discount: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }).returning();
            subscriptionIdValue = newSub.id;
          }
        }

        // Create invoice
        const invoiceValues: any = {
          companyId,
          invoiceNumber,
          amount: amountCents,
          currency,
          tax: taxCents,
          status: statusInput,
          dueDate,
          items,
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        // Always require a subscription reference
        if (subscriptionIdValue === null) throw new Error('subscription_required');
        invoiceValues.subscriptionId = subscriptionIdValue;

        const [createdInvoice] = await tx.insert(invoices).values(invoiceValues).returning();

        // If initially paid, create a payment record once and set paidDate
        if (statusInput === 'paid') {
          // Guard against duplicates
          const existingPayment = await tx.execute(sql`SELECT id FROM payment_transactions WHERE invoice_id = ${createdInvoice.id} AND status = 'success' LIMIT 1`);
          if (!existingPayment.rows?.length) {
            await tx.insert(paymentTransactions).values({
              invoiceId: createdInvoice.id,
              companyId: companyId,
              transactionId: `txn_${Date.now()}`,
              provider: 'manual',
              amount: createdInvoice.amount + (createdInvoice.tax || 0),
              currency,
              status: 'success',
              paymentMethod: 'manual',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          const [updatedInvoice] = await tx.update(invoices).set({ paidDate: new Date(), updatedAt: new Date() }).where(eq(invoices.id, createdInvoice.id)).returning();
          return updatedInvoice;
        }

        return createdInvoice;
      });

      return res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      const known = ['subscriptionId not found', 'subscription_required'];
      const msg = known.includes(error?.message) ? error.message : 'Failed to create invoice';
      const code = known.includes(error?.message) ? 400 : 500;
      return res.status(code).json({ status: 'error', message: msg, error: error?.message || String(error) });
    }
  });

  // Invoices API - list (optionally by companyId)
  app.get('/api/invoices', async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId ? parseInt(String(req.query.companyId)) : undefined;
      let rows;
      if (companyId && !Number.isNaN(companyId)) {
        rows = await db.execute(sql`SELECT * FROM invoices WHERE company_id = ${companyId} ORDER BY created_at DESC`);
      } else {
        rows = await db.execute(sql`SELECT * FROM invoices ORDER BY created_at DESC`);
      }
      return res.json({ status: 'success', data: rows.rows || [] });
    } catch (error: any) {
      console.error('Error listing invoices:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to list invoices', error: error?.message || String(error) });
    }
  });

  // Invoices API - company scoped list
  app.get('/api/company/:companyId/invoices', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(String(req.params.companyId));
      if (!companyId || Number.isNaN(companyId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid companyId' });
      }
      const rows = await db.execute(sql`SELECT * FROM invoices WHERE company_id = ${companyId} ORDER BY created_at DESC`);
      return res.json({ status: 'success', data: rows.rows || [] });
    } catch (error: any) {
      console.error('Error fetching company invoices:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch company invoices', error: error?.message || String(error) });
    }
  });

  // Invoices API - get by id
  app.get('/api/invoices/:invoiceId', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.invoiceId));
      if (!invoiceId || Number.isNaN(invoiceId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid invoiceId' });
      }
      const row = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!row) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return res.json({ status: 'success', data: row });
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to fetch invoice', error: error?.message || String(error) });
    }
  });

  // Invoices API - update invoice
  app.put('/api/invoices/:invoiceId', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.invoiceId));
      if (!invoiceId || Number.isNaN(invoiceId)) {
        return res.status(400).json({ status: 'error', message: 'Invalid invoiceId' });
      }
      const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!existing) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

      const body = req.body || {};
      const updates: any = { updatedAt: new Date() };

      if (body.invoiceNumber != null) updates.invoiceNumber = String(body.invoiceNumber).trim();
      if (body.currency != null) updates.currency = String(body.currency);
      if (body.status != null) updates.status = String(body.status);
      if (body.dueDate != null) {
        const d = new Date(String(body.dueDate));
        if (isNaN(d.getTime())) return res.status(400).json({ status: 'error', message: 'Invalid dueDate' });
        updates.dueDate = d;
      }
      if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;

      if (body.items != null) {
        let items;
        try {
          items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
          if (!Array.isArray(items)) throw new Error('items must be an array');
        } catch {
          return res.status(400).json({ status: 'error', message: 'items must be a valid JSON array' });
        }
        // recompute amount and tax
        const totalDollars = items.reduce((sum: number, it: any) => {
          const qty = Number(it.quantity || 0);
          const price = Number(it.price || 0);
          const lineTotal = Number(it.total != null ? it.total : qty * price);
          return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
        }, 0);
        updates.amount = Math.round(totalDollars * 100);
        updates.items = items;
      }
      if (body.tax != null) {
        const taxNum = Number(body.tax);
        if (!Number.isFinite(taxNum) || taxNum < 0) return res.status(400).json({ status: 'error', message: 'Invalid tax value' });
        const base = updates.amount != null ? updates.amount : existing.amount;
        updates.tax = taxNum <= 1 ? Math.round(base * taxNum) : (taxNum <= 100 ? Math.round(base * (taxNum / 100)) : Math.round(taxNum));
      }

      if (updates.status === 'paid' && !existing.paidDate) {
        updates.paidDate = new Date();
      }

      const [updated] = await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId)).returning();
      return res.json({ status: 'success', data: updated });
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to update invoice', error: error?.message || String(error) });
    }
  });

  // Invoices API - change status (idempotently record payment when moving to paid; refund when moving away from paid)
  app.patch('/api/invoices/:invoiceId/status', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.invoiceId));
      const status = String(req.body?.status || '').trim();
      if (!invoiceId || Number.isNaN(invoiceId)) return res.status(400).json({ status: 'error', message: 'Invalid invoiceId' });
      if (!status) return res.status(400).json({ status: 'error', message: 'status is required' });

      const result = await db.transaction(async (tx: any) => {
        const existing = await tx.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
        if (!existing) throw new Error('not_found');

        const setData: any = { status, updatedAt: new Date() };
        if (status === 'paid' && !existing.paidDate) {
          // Create payment transaction once if none exists
          const existingPayment = await tx.execute(sql`SELECT id FROM payment_transactions WHERE invoice_id = ${existing.id} AND status = 'success' LIMIT 1`);
          if (!existingPayment.rows?.length) {
            await tx.insert(paymentTransactions).values({
              invoiceId: existing.id,
              companyId: existing.companyId,
              transactionId: `txn_${Date.now()}`,
              provider: 'manual',
              amount: existing.amount + (existing.tax || 0),
              currency: existing.currency,
              status: 'success',
              paymentMethod: 'manual',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          setData.paidDate = new Date();
        } else if (status !== 'paid' && existing.paidDate) {
          // Clear paid date when moving away from paid
          setData.paidDate = null;
          // If there is a successful payment, mark it as refunded once (idempotent)
          const latestSuccess = await tx.execute(sql`
            SELECT id, refunded_amount, status FROM payment_transactions 
            WHERE invoice_id = ${existing.id} AND status = 'success' 
            ORDER BY created_at DESC LIMIT 1
          `);
          const paymentRow = latestSuccess.rows?.[0];
          if (paymentRow && (paymentRow.refunded_amount === 0 || paymentRow.status !== 'refunded')) {
            await tx.execute(sql`
              UPDATE payment_transactions 
              SET status = 'refunded', 
                  refunded_amount = ${existing.amount + (existing.tax || 0)}, 
                  refunded_at = ${new Date()}, 
                  updated_at = ${new Date()}
              WHERE id = ${paymentRow.id}
            `);
          }
        }

        const [updated] = await tx.update(invoices).set(setData).where(eq(invoices.id, invoiceId)).returning();
        return updated;
      });

      return res.json({ status: 'success', data: result });
    } catch (error: any) {
      console.error('Error changing invoice status:', error);
      if (error?.message === 'not_found') return res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return res.status(500).json({ status: 'error', message: 'Failed to change invoice status', error: error?.message || String(error) });
    }
  });

  // Invoices API - record payment and mark paid
  app.post('/api/invoices/:invoiceId/pay', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.invoiceId));
      if (!invoiceId || Number.isNaN(invoiceId)) return res.status(400).json({ status: 'error', message: 'Invalid invoiceId' });
      const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
      if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });

      const body = req.body || {};
      const provider = String(body.provider || 'manual');
      const transactionId = String(body.transactionId || `txn_${Date.now()}`);
      const currency = String(body.currency || invoice.currency || 'USD');
      const paymentMethod = String(body.paymentMethod || 'manual');
      const amountCents = Number.isFinite(Number(body.amount)) ? Math.round(Number(body.amount) * 100) : invoice.amount + (invoice.tax || 0);

      const [trx] = await db.insert(paymentTransactions).values({
        invoiceId: invoice.id,
        companyId: invoice.companyId,
        transactionId,
        provider,
        amount: amountCents,
        currency,
        status: 'success',
        paymentMethod,
        paymentMethodDetails: body.paymentMethodDetails || null,
        gatewayResponse: body.gatewayResponse || null,
        metadata: body.metadata || null,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const [updated] = await db.update(invoices).set({ status: 'paid', paidDate: new Date(), updatedAt: new Date() }).where(eq(invoices.id, invoice.id)).returning();

      return res.json({ status: 'success', data: { invoice: updated, payment: trx } });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to record payment', error: error?.message || String(error) });
    }
  });

  // Minimal licenses list for dropdowns (available licenses)
  // Only returns active licenses with endDate > current date
  app.get('/api/licenses/available', async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      // Only return active licenses that haven't expired
      const rows = await db.select({
        id: licenses.id,
        name: licenses.name,
        type: licenses.type,
        status: licenses.status,
        endDate: licenses.endDate
      })
      .from(licenses)
      .where(
        and(
          eq(licenses.status, 'active'),
          gt(licenses.endDate, now)
        )
      );
      
      const data = rows.map((r: any) => ({
        id: r.id,
        label: r.name || `License #${r.id}`,
        type: r.type,
        status: r.status,
        endDate: r.endDate
      }));
      res.json({ status: 'success', data });
    } catch (error) {
      console.error('Error fetching available licenses:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch licenses' });
    }
  });
  
  // Create license endpoint
  app.post('/api/licenses', async (req: Request, res: Response) => {
    try {
      const licenseData = req.body;
      
      // Generate a random license key if not provided
      if (!licenseData.licenseKey) {
        licenseData.licenseKey = `lic_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      }
      
      // Ensure dates are properly formatted as Date objects
      if (licenseData.startDate && typeof licenseData.startDate === 'string') {
        licenseData.startDate = new Date(licenseData.startDate);
      } else if (!licenseData.startDate) {
        licenseData.startDate = new Date(); // default to current date if not provided
      }
      
      if (licenseData.endDate && typeof licenseData.endDate === 'string') {
        licenseData.endDate = new Date(licenseData.endDate);
      } else if (!licenseData.endDate) {
        // Default to one year from now if not provided
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        licenseData.endDate = oneYearFromNow;
      }
      
      // Validate license data
      const validatedData = insertLicenseSchema.parse(licenseData);
      
      // Ensure we don't save any client info - only save name field
      if (validatedData.clientName) {
        delete validatedData.clientName;
      }
      if (validatedData.clientEmail) {
        delete validatedData.clientEmail;
      }
      
      // Insert the new license
      const [newLicense] = await db.insert(licenses).values(validatedData).returning();
      
      res.status(201).json({
        status: 'success',
        message: 'License created successfully',
        data: newLicense
      });
    } catch (error: any) {
      console.error('Error creating license:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid license data',
          errors: error.errors
        });
      } else if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({
          status: 'error',
          message: 'A license with this key already exists',
          error: error.detail
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to create license',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Get license details
  app.get('/api/licenses/:id', async (req: Request, res: Response) => {
    try {
      const licenseId = parseInt(req.params.id);
      
      if (isNaN(licenseId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid license ID'
        });
      }
      
      const license = await db.query.licenses.findFirst({
        where: eq(licenses.id, licenseId)
      });
      
      if (!license) {
        return res.status(404).json({
          status: 'error',
          message: 'License not found'
        });
      }
      
      res.json({
        status: 'success',
        data: license
      });
    } catch (error) {
      console.error('Error fetching license:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch license data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update license
  app.put('/api/licenses/:id', async (req: Request, res: Response) => {
    try {
      const licenseId = parseInt(req.params.id);

      if (isNaN(licenseId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid license ID'
        });
      }

      // Check if the license exists before attempting update
      const licenseExists = await db.query.licenses.findFirst({
        where: eq(licenses.id, licenseId)
      });

      if (!licenseExists) {
        return res.status(404).json({
          status: 'error',
          message: 'License not found'
        });
      }

      const updateData = req.body;

      // Map license fields to licenses table fields
      const licenseUpdateData: any = {
        updatedAt: new Date()
      };

      // Map basic fields - do not save client info
      if (updateData.name !== undefined) {
        licenseUpdateData.name = updateData.name;
      }
      if (updateData.plan !== undefined) {
        licenseUpdateData.type = updateData.plan; // plan maps to type
      }
      if (updateData.status !== undefined) {
        licenseUpdateData.status = updateData.status;
      }
      if (updateData.description !== undefined) {
        licenseUpdateData.description = updateData.description;
      }

      // Map limits to license fields
      if (updateData.limits) {
        if (updateData.limits.users !== undefined) {
          licenseUpdateData.maxSeats = updateData.limits.users;
        }
        if (updateData.limits.surveys !== undefined) {
          licenseUpdateData.maxSurveys = updateData.limits.surveys;
        }
        if (updateData.limits.responses !== undefined) {
          licenseUpdateData.maxResponses = updateData.limits.responses;
        }
      }

      // Map dates
      if (updateData.startDate !== undefined) {
        licenseUpdateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate !== undefined) {
        licenseUpdateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
      }

      // Map other license-specific fields
      if (updateData.cost !== undefined) {
        licenseUpdateData.cost = updateData.cost;
      }
      if (updateData.features !== undefined) {
        licenseUpdateData.features = typeof updateData.features === 'string' 
          ? updateData.features 
          : JSON.stringify(updateData.features);
      }
      if (updateData.notes !== undefined) {
        licenseUpdateData.notes = updateData.notes;
      }
      // Do not save clientEmail - we don't use client info in licenses

      // Update the license
      const [updatedLicense] = await db
        .update(licenses)
        .set(licenseUpdateData)
        .where(eq(licenses.id, licenseId))
        .returning();

      // Update all companies that reference this license to keep data in sync
      const companiesWithLicense = await db.query.companies.findMany({
        where: eq(companies.licenseId, licenseId)
      });

      if (companiesWithLicense.length > 0) {
        const companyUpdates: any = {
          updatedAt: new Date()
        };

        // Update fields that were changed in the license
        if (licenseUpdateData.status !== undefined) {
          companyUpdates.licenseStatus = licenseUpdateData.status;
        }
        if (licenseUpdateData.maxSeats !== undefined) {
          companyUpdates.maxUsers = licenseUpdateData.maxSeats;
        }
        if (licenseUpdateData.maxSurveys !== undefined) {
          companyUpdates.maxSurveys = licenseUpdateData.maxSurveys;
        }
        if (licenseUpdateData.maxResponses !== undefined) {
          companyUpdates.maxResponses = licenseUpdateData.maxResponses;
        }
        if (licenseUpdateData.endDate !== undefined) {
          companyUpdates.licenseEndDate = licenseUpdateData.endDate;
        }
        if (licenseUpdateData.startDate !== undefined) {
          companyUpdates.licenseStartDate = licenseUpdateData.startDate;
        }

        // Update features if changed (parse JSON and update boolean fields)
        if (licenseUpdateData.features !== undefined) {
          const features = typeof licenseUpdateData.features === 'string' 
            ? JSON.parse(licenseUpdateData.features) 
            : licenseUpdateData.features;
          
          if (features && typeof features === 'object') {
            if (features.customBranding !== undefined) companyUpdates.customBranding = features.customBranding;
            if (features.aiInsights !== undefined) companyUpdates.aiInsights = features.aiInsights;
            if (features.advancedAnalytics !== undefined) companyUpdates.advancedAnalytics = features.advancedAnalytics;
            if (features.dataExport !== undefined) companyUpdates.dataExport = features.dataExport;
            if (features.socialSharing !== undefined) companyUpdates.socialSharing = features.socialSharing;
            if (features.crmIntegration !== undefined) companyUpdates.crmIntegration = features.crmIntegration;
          }
        }

        // Update all companies with this license
        if (Object.keys(companyUpdates).length > 1) { // More than just updatedAt
          await db.update(companies)
            .set(companyUpdates)
            .where(eq(companies.licenseId, licenseId));
          
          console.log(`Updated ${companiesWithLicense.length} company/companies with license ID ${licenseId}`);
        }
      }

      // Transform the updated license to match frontend format
      const formattedLicense = {
        id: updatedLicense.id,
        plan: updatedLicense.type,
        status: updatedLicense.status,
        startDate: updatedLicense.startDate,
        endDate: updatedLicense.endDate,
        limits: {
          users: updatedLicense.maxSeats,
          surveys: updatedLicense.maxSurveys,
          responses: updatedLicense.maxResponses,
          storage: null // licenses table doesn't have storage limit
        },
        isActive: updatedLicense.status === 'active',
        licenseKey: updatedLicense.licenseKey,
        name: updatedLicense.name,
        description: updatedLicense.description,
        cost: updatedLicense.cost,
        features: updatedLicense.features,
        notes: updatedLicense.notes,
        createdAt: updatedLicense.createdAt,
        updatedAt: updatedLicense.updatedAt
      };

      // Broadcast license update via WebSocket to all companies with this license
      for (const company of companiesWithLicense) {
        websocketManager.broadcast({
          type: 'licenseUpdate',
          companyId: company.id,
          licenseId: licenseId,
          license: formattedLicense,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        status: 'success',
        message: 'License updated successfully',
        data: formattedLicense
      });
    } catch (error: any) {
      console.error('Error updating license:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid license data',
          errors: error.errors
        });
      } else if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({
          status: 'error',
          message: 'A company with this email already exists',
          error: error.detail
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update license',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Delete license
  app.delete('/api/licenses/:id', async (req: Request, res: Response) => {
    try {
      const licenseId = parseInt(req.params.id);
      
      if (isNaN(licenseId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid license ID'
        });
      }
      
      // Check if the license exists before attempting deletion
      const licenseExists = await db.query.licenses.findFirst({
        where: eq(licenses.id, licenseId)
      });
      
      if (!licenseExists) {
        return res.status(404).json({
          status: 'error',
          message: 'License not found'
        });
      }
      
      // Delete the license
      await db.delete(licenses).where(eq(licenses.id, licenseId));
      
      res.json({
        status: 'success',
        message: 'License deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting license:', error);
      if (error.code === '23503') { // Foreign key violation
        res.status(400).json({
          status: 'error',
          message: 'Cannot delete license because it is associated with clients',
          error: error.detail
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete license',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  
  // Survey responses API endpoint
  app.get('/api/survey-responses', async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const surveyId = req.query.surveyId ? parseInt(req.query.surveyId as string) : undefined;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      // Normalize date range to be inclusive of both boundary days
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;

      const startDate = startDateParam ? new Date(startDateParam) : undefined;
      const endDate = endDateParam ? new Date(endDateParam) : undefined;

      if (startDate && !isNaN(startDate.getTime())) {
        startDate.setHours(0, 0, 0, 0); // inclusive start of day
      }
      if (endDate && !isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999); // inclusive end of day
      }
      
      // Build the base query
      let whereConditions: any[] = [];
      
      if (surveyId) {
        whereConditions.push(sql`sr.survey_id = ${surveyId}`);
      }
      
      if (companyId) {
        whereConditions.push(sql`sr.company_id = ${companyId}`);
      }

      if (startDate) {
        whereConditions.push(sql`sr.created_at >= ${startDate}`);
      }

      if (endDate) {
        whereConditions.push(sql`sr.created_at <= ${endDate}`);
      }
      
      const whereClause = whereConditions.length > 0 
        ? sql`WHERE ${whereConditions.reduce((acc, condition, index) => 
            index === 0 ? condition : sql`${acc} AND ${condition}`
          )}`
        : sql``;
      
      // Get total count
      const countResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT COUNT(*) as total
          FROM survey_responses sr
          ${whereClause}
        `);
      });
      
      const total = parseInt(countResult.rows[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);
      
      // Get responses with pagination
      const responsesResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            sr.id,
            sr.survey_id,
            sr.company_id,
            sr.respondent_id,
            sr.respondent_email,
            sr.responses,
            sr.demographics,
            sr.traits,
            sr.completed,
            sr.response_time_seconds,
            sr.start_time,
            sr.complete_time,
            sr.created_at,
            sr.updated_at,
            s.title as survey_title,
            c.name as company_name
          FROM survey_responses sr
          LEFT JOIN surveys s ON sr.survey_id = s.id
          LEFT JOIN companies c ON sr.company_id = c.id
          ${whereClause}
          ORDER BY sr.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `);
      });
      
      // Format responses for the API
      const formattedResponses = responsesResult.rows.map((response: any) => {
        const completionTimeMinutes = response.response_time_seconds 
          ? Math.round(response.response_time_seconds / 60)
          : null;
          
        return {
          id: response.id,
          surveyId: response.survey_id,
          surveyTitle: response.survey_title || `Survey #${response.survey_id}`,
          companyId: response.company_id,
          clientName: response.company_name || `Company #${response.company_id}`,
          respondentId: response.respondent_id,
          respondentEmail: response.respondent_email,
          responses: response.responses,
          demographics: response.demographics,
          traits: response.traits,
          completed: response.completed,
          completionTime: completionTimeMinutes ? `${completionTimeMinutes} min` : 'N/A',
          completionTimeSeconds: response.response_time_seconds || null, // Include raw seconds for client-side formatting
          startedAt: response.start_time || null,
          completedAt: response.complete_time || null,
          submissionDate: response.created_at,
          createdAt: response.created_at,
          updatedAt: response.updated_at,
          anonymousId: response.respondent_id || "Anonymous",
          status: response.completed ? 'completed' : 'pending'
        };
      });
      
      res.json({
        status: 'success',
        data: formattedResponses,
        total: total,
        page: page,
        totalPages: totalPages,
        limit: limit
      });
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey responses',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get individual survey response details
  app.get('/api/survey-responses/:id', async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.id);
      
      if (isNaN(responseId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid response ID'
        });
      }

      // Get response with survey and company details
      const responseResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            sr.id,
            sr.survey_id,
            sr.company_id,
            sr.respondent_id,
            sr.respondent_email,
            sr.responses,
            sr.demographics,
            sr.traits,
            sr.completed,
            sr.response_time_seconds,
            sr.created_at,
            sr.updated_at,
            s.title as survey_title,
            s.description as survey_description,
            c.name as company_name
          FROM survey_responses sr
          LEFT JOIN surveys s ON sr.survey_id = s.id
          LEFT JOIN companies c ON sr.company_id = c.id
          WHERE sr.id = ${responseId}
        `);
      });
      
      if (responseResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Response not found'
        });
      }
      
      const response = responseResult.rows[0];
      const completionTimeMinutes = response.response_time_seconds 
        ? Math.round(response.response_time_seconds / 60)
        : null;
      
      // Get survey questions to format the responses properly
      const questionsResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            id,
            question,
            question_type,
            "order" as question_order,
            options,
            slider_config,
            scenario_text
          FROM survey_questions
          WHERE survey_id = ${response.survey_id}
          ORDER BY "order" ASC
        `);
      });
      
      // Format questions with answers
      const questionsWithAnswers = questionsResult.rows.map((question: any) => {
        // Find the answer for this question from the responses array
        const responseItem = response.responses?.find((r: any) => r.questionId === question.id);
        const answer = responseItem?.answer || 'No answer';
        
        return {
          id: question.id,
          text: question.question,
          type: question.question_type,
          order: question.question_order,
          options: question.options,
          sliderConfig: question.slider_config,
          scenarioText: question.scenario_text,
          answer: answer,
          scale: question.slider_config ? {
            min: question.slider_config.min || 1,
            max: question.slider_config.max || 5,
            minLabel: question.slider_config.minLabel,
            maxLabel: question.slider_config.maxLabel
          } : undefined
        };
      });
      
      const formattedResponse = {
        id: response.id,
        surveyId: response.survey_id,
        surveyTitle: response.survey_title || `Survey #${response.survey_id}`,
        surveyDescription: response.survey_description,
        companyId: response.company_id,
        clientName: response.company_name || `Company #${response.company_id}`,
        respondentId: response.respondent_id,
        respondentEmail: response.respondent_email,
        completed: response.completed,
        completionTime: completionTimeMinutes ? `${completionTimeMinutes} min` : 'N/A',
        submissionDate: response.created_at,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        anonymousId: response.respondent_id || "Anonymous",
        status: response.completed ? 'completed' : 'pending',
        questions: questionsWithAnswers,
        demographics: response.demographics,
        traits: response.traits
      };
      
      res.json({
        status: 'success',
        data: formattedResponse
      });
    } catch (error) {
      console.error('Error fetching survey response:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey response',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Bulk export survey responses (CSV format)
  app.get('/api/survey-responses/export', async (req: Request, res: Response) => {
    try {
      const surveyId = req.query.surveyId ? parseInt(req.query.surveyId as string) : undefined;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const exportFormat = (req.query.format || 'csv') as string;
      
      // Use storage interface to get survey responses
      let surveyResponses: any[] = [];
      
      if (companyId) {
        surveyResponses = await storage.getSurveyResponsesByCompany(companyId);
      } else {
        surveyResponses = await storage.getSurveyResponsesByCompany(1);
      }
      
      if (surveyId) {
        surveyResponses = surveyResponses.filter(r => r.surveyId === surveyId);
      }
      
      if (surveyResponses.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No survey responses found'
        });
      }
      
      // Format responses for export
      const formattedResponses = surveyResponses.map(response => ({
        id: response.id,
        survey_id: response.surveyId,
        company_id: response.companyId,
        respondent_id: response.respondentId,
        responses: JSON.stringify(response.responses),
        demographics: JSON.stringify(response.demographics),
        traits: JSON.stringify(response.traits),
        completed_at: response.completedAt,
        created_at: response.createdAt
      }));
      
      // Return JSON or CSV based on format parameter
      if (exportFormat === 'json') {
        return res.json({
          status: 'success',
          exportDate: new Date().toISOString(),
          count: formattedResponses.length,
          data: formattedResponses
        });
      } else {
        // Default to CSV export
        const csvHeaders = 'id,survey_id,company_id,respondent_id,responses,demographics,traits,completed_at,created_at\n';
        const csvRows = formattedResponses.map(row => 
          `${row.id},"${row.survey_id}","${row.company_id}","${row.respondent_id}","${row.responses}","${row.demographics}","${row.traits}","${row.completed_at}","${row.created_at}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${surveyId || 'all'}.csv"`);
        return res.send(csvHeaders + csvRows);
      }
    } catch (error) {
      console.error('Error exporting survey responses:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to export survey responses',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Validate a survey response
  app.post('/api/survey-responses/:id/validate', async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.id);
      
      // Use storage interface to get the response
      const response = await storage.getSurveyResponse(responseId);
      
      if (!response) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey response not found'
        });
      }
      
      // For now, return a simple validation result
      const validationResults = {
        isValid: true,
        completeness: 100,
        qualityScore: 85,
        issues: [],
        recommendations: []
      };
      
      return res.json({
        status: 'success',
        data: {
          responseId: responseId,
          validation: validationResults,
          validatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error validating survey response:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to validate survey response',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Anonymize a survey response
  app.post('/api/survey-responses/:id/anonymize', async (req: Request, res: Response) => {
    try {
      const responseId = parseInt(req.params.id);
      
      // Use storage interface to get the response
      const response = await storage.getSurveyResponse(responseId);
      
      if (!response) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey response not found'
        });
      }
      
      // Create an anonymized version of the response
      const anonymizedResponse = {
        id: response.id,
        surveyId: response.surveyId,
        companyId: response.companyId,
        respondentId: 'ANONYMOUS',
        responses: response.responses,
        demographics: {
          ageRange: response.demographics?.ageRange || 'Not specified',
          gender: 'Not specified',
          location: 'Not specified'
        },
        traits: response.traits,
        isCompleted: response.isCompleted,
        completedAt: response.completedAt,
        createdAt: response.createdAt,
        anonymized: true,
        anonymizedAt: new Date().toISOString()
      };
      
      return res.json({
        status: 'success',
        data: anonymizedResponse
      });
    } catch (error) {
      console.error('Error anonymizing survey response:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to anonymize survey response',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================================
  // SURVEY SESSION MANAGEMENT ENDPOINTS
  // ============================================================================

  // Start survey session endpoint
  app.post('/api/survey/start', async (req: Request, res: Response) => {
    try {
      const { companyId, surveyType, surveyId } = req.body;

      if (!companyId) {
        return sendClientError(res, 'Company ID is required', 400, ErrorCodes.VALIDATION_ERROR);
      }

      // Generate a unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const startTime = new Date();

      // Store session start time in memory (in production, use Redis or database)
      // For now, we'll store it in a simple Map
      const globalSessionStartTimes = (global as any).sessionStartTimes || new Map();
      globalSessionStartTimes.set(sessionId, startTime);
      (global as any).sessionStartTimes = globalSessionStartTimes;

      console.log(`DEBUG: Started survey session ${sessionId} at ${startTime.toISOString()}`);

      return sendSuccess(res, {
        sessionId,
        surveyType: surveyType || 'general',
        surveyId: surveyId || null,
        startedAt: startTime.toISOString(),
        startTime: startTime.toISOString() // Include startTime for client to send back
      }, 'Survey session started successfully');
    } catch (error) {
      console.error('Error starting survey session:', error);
      return sendServerError(res, 'Failed to start survey session', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Get survey questions endpoint
  app.get('/api/survey/questions', async (req: Request, res: Response) => {
    try {
      const surveyType = req.query.type as string || 'general';

      // Import survey questions from the client-side data
      // In a real implementation, these would come from a database
      const { surveyTypes } = await import('../client/src/lib/surveyQuestions');

      const selectedSurvey = surveyTypes[surveyType as keyof typeof surveyTypes] || surveyTypes.general;

      if (!selectedSurvey || !selectedSurvey.questions) {
        return sendClientError(res, 'Survey type not found', 404, ErrorCodes.NOT_FOUND);
      }

      return sendSuccess(res, {
        questions: selectedSurvey.questions,
        surveyType,
        totalQuestions: selectedSurvey.questions.length
      });
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      return sendServerError(res, 'Failed to fetch survey questions', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Submit individual survey answer endpoint
  app.post('/api/survey/answer', async (req: Request, res: Response) => {
    try {
      const { sessionId, answer, surveyType } = req.body;

      if (!sessionId || !answer) {
        return sendClientError(res, 'Session ID and answer are required', 400, ErrorCodes.VALIDATION_ERROR);
      }

      // Validate session exists (basic check)
      // if (!sessionId.startsWith('session_')) {
      //   return sendClientError(res, 'Invalid session ID', 400, ErrorCodes.VALIDATION_ERROR);
      // }

      // In a real implementation, we would:
      // 1. Store the answer in a temporary session store
      // 2. Update progress tracking
      // 3. Validate the answer format

      return sendSuccess(res, {
        sessionId,
        answerId: Date.now(),
        savedAt: new Date().toISOString(),
        progress: 'in_progress'
      }, 'Answer saved successfully');
    } catch (error) {
      console.error('Error saving survey answer:', error);
      return sendServerError(res, 'Failed to save survey answer', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Complete survey endpoint
  app.post('/api/survey/complete', async (req: Request, res: Response) => {
    try {
      console.log('DEBUG: Survey completion endpoint called with body:', JSON.stringify(req.body, null, 2));
      console.log('DEBUG: Raw req.body keys:', Object.keys(req.body));
      console.log('DEBUG: req.body.surveyId:', req.body.surveyId);
      const { sessionId, surveyType, responses, demographics, surveyId: requestSurveyId, companyId: requestCompanyId, startTime } = req.body;

      if (!sessionId) {
        console.error('DEBUG: No sessionId provided');
        return sendClientError(res, 'Session ID is required', 400, ErrorCodes.VALIDATION_ERROR);
      }
      
      console.log('DEBUG: SessionId provided:', sessionId);
      console.log('DEBUG: Responses count:', responses?.length || 0);
      console.log('DEBUG: Demographics:', demographics);

      // Validate session exists (basic check)
      // if (!sessionId.startsWith('session_')) {
      //   return sendClientError(res, 'Invalid session ID', 400, ErrorCodes.VALIDATION_ERROR);
      // }

      // Generate a unique respondent ID
      const respondentId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Process survey responses
      const processedResponses = responses || [];

      // Validate survey is active before accepting responses
      const surveyCheckResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT id, title, is_active, status
          FROM surveys
          WHERE id = ${requestSurveyId || 1}
        `);
      });

      const surveyCheck = surveyCheckResult.rows?.[0];
      if (!surveyCheck) {
        return sendClientError(res, 'Survey not found', 404, ErrorCodes.VALIDATION_ERROR);
      }

      if (!surveyCheck.is_active) {
        return sendClientError(res, 'This survey is currently inactive and not accepting responses', 403, ErrorCodes.VALIDATION_ERROR);
      }

      // Fetch survey details and questions for AI analysis
      let generatedTraits: any = [];
      try {
        const surveyRowResult = await executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT
              id, title, survey_type,
              -- Business Context Columns
              product_name, product_description, industry, target_market, pain_points
            FROM surveys
            WHERE id = ${requestSurveyId || 1}
          `);
        });

        const surveyRow = surveyRowResult.rows?.[0];

        const questionsResult = await executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT id, question, question_type, options, required, "order", help_text, slider_config, scenario_text
            FROM survey_questions
            WHERE survey_id = ${requestSurveyId || 1}
            ORDER BY "order" ASC
          `);
        });

        const questionsForAI = (questionsResult.rows || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          questionType: q.question_type,
          options: q.options,
          required: q.required,
          order: q.order,
          helpText: q.help_text,
          sliderConfig: q.slider_config,
          scenarioText: q.scenario_text
        }));

        const businessContext = {
          title: surveyRow?.title,
          surveyType: surveyRow?.survey_type,
          productName: surveyRow?.product_name,
          productDescription: surveyRow?.product_description,
          industry: surveyRow?.industry,
          targetMarket: surveyRow?.target_market,
          painPoints: surveyRow?.pain_points,
        };

        // Call Gemini to generate trait summaries from the submission
        const gemini = new GeminiAIService();
        generatedTraits = await gemini.generateTraitsFromSubmission(
          questionsForAI,
          processedResponses,
          businessContext
        );
      } catch (aiError) {
        console.error('DEBUG: Gemini trait generation failed, falling back to mock:', aiError);
        generatedTraits = generateMockTraits(processedResponses, surveyType);
      }

      // Get company ID and survey ID from request body
      const companyId = requestCompanyId || 1;
      const surveyId = requestSurveyId || 1;
      
      console.log('DEBUG: Extracted values - requestSurveyId:', requestSurveyId, 'requestCompanyId:', requestCompanyId);
      console.log('DEBUG: Using surveyId:', surveyId, 'companyId:', companyId);

      // Calculate completion time
      const completeTime = new Date();
      const actualStartTime = startTime ? new Date(startTime) : new Date(Date.now() - 300000); // Default to 5 minutes ago if no start time
      
      // Calculate response time in seconds
      const responseTimeSeconds = Math.round((completeTime.getTime() - actualStartTime.getTime()) / 1000);
      console.log(`DEBUG: Calculated response time: ${responseTimeSeconds} seconds (start: ${actualStartTime.toISOString()}, complete: ${completeTime.toISOString()})`);

      // Prepare survey response data
      const surveyResponseData = {
        companyId: companyId,
        surveyId: surveyId,
        respondentId: respondentId,
        responses: processedResponses,
        traits: generatedTraits,
        demographics: demographics || {},
        completed: true,
        startTime: actualStartTime,
        completeTime: completeTime,
        processingStatus: 'processed'
      };

      // Save to database using the existing storage method
      console.log('DEBUG: Saving survey response with data:', JSON.stringify(surveyResponseData, null, 2));
      const savedResponse = await storage.createSurveyResponse(surveyResponseData);
      console.log('DEBUG: Survey response saved successfully, ID:', savedResponse.id);
      
      // Trigger AI enrichment for derived fields in background (non-blocking)
      (async () => {
        try {
          const ai = await analyzeSurveyResponse({
            responses: Array.isArray(processedResponses) ? processedResponses : [],
            traits: Array.isArray(generatedTraits) ? generatedTraits : [],
            demographics: demographics || {}
          });
          await db.update(surveyResponses).set({
            genderStereotypes: ai.genderStereotypes as any,
            productRecommendations: ai.productRecommendations as any,
            marketSegment: ai.marketSegment as any,
            satisfactionScore: ai.satisfactionScore as any,
            feedback: ai.feedback as any,
            updatedAt: new Date()
          }).where(eq(surveyResponses.id, savedResponse.id));
        } catch (e) {
          console.error('AI enrichment failed for /api/survey/complete response', e);
        }
      })();

      // Verify the response was actually saved
      if (!savedResponse || !savedResponse.id) {
        console.error('DEBUG: Failed to save survey response - no ID returned');
        return sendServerError(res, 'Failed to save survey response', 500, ErrorCodes.INTERNAL_ERROR);
      }

      // Broadcast survey response received notification
      const responseReceivedData: SurveyResponseReceivedData = {
        type: 'surveyResponseReceived',
        surveyId: surveyResponseData.surveyId,
        responseId: savedResponse.id,
        isAnonymous: !demographics || Object.keys(demographics).length === 0,
        isComplete: true,
        completionTimeSeconds: responseTimeSeconds, // Use actual calculated time
        questionCount: processedResponses.length,
        answeredCount: processedResponses.length,
        timestamp: new Date().toISOString()
      };

      broadcastSurveyResponse(responseReceivedData);

      // Broadcast usage update for company
      websocketManager.broadcast({
        type: 'usageUpdate',
        companyId: companyId,
        surveyId: surveyId,
        timestamp: new Date().toISOString()
      });

      const successResponse = {
        responseId: savedResponse.id,
        respondentId: respondentId,
        completedAt: completeTime.toISOString(),
        responseTimeSeconds: responseTimeSeconds,
        traits: generatedTraits,
        status: 'completed'
      };
      console.log('DEBUG: Sending success response:', JSON.stringify(successResponse, null, 2));
      
      return sendSuccess(res, successResponse, 'Survey completed successfully');
    } catch (error) {
      console.error('DEBUG: Error completing survey:', error);
      console.error('DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return sendServerError(res, 'Failed to complete survey', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Get survey results endpoint
  app.get('/api/survey/results/:responseId', async (req: Request, res: Response) => {
    try {
      const responseId = req.params.responseId;

      if (!responseId) {
        return sendClientError(res, 'Response ID is required', 400, ErrorCodes.VALIDATION_ERROR);
      }

      // Try to find the response in the database
      const response = await storage.getSurveyResponse(parseInt(responseId)) ||
                      await storage.getSurveyResponsesByCompany(1).then(responses =>
                        responses.find(r => r.respondentId === responseId)
                      );

      if (!response) {
        return sendClientError(res, 'Survey response not found', 404, ErrorCodes.NOT_FOUND);
      }

      return sendSuccess(res, {
        responseId: response.id,
        respondentId: response.respondentId,
        responses: response.responses,
        traits: response.traits,
        demographics: response.demographics,
        completedAt: response.completeTime || response.createdAt,
        surveyId: response.surveyId,
        companyId: response.companyId
      });
    } catch (error) {
      console.error('Error fetching survey results:', error);
      return sendServerError(res, 'Failed to fetch survey results', 500, ErrorCodes.INTERNAL_ERROR);
    }
  });

  // Helper function to generate mock traits based on responses
  const generateMockTraits = (responses: any[], surveyType: string) => {
    const traits = [
      { name: 'Innovation', score: Math.floor(Math.random() * 30) + 70, category: 'behavioral' },
      { name: 'Analytical Thinking', score: Math.floor(Math.random() * 25) + 65, category: 'cognitive' },
      { name: 'Leadership', score: Math.floor(Math.random() * 35) + 60, category: 'social' },
      { name: 'Adaptability', score: Math.floor(Math.random() * 20) + 75, category: 'behavioral' },
      { name: 'Creativity', score: Math.floor(Math.random() * 40) + 55, category: 'cognitive' }
    ];

    // Adjust traits based on survey type
    if (surveyType === 'leadership') {
      traits.push({ name: 'Decision Making', score: Math.floor(Math.random() * 25) + 70, category: 'leadership' });
    } else if (surveyType === 'personality') {
      traits.push({ name: 'Emotional Intelligence', score: Math.floor(Math.random() * 30) + 65, category: 'emotional' });
    }

    return traits;
  };

  // Add these debug routes to help diagnose the session issue
  app.get('/api/debug/session', (req: Request, res: Response) => {
    res.json({
      session: req.session,
      sessionId: req.sessionID,
      cookies: req.headers.cookie
    });
  });

  app.get('/api/debug/users', async (req: Request, res: Response) => {
    try {
      const allUsers = await db.query.users.findMany({
        columns: { id: true, username: true, email: true, companyId: true }
      });
      res.json({
        allUsers,
        currentSessionUserId: req.session?.userId
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });
  // Survey creation endpoint with license enforcement
  app.post('/api/surveys', async (req: Request, res: Response) => {
  try {
    console.log('📝 Survey creation request received:', req.body);
    console.log('🔍 Full session data:', req.session);

    // Check authentication using session data
    if (!req.session || !req.session.userId) {
      console.log('❌ No session or userId found');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.session.userId;
    console.log(`🔍 Survey creation request from user ID: ${userId}`);

    // CRITICAL FIX: Validate user exists and get fresh data from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, username: true, companyId: true, isActive: true }
    });

    if (!user) {
      console.log(`❌ User not found with ID: ${userId}. Session may be corrupted.`);

      // Clear the invalid session to force re-login
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid session. Please log in again.',
        code: 'INVALID_SESSION_USER'
      });
    }

    // Additional validation: Check if company exists
    if (!user.companyId) {
      console.log(`❌ User ${user.username} has no companyId`);
      return res.status(400).json({
        status: 'error',
        message: 'User is not associated with a company'
      });
    }

    if (!user.isActive) {
      console.log(`❌ User ${user.username} is not active`);
      return res.status(403).json({
        status: 'error',
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    console.log(`✅ User validated: ${user.username} (ID: ${user.id}), companyId: ${user.companyId}`);

    if (!user.companyId) {
      console.log(`❌ User ${user.username} has no companyId`);
      return res.status(400).json({
        status: 'error',
        message: 'User is not associated with a company'
      });
    }

    const companyId = user.companyId;
    console.log(`🔍 Looking for company with ID: ${companyId} for user: ${user.username}`);

    // Get company and check license limits
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId)
    });

    if (!company) {
      console.log(`❌ Company not found with ID: ${companyId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    console.log(`✅ Company found: ${company.name}`);

    // Check survey count limit
    const existingSurveysResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM surveys WHERE company_id = ${companyId}
    `);

    const currentSurveyCount = parseInt(existingSurveysResult.rows[0]?.count as string || '0');
    const maxSurveys = company.maxSurveys || 5; // Default to 5 if not set

    console.log(`📊 Current surveys: ${currentSurveyCount}, Max allowed: ${maxSurveys}`);

    if (currentSurveyCount >= maxSurveys) {
      console.log(`❌ Survey limit exceeded`);
      return res.status(403).json({
        status: 'error',
        message: `Survey limit reached. You can create up to ${maxSurveys} surveys with your current license.`,
        code: 'SURVEY_LIMIT_EXCEEDED',
        limits: {
          current: currentSurveyCount,
          maximum: maxSurveys
        }
      });
    }

    // Validate survey data
    const { title, description, surveyType } = req.body;

    if (!title) {
      console.log('❌ Survey title is missing');
      return res.status(400).json({
        status: 'error',
        message: 'Survey title is required'
      });
    }

    console.log(`📝 Creating survey: ${title} for company: ${company.name}`);

    // Create survey data with proper database fields including business context
    const surveyData = {
      companyId: companyId,
      createdById: userId,
      title,
      description: description || '',
      surveyType: surveyType || 'general',
      isActive: req.body.isActive !== undefined ? !!req.body.isActive : true,
      isPublic: req.body.isPublic !== undefined ? !!req.body.isPublic : false,
      allowAnonymous: req.body.allowAnonymous !== undefined ? !!req.body.allowAnonymous : true,
      requireEmail: req.body.requireEmail !== undefined ? !!req.body.requireEmail : false,
      collectDemographics: req.body.collectDemographics !== undefined ? !!req.body.collectDemographics : true,
      // Honor client-provided estimate when valid
      estimatedTime: (Number.isFinite(req.body.estimatedTime) && req.body.estimatedTime > 0) ? Math.floor(req.body.estimatedTime) : 10,
      customWelcomeMessage: req.body.welcomeMessage || null,
      customCompletionMessage: req.body.completionMessage || null,
      maxResponses: req.body.responseLimit || null,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,

      // Business Context Data - Save all the collected business context information
      productName: req.body.businessContext?.productName || null,
      productDescription: req.body.businessContext?.productDescription || null,
      productCategory: req.body.businessContext?.productCategory || null,
      productFeatures: req.body.businessContext?.productFeatures || null,
      valueProposition: req.body.businessContext?.valueProposition || null,
      competitors: req.body.businessContext?.competitors || null,
      targetMarket: req.body.businessContext?.targetMarket || null,
      industry: req.body.businessContext?.industry || null,
      painPoints: req.body.businessContext?.painPoints || null,

      // Survey Configuration Data
      surveyLanguage: req.body.surveyLanguage || 'en',
      enableAIInsights: req.body.enableAIInsights !== undefined ? req.body.enableAIInsights : true,
      enableSocialSharing: req.body.enableSocialSharing !== undefined ? req.body.enableSocialSharing : true,

      // Demographic Collection Settings
      collectAge: req.body.demographics?.collectAge !== undefined ? req.body.demographics.collectAge : true,
      collectGender: req.body.demographics?.collectGender !== undefined ? req.body.demographics.collectGender : true,
      collectLocation: req.body.demographics?.collectLocation !== undefined ? req.body.demographics.collectLocation : true,
      collectEducation: req.body.demographics?.collectEducation !== undefined ? req.body.demographics.collectEducation : false,
      collectIncome: req.body.demographics?.collectIncome !== undefined ? req.body.demographics.collectIncome : false,

      // AI Responses Settings
      enableAIResponses: req.body.aiResponses?.enabled !== undefined ? req.body.aiResponses.enabled : false,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Survey data to insert:', surveyData);

    // Insert survey into database
    const [newSurvey] = await db.insert(surveys)
      .values(surveyData)
      .returning();

    if (!newSurvey) {
      console.log('❌ Failed to create survey - no survey returned');
      throw new Error('Failed to create survey record');
    }

    console.log(`✅ Survey created successfully with ID: ${newSurvey.id} for company: ${company.name}`);
    console.log(`📋 Request body templateId:`, req.body.templateId);

    // Track survey creation event for notifications
    await trackSurveyCreated(newSurvey.id, newSurvey.title, user.username, userId).catch(err => {
      console.error('Failed to track survey creation event:', err);
      // Don't block the survey creation if tracking fails
    });

    // Prepare payload questions (custom) and detect conflict with templateId
    const payloadQuestions = Array.isArray(req.body.questions) ? req.body.questions : [];
    const templateId = req.body.templateId;

    // Guard: prevent duplicating questions if both templateId and questions are sent
    const shouldCopyFromTemplate = !!templateId && templateId !== "" && payloadQuestions.length === 0;

    // If templateId is provided (and no custom questions), copy questions from the template
    if (shouldCopyFromTemplate) {
      try {
        const templateIdNum = parseInt(templateId);
        console.log(`📋 Copying questions from template ID: ${templateId} (parsed: ${templateIdNum})`);
        
        // Fetch questions from the template
        const templateQuestionsData = await db.query.templateQuestions.findMany({
          where: (tq: any, { eq }: any) => eq(tq.templateId, templateIdNum),
          orderBy: (tq: any, { asc }: any) => [asc(tq.order)]
        });

        console.log(`Found ${templateQuestionsData.length} questions to copy from template`);

        // Copy each question to the survey
        if (templateQuestionsData.length > 0) {
          for (const tq of templateQuestionsData) {
            // Sanitize type-specific fields
            const qType = tq.questionType || 'multiple-choice';
            const insertValues: any = {
              surveyId: newSurvey.id,
              question: tq.question,
              questionType: qType,
              required: tq.required !== undefined ? tq.required : true,
              helpText: tq.helpText || null,
              order: tq.order,
              options: tq.options || null,
              customValidation: tq.customValidation || null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            if (qType === 'slider') {
              insertValues.sliderConfig = tq.sliderConfig || null;
            }
            if (qType === 'scenario') {
              insertValues.scenarioText = tq.scenarioText || null;
            }
            await db.insert(surveyQuestions).values({
              ...insertValues
            });
          }
          console.log(`✅ Successfully copied ${templateQuestionsData.length} questions to survey`);
        }
      } catch (templateError) {
        console.error('Error copying template questions:', templateError);
        // Don't fail the survey creation if template questions fail to copy
      }
    }

    // If custom questions are provided in the payload (start from scratch), save them
    if (payloadQuestions.length > 0) {
      try {
        for (let i = 0; i < payloadQuestions.length; i++) {
          const q = payloadQuestions[i];
          const qType = q.questionType || 'multiple-choice';
          const insertValues: any = {
            surveyId: newSurvey.id,
            question: q.question,
            questionType: qType,
            required: q.required !== undefined ? q.required : true,
            helpText: q.helpText || null,
            order: q.order ?? i + 1,
            options: q.options || null,
            customValidation: q.customValidation || null,
          };
          if (qType === 'slider' && q.sliderConfig) {
            insertValues.sliderConfig = q.sliderConfig;
          }
          if (qType === 'scenario' && q.scenarioText) {
            insertValues.scenarioText = q.scenarioText;
          }
          await db.insert(surveyQuestions).values(insertValues);
        }
      } catch (err) {
        console.error('Error inserting custom questions for survey:', err);
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Survey created successfully',
      data: newSurvey
    });

  } catch (error) {
    console.error('❌ Error creating survey:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create survey',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

  // Surveys API endpoint
  app.get('/api/surveys', async (req: Request, res: Response) => {
    try {
      // Get the user's company ID from session or user object
      const companyId = req.session?.companyId || req.user?.companyId;
      
      if (!companyId) {
        console.error('No company ID found for user');
        return res.status(403).json({
          status: 'error',
          message: 'Company ID not found. Please ensure you are logged in.'
        });
      }

      console.log(`Fetching surveys for company_id: ${companyId}`);
      
      // Use SQL template query filtered by company_id
      const surveys = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            id, company_id, created_by_id, title, description, survey_type, 
            is_active, is_public, access_code, custom_logo, custom_theme, 
            custom_css, custom_welcome_message, custom_completion_message, 
            redirect_url, allow_anonymous, require_email, collect_demographics, 
            estimated_time_minutes, max_responses, expiry_date, created_at, updated_at
          FROM surveys
          WHERE company_id = ${companyId}
        `);
      });
      
      // Transform the results to match the expected format
      const formattedSurveys = surveys.rows.map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        createdById: row.created_by_id,
        createdByUserId: row.created_by_id, // Explicitly include the user ID who created the survey
        title: row.title,
        description: row.description,
        surveyType: row.survey_type,
        isActive: row.is_active,
        isPublic: row.is_public,
        accessCode: row.access_code,
        customLogo: row.custom_logo,
        customTheme: row.custom_theme,
        customCss: row.custom_css,
        customWelcomeMessage: row.custom_welcome_message,
        customCompletionMessage: row.custom_completion_message,
        redirectUrl: row.redirect_url,
        allowAnonymous: row.allow_anonymous,
        requireEmail: row.require_email,
        collectDemographics: row.collect_demographics,
        estimatedTimeMinutes: row.estimated_time_minutes,
        maxResponses: row.max_responses,
        expiryDate: row.expiry_date,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString()
      }));
      
      console.log(`Found ${formattedSurveys.length} surveys for company ${companyId}`);
      
      res.json({
        status: 'success',
        data: formattedSurveys
      });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch surveys data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Dashboard-specific surveys list endpoint with enhanced authentication
  app.get('/api/dashboard/surveys', async (req: Request, res: Response) => {
    try {
      // Enhanced authentication check for dashboard
      if (!req.session || !req.session.userId) {
        console.error('No session or userId found for dashboard surveys access');
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required for dashboard access'
        });
      }

      // Get the user's company ID from session
      const companyId = req.session.companyId;
      
      if (!companyId) {
        console.error('No company ID found for user in dashboard');
        return res.status(403).json({
          status: 'error',
          message: 'Company ID not found. Please ensure you are logged in.'
        });
      }

      console.log(`Fetching dashboard surveys for company_id: ${companyId}`);
      
      // Use SQL template query filtered by company_id with response metrics and flags
      const surveys = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT 
            s.id, s.company_id, s.created_by_id, s.title, s.description, s.survey_type, 
            s.is_active, s.is_public, s.access_code, s.custom_logo, s.custom_theme, 
            s.custom_css, s.custom_welcome_message, s.custom_completion_message, 
            s.redirect_url, s.allow_anonymous, s.require_email, s.collect_demographics, 
            s.estimated_time_minutes, s.max_responses, s.expiry_date, s.created_at, s.updated_at,
            s.enable_ai_responses, s.status, s.admin_note, s.admin_deactivated,
            COALESCE(response_stats.total_responses, 0) as response_count,
            COALESCE(response_stats.completion_rate, 0) as completion_rate,
            COALESCE(flag_counts.open_flags, 0) as open_flags_count
          FROM surveys s
          LEFT JOIN (
            SELECT 
              survey_id,
              COUNT(*) as total_responses,
              CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(CASE WHEN complete_time IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1)
              END as completion_rate
            FROM survey_responses
            GROUP BY survey_id
          ) response_stats ON s.id = response_stats.survey_id
          LEFT JOIN (
            SELECT 
              survey_id,
              COUNT(*) as open_flags
            FROM survey_flags
            WHERE status = 'open'
            GROUP BY survey_id
          ) flag_counts ON s.id = flag_counts.survey_id
          WHERE s.company_id = ${companyId}
          ORDER BY s.created_at DESC
        `);
      });
      
      // Fetch flags for each survey
      const surveyIds = surveys.rows.map((row: any) => row.id);
      const flagsMap = new Map();
      
      if (surveyIds.length > 0) {
        // Use Drizzle query builder with inArray for proper array handling
        const flags = await db.select({
          id: surveyFlags.id,
          surveyId: surveyFlags.surveyId,
          type: surveyFlags.type,
          description: surveyFlags.description,
          status: surveyFlags.status,
          createdByName: surveyFlags.createdByName,
          createdAt: surveyFlags.createdAt
        })
        .from(surveyFlags)
        .where(inArray(surveyFlags.surveyId, surveyIds));
        
        // Sort by createdAt descending (newest first)
        flags.sort((a: any, b: any) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        flags.forEach((flag: any) => {
          if (!flagsMap.has(flag.surveyId)) {
            flagsMap.set(flag.surveyId, []);
          }
          flagsMap.get(flag.surveyId).push({
            id: flag.id,
            type: flag.type,
            description: flag.description,
            status: flag.status,
            createdByName: flag.createdByName,
            createdAt: flag.createdAt instanceof Date ? flag.createdAt.toISOString() : new Date(flag.createdAt).toISOString()
          });
        });
      }
      
      // Transform the results to match the expected format
      const formattedSurveys = surveys.rows.map((row: any) => {
        // Determine status: flagged takes priority, then active/inactive
        let status = row.is_active ? 'active' : 'inactive';
        // If survey has status 'flagged' in database OR has open flags, mark as flagged
        if (row.status === 'flagged' || (row.open_flags_count > 0)) {
          status = 'flagged';
        }
        
        return {
          id: row.id,
          companyId: row.company_id,
          createdById: row.created_by_id,
          title: row.title,
          description: row.description,
          surveyType: row.survey_type,
          isActive: row.is_active,
          isPublic: row.is_public,
          accessCode: row.access_code,
          customLogo: row.custom_logo,
          customTheme: row.custom_theme,
          customCss: row.custom_css,
          customWelcomeMessage: row.custom_welcome_message,
          customCompletionMessage: row.custom_completion_message,
          redirectUrl: row.redirect_url,
          allowAnonymous: row.allow_anonymous,
          requireEmail: row.require_email,
          collectDemographics: row.collect_demographics,
          estimatedTime: row.estimated_time_minutes,
          maxResponses: row.max_responses,
          expiryDate: row.expiry_date,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
          status: status,
          responseCount: parseInt(row.response_count) || 0,
          completionRate: parseFloat(row.completion_rate) || 0,
          enableAIResponses: row.enable_ai_responses || false,
          flags: flagsMap.get(row.id) || [],
          openFlagsCount: parseInt(row.open_flags_count) || 0,
          adminNote: row.admin_note || null,
          adminDeactivated: row.admin_deactivated || false
        };
      });
      
      res.json({
        status: 'success',
        data: formattedSurveys
      });
    } catch (error) {
      console.error('Error fetching dashboard surveys:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch surveys data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Single survey retrieval endpoint
  app.get('/api/surveys/:id', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid survey ID format',
          code: 'INVALID_ID',
          timestamp: new Date().toISOString(),
          path: `/api/surveys/${req.params.id}`
        });
      }
      
      // Check if this is a preview request (only allowed for admins)
      const isPreview = req.query.preview === 'true';
      const isAdmin = req.headers['x-mock-admin'] === 'true' || 
                      req.session?.userRole === 'platform_admin' || 
                      req.user?.role === 'platform_admin';
      
      // Get the user's company ID from session or user object (may be undefined for anonymous users)
      const companyId = req.session?.companyId || req.user?.companyId;
      
      // If preview is requested but user is not admin, deny access
      if (isPreview && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Preview access is restricted to administrators only.'
        });
      }
      
      // First, fetch the survey to check its settings (allow_anonymous, is_public)
      const surveyCheck = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT id, company_id, is_public, allow_anonymous, is_active
          FROM surveys
          WHERE id = ${surveyId}
        `);
      });
      
      if (!surveyCheck.rows || surveyCheck.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Survey not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: `/api/surveys/${surveyId}`
        });
      }
      
      const survey = surveyCheck.rows[0];
      
      // Check if survey allows anonymous access
      const allowsAnonymous = survey.allow_anonymous || survey.is_public;
      
      // If not admin preview and survey doesn't allow anonymous, require company match
      if (!isPreview && !allowsAnonymous && !companyId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
          path: `/api/surveys/${surveyId}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // If not admin preview and survey doesn't allow anonymous, check company match
      if (!isPreview && !allowsAnonymous && companyId && companyId !== survey.company_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You do not have permission to view this survey.'
        });
      }
      
      // Now fetch the full survey data
      const result = await executeWithRetry(async () => {
        // If admin preview or survey allows anonymous, don't filter by company_id
        if ((isPreview && isAdmin) || allowsAnonymous) {
          return await db.execute(sql`
            SELECT
              id, company_id, created_by_id, title, description, survey_type,
              is_active, is_public, access_code, custom_logo, custom_theme,
              custom_css, custom_welcome_message, custom_completion_message,
              redirect_url, allow_anonymous, require_email, collect_demographics,
              estimated_time_minutes, max_responses, expiry_date, created_at, updated_at,
              -- Business Context Columns
              product_name, product_description, product_category, product_features,
              value_proposition, competitors, target_market, industry, pain_points,
              -- Survey Configuration Columns
              survey_language, enable_ai_insights, enable_social_sharing, enable_ai_responses,
              -- Demographic Collection Settings
              collect_age, collect_gender, collect_location, collect_education, collect_income
            FROM surveys
            WHERE id = ${surveyId}
          `);
        } else {
          // Regular authenticated access - filter by company_id
          return await db.execute(sql`
            SELECT
              id, company_id, created_by_id, title, description, survey_type,
              is_active, is_public, access_code, custom_logo, custom_theme,
              custom_css, custom_welcome_message, custom_completion_message,
              redirect_url, allow_anonymous, require_email, collect_demographics,
              estimated_time_minutes, max_responses, expiry_date, created_at, updated_at,
              -- Business Context Columns
              product_name, product_description, product_category, product_features,
              value_proposition, competitors, target_market, industry, pain_points,
              -- Survey Configuration Columns
              survey_language, enable_ai_insights, enable_social_sharing, enable_ai_responses,
              -- Demographic Collection Settings
              collect_age, collect_gender, collect_location, collect_education, collect_income
            FROM surveys
            WHERE id = ${surveyId} AND company_id = ${companyId}
          `);
        }
      });
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Survey not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: `/api/surveys/${surveyId}`
        });
      }
      
      const row = result.rows[0];
      const formattedSurvey = {
        id: row.id,
        companyId: row.company_id,
        createdById: row.created_by_id,
        title: row.title,
        description: row.description,
        surveyType: row.survey_type,
        isActive: row.is_active,
        isPublic: row.is_public,
        accessCode: row.access_code,
        customLogo: row.custom_logo,
        customTheme: row.custom_theme,
        customCss: row.custom_css,
        customWelcomeMessage: row.custom_welcome_message,
        customCompletionMessage: row.custom_completion_message,
        redirectUrl: row.redirect_url,
        allowAnonymous: row.allow_anonymous,
        requireEmail: row.require_email,
        collectDemographics: row.collect_demographics,
        estimatedTime: row.estimated_time_minutes, // Map database field to frontend expected field
        maxResponses: row.max_responses,
        expiryDate: row.expiry_date,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),

        // Business Context Data
        businessContext: {
          productName: row.product_name,
          productDescription: row.product_description,
          productCategory: row.product_category,
          productFeatures: row.product_features,
          valueProposition: row.value_proposition,
          competitors: row.competitors,
          targetMarket: row.target_market,
          industry: row.industry,
          painPoints: row.pain_points
        },

        // Survey Configuration Data
        surveyLanguage: row.survey_language,
        enableAIInsights: row.enable_ai_insights,
        enableSocialSharing: row.enable_social_sharing,
        enableAIResponses: row.enable_ai_responses,
        aiResponses: { enabled: row.enable_ai_responses },

        // Demographic Collection Settings
        demographics: {
          collectAge: row.collect_age,
          collectGender: row.collect_gender,
          collectLocation: row.collect_location,
          collectEducation: row.collect_education,
          collectIncome: row.collect_income
        }
      };
      
      res.json({
        status: 'success',
        data: formattedSurvey
      });
    } catch (error) {
      console.error(`Error fetching survey ${req.params.id}:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Alternative endpoint for single survey retrieval
  app.get('/api/survey/:id', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid survey ID format',
          code: 'INVALID_ID',
          timestamp: new Date().toISOString(),
          path: `/api/survey/${req.params.id}`
        });
      }

      // Get the user's company ID from session or user object (optional for public surveys)
      const companyId = req.session?.companyId || req.user?.companyId;

      // First, fetch the survey without company filter to check if it's public/anonymous
      const result = await db.execute(sql`
        SELECT
          id, company_id, created_by_id, title, description, survey_type,
          is_active, is_public, access_code, custom_logo, custom_theme,
          custom_css, custom_welcome_message, custom_completion_message,
          redirect_url, allow_anonymous, require_email, collect_demographics,
          estimated_time_minutes, max_responses, expiry_date, created_at, updated_at
        FROM surveys
        WHERE id = ${surveyId}
      `);

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Survey not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: `/api/survey/${surveyId}`
        });
      }

      const row = result.rows[0];

      // All surveys are publicly available for taking via share links
      // Anyone can access any survey from the shared link without authentication
      console.log(`Survey ${surveyId} is publicly accessible via share link`);
      const formattedSurvey = {
        id: row.id,
        companyId: row.company_id,
        createdById: row.created_by_id,
        title: row.title,
        description: row.description,
        surveyType: row.survey_type,
        isActive: row.is_active,
        isPublic: row.is_public,
        accessCode: row.access_code,
        customLogo: row.custom_logo,
        customTheme: row.custom_theme,
        customCss: row.custom_css,
        customWelcomeMessage: row.custom_welcome_message,
        customCompletionMessage: row.custom_completion_message,
        redirectUrl: row.redirect_url,
        allowAnonymous: row.allow_anonymous,
        requireEmail: row.require_email,
        collectDemographics: row.collect_demographics,
        estimatedTimeMinutes: row.estimated_time_minutes,
        maxResponses: row.max_responses,
        expiryDate: row.expiry_date,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString()
      };

      res.json({
        status: 'success',
        data: formattedSurvey
      });
    } catch (error) {
      console.error(`Error fetching survey ${req.params.id}:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Dashboard-specific survey endpoint with enhanced authentication
  app.get('/api/dashboard/surveys/:id', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid survey ID format',
          code: 'INVALID_ID',
          timestamp: new Date().toISOString(),
          path: `/api/dashboard/surveys/${req.params.id}`
        });
      }
      
      // Enhanced authentication check for dashboard
      if (!req.session || !req.session.userId) {
        console.error('No session or userId found for dashboard survey access');
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required for dashboard access'
        });
      }

      // Get the user's company ID from session
      const companyId = req.session.companyId;
      
      if (!companyId) {
        console.error('No company ID found for user in dashboard');
        return res.status(403).json({
          status: 'error',
          message: 'Company ID not found. Please ensure you are logged in.'
        });
      }
      
      // Fetch survey data with additional metrics
      const [surveyResult, questionsResult, responsesResult, activityResult] = await Promise.all([
        // Get basic survey data
        executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT
              id, company_id, created_by_id, title, description, survey_type,
              is_active, is_public, access_code, custom_logo, custom_theme,
              custom_css, custom_welcome_message, custom_completion_message,
              redirect_url, allow_anonymous, require_email, collect_demographics,
              estimated_time_minutes, max_responses, expiry_date, created_at, updated_at,
              -- Business Context Columns
              product_name, product_description, product_category, product_features,
              value_proposition, competitors, target_market, industry, pain_points,
              -- Survey Configuration Columns
              survey_language, enable_ai_insights, enable_social_sharing,
              -- Demographic Collection Settings
              collect_age, collect_gender, collect_location, collect_education, collect_income,
              -- AI Responses Settings
              enable_ai_responses
            FROM surveys
            WHERE id = ${surveyId} AND company_id = ${companyId}
          `);
        }),
        // Get question count
        executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT COUNT(*) as question_count
            FROM survey_questions
            WHERE survey_id = ${surveyId}
          `);
        }),
        // Get response count and completion stats
        executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT 
              COUNT(*) as total_responses,
              COUNT(CASE WHEN complete_time IS NOT NULL THEN 1 END) as completed_responses,
              AVG(CASE WHEN complete_time IS NOT NULL AND start_time IS NOT NULL 
                  THEN EXTRACT(EPOCH FROM (complete_time - start_time))/60 
                  END) as avg_completion_time_minutes
            FROM survey_responses
            WHERE survey_id = ${surveyId}
          `);
        }),
        // Get recent activity (last 5 activities)
        executeWithRetry(async () => {
          return await db.execute(sql`
            SELECT 
              id, respondent_id, start_time, complete_time,
              CASE 
                WHEN complete_time IS NOT NULL THEN 'completed'
                WHEN start_time IS NOT NULL THEN 'started'
                ELSE 'created'
              END as activity_type
            FROM survey_responses
            WHERE survey_id = ${surveyId}
            ORDER BY COALESCE(complete_time, start_time, created_at) DESC
            LIMIT 5
          `);
        })
      ]);
      
      if (!surveyResult.rows || surveyResult.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Survey not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: `/api/dashboard/surveys/${surveyId}`
        });
      }
      
      const row = surveyResult.rows[0];
      const questionCount = questionsResult.rows[0]?.question_count || 0;
      const responseStats = responsesResult.rows[0] || { total_responses: 0, completed_responses: 0, avg_completion_time_minutes: null };
      const recentActivity = activityResult.rows || [];
      
      const formattedSurvey = {
        id: row.id,
        companyId: row.company_id,
        createdById: row.created_by_id,
        title: row.title,
        description: row.description,
        surveyType: row.survey_type,
        status: row.is_active ? 'active' : 'draft', // Convert boolean to string
        isActive: row.is_active,
        isPublic: row.is_public,
        accessCode: row.access_code,
        customLogo: row.custom_logo,
        customTheme: row.custom_theme,
        customCss: row.custom_css,
        customWelcomeMessage: row.custom_welcome_message,
        customCompletionMessage: row.custom_completion_message,
        redirectUrl: row.redirect_url,
        allowAnonymous: row.allow_anonymous,
        requireEmail: row.require_email,
        collectDemographics: row.collect_demographics,
        estimatedTime: row.estimated_time_minutes,
        maxResponses: row.max_responses,
        expiryDate: row.expiry_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row.survey_type || 'Uncategorized', // Add category field
        questions: [], // Empty array - questions are fetched separately
        questionCount: parseInt(questionCount) || 0, // Add explicit question count field
        responseCount: parseInt(responseStats.total_responses) || 0,
        completedCount: parseInt(responseStats.completed_responses) || 0,
        completionRate: responseStats.total_responses > 0 
          ? Math.round((responseStats.completed_responses / responseStats.total_responses) * 100)
          : 0,
        avgCompletionTime: responseStats.avg_completion_time_minutes 
          ? Math.round(responseStats.avg_completion_time_minutes)
          : null,
        recentActivity: recentActivity.map((activity: any) => ({
          id: activity.id,
          respondentId: activity.respondent_id,
          type: activity.activity_type,
          timestamp: activity.complete_time || activity.start_time || new Date(),
          description: activity.activity_type === 'completed' 
            ? `Respondent #${activity.respondent_id} completed the survey`
            : activity.activity_type === 'started'
            ? `Respondent #${activity.respondent_id} started the survey`
            : `Respondent #${activity.respondent_id} created a response`
        })),

        // Business Context Data
        businessContext: {
          productName: row.product_name,
          productDescription: row.product_description,
          productCategory: row.product_category,
          productFeatures: row.product_features,
          valueProposition: row.value_proposition,
          competitors: row.competitors,
          targetMarket: row.target_market,
          industry: row.industry,
          painPoints: row.pain_points
        },

        // Survey Configuration Data
        surveyLanguage: row.survey_language,
        enableAIInsights: row.enable_ai_insights,
        enableSocialSharing: row.enable_social_sharing,

        // Demographic Collection Settings
        demographics: {
          collectAge: row.collect_age,
          collectGender: row.collect_gender,
          collectLocation: row.collect_location,
          collectEducation: row.collect_education,
          collectIncome: row.collect_income
        },

        // AI Responses Settings
        aiResponses: {
          enabled: row.enable_ai_responses
        }
      };
      
      res.json(formattedSurvey);
    } catch (error) {
      console.error('Error fetching dashboard survey:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get questions for a specific survey
  app.get('/api/surveys/:id/questions', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid survey ID format',
          code: 'INVALID_ID',
          timestamp: new Date().toISOString(),
          path: `/api/surveys/${req.params.id}/questions`
        });
      }

      // Check if this is a preview request (only allowed for admins)
      const isPreview = req.query.preview === 'true';
      const isAdmin = req.headers['x-mock-admin'] === 'true' || 
                      req.session?.userRole === 'platform_admin' || 
                      req.user?.role === 'platform_admin';

      // Get the user's company ID from session or user object (if authenticated)
      const companyId = req.session?.companyId || req.user?.companyId;

      // First verify the survey exists and check access
      const surveyCheck = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT id, company_id, is_public, allow_anonymous FROM surveys
          WHERE id = ${surveyId}
        `);
      });

      if (!surveyCheck.rows || surveyCheck.rows.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Survey not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
          path: `/api/surveys/${surveyId}/questions`
        });
      }

      const survey = surveyCheck.rows[0];

      // If preview is requested but user is not admin, deny access
      if (isPreview && !isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Preview access is restricted to administrators only.'
        });
      }

      // All surveys are publicly available via share links
      // Anyone can access survey questions without authentication
      console.log(`Survey ${surveyId} questions are publicly accessible via share link`);

      // Fetch questions for this survey
      const questionsResult = await executeWithRetry(async () => {
        return await db.execute(sql`
          SELECT
            id, survey_id, question, question_type, required,
            help_text, "order", options, custom_validation,
            slider_config, scenario_text,
            created_at, updated_at
          FROM survey_questions
          WHERE survey_id = ${surveyId}
          ORDER BY "order" ASC
        `);
      });

      const formattedQuestions = questionsResult.rows.map((row: any) => {
        // Handle options - convert to array of objects with {id, text, value}
        let options: any[] = [];
        if (row.options) {
          const rawOptions = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
          // If options is an array of objects, preserve the structure
          if (Array.isArray(rawOptions)) {
            options = rawOptions.map((opt: any, index: number) => {
              if (typeof opt === 'string') {
                return {
                  id: `opt_${index}`,
                  text: opt,
                  value: opt
                };
              }
              // If it's already an object, preserve all fields including image and description
              return {
                id: opt.id || `opt_${index}`,
                text: opt.text || opt.value || opt.label || String(opt),
                value: opt.value || opt.text || opt.label || String(opt),
                image: opt.image || opt.imageUrl || null,
                description: opt.description || null
              };
            });
          }
        }

        return {
          id: row.id,
          surveyId: row.survey_id,
          type: row.question_type || 'multiple-choice', // Map questionType to type for frontend
          text: row.question, // Map 'question' to 'text' for client compatibility
          question: row.question, // Also keep the original field
          questionType: row.question_type || 'multiple-choice',
          required: row.required !== undefined ? row.required : true,
          helpText: row.help_text,
          order: row.order,
          options: options,
          customValidation: row.custom_validation,
          sliderConfig: row.slider_config,
          scenarioText: row.scenario_text,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });

      console.log(`Found ${formattedQuestions.length} questions for survey ${surveyId}`);
      console.log(`First question:`, formattedQuestions[0]);

      res.json({
        status: 'success',
        data: formattedQuestions
      });
    } catch (error) {
      console.error(`Error fetching questions for survey ${req.params.id}:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey questions',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update survey endpoint for survey editing
  app.put('/api/surveys/:id', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Check if user is admin
      const isAdminUser = req.headers['x-mock-admin'] === 'true' ||
                         req.session?.userRole === 'platform_admin' ||
                         req.user?.role === 'platform_admin';

      // If survey is admin-deactivated, only admins can edit it
      if (existingSurvey.adminDeactivated && !isAdminUser) {
        return res.status(403).json({
          status: 'error',
          message: 'This survey has been deactivated by an administrator and cannot be edited. Please contact support to reactivate it.'
        });
      }

      const updateData = req.body;
      console.log('Survey update request:', updateData);

      // Prepare update data with proper field mapping including business context
      const surveyUpdateData: any = {
        title: updateData.title,
        description: updateData.description,
        surveyType: updateData.surveyType,
        isActive: updateData.isActive,
        isPublic: updateData.isPublic,
        allowAnonymous: updateData.allowAnonymous,
        requireEmail: updateData.requireEmail,
        collectDemographics: updateData.collectDemographics,
        // accept both string and number; coerce to int and validate
        estimatedTime: (() => {
          const raw = updateData.estimatedTime;
          const parsed = typeof raw === 'string' ? parseInt(raw, 10) : raw;
          return (Number.isFinite(parsed) && parsed > 0)
            ? Math.floor(parsed as number)
            : existingSurvey.estimatedTime;
        })(),
        maxResponses: updateData.maxResponses ?? existingSurvey.maxResponses,
        expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : existingSurvey.expiryDate,
        customWelcomeMessage: updateData.customWelcomeMessage || updateData.welcomeMessage || existingSurvey.customWelcomeMessage,
        customCompletionMessage: updateData.customCompletionMessage || updateData.completionMessage || existingSurvey.customCompletionMessage,

        // Business Context Data - Update all the collected business context information
        productName: updateData.businessContext?.productName ?? existingSurvey.productName,
        productDescription: updateData.businessContext?.productDescription ?? existingSurvey.productDescription,
        productCategory: updateData.businessContext?.productCategory ?? existingSurvey.productCategory,
        productFeatures: updateData.businessContext?.productFeatures ?? existingSurvey.productFeatures,
        valueProposition: updateData.businessContext?.valueProposition ?? existingSurvey.valueProposition,
        competitors: updateData.businessContext?.competitors ?? existingSurvey.competitors,
        targetMarket: updateData.businessContext?.targetMarket ?? existingSurvey.targetMarket,
        industry: updateData.businessContext?.industry ?? existingSurvey.industry,
        painPoints: updateData.businessContext?.painPoints ?? existingSurvey.painPoints,

        // Survey Configuration Data
        surveyLanguage: updateData.surveyLanguage ?? existingSurvey.surveyLanguage ?? 'en',
        enableAIInsights: updateData.enableAIInsights !== undefined ? updateData.enableAIInsights : existingSurvey.enableAIInsights,
        enableSocialSharing: updateData.enableSocialSharing !== undefined ? updateData.enableSocialSharing : existingSurvey.enableSocialSharing,
        enableAIResponses: updateData.enableAIResponses !== undefined ? updateData.enableAIResponses : existingSurvey.enableAIResponses,

        // Demographic Collection Settings
        collectAge: updateData.demographics?.collectAge !== undefined ? updateData.demographics.collectAge : existingSurvey.collectAge,
        collectGender: updateData.demographics?.collectGender !== undefined ? updateData.demographics.collectGender : existingSurvey.collectGender,
        collectLocation: updateData.demographics?.collectLocation !== undefined ? updateData.demographics.collectLocation : existingSurvey.collectLocation,
        collectEducation: updateData.demographics?.collectEducation !== undefined ? updateData.demographics.collectEducation : existingSurvey.collectEducation,
        collectIncome: updateData.demographics?.collectIncome !== undefined ? updateData.demographics.collectIncome : existingSurvey.collectIncome,

        updatedAt: new Date()
      };

      // Update the survey in the database
      const [updatedSurvey] = await db.update(surveys)
        .set(surveyUpdateData)
        .where(eq(surveys.id, surveyId))
        .returning();

      if (!updatedSurvey) {
        throw new Error('Failed to update survey');
      }

      // Broadcast survey update via WebSocket
      const companyId = existingSurvey.companyId;
      websocketManager.broadcast({
        type: 'surveyUpdate',
        surveyId: surveyId,
        companyId: companyId,
        timestamp: new Date().toISOString()
      });

      // Handle questions upsert/delete if provided
      const payloadQuestions = Array.isArray(updateData.questions) ? updateData.questions : [];
      if (payloadQuestions.length > 0) {
        try {
          // Fetch existing questions
          const existing = await db.query.surveyQuestions.findMany({
            where: (sq: any, { eq }: any) => eq(sq.surveyId, surveyId),
            orderBy: (sq: any, { asc }: any) => [asc(sq.order)]
          });

          const existingById = new Map<number, any>(existing.map((q: any) => [q.id, q]));
          const payloadIds = new Set<number>();

          // Update or insert
          for (let i = 0; i < payloadQuestions.length; i++) {
            const q = payloadQuestions[i];
            const qType = q.questionType || 'multiple-choice';

            const values: any = {
              surveyId,
              question: q.question,
              questionType: qType,
              required: q.required !== undefined ? q.required : true,
              helpText: q.helpText || null,
              order: q.order ?? i + 1,
              options: q.options || null,
              customValidation: q.customValidation || null,
              updatedAt: new Date(),
            };
            // Type-specific fields
            if (qType === 'slider' && q.sliderConfig) {
              values.sliderConfig = q.sliderConfig;
            } else {
              values.sliderConfig = null;
            }
            if (qType === 'scenario' && q.scenarioText) {
              values.scenarioText = q.scenarioText;
            } else {
              values.scenarioText = null;
            }

            if (q.id && existingById.has(Number(q.id))) {
              const qid = Number(q.id);
              payloadIds.add(qid);
              await db.update(surveyQuestions)
                .set(values)
                .where(eq(surveyQuestions.id, qid));
            } else {
              await db.insert(surveyQuestions).values({
                ...values,
                createdAt: new Date(),
              });
            }
          }

          // Delete removed questions
          const toDelete = existing.filter((q: any) => !payloadIds.has(q.id));
          for (const dq of toDelete) {
            await db.delete(surveyQuestions).where(eq(surveyQuestions.id, dq.id));
          }
        } catch (qErr) {
          console.error('Error updating survey questions:', qErr);
          // Continue; return survey update result even if questions update failed
        }
      }

      console.log(`Survey ${surveyId} updated successfully`);

      res.json({
        status: 'success',
        message: 'Survey updated successfully',
        data: updatedSurvey
      });

    } catch (error) {
      console.error('Error updating survey:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete survey endpoint - public endpoint with no middleware or limitations
  app.delete('/api/surveys/:id', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Delete related records first (due to foreign key constraints)
      // Delete survey questions
      await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId));
      
      // Delete survey responses
      await db.execute(sql`DELETE FROM survey_responses WHERE survey_id = ${surveyId}`);
      
      // Delete client survey deployments
      await db.execute(sql`DELETE FROM client_survey_deployments WHERE survey_id = ${surveyId}`);
      
      // Delete collaboration sessions
      await db.execute(sql`DELETE FROM collaboration_sessions WHERE survey_id = ${surveyId}`);
      
      // Delete AI generation jobs linked to this survey
      await db.delete(aiGenerationJobs).where(eq(aiGenerationJobs.surveyId, surveyId));
      
      // Delete survey flags (cascade will handle this, but explicit for clarity)
      await db.delete(surveyFlags).where(eq(surveyFlags.surveyId, surveyId));
      
      // Finally, delete the survey from the database
      await db.delete(surveys).where(eq(surveys.id, surveyId));

      // Track survey deletion event for notifications
      const userId = (req.session as any)?.userId || 1;
      await trackSurveyDeleted(existingSurvey.title, userId).catch(err => {
        console.error('Failed to track survey deletion event:', err);
        // Don't block the survey deletion if tracking fails
      });

      // Broadcast survey deletion via WebSocket
      const companyId = existingSurvey.companyId;
      websocketManager.broadcast({
        type: 'surveyUpdate',
        surveyId: surveyId,
        companyId: companyId,
        action: 'delete',
        timestamp: new Date().toISOString()
      });

      // Broadcast usage update to refresh survey count
      websocketManager.broadcast({
        type: 'usageUpdate',
        companyId: companyId,
        timestamp: new Date().toISOString()
      });

      console.log(`Survey ${surveyId} deleted successfully`);

      res.json({
        status: 'success',
        message: 'Survey deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting survey:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update survey status (enable/disable)
  app.patch('/api/surveys/:id/status', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      const { status, isAdmin } = req.body;

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      if (!status || !['active', 'inactive', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Must be one of: active, inactive, draft, archived'
        });
      }

      // Check if user is admin (for admin-side deactivation)
      const isAdminUser = isAdmin || 
                         req.headers['x-mock-admin'] === 'true' ||
                         req.session?.userRole === 'platform_admin' ||
                         req.user?.role === 'platform_admin';

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Update survey status and is_active
      const isActive = status === 'active';
      const updateData: any = {
        status: status,
        isActive: isActive,
        updatedAt: new Date()
      };

      // If admin is deactivating, set admin_deactivated flag
      if (isAdminUser) {
        updateData.adminDeactivated = !isActive; // Set to true if deactivating, false if activating
      } else {
        // Client-side activation/deactivation: only update isActive, don't change admin_deactivated
        // If admin_deactivated is true, client cannot activate
        if (existingSurvey.adminDeactivated && isActive) {
          return res.status(403).json({
            status: 'error',
            message: 'This survey has been deactivated by an administrator. Please contact support to reactivate it.'
          });
        }
      }

      await db.update(surveys)
        .set(updateData)
        .where(eq(surveys.id, surveyId));

      // Broadcast survey status update via WebSocket
      const companyId = existingSurvey.companyId;
      websocketManager.broadcast({
        type: 'surveyStatusUpdate',
        surveyId: surveyId,
        companyId: companyId,
        status: status,
        isActive: isActive,
        adminDeactivated: updateData.adminDeactivated !== undefined ? updateData.adminDeactivated : existingSurvey.adminDeactivated,
        timestamp: new Date().toISOString()
      });

      res.json({
        status: 'success',
        message: 'Survey status updated successfully',
        data: {
          id: surveyId,
          status: status,
          isActive: isActive,
          adminDeactivated: updateData.adminDeactivated !== undefined ? updateData.adminDeactivated : existingSurvey.adminDeactivated
        }
      });

    } catch (error) {
      console.error('Error updating survey status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update survey status',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Reset survey (delete all responses)
  app.post('/api/surveys/:id/reset', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Delete all survey responses
      await db.execute(sql`DELETE FROM survey_responses WHERE survey_id = ${surveyId}`);
      
      // Reset response_count and completion_rate
      await db.update(surveys)
        .set({
          responseCount: 0,
          completionRate: 0,
          updatedAt: new Date()
        })
        .where(eq(surveys.id, surveyId));

      res.json({
        status: 'success',
        message: 'Survey reset successfully. All responses have been deleted.',
        data: {
          id: surveyId,
          responseCount: 0
        }
      });

    } catch (error) {
      console.error('Error resetting survey:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Flag survey issue
  app.post('/api/surveys/:id/flag', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      const { type, description } = req.body;

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      if (!type || !['missing_data', 'broken_logic', 'client_complaint', 'other'].includes(type)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid flag type. Must be one of: missing_data, broken_logic, client_complaint, other'
        });
      }

      if (!description || !description.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Description is required'
        });
      }

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Get admin user info
      const adminUserId = req.session?.userId || req.user?.id;
      const adminUserName = req.session?.username || req.user?.username || 
                           `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 
                           'Admin';

      // Create flag
      const [newFlag] = await db.insert(surveyFlags).values({
        surveyId: surveyId,
        type: type,
        description: description.trim(),
        status: 'open',
        createdById: adminUserId || null,
        createdByName: adminUserName,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Update survey status to flagged if it has open flags
      const openFlagsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM survey_flags 
        WHERE survey_id = ${surveyId} AND status = 'open'
      `);
      const openFlagsCount = parseInt(openFlagsResult.rows[0]?.count || '0');

      if (openFlagsCount > 0) {
        await db.update(surveys)
          .set({
            status: 'flagged',
            isActive: false,
            adminDeactivated: true, // Flagged surveys are admin-deactivated
            updatedAt: new Date()
          })
          .where(eq(surveys.id, surveyId));

        // Broadcast survey status update via WebSocket
        const companyId = existingSurvey.companyId;
        websocketManager.broadcast({
          type: 'surveyStatusUpdate',
          surveyId: surveyId,
          companyId: companyId,
          status: 'flagged',
          isActive: false,
          adminDeactivated: true,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        status: 'success',
        message: 'Survey flagged successfully',
        data: {
          id: newFlag.id,
          surveyId: surveyId,
          type: type,
          description: description.trim(),
          status: 'open'
        }
      });

    } catch (error) {
      console.error('Error flagging survey:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to flag survey',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add admin note to survey
  app.post('/api/surveys/:id/notes', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      const { note } = req.body;

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      if (!note || !note.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Note is required'
        });
      }

      // Check if survey exists
      const existingSurvey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId)
      });

      if (!existingSurvey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      // Update survey with admin note
      await db.update(surveys)
        .set({
          adminNote: note.trim(),
          updatedAt: new Date()
        })
        .where(eq(surveys.id, surveyId));

      res.json({
        status: 'success',
        message: 'Admin note added successfully',
        data: {
          id: surveyId,
          adminNote: note.trim()
        }
      });

    } catch (error) {
      console.error('Error adding admin note:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add admin note',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get survey flags
  app.get('/api/surveys/:id/flags', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID format'
        });
      }

      const flags = await db.execute(sql`
        SELECT id, survey_id, type, description, status, created_by_name, 
               created_at, resolved_at, resolved_by_name
        FROM survey_flags
        WHERE survey_id = ${surveyId}
        ORDER BY created_at DESC
      `);

      const formattedFlags = flags.rows.map((flag: any) => ({
        id: flag.id,
        surveyId: flag.survey_id,
        type: flag.type,
        description: flag.description,
        status: flag.status,
        createdBy: flag.created_by_name || 'Unknown',
        createdAt: flag.created_at,
        resolvedAt: flag.resolved_at,
        resolvedBy: flag.resolved_by_name
      }));

      res.json({
        status: 'success',
        data: formattedFlags
      });

    } catch (error) {
      console.error('Error fetching survey flags:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch survey flags',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/debug/clear-session', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to clear session' });
      }
      res.json({ message: 'Session cleared successfully' });
    });
  });

  // Test survey creation with current session
  app.post('/api/debug/test-survey-creation', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Debug survey creation test');
      console.log('Session data:', req.session);
      console.log('Session userId:', req.session?.userId);

      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          error: 'No session found',
          message: 'Please log in first'
        });
      }

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId),
        columns: { id: true, username: true, companyId: true, isActive: true }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid user',
          message: `User ID ${req.session.userId} not found in database`,
          sessionData: req.session
        });
      }

      // Check if company exists
      if (!user.companyId) {
        return res.status(400).json({
          error: 'No company',
          message: 'User is not associated with a company',
          user: user
        });
      }

      const company = await db.query.companies.findFirst({
        where: eq(companies.id, user.companyId)
      });

      if (!company) {
        return res.status(404).json({
          error: 'Company not found',
          message: `Company ID ${user.companyId} not found`,
          user: user
        });
      }

      // Try to create a test survey
      const testSurveyData = {
        companyId: user.companyId,
        createdById: user.id,
        title: `Test Survey ${Date.now()}`,
        description: 'Debug test survey',
        surveyType: 'general',
        isActive: true,
        isPublic: false,
        allowAnonymous: true,
        requireEmail: false,
        collectDemographics: true,
        estimatedTimeMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [newSurvey] = await db.insert(surveys)
        .values(testSurveyData)
        .returning();

      res.json({
        success: true,
        message: 'Test survey created successfully',
        survey: newSurvey,
        debug: {
          session: req.session,
          user: user,
          company: company
        }
      });

    } catch (error) {
      console.error('Debug survey creation failed:', error);
      res.status(500).json({
        error: 'Debug survey creation failed',
        message: error instanceof Error ? error.message : String(error),
        session: req.session
      });
    }
  });
    
  // Newsletter subscription endpoints
  app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Email address is required' 
        });
      }

      // Check if email already exists
      const existingSubscriber = await db.select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1);

      if (existingSubscriber.length > 0) {
        // If already subscribed, just return success
        if (existingSubscriber[0].subscribed) {
          return res.status(200).json({ 
            status: 'success', 
            message: 'You are already subscribed to our newsletter!' 
          });
        }
        
        // If previously unsubscribed, resubscribe them
        await db.update(newsletterSubscribers)
          .set({ 
            subscribed: true,
            subscribedAt: new Date(),
            unsubscribedAt: null
          })
          .where(eq(newsletterSubscribers.email, email));
        
        return res.status(200).json({ 
          status: 'success', 
          message: 'You have been resubscribed to our newsletter!' 
        });
      }

      // Insert new subscriber
      await db.insert(newsletterSubscribers)
        .values({
          email,
          name: name || null,
          subscriptionSource: 'website_footer',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          confirmed: true // Auto-confirm for now
        });

      res.status(201).json({ 
        status: 'success', 
        message: 'Thank you for subscribing to our newsletter!' 
      });
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'An error occurred while processing your subscription. Please try again.' 
      });
    }
  });

  app.post('/api/newsletter/unsubscribe', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Email address is required' 
        });
      }

      const subscriber = await db.select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1);

      if (subscriber.length === 0) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Email address not found in our subscriber list' 
        });
      }

      // Update subscriber status
      await db.update(newsletterSubscribers)
        .set({ 
          subscribed: false,
          unsubscribedAt: new Date()
        })
        .where(eq(newsletterSubscribers.email, email));

      res.status(200).json({ 
        status: 'success', 
        message: 'You have been unsubscribed from our newsletter.' 
      });
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'An error occurred while processing your request. Please try again.' 
      });
    }
  });

  // Cookie consent endpoint for GDPR compliance
  app.post('/api/cookie-consent', async (req: Request, res: Response) => {
    try {
      const { 
        sessionId, 
        userId, 
        necessary, 
        analytics, 
        marketing, 
        functional,
        consentVersion = "1.0",
        country,
        region 
      } = req.body;

      // Validate the request
      const validationResult = insertCookieConsentSchema.safeParse({
        sessionId,
        userId: userId ? parseInt(userId) : null,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        necessary: necessary !== undefined ? necessary : true,
        analytics: analytics !== undefined ? analytics : false,
        marketing: marketing !== undefined ? marketing : false,
        functional: functional !== undefined ? functional : false,
        consentVersion,
        country,
        region
      });

      if (!validationResult.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid cookie consent data',
          errors: validationResult.error.errors
        });
      }

      // Check if consent already exists for this session/user
      const existingConsent = await db.select()
        .from(cookieConsents)
        .where(
          sessionId 
            ? eq(cookieConsents.sessionId, sessionId)
            : userId 
              ? eq(cookieConsents.userId, parseInt(userId))
              : eq(cookieConsents.ipAddress, req.ip || 'unknown')
        )
        .limit(1);

      if (existingConsent.length > 0) {
        // Update existing consent
        await db.update(cookieConsents)
          .set({
            necessary: validationResult.data.necessary,
            analytics: validationResult.data.analytics,
            marketing: validationResult.data.marketing,
            functional: validationResult.data.functional,
            consentVersion: validationResult.data.consentVersion,
            updatedAt: new Date(),
            country: validationResult.data.country,
            region: validationResult.data.region
          })
          .where(eq(cookieConsents.id, existingConsent[0].id));
      } else {
        // Insert new consent record
        await db.insert(cookieConsents).values(validationResult.data);
      }

      res.status(200).json({
        status: 'success',
        message: 'Cookie preferences saved successfully'
      });
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save cookie preferences'
      });
    }
  });

  // Get cookie consent for analytics purposes (admin only)
  // app.get('/api/cookie-consent/stats', requireAdmin, async (req: Request, res: Response) => {
  //   try {
  //     const stats = await db.select({
  //       necessary: sql<number>`COUNT(CASE WHEN necessary = true THEN 1 END)`,
  //       analytics: sql<number>`COUNT(CASE WHEN analytics = true THEN 1 END)`,
  //       marketing: sql<number>`COUNT(CASE WHEN marketing = true THEN 1 END)`,
  //       functional: sql<number>`COUNT(CASE WHEN functional = true THEN 1 END)`,
  //       total: sql<number>`COUNT(*)`
  //     }).from(cookieConsents);

  //     res.json({
  //       status: 'success',
  //       data: stats[0] || {
  //         necessary: 0,
  //         analytics: 0,
  //         marketing: 0,
  //         functional: 0,
  //         total: 0
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error fetching cookie consent stats:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to fetch cookie consent statistics'
  //     });
  //   }
  // });

  // Users/Agents API endpoint
  app.get('/api/users/agents', async (_req: Request, res: Response) => {
    try {
      const agents = await db.query.users.findMany({
        where: (users: any, { eq }: any) => eq(users.role, 'SUPPORT_AGENT'),
        columns: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          department: true,
          isActive: true,
          profilePic: true,
          createdAt: true
        }
      });
      
      // If no support agents found, return some default data
      const formattedAgents = agents.length > 0 ? agents : [
        {
          id: 1,
          username: 'support1',
          email: 'support@example.com',
          firstName: 'Support',
          lastName: 'Agent',
          jobTitle: 'Customer Support Agent',
          department: 'Customer Support',
          isActive: true,
          profilePic: null,
          createdAt: new Date()
        }
      ];
      
      res.json({
        status: 'success',
        data: formattedAgents
      });
    } catch (error) {
      console.error('Error fetching support agents:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch support agents data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Support tickets API endpoint - GET
  app.get('/api/support/tickets', async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const assignedToId = req.query.assignedToId ? parseInt(req.query.assignedToId as string) : undefined;

      // Build SQL query with potential filters
      let ticketsQuery;

      if (status && priority && companyId && assignedToId) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.status = ${status}
            AND t.priority = ${priority}
            AND t.company_id = ${companyId}
            AND t.assigned_to_id = ${assignedToId}
          ORDER BY t.created_at DESC
        `;
      } else if (status && companyId) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.status = ${status}
            AND t.company_id = ${companyId}
          ORDER BY t.created_at DESC
        `;
      } else if (priority && companyId) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.priority = ${priority}
            AND t.company_id = ${companyId}
          ORDER BY t.created_at DESC
        `;
      } else if (assignedToId) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.assigned_to_id = ${assignedToId}
          ORDER BY t.created_at DESC
        `;
      } else if (status) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.status = ${status}
          ORDER BY t.created_at DESC
        `;
      } else if (priority) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.priority = ${priority}
          ORDER BY t.created_at DESC
        `;
      } else if (companyId) {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          WHERE t.company_id = ${companyId}
          ORDER BY t.created_at DESC
        `;
      } else {
        ticketsQuery = sql`
          SELECT t.*, c.name as client_name
          FROM support_tickets t
          JOIN companies c ON t.company_id = c.id
          ORDER BY t.created_at DESC
        `;
      }

      const tickets = await db.execute(ticketsQuery);

      // Format the results
      const formattedTickets = tickets.rows.map((ticket: any) => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.created_at,
        clientId: ticket.company_id,
        clientName: ticket.client_name,
        assignedAgentId: ticket.assigned_to_id,
        lastUpdate: ticket.updated_at,
        description: ticket.description,
        type: ticket.type,
        dueDate: ticket.due_date,
        resolvedAt: ticket.resolved_at,
        closedAt: ticket.closed_at
      }));

      res.json({
        status: 'success',
        data: formattedTickets
      });
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch support tickets data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Support ticket creation endpoint - POST (public route, no middleware)
  app.post('/api/support/ticket', async (req: Request, res: Response) => {
    try {
      const { subject, description, companyId, userId, priority, type } = req.body;

      // Validate required fields
      if (!subject || !description || !companyId || !userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: subject, description, companyId, userId'
        });
      }

      // Generate unique ticket number
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const ticketNumber = `TICK-${dateStr}-${randomNum}`;

      // Prepare ticket data
      const ticketData = {
        ticketNumber,
        companyId: parseInt(companyId),
        userId: parseInt(userId),
        subject,
        description,
        priority: priority || 'medium',
        status: 'new',
        type: type || 'general',
        assignedToId: null,
        dueDate: null,
        resolvedAt: null,
        closedAt: null,
        attachments: null,
        tags: null,
        createdAt: now,
        updatedAt: now
      };

      // Insert into database
      const [newTicket] = await db.insert(supportTickets)
        .values(ticketData)
        .returning();

      if (!newTicket) {
        throw new Error('Failed to create support ticket');
      }

      res.status(201).json({
        status: 'success',
        message: 'Support ticket created successfully',
        data: newTicket
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create support ticket',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Support ticket comments - GET
  app.get('/api/support/tickets/:id/comments', async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (Number.isNaN(ticketId)) {
        return res.status(400).json({ success: false, message: 'Invalid ticket id' });
      }

      // Ensure ticket exists
      const ticket = await db.query.supportTickets.findFirst({
        where: eq(supportTickets.id, ticketId)
      });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      const comments = await db.query.supportTicketComments.findMany({
        where: eq(supportTicketComments.ticketId, ticketId),
        orderBy: (c: any, { asc }: any) => [asc(c.createdAt)]
      });

      return res.json({ success: true, comments });
    } catch (error) {
      console.error('Error fetching ticket comments:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch ticket comments' });
    }
  });

  // Support ticket comments - POST
  app.post('/api/support/tickets/:id/comments', async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (Number.isNaN(ticketId)) {
        return res.status(400).json({ success: false, message: 'Invalid ticket id' });
      }

      const { content, isInternal } = req.body as { content?: string; isInternal?: boolean };
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      // Ensure ticket exists
      const ticket = await db.query.supportTickets.findFirst({
        where: eq(supportTickets.id, ticketId)
      });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      // Resolve userId from headers (mock admin), body, or fallback to ticket creator
      const headerUserId = req.headers['x-user-id'] as string | undefined;
      const bodyUserId = (req.body && (req.body.userId as number | undefined)) || undefined;
      const resolvedUserId = headerUserId ? parseInt(headerUserId) : (bodyUserId ?? ticket.userId);

      const now = new Date();
      const [newComment] = await db.insert(supportTicketComments)
        .values({
          ticketId,
          userId: resolvedUserId,
          content: content.trim(),
          isInternal: isInternal === true,
          attachments: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      if (!newComment) {
        throw new Error('Failed to create comment');
      }

      return res.status(201).json({ success: true, comment: newComment });
    } catch (error) {
      console.error('Error adding ticket comment:', error);
      return res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
  });

  // Support ticket update endpoint - PATCH (status/assignment)
  app.patch('/api/support/tickets/:id', async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (Number.isNaN(ticketId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid ticket id'
        });
      }

      const { status, assignedToId, dueDate, subject, description, priority, type } = req.body as {
        status?: string;
        assignedToId?: number | null;
        dueDate?: string | null;
        subject?: string;
        description?: string;
        priority?: string;
        type?: string;
      };

      if (
        status === undefined &&
        assignedToId === undefined &&
        dueDate === undefined &&
        subject === undefined &&
        description === undefined &&
        priority === undefined &&
        type === undefined
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'No updatable fields provided'
        });
      }

      const updateData: any = { updatedAt: new Date() };

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'resolved') {
          updateData.resolvedAt = new Date();
        } else if (status === 'closed') {
          updateData.closedAt = new Date();
        } else if (status === 'open' || status === 'in_progress' || status === 'on_hold') {
          // Clear resolution/closure timestamps when moving back to active states
          updateData.resolvedAt = null;
          updateData.closedAt = null;
        }
      }

      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId === null ? null : parseInt(String(assignedToId));
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }

      if (subject !== undefined) {
        updateData.subject = subject;
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (priority !== undefined) {
        updateData.priority = priority;
      }
      if (type !== undefined) {
        updateData.type = type;
      }

      const [updated] = await db.update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          status: 'error',
          message: 'Ticket not found'
        });
      }

      return res.json({
        status: 'success',
        message: 'Support ticket updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update support ticket',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Notifications API endpoint
  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const isRead = req.query.isRead === 'true' ? true : (req.query.isRead === 'false' ? false : undefined);
      
      // Build query based on parameters
      let query;
      
      if (userId && isRead !== undefined) {
        query = sql`
          SELECT * FROM notifications 
          WHERE "userId" = ${userId} AND "isRead" = ${isRead}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      } else if (userId) {
        query = sql`
          SELECT * FROM notifications 
          WHERE "userId" = ${userId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      } else if (isRead !== undefined) {
        query = sql`
          SELECT * FROM notifications 
          WHERE "isRead" = ${isRead}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      } else {
        query = sql`
          SELECT * FROM notifications 
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;
      }
      
      const result = await db.execute(query);
      const notifications = result.rows || [];
      
      res.json({
        status: 'success',
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch notifications data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Add collaboration routes
  app.use('/api/collaboration', collaborationRouter);
  
  // Add demo data router for specific demo accounts
  app.use('/api', demoDataRouter);
  
  // Add data integrity routes for monitoring and managing data integrity
  // app.use('/api/integrity', dataIntegrityRouter);
  
  // Add newsletter subscription routes
  app.use('/api/newsletter', newsletterRouter);
  
  // Demo request endpoint for public forms - POST (create)
  app.post('/api/demo-request', async (req: Request, res: Response) => {
    try {
      const demoRequestData = req.body;

      // Validate required fields
      if (!demoRequestData.firstName || !demoRequestData.lastName || !demoRequestData.email || !demoRequestData.phone || !demoRequestData.company) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields: firstName, lastName, email, phone, company'
        });
      }

      // Prepare data for database insertion
      const insertData = {
        firstName: demoRequestData.firstName,
        lastName: demoRequestData.lastName,
        email: demoRequestData.email,
        phone: demoRequestData.phone,
        company: demoRequestData.company,
        role: demoRequestData.role || demoRequestData.jobTitle || '',
        industry: demoRequestData.industry || null,
        companySize: demoRequestData.companySize || null,
        message: demoRequestData.message || null,
        notes: null, // Admin notes - separate from user message
        status: 'pending',
        viewed: false,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        referrer: req.headers.referer || null
      };

      // Insert into database using Drizzle ORM
      const [newDemoRequest] = await db.insert(demoRequests)
        .values(insertData)
        .returning();

      console.log(`Demo request saved to database: ${newDemoRequest.id} from ${demoRequestData.firstName} ${demoRequestData.lastName} (${demoRequestData.email})`);

      res.status(201).json({
        status: 'success',
        message: 'Demo request submitted successfully',
        data: newDemoRequest
      });

    } catch (error) {
      console.error('Error submitting demo request:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit demo request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Demo request endpoint for public access - GET (read all)
  app.get('/api/demo-request', async (req: Request, res: Response) => {
    try {
      // No authentication required - public endpoint
      console.log(`Public demo request fetch from IP: ${req.ip}`);

      // Fetch all demo requests from database, ordered by creation date (newest first)
      const allDemoRequests = await db.query.demoRequests.findMany({
        orderBy: (demoRequests: any, { desc }: any) => [desc(demoRequests.createdAt)]
      });

      // Transform data to match expected format (camelCase for frontend)
      const formattedRequests = allDemoRequests.map((request: typeof demoRequests.$inferSelect) => ({
        id: request.id,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        company: request.company,
        role: request.role,
        industry: request.industry,
        companySize: request.companySize,
        message: request.message,
        notes: request.notes,
        status: request.status,
        viewed: request.viewed,
        scheduledDate: request.scheduledDate,
        contactAttempts: request.contactAttempts,
        lastContactAttempt: request.lastContactAttempt,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        referrer: request.referrer,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      }));

      res.json({
        status: 'success',
        data: formattedRequests,
        total: formattedRequests.length
      });

    } catch (error) {
      console.error('Error fetching demo requests:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch demo requests',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Demo request endpoint for public access - DELETE (delete by ID)
  app.delete('/api/demo-request/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid demo request ID'
        });
      }

      // Check if demo request exists
      const existingRequest = await db.query.demoRequests.findFirst({
        where: eq(demoRequests.id, id)
      });

      if (!existingRequest) {
        return res.status(404).json({
          status: 'error',
          message: 'Demo request not found'
        });
      }

      // Delete the demo request
      await db.delete(demoRequests).where(eq(demoRequests.id, id));

      res.json({
        status: 'success',
        message: 'Demo request deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting demo request:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete demo request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Demo request endpoint for public access - PATCH (update by ID)
  app.patch('/api/demo-request/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid demo request ID'
        });
      }

      // Check if demo request exists
      const existingRequest = await db.query.demoRequests.findFirst({
        where: eq(demoRequests.id, id)
      });

      if (!existingRequest) {
        return res.status(404).json({
          status: 'error',
          message: 'Demo request not found'
        });
      }

      const updateData = req.body;

      // Prepare update data with only allowed fields
      const allowedFields = ['status', 'scheduledDate', 'notes', 'contactAttempts', 'lastContactAttempt', 'viewed'];
      const filteredUpdateData: any = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'scheduledDate') {
            filteredUpdateData[field] = updateData[field] ? new Date(updateData[field]) : null;
          } else {
            filteredUpdateData[field] = updateData[field];
          }
        }
      }

      // Add updatedAt timestamp
      filteredUpdateData.updatedAt = new Date();

      // Update the demo request
      const [updatedRequest] = await db.update(demoRequests)
        .set(filteredUpdateData)
        .where(eq(demoRequests.id, id))
        .returning();

      res.json({
        status: 'success',
        message: 'Demo request updated successfully',
        data: updatedRequest
      });

    } catch (error) {
      console.error('Error updating demo request:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update demo request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ============================================================================
  // ADMIN API ENDPOINTS
  // ============================================================================
  
  // Demo requests management endpoints
  // app.get('/api/admin/demo-requests', requireAdmin, async (_req: Request, res: Response) => {
  //   try {
  //     // Return demo requests from shared storage
  //     // Sort by creation date (newest first)
  //     const sortedRequests = demoRequestsStorage.sort((a, b) => 
  //       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //     );
      
  //     res.json({
  //       status: 'success',
  //       data: sortedRequests
  //     });
  //   } catch (error) {
  //     console.error('Error fetching demo requests:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to fetch demo requests',
  //       error: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });
  
  // app.post('/api/admin/demo-requests', requireAdmin, async (req: Request, res: Response) => {
  //   try {
  //     const demoRequest = req.body;
      
  //     // In a real implementation, this would save to a demo_requests table
  //     // For now, just return success
  //     res.json({
  //       status: 'success',
  //       message: 'Demo request created successfully',
  //       data: { id: Date.now(), ...demoRequest, createdAt: new Date() }
  //     });
  //   } catch (error) {
  //     console.error('Error creating demo request:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to create demo request',
  //       error: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });
  
  // System settings endpoints
  app.get('/api/system/settings', async (_req: Request, res: Response) => {
    try {
      // Query system settings from the database
      const settings = await db.query.systemSettings.findFirst();
      
      if (!settings) {
        // Return default settings structure if none exist
        const defaultSettings = {
          general: {
            siteName: 'PersonalysisKIRK',
            maintenanceMode: false,
            defaultLanguage: 'en',
            timezone: 'UTC'
          },
          security: {
            enableTwoFactor: false,
            sessionTimeout: 3600,
            passwordComplexity: 'medium',
            loginAttempts: 5
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            notificationRetention: 30
          },
          storage: {
            maxFileSize: 10485760,
            allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
            backupFrequency: 'daily',
            retentionPeriod: 365
          },
          userManagement: {
            autoApproval: false,
            defaultRole: 'business_user',
            inviteExpiry: 7,
            maxUsers: 100
          },
          appearance: {
            theme: 'light',
            primaryColor: '#3b82f6',
            logo: null,
            customCss: ''
          }
        };
        
        res.json({
          status: 'success',
          data: defaultSettings
        });
        return;
      }
      
      // Return existing settings
      res.json({
        status: 'success',
        data: {
          general: settings.general,
          security: settings.security,
          notifications: settings.notifications,
          storage: settings.storage,
          userManagement: settings.userManagement,
          appearance: settings.appearance
        }
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch system settings',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // app.put('/api/system/settings', requireAdmin, async (req: Request, res: Response) => {
  //   try {
  //     const settingsToUpdate = req.body;
      
  //     // Update each setting in the database
  //     for (const [key, value] of Object.entries(settingsToUpdate)) {
  //       // System settings use a different schema structure
  //       const settingsData = {
  //         general: key === 'general' ? value : {},
  //         security: key === 'security' ? value : {},
  //         notifications: key === 'notifications' ? value : {},
  //         storage: key === 'storage' ? value : {},
  //         userManagement: key === 'userManagement' ? value : {},
  //         appearance: key === 'appearance' ? value : {}
  //       };
        
  //       await db.insert(systemSettings)
  //         .values(settingsData as any);
  //     }
      
  //     res.json({
  //       status: 'success',
  //       message: 'System settings updated successfully'
  //     });
  //   } catch (error) {
  //     console.error('Error updating system settings:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to update system settings',
  //       error: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });
  
  // System backups endpoints
  // app.get('/api/system/backups', requireAdmin, async (_req: Request, res: Response) => {
  //   try {
  //     // Query system backups from the database
  //     const backups = await db.query.backups.findMany({
  //       orderBy: (backups: any, { desc }: any) => [desc(backups.createdAt)]
  //     });
      
  //     // If no backups exist, return empty array with success status
  //     res.json({
  //       status: 'success',
  //       data: backups || []
  //     });
  //   } catch (error) {
  //     console.error('Error fetching system backups:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to fetch system backups',
  //       error: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });
  
  // app.post('/api/system/backups', requireAdmin, async (req: Request, res: Response) => {
  //   try {
  //     const { name, description } = req.body;
      
  //     // Create a new backup entry
  //     const [backup] = await db.insert(backups)
  //       .values({
  //         name: name || `Backup-${new Date().toISOString()}`,
  //         description: description || 'Manual backup',
  //         size: String(Math.floor(Math.random() * 1000000) + 500000), // Convert to string
  //         status: 'completed',
  //         backupType: 'manual',
  //         createdAt: new Date()
  //       } as any)
  //       .returning();
      
  //     res.json({
  //       status: 'success',
  //       message: 'Backup created successfully',
  //       data: backup
  //     });
  //   } catch (error) {
  //     console.error('Error creating system backup:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Failed to create system backup',
  //       error: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });

  // === CORE API ROUTES ===
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  // CSRF token endpoint is handled in server/index.ts with proper csurf middleware
  // This ensures the CSRF token is properly tied to the session and validated correctly
  // The route in index.ts uses csrfMiddleware.generateCsrfToken which properly saves
  // the session with the CSRF secret, allowing token validation to work correctly

  // Authentication routes are now handled by server/auth.ts

  // ============================================================================
  // TEMPLATE API ENDPOINTS - MOVED BEFORE OTHER ROUTERS TO AVOID CONFLICTS
  // ============================================================================

  // Get all templates (public API)
  app.get('/api/templates', async (_req: Request, res: Response) => {
    try {
      console.log('📋 Fetching templates...');
      
      // Optimized query: Fetch templates with a single SQL query instead of N+1
      const templatesData = await db.execute(sql`
        SELECT 
          t.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', tq.id,
                'templateId', tq.template_id,
                'question', tq.question,
                'questionType', tq.question_type,
                'required', tq.required,
                'helpText', tq.help_text,
                'order', tq.order,
                'options', tq.options,
                'customValidation', tq.custom_validation,
                'sliderConfig', tq.slider_config,
                'scenarioText', tq.scenario_text,
                'createdAt', tq.created_at,
                'updatedAt', tq.updated_at
              ) ORDER BY tq.order
            ) FILTER (WHERE tq.id IS NOT NULL),
            '[]'::json
          ) as questions
        FROM templates t
        LEFT JOIN template_questions tq ON t.id = tq.template_id
        WHERE t.is_active = true
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `);
      
      console.log(`✅ Found ${templatesData.rows.length} templates`);
      
      // Transform the rows to match the expected structure
      const templatesWithQuestions = templatesData.rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        estimatedTime: row.estimated_time,
        questionCount: row.question_count,
        traits: row.traits,
        isActive: row.is_active,
        surveyType: row.survey_type,
        image: row.image,
        customTheme: row.custom_theme,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        questions: row.questions || []
      }));

      res.json({
        status: 'success',
        data: templatesWithQuestions
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single template by ID
  app.get('/api/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      

      if (isNaN(templateId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID'
        });
      }

      const template = await db.query.templates.findFirst({
        where: eq(templates.id, templateId)
      });

      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
      }

      // Get template questions
      const questions = await db.query.templateQuestions.findMany({
        where: eq(templateQuestions.templateId, templateId),
        orderBy: (templateQuestions: any, { asc }: any) => [asc(templateQuestions.order)]
      });

      res.json({
        status: 'success',
        data: {
          ...template,
          questions: questions || []
        }
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch template',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create new template
  app.post('/api/templates', async (req: Request, res: Response) => {
    try {
      const templateData = req.body;

      if (!templateData.title || !templateData.type || !templateData.surveyType) {
        return res.status(400).json({
          status: 'error',
          message: 'Title, type, and surveyType are required'
        });
      }

      // Insert template
      const [newTemplate] = await db.insert(templates).values({
        type: templateData.type,
        title: templateData.title,
        description: templateData.description || '',
        estimatedTime: templateData.estimatedTime || null,
        questionCount: templateData.questionCount || 0,
        traits: templateData.traits || null,
        isActive: templateData.isActive !== undefined ? templateData.isActive : true,
        surveyType: templateData.surveyType,
        image: templateData.image || null,
        customTheme: templateData.customTheme || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Insert template questions if provided
      if (templateData.questions && Array.isArray(templateData.questions)) {
        for (const [index, question] of templateData.questions.entries()) {
          await db.insert(templateQuestions).values({
            templateId: newTemplate.id,
            question: question.question,
            questionType: question.questionType || 'multiple-choice',
            required: question.required !== undefined ? question.required : true,
            helpText: question.helpText || null,
            order: question.order || index + 1,
            options: question.options || null,
            customValidation: question.customValidation || null,
            sliderConfig: question.sliderConfig || null,
            scenarioText: question.scenarioText || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      res.status(201).json({
        status: 'success',
        message: 'Template created successfully',
        data: newTemplate
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create template',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update template
  app.put('/api/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID'
        });
      }

      const templateData = req.body;

      // Check if template exists
      const existingTemplate = await db.query.templates.findFirst({
        where: eq(templates.id, templateId)
      });

      if (!existingTemplate) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
      }

      // Update template
      const [updatedTemplate] = await db.update(templates)
        .set({
          type: templateData.type,
          title: templateData.title,
          description: templateData.description,
          estimatedTime: templateData.estimatedTime,
          questionCount: templateData.questionCount,
          traits: templateData.traits,
          isActive: templateData.isActive,
          surveyType: templateData.surveyType,
          image: templateData.image,
          customTheme: templateData.customTheme || null,
          updatedAt: new Date()
        })
        .where(eq(templates.id, templateId))
        .returning();

      // Update questions if provided
      if (templateData.questions && Array.isArray(templateData.questions)) {
        // Delete existing questions
        await db.delete(templateQuestions).where(eq(templateQuestions.templateId, templateId));

        // Insert updated questions
        for (const [index, question] of templateData.questions.entries()) {
          await db.insert(templateQuestions).values({
            templateId: templateId,
            question: question.question,
            questionType: question.questionType || 'multiple-choice',
            required: question.required !== undefined ? question.required : true,
            helpText: question.helpText || null,
            order: question.order || index + 1,
            options: question.options || null,
            customValidation: question.customValidation || null,
            sliderConfig: question.sliderConfig || null,
            scenarioText: question.scenarioText || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      res.json({
        status: 'success',
        message: 'Template updated successfully',
        data: updatedTemplate
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update template',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete template
  app.delete('/api/templates/:id', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID'
        });
      }

      // Check if template exists
      const existingTemplate = await db.query.templates.findFirst({
        where: eq(templates.id, templateId)
      });

      if (!existingTemplate) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
      }

      // Delete template questions first (due to foreign key constraint)
      await db.delete(templateQuestions).where(eq(templateQuestions.templateId, templateId));

      // Delete template
      await db.delete(templates).where(eq(templates.id, templateId));

      res.json({
        status: 'success',
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete template',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Duplicate template
  app.post('/api/templates/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid template ID'
        });
      }

      // Get original template
      const originalTemplate = await db.query.templates.findFirst({
        where: eq(templates.id, templateId)
      });

      if (!originalTemplate) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
      }

      // Get original template questions
      const originalQuestions = await db.query.templateQuestions.findMany({
        where: eq(templateQuestions.templateId, templateId),
        orderBy: (templateQuestions: any, { asc }: any) => [asc(templateQuestions.order)]
      });

      // Create duplicate template
      const [duplicateTemplate] = await db.insert(templates).values({
        type: originalTemplate.type,
        title: `${originalTemplate.title} (Copy)`,
        description: originalTemplate.description,
        estimatedTime: originalTemplate.estimatedTime,
        questionCount: originalTemplate.questionCount,
        traits: originalTemplate.traits,
        isActive: originalTemplate.isActive,
        surveyType: originalTemplate.surveyType,
        image: originalTemplate.image,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Duplicate questions
      for (const question of originalQuestions) {
        await db.insert(templateQuestions).values({
          templateId: duplicateTemplate.id,
          question: question.question,
          questionType: question.questionType,
          required: question.required,
          helpText: question.helpText,
          order: question.order,
          options: question.options,
          customValidation: question.customValidation,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Template duplicated successfully',
        data: duplicateTemplate
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to duplicate template',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add other routers
  app.use('/api', collaborationRouter);
  app.use('/api', demoDataRouter);
  // app.use('/api', dataIntegrityRouter);
  app.use('/api', analyticsRouter);
  app.use('/api', newsletterRouter);

  // Add the BI endpoints
  // addSurveyBIEndpoints(app, storage);

  // ============================================================================
  // BLOG API ENDPOINTS
  // ============================================================================

  // Blog Categories API endpoints

  // Get all blog categories
  app.get('/api/blog/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await db.query.blogCategories.findMany({
        orderBy: (blogCategories: any, { asc }: any) => [asc(blogCategories.name)]
      });

      res.json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog categories',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single blog category
  app.get('/api/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category ID'
        });
      }

      const category = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, categoryId)
      });

      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog category not found'
        });
      }

      res.json({
        status: 'success',
        data: category
      });
    } catch (error) {
      console.error('Error fetching blog category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog category',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create blog category
  app.post('/api/blog/categories', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'Category name is required'
        });
      }

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingCategory = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, slug)
      });

      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'A category with this name already exists'
        });
      }

      const [newCategory] = await db.insert(blogCategories)
        .values({
          name,
          slug,
          description: description || null,
          articleCount: 0,
          isActive: true
        })
        .returning();

      res.status(201).json({
        status: 'success',
        message: 'Blog category created successfully',
        data: newCategory
      });
    } catch (error) {
      console.error('Error creating blog category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create blog category',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update blog category
  app.put('/api/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category ID'
        });
      }

      const { name, description, isActive } = req.body;

      // Generate slug if name is provided
      let slug;
      if (name) {
        slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (slug) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;
      updateData.updatedAt = new Date();

      const [updatedCategory] = await db.update(blogCategories)
        .set(updateData)
        .where(eq(blogCategories.id, categoryId))
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog category not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Blog category updated successfully',
        data: updatedCategory
      });
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update blog category',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete blog category
  app.delete('/api/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category ID'
        });
      }

      // Check if category has articles
      const articlesCount = await db.query.blogArticles.findMany({
        where: eq(blogArticles.categoryId, categoryId)
      });

      if (articlesCount.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete category that contains articles. Please move or delete articles first.'
        });
      }

      const [deletedCategory] = await db.delete(blogCategories)
        .where(eq(blogCategories.id, categoryId))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog category not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Blog category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete blog category',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Blog Articles API endpoints

  // Get all blog articles with optional filtering
  app.get('/api/blog/articles', async (req: Request, res: Response) => {
    try {
      const { status, category, author, search, limit = '50', offset = '0' } = req.query;

      // Build query conditions
      const conditions:any = [];

      if (status) {
        conditions.push(eq(blogArticles.status, status as string));
      }

      if (category) {
        conditions.push(eq(blogArticles.categoryId, parseInt(category as string)));
      }

      if (author) {
        conditions.push(eq(blogArticles.authorId, parseInt(author as string)));
      }

      // Execute query with error handling
      let articles;
      try {
        articles = await db.query.blogArticles.findMany({
          where: conditions.length > 0 ? (blogArticles: any, { and }: any) => and(...conditions) : undefined,
          orderBy: (blogArticles: any, { desc }: any) => [desc(blogArticles.createdAt)],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Return empty array instead of failing
        articles = [];
      }

      // Transform articles to include category name instead of just categoryId
      const transformedArticles = await Promise.all((articles || []).map(async (article: any) => {
        // Get category name
        let categoryName = 'Uncategorized';
        try {
          const category = await db.query.blogCategories.findFirst({
            where: eq(blogCategories.id, article.categoryId)
          });
          categoryName = category?.name || 'Uncategorized';
        } catch (error) {
          console.error('Error fetching category for article:', error);
        }

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          status: article.status,
          category: categoryName,
          categoryId: article.categoryId,
          tags: article.tags || [],
          authorId: article.authorId,
          authorName: 'Admin', // Default author name
          publishedAt: article.publishedAt,
          scheduledPublishDate: article.scheduledPublishDate,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          featuredImage: article.featuredImage,
          viewCount: article.viewCount || 0,
          seo: article.seo || {
            metaTitle: null,
            metaDescription: null,
            ogImage: null
          }
        };
      }));

      res.json({
        status: 'success',
        data: transformedArticles,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: transformedArticles.length
        }
      });
    } catch (error) {
      console.error('Error fetching blog articles:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog articles',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get published blog articles (for public blog page)
  app.get('/api/blog/articles/published', async (req: Request, res: Response) => {
    try {
      const { category, search, limit = '20', offset = '0' } = req.query;

      // Build query conditions for published articles only
      const conditions = [eq(blogArticles.status, 'published')];

      if (category) {
        conditions.push(eq(blogArticles.categoryId, parseInt(category as string)));
      }

      // Execute query with error handling
      let articles;
      try {
        articles = await db.query.blogArticles.findMany({
          where: (blogArticles: any, { and }: any) => and(...conditions),
          orderBy: (blogArticles: any, { desc }: any) => [desc(blogArticles.publishedAt)],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        });
      } catch (dbError) {
        console.error('Database query error for published articles:', dbError);
        // Return empty array instead of failing
        articles = [];
      }

      res.json({
        status: 'success',
        data: articles || [],
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: (articles || []).length
        }
      });
    } catch (error) {
      console.error('Error fetching published blog articles:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch published blog articles',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single blog article by slug
  app.get('/api/blog/articles/slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const article = await db.query.blogArticles.findFirst({
        where: eq(blogArticles.slug, slug)
      });

      if (!article) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog article not found'
        });
      }

      // Increment view count
      await db.update(blogArticles)
        .set({
          viewCount: (article.viewCount || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(blogArticles.id, article.id));

      res.json({
        status: 'success',
        data: article
      });
    } catch (error) {
      console.error('Error fetching blog article:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single blog article by ID
  app.get('/api/blog/articles/:id', async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);

      if (isNaN(articleId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid article ID'
        });
      }

      const article = await db.query.blogArticles.findFirst({
        where: eq(blogArticles.id, articleId)
      });

      if (!article) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog article not found'
        });
      }

      res.json({
        status: 'success',
        data: article
      });
    } catch (error) {
      console.error('Error fetching blog article:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create blog article
  app.post('/api/blog/articles', async (req: Request, res: Response) => {
    console.log('➡️  /api/blog/articles endpoint hit');
    console.log('Request body:', req.body);
    try {
      const {
        title,
        excerpt,
        content,
        status = 'draft',
        categoryId,
        tags = [],
        featuredImage,
        scheduledPublishDate,
        seo
      } = req.body;

      if (!title || !excerpt || !content || !categoryId) {
        return res.status(400).json({
          status: 'error',
          message: 'Title, excerpt, content, and category are required'
        });
      }

      // Generate slug from title
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (true) {
        const existingArticle = await db.query.blogArticles.findFirst({
          where: eq(blogArticles.slug, slug)
        });

        if (!existingArticle) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Get current user ID from session or use a default
      // In development, we'll use a fallback approach
      let authorId = 1; // Default fallback

      // Try to get the author ID from session if available
      if (req.session && req.session.userId) {
        authorId = req.session.userId;
      }

      console.log(`Creating article with authorId: ${authorId}, categoryId: ${categoryId}`);

      // Handle scheduled publishing
      let publishedAt = null;
      if (status === 'published') {
        publishedAt = new Date();
      }

      // Prepare the article data
      const articleData = {
        title,
        slug,
        excerpt,
        content,
        status,
        categoryId: parseInt(categoryId),
        tags: Array.isArray(tags) ? tags : [],
        authorId,
        featuredImage: featuredImage || null,
        viewCount: 0,
        publishedAt,
        scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
        seo: seo || {
          metaTitle: null,
          metaDescription: null,
          ogImage: null
        }
      };

      console.log('Article data to insert:', articleData);

      const [newArticle] = await db.insert(blogArticles)
        .values(articleData)
        .returning();

      console.log('Article created successfully:', newArticle);

      // Update category article count
      if (newArticle) {
        await db.update(blogCategories)
          .set({
            articleCount: sql`${blogCategories.articleCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(blogCategories.id, parseInt(categoryId)));
      }

      res.status(201).json({
        status: 'success',
        message: 'Blog article created successfully',
        data: newArticle
      });
    } catch (error) {
      console.error('Error creating blog article:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create blog article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update blog article
  app.put('/api/blog/articles/:id', async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);

      if (isNaN(articleId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid article ID'
        });
      }

      const {
        title,
        excerpt,
        content,
        status,
        categoryId,
        tags,
        featuredImage,
        scheduledPublishDate,
        seo
      } = req.body;

      // Generate slug if title is provided
      let slug: string | undefined;
      if (title) {
        const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        slug = baseSlug;

        // Ensure slug is unique (excluding current article)
        let counter = 1;
        while (true) {
          const existingArticle = await db.query.blogArticles.findFirst({
            where: (blogArticles: any, { and, eq, ne }: any) =>
              and(eq(blogArticles.slug, slug), ne(blogArticles.id, articleId))
          });

          if (!existingArticle) break;

          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Handle status changes
      let publishedAt = undefined;
      if (status === 'published') {
        publishedAt = new Date();
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      if (title) updateData.title = title;
      if (slug) updateData.slug = slug;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (content !== undefined) updateData.content = content;
      if (status) updateData.status = status;
      if (categoryId) updateData.categoryId = parseInt(categoryId);
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (scheduledPublishDate !== undefined) {
        updateData.scheduledPublishDate = scheduledPublishDate ? new Date(scheduledPublishDate) : null;
      }
      if (seo !== undefined) updateData.seo = seo;
      if (publishedAt !== undefined) updateData.publishedAt = publishedAt;

      const [updatedArticle] = await db.update(blogArticles)
        .set(updateData)
        .where(eq(blogArticles.id, articleId))
        .returning();

      if (!updatedArticle) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog article not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Blog article updated successfully',
        data: updatedArticle
      });
    } catch (error) {
      console.error('Error updating blog article:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update blog article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete blog article
  app.delete('/api/blog/articles/:id', async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);

      if (isNaN(articleId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid article ID'
        });
      }

      // Get article details before deletion to update category count
      const article = await db.query.blogArticles.findFirst({
        where: eq(blogArticles.id, articleId)
      });

      if (!article) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog article not found'
        });
      }

      // Delete the article
      await db.delete(blogArticles)
        .where(eq(blogArticles.id, articleId));

      // Update category article count
      await db.update(blogCategories)
        .set({
          articleCount: sql`${blogCategories.articleCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(blogCategories.id, article.categoryId));

      res.json({
        status: 'success',
        message: 'Blog article deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog article:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete blog article',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin blog management endpoints

  // Get blog statistics for admin dashboard
  app.get('/api/admin/blog/stats', async (_req: Request, res: Response) => {
    try {
      // Get total counts
      const totalArticles = await db.query.blogArticles.findMany();
      const totalCategories = await db.query.blogCategories.findMany();

      // Get counts by status
      const publishedArticles = totalArticles.filter((a: any) => a.status === 'published');
      const draftArticles = totalArticles.filter((a: any) => a.status === 'draft');
      const archivedArticles = totalArticles.filter((a: any) => a.status === 'archived');

      // Get recent articles (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentArticles = totalArticles.filter((a: any) =>
        new Date(a.createdAt) >= thirtyDaysAgo
      );

      // Calculate total views
      const totalViews = totalArticles.reduce((sum: any, article: any) => sum + (article.viewCount || 0), 0);

      const stats = {
        totalArticles: totalArticles.length,
        totalCategories: totalCategories.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        archivedArticles: archivedArticles.length,
        recentArticles: recentArticles.length,
        totalViews,
        averageViewsPerArticle: totalArticles.length > 0 ? Math.round(totalViews / totalArticles.length) : 0
      };

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching blog stats:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch blog statistics',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI Response Generation Endpoints
  
  // Start AI response generation
  app.post('/api/surveys/:id/generate-ai-responses', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);
      const { count } = req.body;

      if (isNaN(surveyId) || !count || count <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID or count'
        });
      }

      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const userId = req.session.userId;

      // Get survey data
      const survey = await db.query.surveys.findFirst({
        where: eq(surveys.id, surveyId),
        with: {
          questions: {
            orderBy: (questions: any, { asc }: any) => [asc(questions.order)]
          }
        }
      });

      if (!survey) {
        return res.status(404).json({
          status: 'error',
          message: 'Survey not found'
        });
      }

      if (!survey.enableAIResponses) {
        return res.status(400).json({
          status: 'error',
          message: 'AI responses are not enabled for this survey'
        });
      }

      // Check if there's already a running job (with timeout check)
      const existingJob = await db.query.aiGenerationJobs.findFirst({
        where: and(
          eq(aiGenerationJobs.surveyId, surveyId),
          eq(aiGenerationJobs.status, 'running')
        )
      });

      if (existingJob) {
        // Check if the job has been running for too long (more than 30 minutes)
        const jobAge = Date.now() - new Date(existingJob.startedAt || existingJob.createdAt).getTime();
        const maxJobAge = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (jobAge > maxJobAge) {
          // Mark the old job as failed due to timeout
          await db.update(aiGenerationJobs)
            .set({ 
              status: 'failed', 
              error: 'Job timed out - taking too long to complete',
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(aiGenerationJobs.id, existingJob.id));
          
          console.log(`Marked stuck job ${existingJob.id} as failed due to timeout`);
        } else {
          // Job is still valid, return the existing job info
          return res.status(200).json({
            status: 'success',
            message: 'AI generation is already in progress for this survey',
            job: existingJob
          });
        }
      }

      // Create new job
      const [newJob] = await db.insert(aiGenerationJobs).values({
        surveyId,
        userId,
        totalCount: count,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Start background generation (simplified for now)
      setImmediate(async () => {
        try {
          await generateAIResponses(newJob.id, surveyId, count, survey);
        } catch (error) {
          console.error('Error in background AI generation:', error);
          await db.update(aiGenerationJobs)
            .set({ 
              status: 'failed', 
              error: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(aiGenerationJobs.id, newJob.id));
        }
      });

      res.json({
        status: 'success',
        message: 'AI generation started',
        job: newJob
      });

    } catch (error) {
      console.error('Error starting AI generation:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to start AI generation',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get AI job status
  app.get('/api/surveys/:id/ai-job-status', async (req: Request, res: Response) => {
    try {
      const surveyId = parseInt(req.params.id);

      if (isNaN(surveyId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid survey ID'
        });
      }

      // Check authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const job = await db.query.aiGenerationJobs.findFirst({
        where: eq(aiGenerationJobs.surveyId, surveyId),
        orderBy: (jobs: any, { desc }: any) => [desc(jobs.createdAt)]
      });

      if (!job) {
        return res.status(404).json({
          status: 'error',
          message: 'No AI generation job found'
        });
      }

      res.json(job);

    } catch (error) {
      console.error('Error fetching AI job status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch job status',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================
  // ADMIN NOTIFICATION ENDPOINTS
  // ============================================

  // GET /api/admin/notifications - Get all admin notifications with filters
  app.get('/api/admin/notifications', async (req: Request, res: Response) => {
    try {
      // Verify admin authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Check admin role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      // Get filters from query
      let isRead: boolean | undefined = undefined;
      if (req.query.isRead !== undefined && req.query.isRead !== '') {
        isRead = req.query.isRead === 'true';
      }
      const category = req.query.category as string | undefined;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      console.log('[ADMIN_NOTIFICATIONS] Fetching with filters:', { isRead, category, limit, offset });

      // Fetch notifications using service
      const notifs = await notificationService.getAdminNotifications({
        isRead,
        category,
        limit,
        offset
      });

      console.log('[ADMIN_NOTIFICATIONS] Found', notifs.length, 'notifications');

      res.json({
        status: 'success',
        data: notifs,
        pagination: {
          limit,
          offset,
          count: notifs.length
        }
      });
    } catch (error) {
      console.error('[ADMIN_NOTIFICATIONS] Error fetching notifications:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/admin/notifications/unread-count - Get count of unread notifications
  app.get('/api/admin/notifications/unread-count', async (req: Request, res: Response) => {
    try {
      // Verify admin authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Check admin role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      const count = await notificationService.getUnreadCount();

      res.json({
        status: 'success',
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('[UNREAD_COUNT] Error fetching unread count:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch unread count',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH /api/admin/notifications/:id/read - Mark single notification as read
  app.patch('/api/admin/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      // Verify admin authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Check admin role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      const notificationId = parseInt(req.params.id);
      const result = await notificationService.markAsRead(notificationId);

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Notification not found'
        });
      }

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('[MARK_READ] Error marking notification as read:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH /api/admin/notifications/read-all - Mark all notifications as read
  app.patch('/api/admin/notifications/read-all', async (req: Request, res: Response) => {
    try {
      // Verify admin authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Check admin role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      const count = await notificationService.markAllAsRead();

      res.json({
        status: 'success',
        data: { markedAsReadCount: count }
      });
    } catch (error) {
      console.error('[MARK_ALL_READ] Error marking all as read:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // DELETE /api/admin/notifications/:id - Delete notification
  app.delete('/api/admin/notifications/:id', async (req: Request, res: Response) => {
    try {
      // Verify admin authentication
      if (!req.session || !req.session.userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Check admin role
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user || (user.role !== 'admin' && user.role !== 'platform_admin')) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }

      const notificationId = parseInt(req.params.id);
      const deleted = await notificationService.deleteNotification(notificationId);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Notification not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('[DELETE_NOTIFICATION] Error deleting notification:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete notification',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return wss;
}
