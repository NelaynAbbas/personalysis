/**
 * Data Integrity Module
 *
 * This module provides utilities for ensuring database integrity
 * through constraints, validation, and automatic repair functions.
 */

import { Pool } from '@neondatabase/serverless';
import { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { Logger } from './Logger';

const logger = new Logger('DataIntegrity');

// Define the type to match the database with client
type DbWithClient = NeonDatabase<typeof schema> & { $client: Pool };

/**
 * Execute a database operation within a transaction
 * @param db Database instance 
 * @param operation The operation to execute in the transaction
 */
export async function withTransaction<T>(
  db: DbWithClient,
  operation: (tx: DbWithClient) => Promise<T>
): Promise<T> {
  const client = await db.$client.connect();
  
  try {
    await client.query('BEGIN');
    const tx = drizzle(client, { schema }) as unknown as DbWithClient;
    const result = await operation(tx);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed', { error });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Define database constraints for various tables
 */
export const databaseConstraints = {
  users: {
    unique: ['username', 'email'],
    notNull: ['username', 'password', 'role'],
    format: {
      email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    }
  },
  companies: {
    unique: ['name', 'apiKey'],
    notNull: ['name', 'status'],
    foreignKeys: {
      // Example: ownerId references users.id
      ownerId: { table: 'users', field: 'id' }
    }
  },
  survey_responses: {
    notNull: ['companyId', 'surveyId', 'respondentId', 'status'],
    foreignKeys: {
      companyId: { table: 'companies', field: 'id' },
      surveyId: { table: 'surveys', field: 'id' }
    }
  },
  // Add more tables and their constraints as needed
};

/**
 * Get the tables defined in the schema
 */
export function getSchemaTables(): string[] {
  return Object.keys(schema)
    .filter(key => {
      const value = schema[key];
      // Filter actual table objects, not functions or other exports
      return typeof value === 'object' && value !== null && '$type' in value;
    });
}

/**
 * Get the column names for a specific table
 * @param tableName The name of the table
 */
export function getTableColumns(tableName: string): string[] {
  // @ts-ignore - We know this is a valid table from getSchemaTables()
  const table = schema[tableName];
  if (!table) return [];
  
  return Object.keys(table).filter(key => !key.startsWith('$'));
}

/**
 * Get foreign key relationships defined in the schema
 */
export function getSchemaRelationships(): Record<string, Record<string, { 
  table: string; 
  field: string;
}>> {
  const relationships: Record<string, Record<string, {
    table: string;
    field: string;
  }>> = {};
  
  // Extract relationships from the schema
  const tables = getSchemaTables();
  for (const tableName of tables) {
    // @ts-ignore - We know this is valid from getSchemaTables()
    const table = schema[tableName];
    const tableRelations: Record<string, { table: string; field: string }> = {};
    
    // Check for relations defined in the table
    for (const key in table) {
      if (key === '$relations') {
        // @ts-ignore - The structure here depends on Drizzle's internal format
        const relations = table.$relations;
        for (const relationKey in relations) {
          // @ts-ignore - We're traversing the internal structure
          const relation = relations[relationKey];
          const relatedTable = ''; // Need more complex extraction from the schema
          const relatedField = ''; // Need more complex extraction from the schema
          
          if (relatedTable && relatedField) {
            tableRelations[relationKey] = {
              table: relatedTable,
              field: relatedField
            };
          }
        }
      }
    }
    
    if (Object.keys(tableRelations).length > 0) {
      relationships[tableName] = tableRelations;
    }
  }
  
  // Merge with explicitly defined constraints
  for (const [tableName, constraints] of Object.entries(databaseConstraints)) {
    if (constraints.foreignKeys) {
      if (!relationships[tableName]) {
        relationships[tableName] = {};
      }
      
      Object.assign(relationships[tableName], constraints.foreignKeys);
    }
  }
  
  return relationships;
}

/**
 * Validate database constraints
 * @param db Database instance
 * @param reportOnly If true, only report violations without fixing them
 */
export async function validateDatabaseConstraints(
  db: DbWithClient,
  reportOnly: boolean = false
): Promise<any> {
  const results: Record<string, any> = {};
  
  try {
    // Check unique constraints
    const uniqueConstraintResults = await checkUniqueConstraints(db, reportOnly);
    results.uniqueConstraints = uniqueConstraintResults;
    
    // Check not null constraints
    const notNullConstraintResults = await checkNotNullConstraints(db, reportOnly);
    results.notNullConstraints = notNullConstraintResults;
    
    // Check foreign key constraints
    const foreignKeyResults = await checkForeignKeyConstraints(db, reportOnly);
    results.foreignKeys = foreignKeyResults;
    
    return results;
  } catch (error) {
    logger.error('Error validating database constraints', { error });
    throw error;
  }
}

/**
 * Check unique constraints across the database
 * @param db Database instance
 * @param reportOnly If true, only report violations without fixing them
 */
async function checkUniqueConstraints(
  db: DbWithClient,
  reportOnly: boolean = false
): Promise<any> {
  const results: Record<string, any> = {};
  
  for (const [tableName, constraints] of Object.entries(databaseConstraints)) {
    if (!constraints.unique || constraints.unique.length === 0) continue;
    
    const tableResults: Record<string, any> = {};
    
    for (const column of constraints.unique) {
      // Check for duplicates
      const query = `
        SELECT ${column}, COUNT(*) as count
        FROM ${tableName}
        GROUP BY ${column}
        HAVING COUNT(*) > 1
      `;
      
      const { rows } = await db.$client.query(query);
      
      if (rows.length > 0) {
        // Found duplicates
        const duplicates = rows.map(row => ({
          value: row[column],
          count: row.count
        }));
        
        tableResults[column] = {
          valid: false,
          duplicates,
          count: duplicates.length
        };
        
        if (!reportOnly) {
          // In a real implementation, we might implement deduplication logic here
          logger.warn(`Found duplicate values in ${tableName}.${column}`, {
            duplicates
          });
        }
      } else {
        tableResults[column] = { valid: true };
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Check not null constraints across the database
 * @param db Database instance
 * @param reportOnly If true, only report violations without fixing them
 */
async function checkNotNullConstraints(
  db: DbWithClient,
  reportOnly: boolean = false
): Promise<any> {
  const results: Record<string, any> = {};
  
  for (const [tableName, constraints] of Object.entries(databaseConstraints)) {
    if (!constraints.notNull || constraints.notNull.length === 0) continue;
    
    const tableResults: Record<string, any> = {};
    
    for (const column of constraints.notNull) {
      // Check for null values
      const query = `
        SELECT id, COUNT(*) as count
        FROM ${tableName}
        WHERE ${column} IS NULL
      `;
      
      const { rows } = await db.$client.query(query);
      const nullCount = rows[0]?.count || 0;
      
      if (nullCount > 0) {
        // Found null values
        tableResults[column] = {
          valid: false,
          nullCount
        };
        
        logger.warn(`Found ${nullCount} null values in ${tableName}.${column}`);
        
        if (!reportOnly) {
          // In a real implementation, we might implement null value handling here
          // For example, setting default values or deleting invalid rows
        }
      } else {
        tableResults[column] = { valid: true };
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Check foreign key constraints across the database
 * @param db Database instance
 * @param reportOnly If true, only report violations without fixing them
 */
async function checkForeignKeyConstraints(
  db: DbWithClient,
  reportOnly: boolean = false
): Promise<any> {
  const results: Record<string, any> = {};
  const relationships = getSchemaRelationships();
  
  for (const [tableName, relations] of Object.entries(relationships)) {
    const tableResults: Record<string, any> = {};
    
    for (const [column, relation] of Object.entries(relations)) {
      // Check for orphaned references
      const query = `
        SELECT a.id
        FROM ${tableName} a
        LEFT JOIN ${relation.table} b ON a.${column} = b.${relation.field}
        WHERE a.${column} IS NOT NULL AND b.${relation.field} IS NULL
      `;
      
      const { rows } = await db.$client.query(query);
      
      if (rows.length > 0) {
        // Found orphaned references
        const orphanedIds = rows.map(row => row.id);
        
        tableResults[column] = {
          valid: false,
          orphanedReferences: orphanedIds,
          count: orphanedIds.length
        };
        
        logger.warn(`Found ${orphanedIds.length} orphaned references in ${tableName}.${column}`, {
          sample: orphanedIds.slice(0, 5)
        });
        
        if (!reportOnly) {
          // In a real implementation, we might implement orphaned reference handling here
          // For example, setting references to null or deleting orphaned rows
        }
      } else {
        tableResults[column] = { valid: true };
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Repair constraint violations detected in the database
 * @param db Database instance
 */
export async function repairConstraintViolations(db: DbWithClient): Promise<any> {
  const results: Record<string, any> = {};
  
  try {
    // Fix not null constraint violations
    const notNullRepairResults = await repairNotNullConstraints(db);
    results.notNullConstraints = notNullRepairResults;
    
    // Clean orphaned references
    const orphanedReferencesResults = await cleanOrphanedReferences(db);
    results.orphanedReferences = orphanedReferencesResults;
    
    return results;
  } catch (error) {
    logger.error('Error repairing constraint violations', { error });
    throw error;
  }
}

/**
 * Repair not null constraint violations
 * @param db Database instance
 */
async function repairNotNullConstraints(db: DbWithClient): Promise<any> {
  const results: Record<string, any> = {};
  
  for (const [tableName, constraints] of Object.entries(databaseConstraints)) {
    if (!constraints.notNull || constraints.notNull.length === 0) continue;
    
    const tableResults: Record<string, any> = {};
    
    for (const column of constraints.notNull) {
      // Get default values for different column types
      let defaultValue: string | number | boolean;
      
      // Determine default value based on column type
      // This is a simplified example - in a real system we'd check the schema 
      // to determine appropriate default values
      const result = await db.$client.query(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, column]);
      
      const dataType = result.rows[0]?.data_type;
      
      switch (dataType) {
        case 'character varying':
        case 'text':
          defaultValue = '(unspecified)';
          break;
        case 'integer':
        case 'bigint':
        case 'numeric':
          defaultValue = 0;
          break;
        case 'boolean':
          defaultValue = false;
          break;
        case 'timestamp with time zone':
        case 'timestamp without time zone':
          defaultValue = 'NOW()';
          break;
        default:
          defaultValue = '(unspecified)';
      }
      
      // Update null values with default value
      const updateQuery = `
        UPDATE ${tableName}
        SET ${column} = $1
        WHERE ${column} IS NULL
      `;
      
      const { rowCount } = await db.$client.query(updateQuery, [defaultValue]);
      
      tableResults[column] = {
        updated: rowCount,
        defaultValue
      };
      
      if (rowCount > 0) {
        logger.info(`Updated ${rowCount} null values in ${tableName}.${column} with default value: ${defaultValue}`);
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Clean orphaned references (foreign key violations)
 * @param db Database instance
 */
async function cleanOrphanedReferences(db: DbWithClient): Promise<any> {
  const results: Record<string, any> = {};
  const relationships = getSchemaRelationships();
  
  for (const [tableName, relations] of Object.entries(relationships)) {
    const tableResults: Record<string, any> = {};
    
    for (const [column, relation] of Object.entries(relations)) {
      // Find orphaned references
      const query = `
        SELECT a.id
        FROM ${tableName} a
        LEFT JOIN ${relation.table} b ON a.${column} = b.${relation.field}
        WHERE a.${column} IS NOT NULL AND b.${relation.field} IS NULL
      `;
      
      const { rows } = await db.$client.query(query);
      
      if (rows.length > 0) {
        // Set orphaned references to NULL
        const updateQuery = `
          UPDATE ${tableName}
          SET ${column} = NULL
          WHERE id IN (${rows.map(row => row.id).join(',')})
        `;
        
        const { rowCount } = await db.$client.query(updateQuery);
        
        tableResults[column] = {
          orphanedReferences: rows.length,
          fixed: rowCount
        };
        
        logger.info(`Fixed ${rowCount} orphaned references in ${tableName}.${column}`);
      } else {
        tableResults[column] = { orphanedReferences: 0 };
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Enforce unique constraints by removing or merging duplicates
 * @param db Database instance
 */
export async function enforceUniqueConstraints(db: DbWithClient): Promise<any> {
  const results: Record<string, any> = {};
  
  for (const [tableName, constraints] of Object.entries(databaseConstraints)) {
    if (!constraints.unique || constraints.unique.length === 0) continue;
    
    const tableResults: Record<string, any> = {};
    
    for (const column of constraints.unique) {
      // Find duplicates
      const query = `
        SELECT ${column}, array_agg(id) as ids
        FROM ${tableName}
        GROUP BY ${column}
        HAVING COUNT(*) > 1
      `;
      
      const { rows } = await db.$client.query(query);
      
      if (rows.length > 0) {
        let deduplicatedCount = 0;
        
        // Process each set of duplicates
        for (const row of rows) {
          const ids = row.ids;
          // Keep the first one, mark the rest for removal
          const idToKeep = ids[0];
          const idsToRemove = ids.slice(1);
          
          // Delete duplicates
          const deleteQuery = `
            DELETE FROM ${tableName}
            WHERE id IN (${idsToRemove.join(',')})
          `;
          
          const { rowCount } = await db.$client.query(deleteQuery);
          deduplicatedCount += rowCount;
        }
        
        tableResults[column] = {
          duplicateSets: rows.length,
          deduplicatedCount
        };
        
        logger.info(`Removed ${deduplicatedCount} duplicate values from ${tableName}.${column}`);
      } else {
        tableResults[column] = { duplicateSets: 0 };
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Synchronize foreign keys to ensure referential integrity
 * @param db Database instance
 */
export async function syncForeignKeys(db: DbWithClient): Promise<any> {
  const results: Record<string, any> = {};
  const relationships = getSchemaRelationships();
  
  for (const [tableName, relations] of Object.entries(relationships)) {
    const tableResults: Record<string, any> = {};
    
    for (const [column, relation] of Object.entries(relations)) {
      // Clean orphaned references
      const query = `
        UPDATE ${tableName}
        SET ${column} = NULL
        WHERE ${column} IS NOT NULL AND 
        NOT EXISTS (
          SELECT 1 FROM ${relation.table} 
          WHERE ${relation.field} = ${tableName}.${column}
        )
      `;
      
      const { rowCount } = await db.$client.query(query);
      
      tableResults[column] = {
        orphanedReferencesFixed: rowCount
      };
      
      if (rowCount > 0) {
        logger.info(`Fixed ${rowCount} orphaned references in ${tableName}.${column}`);
      }
    }
    
    results[tableName] = tableResults;
  }
  
  return results;
}

/**
 * Create a database backup before making significant changes
 * @param db Database instance
 * @param backupName Optional name for the backup
 */
export async function createDatabaseBackup(
  db: DbWithClient, 
  backupName?: string
): Promise<any> {
  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    const name = backupName ? `${backupName}_${timestamp}` : `backup_${timestamp}`;
    
    // Get the tables
    const tables = await getSchemaTables();
    const backupData: Record<string, any[]> = {};
    
    // Extract data from each table
    for (const tableName of tables) {
      const { rows } = await db.$client.query(`SELECT * FROM ${tableName}`);
      backupData[tableName] = rows;
    }
    
    // Write backup to file
    const backupDir = './backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = `${backupDir}/${name}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    return {
      success: true,
      backup: {
        name,
        path: backupPath,
        tables: Object.keys(backupData),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Failed to create database backup', { error });
    throw error;
  }
}

// Add import for file system operations
import fs from 'fs';