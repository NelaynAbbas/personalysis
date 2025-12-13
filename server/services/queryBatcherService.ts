import { db } from '../db';
import { SQL, sql } from 'drizzle-orm';

/**
 * Query Batcher Service
 * 
 * This service enables batching of database queries for optimized performance.
 * Instead of making many small queries, it batches them together to reduce 
 * database round-trips and improve overall application performance.
 */
class QueryBatcherService {
  private batchSize: number = 100;
  private queryQueue: Array<{
    query: SQL;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isBatchInProgress: boolean = false;
  private batchInterval: number = 50; // ms
  
  constructor() {
    console.log('Query batcher service initialized');
  }
  
  /**
   * Configure the batch size and interval
   */
  configure(options: { batchSize?: number; batchInterval?: number }): void {
    if (options.batchSize) {
      this.batchSize = options.batchSize;
    }
    
    if (options.batchInterval) {
      this.batchInterval = options.batchInterval;
    }
  }
  
  /**
   * Add a query to the batch queue and return a promise that resolves with the result
   */
  async addQuery<T>(query: SQL): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add the query to the queue
      this.queryQueue.push({
        query,
        resolve: (result) => resolve(result as T),
        reject
      });
      
      // Schedule processing if not already scheduled
      this.scheduleBatch();
    });
  }
  
  /**
   * Schedule batch processing if not already in progress
   */
  private scheduleBatch(): void {
    if (this.batchTimeout !== null || this.isBatchInProgress) {
      return;
    }
    
    // If we've reached batch size, process immediately
    if (this.queryQueue.length >= this.batchSize) {
      this.processBatch();
      return;
    }
    
    // Otherwise, set a timer
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processBatch();
    }, this.batchInterval);
  }
  
  /**
   * Process the current batch of queries
   */
  private async processBatch(): Promise<void> {
    if (this.queryQueue.length === 0 || this.isBatchInProgress) {
      return;
    }
    
    this.isBatchInProgress = true;
    
    // Get the current batch (up to batch size)
    const currentBatch = this.queryQueue.splice(0, this.batchSize);
    
    try {
      // For queries of the same type, we could optimize further by combining them
      // For now, we'll execute them in a transaction for atomicity
      await db.transaction(async (tx) => {
        for (const item of currentBatch) {
          try {
            const result = await tx.execute(item.query);
            item.resolve(result);
          } catch (error) {
            item.reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      });
    } catch (error) {
      // If the transaction fails, reject all queries
      for (const item of currentBatch) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.isBatchInProgress = false;
      
      // If there are more queries in the queue, process them
      if (this.queryQueue.length > 0) {
        this.scheduleBatch();
      }
    }
  }
  
  /**
   * Execute a batch operation on multiple records
   * This is optimized for bulk inserts, updates, or deletes
   */
  async batchOperation<T>(
    records: any[],
    operation: 'insert' | 'update' | 'delete',
    table: any,
    options?: { chunkSize?: number; updateFields?: string[] }
  ): Promise<T[]> {
    if (records.length === 0) {
      return [];
    }
    
    const chunkSize = options?.chunkSize || 100;
    const results: T[] = [];
    
    // Split records into chunks
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      
      try {
        let result;
        
        switch (operation) {
          case 'insert':
            result = await db.insert(table).values(chunk).returning();
            break;
          
          case 'update':
            if (!options?.updateFields || options.updateFields.length === 0) {
              throw new Error('Update fields must be specified for batch update');
            }
            
            // For batch updates, we'd need to create a complex query
            // This is a simplified placeholder
            throw new Error('Batch update not yet implemented');
          
          case 'delete':
            if (!('id' in chunk[0])) {
              throw new Error('Records must have an id field for batch delete');
            }
            
            const ids = chunk.map(record => record.id);
            result = await db.delete(table)
              .where(sql`id IN ${ids}`)
              .returning();
            break;
          
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        
        results.push(...result);
      } catch (error) {
        console.error(`Error in batch ${operation}:`, error);
        throw error;
      }
    }
    
    return results;
  }
}

// Create a singleton instance
export const queryBatcherService = new QueryBatcherService();