/**
 * Data Integrity Service
 * 
 * This is the main service that exposes all data integrity features to the application.
 * It combines database constraints, transaction handling, validation, migrations,
 * and data archiving utilities in a single interface.
 */

import { Pool } from '@neondatabase/serverless';
import { db } from '../db';
import { Logger } from './Logger';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createId } from '@paralleldrive/cuid2';
import { 
  validateDatabaseConstraints,
  repairConstraintViolations,
  enforceUniqueConstraints,
  syncForeignKeys
} from './dataIntegrity';
import {
  validateEntityData,
  getValidationSchemas
} from './dataValidation';

// Define __dirname for ES modules 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger('DataIntegrityService');

let constraintCheckScheduled = false;
let dataValidationScheduled = false;

/**
 * Initializes all data integrity services
 */
export async function initializeDataIntegrity(): Promise<void> {
  logger.info('Initializing data integrity service...');
  
  try {
    // Initialize data validation schemas
    await getValidationSchemas();
    
    // Schedule regular data integrity checks
    scheduleDataIntegrityChecks();
    
    logger.info('Data integrity service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize data integrity service', { error });
    throw error;
  }
}

/**
 * Schedule regular data integrity checks
 */
function scheduleDataIntegrityChecks(intervalHours: number = 24): void {
  if (!constraintCheckScheduled) {
    // Schedule database constraint checks
    const constraintCheckInterval = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    setInterval(async () => {
      logger.info('Running scheduled database constraint check');
      try {
        await validateDatabaseConstraints(db);
        logger.info('Scheduled constraint check completed successfully');
      } catch (error) {
        logger.error('Scheduled constraint check failed', { error });
      }
    }, constraintCheckInterval);
    
    constraintCheckScheduled = true;
  }
  
  if (!dataValidationScheduled) {
    // Schedule data validation at a different time to spread the load
    const dataValidationInterval = intervalHours * 60 * 60 * 1000;
    const initialDelay = 30 * 60 * 1000; // 30 minutes offset from constraint check
    
    setTimeout(() => {
      setInterval(async () => {
        logger.info('Running scheduled data validation');
        try {
          // Sample a subset of data for validation to reduce performance impact
          await DataIntegrityService.validateDatabaseData({ sampleSize: 100 });
          logger.info('Scheduled data validation completed successfully');
        } catch (error) {
          logger.error('Scheduled data validation failed', { error });
        }
      }, dataValidationInterval);
    }, initialDelay);
    
    dataValidationScheduled = true;
  }
}

/**
 * Gets the migration directory path
 */
function getMigrationsDir(): string {
  return path.join(process.cwd(), 'drizzle');
}

/**
 * Combines all data integrity utilities for export
 */
export const DataIntegrityService = {
  /**
   * Initialize data integrity services
   */
  initialize: async (): Promise<void> => {
    await initializeDataIntegrity();
  },
  
  /**
   * Execute a database operation within a transaction
   */
  withTransaction: async <T>(
    operation: (tx: DbWithClient) => Promise<T>
  ): Promise<T> => {
    return withTransaction(db, operation);
  },
  
  /**
   * Fix integrity issues 
   */
  fixIntegrityIssues: async (): Promise<any> => {
    return repairConstraintViolations(db);
  },
  /**
   * Get the current data integrity status
   */
  async getIntegrityStatus(): Promise<any> {
    try {
      // Check database constraints
      const constraintStatus = await validateDatabaseConstraints(db, true);
      
      // Get migration status
      const migrationStatus = await this.getMigrationStatus();
      
      // Get validation sample results
      const validationResults = await this.validateDatabaseData({ 
        sampleSize: 25 // Small sample for quick status check
      });
      
      return {
        constraintStatus,
        migrationStatus,
        validationResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get data integrity status', { error });
      throw error;
    }
  },
  
  /**
   * Fix detected data integrity issues
   */
  async fixDataIntegrityIssues(): Promise<any> {
    try {
      // Fix constraint violations
      const constraintRepairResults = await repairConstraintViolations(db);
      
      // Sync foreign keys
      const foreignKeyResults = await syncForeignKeys(db);
      
      // Enforce unique constraints
      const uniqueConstraintResults = await enforceUniqueConstraints(db);
      
      return {
        constraintRepairResults,
        foreignKeyResults,
        uniqueConstraintResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to fix data integrity issues', { error });
      throw error;
    }
  },
  
  /**
   * Archive old data based on policy
   */
  async archiveData(options: { 
    olderThanDays?: number;
    dataTypes?: string[];
  }): Promise<any> {
    const { olderThanDays = 365, dataTypes } = options;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const results: Record<string, any> = {};
      
      // Define archivable tables and their date fields
      const archivableTables: Record<string, string> = {
        survey_responses: 'createdAt',
        user_logins: 'loginTime',
        system_events: 'timestamp',
        api_requests: 'timestamp',
        error_logs: 'createdAt'
      };
      
      // Filter tables based on dataTypes parameter if provided
      const tablesToArchive = dataTypes 
        ? Object.keys(archivableTables).filter(table => dataTypes.includes(table))
        : Object.keys(archivableTables);
      
      for (const table of tablesToArchive) {
        const dateField = archivableTables[table];
        const archiveFilePath = path.join(
          process.cwd(), 
          'archives', 
          `${table}_${new Date().toISOString().split('T')[0]}.json`
        );
        
        // Ensure archives directory exists
        const archiveDir = path.dirname(archiveFilePath);
        if (!fs.existsSync(archiveDir)) {
          fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // Get data to archive
        const archiveQuery = `
          SELECT * FROM ${table} 
          WHERE ${dateField} < $1 
          LIMIT 10000
        `;
        
        // Use db.$client to access the pool
        const { rowCount, rows } = await db.$client.query(archiveQuery, [cutoffDate.toISOString()]);
        
        if (rowCount > 0 && rows.length > 0) {
          // Write data to archive file
          fs.writeFileSync(archiveFilePath, JSON.stringify(rows, null, 2));
          
          // Delete archived data
          const deleteQuery = `
            DELETE FROM ${table} 
            WHERE ${dateField} < $1 
            AND id IN (${rows.map(r => r.id).join(',')})
          `;
          
          const deleteResult = await db.$client.query(deleteQuery, [cutoffDate.toISOString()]);
          
          results[table] = {
            archivedCount: rowCount,
            deletedCount: deleteResult.rowCount,
            archiveFile: archiveFilePath
          };
        } else {
          results[table] = {
            archivedCount: 0,
            deletedCount: 0,
            message: 'No data to archive'
          };
        }
      }
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to archive data', { error });
      throw error;
    }
  },
  
  /**
   * Get status of migrations
   */
  async getMigrationStatus(): Promise<any> {
    try {
      const migrationsDir = getMigrationsDir();
      let pendingMigrations: string[] = [];
      let appliedMigrations: string[] = [];
      let lastRun: string | null = null;
      
      // Check if migrations directory exists
      if (!fs.existsSync(migrationsDir)) {
        return { pending: [], applied: [], lastRun: null };
      }
      
      // Get all migration files
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      // Check if drizzle_migrations table exists
      const { rows: tableExists } = await db.$client.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'drizzle_migrations'
        );
      `);
      
      if (tableExists[0].exists) {
        // Get applied migrations
        const { rows } = await db.$client.query(`
          SELECT migration_name, created_at
          FROM drizzle_migrations
          ORDER BY created_at DESC;
        `);
        
        appliedMigrations = rows.map(row => row.migration_name);
        lastRun = rows.length > 0 ? rows[0].created_at : null;
        
        // Determine pending migrations
        pendingMigrations = migrationFiles.filter(
          file => !appliedMigrations.includes(file)
        );
      } else {
        // No migrations have been applied yet
        pendingMigrations = migrationFiles;
      }
      
      return {
        pending: pendingMigrations,
        applied: appliedMigrations,
        lastRun
      };
    } catch (error) {
      logger.error('Failed to get migration status', { error });
      throw error;
    }
  },
  
  /**
   * Plan a migration for schema changes
   */
  async planMigration(options: {
    description: string;
    schemaChanges: any;
  }): Promise<any> {
    const { description, schemaChanges } = options;
    
    try {
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
      const slug = description
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      
      const fileName = `${timestamp}_${slug}.sql`;
      const migrationsDir = getMigrationsDir();
      
      // Ensure migrations directory exists
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
      
      // Generate SQL based on schema changes
      // This is a simplified example - in a real system this would use
      // a diff between the current and desired schema
      let sql = `-- Migration: ${description}\n-- Created at: ${new Date().toISOString()}\n\n`;
      
      // Add SQL statements based on schemaChanges object
      if (schemaChanges.addColumns) {
        for (const [table, columns] of Object.entries(schemaChanges.addColumns)) {
          for (const [column, details] of Object.entries(columns as Record<string, any>)) {
            sql += `ALTER TABLE ${table} ADD COLUMN ${column} ${details.type}`;
            
            if (details.notNull) {
              sql += ` NOT NULL`;
            }
            
            if (details.defaultValue !== undefined) {
              sql += ` DEFAULT ${details.defaultValue}`;
            }
            
            sql += `;\n`;
          }
        }
      }
      
      if (schemaChanges.dropColumns) {
        for (const [table, columns] of Object.entries(schemaChanges.dropColumns)) {
          for (const column of (columns as string[])) {
            sql += `ALTER TABLE ${table} DROP COLUMN ${column};\n`;
          }
        }
      }
      
      if (schemaChanges.alterColumns) {
        for (const [table, columns] of Object.entries(schemaChanges.alterColumns)) {
          for (const [column, details] of Object.entries(columns as Record<string, any>)) {
            if (details.type) {
              sql += `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${details.type}`;
              
              if (details.using) {
                sql += ` USING ${details.using}`;
              }
              
              sql += `;\n`;
            }
            
            if (details.setNotNull) {
              sql += `ALTER TABLE ${table} ALTER COLUMN ${column} SET NOT NULL;\n`;
            } else if (details.dropNotNull) {
              sql += `ALTER TABLE ${table} ALTER COLUMN ${column} DROP NOT NULL;\n`;
            }
            
            if (details.defaultValue !== undefined) {
              sql += `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${details.defaultValue};\n`;
            } else if (details.dropDefault) {
              sql += `ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT;\n`;
            }
          }
        }
      }
      
      if (schemaChanges.createTable) {
        for (const [table, tableDetails] of Object.entries(schemaChanges.createTable)) {
          const details = tableDetails as { 
            columns: Record<string, any>; 
            primaryKey?: string[];
            foreignKeys?: Record<string, { table: string; column: string; onDelete?: string }>;
          };
          
          sql += `CREATE TABLE ${table} (\n`;
          
          const columnDefinitions = Object.entries(details.columns).map(([column, columnDetails]) => {
            const colDetails = columnDetails as any;
            let def = `  ${column} ${colDetails.type}`;
            
            if (colDetails.notNull) {
              def += ` NOT NULL`;
            }
            
            if (colDetails.defaultValue !== undefined) {
              def += ` DEFAULT ${colDetails.defaultValue}`;
            }
            
            if (colDetails.unique) {
              def += ` UNIQUE`;
            }
            
            return def;
          });
          
          // Add primary key if specified
          if (details.primaryKey && details.primaryKey.length > 0) {
            columnDefinitions.push(`  PRIMARY KEY (${details.primaryKey.join(', ')})`);
          }
          
          // Add foreign keys if specified
          if (details.foreignKeys) {
            for (const [column, fkDetails] of Object.entries(details.foreignKeys)) {
              let fkDef = `  FOREIGN KEY (${column}) REFERENCES ${fkDetails.table}(${fkDetails.column})`;
              
              if (fkDetails.onDelete) {
                fkDef += ` ON DELETE ${fkDetails.onDelete}`;
              }
              
              columnDefinitions.push(fkDef);
            }
          }
          
          sql += columnDefinitions.join(',\n');
          sql += `\n);\n\n`;
        }
      }
      
      if (schemaChanges.dropTable) {
        for (const table of schemaChanges.dropTable) {
          sql += `DROP TABLE IF EXISTS ${table};\n`;
        }
      }
      
      // Write the migration file
      const migrationPath = path.join(migrationsDir, fileName);
      fs.writeFileSync(migrationPath, sql);
      
      return {
        fileName,
        path: migrationPath,
        sql
      };
    } catch (error) {
      logger.error('Failed to plan migration', { error });
      throw error;
    }
  },
  
  /**
   * Apply pending migrations
   */
  async applyMigrations(options: {
    migrationIds?: string[];
    applyAll?: boolean;
  }): Promise<any> {
    const { migrationIds, applyAll = false } = options;
    
    try {
      // Get migration status
      const { pending } = await this.getMigrationStatus();
      
      if (pending.length === 0) {
        return { message: 'No pending migrations to apply' };
      }
      
      // Determine which migrations to apply
      let migrationsToApply = [];
      
      if (applyAll) {
        migrationsToApply = pending;
      } else if (migrationIds && migrationIds.length > 0) {
        migrationsToApply = pending.filter(migration => 
          migrationIds.includes(migration));
      } else {
        return { message: 'No migrations selected to apply' };
      }
      
      if (migrationsToApply.length === 0) {
        return { message: 'No matching migrations found to apply' };
      }
      
      // Create migrations table if it doesn't exist
      await db.$client.query(`
        CREATE TABLE IF NOT EXISTS drizzle_migrations (
          id SERIAL PRIMARY KEY,
          migration_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      
      const migrationsDir = getMigrationsDir();
      const results = [];
      
      // Apply each migration in a transaction
      for (const migration of migrationsToApply) {
        const migrationPath = path.join(migrationsDir, migration);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration in a transaction
        const client = await db.$client.connect();
        try {
          await client.query('BEGIN');
          
          // Run the migration SQL
          await client.query(migrationSql);
          
          // Record the migration
          await client.query(
            'INSERT INTO drizzle_migrations (migration_name) VALUES ($1)',
            [migration]
          );
          
          await client.query('COMMIT');
          
          results.push({
            migration,
            status: 'success'
          });
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error(`Failed to apply migration ${migration}`, { error });
          
          results.push({
            migration,
            status: 'error',
            error: error.message
          });
          
          // Stop applying further migrations after an error
          break;
        } finally {
          client.release();
        }
      }
      
      return {
        applied: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      };
    } catch (error) {
      logger.error('Failed to apply migrations', { error });
      throw error;
    }
  },
  
  /**
   * Rollback the last migration batch
   */
  async rollbackLastMigration(): Promise<any> {
    try {
      // Check if drizzle_migrations table exists
      const { rows: tableExists } = await db.$client.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'drizzle_migrations'
        );
      `);
      
      if (!tableExists[0].exists) {
        return { message: 'No migrations to roll back' };
      }
      
      // Get the last batch of migrations
      const { rows: lastBatch } = await db.$client.query(`
        SELECT id, migration_name
        FROM drizzle_migrations
        ORDER BY created_at DESC
        LIMIT 1;
      `);
      
      if (lastBatch.length === 0) {
        return { message: 'No migrations to roll back' };
      }
      
      const lastMigration = lastBatch[0].migration_name;
      const migrationsDir = getMigrationsDir();
      const migrationPath = path.join(migrationsDir, lastMigration);
      
      // Check if rollback file exists
      const rollbackFileName = lastMigration.replace('.sql', '.down.sql');
      const rollbackPath = path.join(migrationsDir, rollbackFileName);
      
      if (!fs.existsSync(rollbackPath)) {
        return { 
          status: 'error', 
          message: `Rollback file ${rollbackFileName} not found` 
        };
      }
      
      const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');
      
      // Execute rollback in a transaction
      const client = await db.$client.connect();
      try {
        await client.query('BEGIN');
        
        // Run the rollback SQL
        await client.query(rollbackSql);
        
        // Remove the migration record
        await client.query(
          'DELETE FROM drizzle_migrations WHERE id = $1',
          [lastBatch[0].id]
        );
        
        await client.query('COMMIT');
        
        return {
          status: 'success',
          message: `Successfully rolled back migration ${lastMigration}`
        };
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Failed to roll back migration ${lastMigration}`, { error });
        
        return {
          status: 'error',
          message: `Failed to roll back migration: ${error.message}`
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to roll back migration', { error });
      throw error;
    }
  },
  
  /**
   * Check database constraints
   */
  async checkDatabaseConstraints(): Promise<any> {
    try {
      const results = await validateDatabaseConstraints(db);
      return results;
    } catch (error) {
      logger.error('Failed to check database constraints', { error });
      throw error;
    }
  },
  
  /**
   * Validate database data
   */
  async validateDatabaseData(options: {
    entities?: string[];
    sampleSize?: number;
  }): Promise<any> {
    const { entities, sampleSize = 100 } = options;
    
    try {
      const schemas = await getValidationSchemas();
      const results: Record<string, any> = {};
      
      // Determine which entities to validate
      const entitiesToValidate = entities || Object.keys(schemas);
      
      for (const entity of entitiesToValidate) {
        if (!schemas[entity]) {
          results[entity] = {
            status: 'skipped',
            message: 'No validation schema defined'
          };
          continue;
        }
        
        const validationResult = await validateEntityData(
          db, entity, schemas[entity], sampleSize
        );
        
        results[entity] = validationResult;
      }
      
      return {
        timestamp: new Date().toISOString(),
        results
      };
    } catch (error) {
      logger.error('Failed to validate database data', { error });
      throw error;
    }
  }
};