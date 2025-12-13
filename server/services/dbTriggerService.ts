import { WebSocketServer } from 'ws';
import { db } from '../db';
import { cacheService } from './cacheService';
import { sql } from 'drizzle-orm';
import { surveyResponses } from '../../shared/schema';

/**
 * Database Trigger Service
 * 
 * This service manages database triggers for real-time analytics updates.
 * It creates listeners for database events and broadcasts updates to connected WebSocket clients.
 */
class DbTriggerService {
  private wss: WebSocketServer | null = null;
  private isListening = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastProcessedId = 0;
  
  /**
   * Initialize the service with a WebSocket server
   */
  initialize(websocketServer: WebSocketServer): void {
    this.wss = websocketServer;
    console.log('Database trigger service initialized');
  }
  
  /**
   * Start listening for database changes
   */
  startListening(): void {
    if (this.isListening) {
      console.log('Database trigger service is already listening');
      return;
    }
    
    this.isListening = true;
    
    // Since Neon DB doesn't support native LISTEN/NOTIFY, we'll use polling
    // In production with a self-hosted Postgres, you'd use LISTEN/NOTIFY instead
    this.setupPolling();
    
    console.log('Database trigger service started listening for changes');
  }
  
  /**
   * Stop listening for database changes
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }
    
    this.isListening = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    console.log('Database trigger service stopped listening for changes');
  }
  
  /**
   * Setup polling for database changes
   * This is a fallback mechanism since Neon doesn't support LISTEN/NOTIFY
   */
  private setupPolling(): void {
    // Get the initial last ID
    this.getLastResponseId().then(id => {
      this.lastProcessedId = id || 0;
      
      // Poll every 5 seconds for new or updated responses
      this.pollInterval = setInterval(async () => {
        try {
          const newResponses = await this.checkForNewResponses();
          
          if (newResponses.length > 0) {
            // Process each new response
            for (const response of newResponses) {
              // Update the cache
              cacheService.cacheSurveyResponse(response);
              
              // Broadcast the update via WebSocket
              this.broadcastUpdate({
                type: 'surveyResponseUpdate',
                data: {
                  responseId: response.id,
                  companyId: response.companyId,
                  surveyId: response.surveyId,
                  timestamp: new Date().toISOString()
                }
              });
              
              // Invalidate related analytics caches
              cacheService.invalidateCompanyAnalytics(response.companyId);
              cacheService.invalidateSurveyAnalytics(response.surveyId);
            }
            
            // Update the last processed ID
            const maxId = Math.max(...newResponses.map(r => r.id));
            this.lastProcessedId = Math.max(this.lastProcessedId, maxId);
          }
        } catch (error) {
          console.error('Error polling for new survey responses:', error);
        }
      }, 5000);
    });
  }
  
  /**
   * Get the ID of the last survey response in the database
   */
  private async getLastResponseId(): Promise<number | null> {
    try {
      const result = await db.execute(
        sql`SELECT MAX(id) as max_id FROM ${surveyResponses}`
      );
      
      if (result.rows.length > 0 && result.rows[0].max_id) {
        return Number(result.rows[0].max_id);
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting last response ID:', error);
      return 0;
    }
  }
  
  /**
   * Check for new survey responses since the last processed ID
   */
  private async checkForNewResponses(): Promise<any[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM ${surveyResponses} 
            WHERE id > ${this.lastProcessedId}
            ORDER BY id ASC
            LIMIT 100`
      );
      
      return result.rows.map(row => ({
        ...row,
        id: Number(row.id),
        companyId: Number(row.companyId),
        surveyId: Number(row.surveyId)
      }));
    } catch (error) {
      console.error('Error checking for new responses:', error);
      return [];
    }
  }
  
  /**
   * Broadcast an update to all connected WebSocket clients
   */
  private broadcastUpdate(data: any): void {
    if (!this.wss) {
      console.warn('Cannot broadcast update: WebSocket server not initialized');
      return;
    }
    
    const message = JSON.stringify(data);
    
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

// Create a singleton instance
export const dbTriggerService = new DbTriggerService();