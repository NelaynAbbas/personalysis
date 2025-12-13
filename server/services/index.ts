import { WebSocketServer } from 'ws';
import { cacheService } from './cacheService';
import { dbTriggerService } from './dbTriggerService';
import { queryBatcherService } from './queryBatcherService';

/**
 * Initialize all database integration services
 * @param wss WebSocket server instance for real-time updates
 */
export function initDatabaseServices(wss: WebSocketServer): void {
  // Configure query batcher
  queryBatcherService.configure({
    batchSize: 50,
    batchInterval: 100
  });
  
  // Initialize DB trigger service with WebSocket server
  dbTriggerService.initialize(wss);
  
  // Start listening for database changes
  dbTriggerService.startListening();
  
  console.log('All database services initialized');
}

export {
  cacheService,
  dbTriggerService,
  queryBatcherService
};