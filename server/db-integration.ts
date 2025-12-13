/**
 * Database integration module
 * This file serves as the integration point for our database connection
 * and manages the replacement of in-memory storage with proper database storage
 */

import { dbStorage } from './database-storage';
import { db, sql } from './db';
import { storage } from './storage';

// Check the database connection
async function checkDatabaseConnection() {
  try {
    // Run a simple query to check if the database is connected
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('[Database] Connection successful, database time:', result[0]?.current_time);
    return true;
  } catch (error: any) {
    console.error('[Database] Connection error:', error?.message || 'Unknown error');
    return false;
  }
}

// Initialize the database integration
export async function initDatabaseIntegration() {
  console.log('[Database] Initializing database integration...');
  
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    console.error('[Database] Failed to connect to the database, using in-memory storage as fallback');
    return storage; // Return the in-memory storage as fallback
  }
  
  console.log('[Database] Connected successfully, using database storage for all operations');
  return dbStorage; // Return the database storage implementation
}

// Get the appropriate storage implementation
// This function should be used throughout the application instead of directly importing storage
export async function getStorage() {
  // For now, we'll keep it simple and just return the database storage
  // In the future, this could include more complex logic for failover or caching
  return dbStorage;
}

// Export the database storage instance directly for convenient access
export { dbStorage };