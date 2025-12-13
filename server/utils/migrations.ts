/**
 * Database Migration Planning & Management
 * 
 * This module provides utilities for planning and executing database migrations
 * in a safe, consistent manner with version tracking and rollback capabilities.
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { Logger } from './Logger';

const logger = new Logger('Migrations');

// Migration metadata schema for tracking applied migrations
export const migrations = pgTable('system_migrations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  version: text('version').notNull(),
  description: text('description').notNull(),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  createdBy: text('created_by'),
  batchId: integer('batch_id').notNull(),
  duration: integer('duration_ms'), // Duration in milliseconds
  status: text('status').notNull(), // 'pending', 'applied', 'failed', 'rolled_back'
  hasDownMigration: boolean('has_down_migration').default(false),
  error: text('error'),
  checksum: text('checksum').notNull(), // To verify migration file integrity
});

// Schema for migration file metadata
const migrationSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string().optional(),
  date: z.string(), // ISO format date
  
  // SQL to run for up migration
  up: z.string(),
  
  // SQL to run for down migration (rollback)
  down: z.string().optional(),
  
  // Tags for organizing and filtering migrations
  tags: z.array(z.string()).optional()
});

// Type definitions
type Migration = z.infer<typeof migrationSchema>;
type MigrationStatus = 'pending' | 'applied' | 'failed' | 'rolled_back';
type MigrationPlan = {
  migrationsToApply: Migration[];
  dryRun: boolean;
  batchId: number;
  rollbackOnError: boolean;
};

// Default migration directory
const DEFAULT_MIGRATION_DIR = path.join(__dirname, '../../migrations');

/**
 * Creates the migrations table if it doesn't exist
 */
export async function initializeMigrationsTable(): Promise<void> {
  logger.info('Initializing migrations tracking table');
  
  try {
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_migrations'
      );
    `);
    
    const exists = tableExists.rows?.[0]?.exists === true;
    
    if (!exists) {
      logger.info('Migrations table does not exist, creating it');
      
      // This would normally happen through Drizzle Kit
      // For this implementation, we'll just log that it would be created
      logger.info('Migration table creation would be handled by Drizzle Kit');
      
      // In practice, Drizzle would create the table based on the schema definition above
    } else {
      logger.info('Migrations table already exists');
    }
  } catch (error) {
    logger.error('Failed to initialize migrations table', error);
    throw error;
  }
}

/**
 * Loads migration files from the specified directory
 */
export function loadMigrations(directory: string = DEFAULT_MIGRATION_DIR): Migration[] {
  logger.info(`Loading migrations from ${directory}`);
  
  try {
    if (!fs.existsSync(directory)) {
      logger.info(`Migration directory does not exist, creating it`);
      fs.mkdirSync(directory, { recursive: true });
      return [];
    }
    
    const fileNames = fs.readdirSync(directory)
      .filter(file => file.endsWith('.json'))
      .sort(); // Sort alphabetically
    
    const migrations: Migration[] = [];
    
    for (const fileName of fileNames) {
      const filePath = path.join(directory, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const migrationData = JSON.parse(fileContent);
        const validatedMigration = migrationSchema.parse(migrationData);
        migrations.push(validatedMigration);
      } catch (error) {
        logger.error(`Invalid migration file: ${fileName}`, error);
      }
    }
    
    logger.info(`Loaded ${migrations.length} migrations`);
    return migrations;
  } catch (error) {
    logger.error(`Failed to load migrations from ${directory}`, error);
    throw error;
  }
}

/**
 * Gets the list of applied migrations from the database
 */
export async function getAppliedMigrations(): Promise<any[]> {
  try {
    const result = await db.select().from(migrations).orderBy(migrations.appliedAt);
    return result;
  } catch (error) {
    logger.error('Failed to get applied migrations', error);
    throw error;
  }
}

/**
 * Creates a new migration file
 */
export function createMigration(
  name: string,
  description: string,
  upSql: string,
  downSql?: string,
  version: string = new Date().toISOString().slice(0, 10),
  author: string = process.env.USER || 'system'
): string {
  logger.info(`Creating new migration: ${name}`);
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
  const fileName = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.json`;
  const filePath = path.join(DEFAULT_MIGRATION_DIR, fileName);
  
  const migration: Migration = {
    name,
    version,
    description,
    author,
    date: new Date().toISOString(),
    up: upSql,
    down: downSql,
    tags: []
  };
  
  try {
    if (!fs.existsSync(DEFAULT_MIGRATION_DIR)) {
      fs.mkdirSync(DEFAULT_MIGRATION_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(migration, null, 2));
    logger.info(`Migration file created at ${filePath}`);
    
    return filePath;
  } catch (error) {
    logger.error(`Failed to create migration file`, error);
    throw error;
  }
}

/**
 * Calculates checksum for a migration to ensure integrity
 */
function calculateChecksum(migration: Migration): string {
  // In a real implementation, this would use a cryptographic hash
  // For this example, we'll just use a simple string representation
  const content = JSON.stringify(migration);
  return Buffer.from(content).toString('base64');
}

/**
 * Creates a migration plan for pending migrations
 */
export async function createMigrationPlan(
  options: { dryRun?: boolean, rollbackOnError?: boolean } = {}
): Promise<MigrationPlan> {
  const { dryRun = false, rollbackOnError = true } = options;
  
  logger.info(`Creating migration plan (dryRun: ${dryRun}, rollbackOnError: ${rollbackOnError})`);
  
  // Load all migrations from files
  const allMigrations = loadMigrations();
  
  // Get applied migrations from database
  const appliedMigrations = await getAppliedMigrations();
  const appliedNames = new Set(appliedMigrations.map(m => m.name));
  
  // Find migrations that haven't been applied yet
  const pendingMigrations = allMigrations.filter(migration => !appliedNames.has(migration.name));
  
  // Get next batch ID
  const latestBatch = appliedMigrations.length > 0 
    ? Math.max(...appliedMigrations.map(m => m.batchId))
    : 0;
  const nextBatchId = latestBatch + 1;
  
  logger.info(`Found ${pendingMigrations.length} pending migrations for batch ${nextBatchId}`);
  
  return {
    migrationsToApply: pendingMigrations,
    dryRun,
    batchId: nextBatchId,
    rollbackOnError
  };
}

/**
 * Executes a migration plan
 */
export async function executeMigrationPlan(plan: MigrationPlan): Promise<any[]> {
  const { migrationsToApply, dryRun, batchId, rollbackOnError } = plan;
  
  logger.info(`Executing migration plan with ${migrationsToApply.length} migrations (batchId: ${batchId}, dryRun: ${dryRun})`);
  
  if (migrationsToApply.length === 0) {
    logger.info('No migrations to apply');
    return [];
  }
  
  const results = [];
  
  for (const migration of migrationsToApply) {
    logger.info(`Applying migration: ${migration.name}`);
    
    // Skip execution in dry run mode
    if (dryRun) {
      logger.info(`[DRY RUN] Would apply migration: ${migration.name}`);
      continue;
    }
    
    const startTime = Date.now();
    let status: MigrationStatus = 'pending';
    let error: string | null = null;
    
    try {
      // Begin a transaction
      await db.transaction(async (tx) => {
        // Execute the up migration SQL
        logger.debug(`Executing migration SQL for ${migration.name}`);
        await tx.execute(sql.raw(migration.up));
        
        // Record the migration in the migrations table
        const checksum = calculateChecksum(migration);
        
        await tx.insert(migrations).values({
          name: migration.name,
          version: migration.version,
          description: migration.description,
          createdBy: migration.author || 'system',
          batchId,
          status: 'applied',
          hasDownMigration: !!migration.down,
          duration: Date.now() - startTime,
          checksum
        });
      });
      
      status = 'applied';
      logger.info(`Migration ${migration.name} applied successfully`);
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to apply migration ${migration.name}`, err);
      
      // If configured to rollback on error, try to roll back the current batch
      if (rollbackOnError) {
        logger.info(`Rolling back batch ${batchId} due to error`);
        await rollbackMigrationBatch(batchId).catch(rollbackErr => {
          logger.error(`Failed to rollback batch ${batchId}`, rollbackErr);
        });
        
        // Re-throw the original error to indicate the migration failed
        throw err;
      }
    }
    
    results.push({
      name: migration.name,
      status,
      duration: Date.now() - startTime,
      error
    });
  }
  
  return results;
}

/**
 * Rolls back the last batch of migrations
 */
export async function rollbackLastBatch(): Promise<any[]> {
  logger.info('Rolling back last migration batch');
  
  // Find the latest batch ID
  const appliedMigrations = await getAppliedMigrations();
  
  if (appliedMigrations.length === 0) {
    logger.info('No migrations to roll back');
    return [];
  }
  
  const latestBatch = Math.max(...appliedMigrations.map(m => m.batchId));
  return rollbackMigrationBatch(latestBatch);
}

/**
 * Rolls back a specific batch of migrations
 */
export async function rollbackMigrationBatch(batchId: number): Promise<any[]> {
  logger.info(`Rolling back migration batch ${batchId}`);
  
  // Get migrations for this batch
  const batchMigrations = await db.select()
    .from(migrations)
    .where(sql`${migrations.batchId} = ${batchId}`)
    .orderBy(sql`${migrations.id} DESC`); // Roll back in reverse order
  
  if (batchMigrations.length === 0) {
    logger.info(`No migrations found for batch ${batchId}`);
    return [];
  }
  
  const results = [];
  
  // Load all migrations to get the down SQL
  const allMigrations = loadMigrations();
  const migrationMap = new Map<string, Migration>();
  
  allMigrations.forEach(migration => {
    migrationMap.set(migration.name, migration);
  });
  
  for (const dbMigration of batchMigrations) {
    logger.info(`Rolling back migration: ${dbMigration.name}`);
    
    const fileMigration = migrationMap.get(dbMigration.name);
    
    if (!fileMigration) {
      logger.error(`Migration file for ${dbMigration.name} not found`);
      continue;
    }
    
    if (!fileMigration.down) {
      logger.warn(`No down migration available for ${dbMigration.name}`);
      continue;
    }
    
    const startTime = Date.now();
    let status: MigrationStatus = 'pending';
    let error: string | null = null;
    
    try {
      // Begin a transaction
      await db.transaction(async (tx) => {
        // Execute the down migration SQL
        logger.debug(`Executing down migration SQL for ${dbMigration.name}`);
        await tx.execute(sql.raw(fileMigration.down!));
        
        // Update the migration record
        await tx.update(migrations)
          .set({
            status: 'rolled_back',
            duration: Date.now() - startTime
          })
          .where(sql`${migrations.id} = ${dbMigration.id}`);
      });
      
      status = 'rolled_back';
      logger.info(`Migration ${dbMigration.name} rolled back successfully`);
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to roll back migration ${dbMigration.name}`, err);
    }
    
    results.push({
      name: dbMigration.name,
      status,
      duration: Date.now() - startTime,
      error
    });
  }
  
  return results;
}

/**
 * Gets the migration status report
 */
export async function getMigrationStatus(): Promise<any> {
  logger.info('Getting migration status');
  
  // Load all migrations from files
  const allMigrations = loadMigrations();
  
  // Get applied migrations from database
  const appliedMigrations = await getAppliedMigrations();
  const appliedNamesMap = new Map();
  
  appliedMigrations.forEach(m => {
    appliedNamesMap.set(m.name, m);
  });
  
  // Build status report
  const migrationStatus = allMigrations.map(migration => {
    const dbMigration = appliedNamesMap.get(migration.name);
    
    return {
      name: migration.name,
      version: migration.version,
      description: migration.description,
      status: dbMigration ? dbMigration.status : 'pending',
      appliedAt: dbMigration ? dbMigration.appliedAt : null,
      batchId: dbMigration ? dbMigration.batchId : null,
      hasDownMigration: !!migration.down
    };
  });
  
  // Check for migrations in DB but missing files (danger!)
  const missingMigrations = appliedMigrations.filter(
    dbMigration => !allMigrations.some(m => m.name === dbMigration.name)
  ).map(m => ({
    name: m.name,
    version: m.version,
    description: m.description,
    status: 'file_missing',
    appliedAt: m.appliedAt,
    batchId: m.batchId
  }));
  
  const latest = appliedMigrations.length > 0 
    ? Math.max(...appliedMigrations.map(m => m.batchId))
    : 0;
  
  return {
    migrations: [...migrationStatus, ...missingMigrations],
    stats: {
      total: allMigrations.length,
      applied: appliedMigrations.filter(m => m.status === 'applied').length,
      pending: allMigrations.length - appliedMigrations.filter(m => m.status === 'applied').length,
      rolledBack: appliedMigrations.filter(m => m.status === 'rolled_back').length,
      failed: appliedMigrations.filter(m => m.status === 'failed').length,
      missing: missingMigrations.length,
      latestBatch: latest
    }
  };
}

/**
 * Plans for a future schema change by creating a migration
 */
export function planSchemaChange(
  name: string,
  description: string,
  changes: { table: string, operation: 'add_column' | 'drop_column' | 'rename_column' | 'modify_column' | 'add_table' | 'drop_table', details: any }[]
): string {
  logger.info(`Planning schema change: ${name}`);
  
  // Generate SQL for the changes
  let upSql = `-- Migration: ${name}\n-- Description: ${description}\n\n`;
  let downSql = `-- Rollback for: ${name}\n\n`;
  
  for (const change of changes) {
    switch (change.operation) {
      case 'add_column':
        upSql += `ALTER TABLE "${change.table}" ADD COLUMN "${change.details.name}" ${change.details.type}`;
        
        if (change.details.notNull) {
          upSql += ' NOT NULL';
        }
        
        if (change.details.default !== undefined) {
          upSql += ` DEFAULT ${change.details.default}`;
        }
        
        upSql += ';\n';
        
        // Down SQL for add_column is drop_column
        downSql += `ALTER TABLE "${change.table}" DROP COLUMN "${change.details.name}";\n`;
        break;
        
      case 'drop_column':
        upSql += `ALTER TABLE "${change.table}" DROP COLUMN "${change.details.name}";\n`;
        
        // Down SQL is more complex - need original column definition
        if (change.details.originalDefinition) {
          downSql += `ALTER TABLE "${change.table}" ADD COLUMN "${change.details.name}" ${change.details.originalDefinition};\n`;
        } else {
          downSql += `-- Warning: Cannot automatically generate down migration for drop_column without original definition\n`;
        }
        break;
        
      case 'rename_column':
        upSql += `ALTER TABLE "${change.table}" RENAME COLUMN "${change.details.oldName}" TO "${change.details.newName}";\n`;
        
        // Down SQL for rename_column is rename back
        downSql += `ALTER TABLE "${change.table}" RENAME COLUMN "${change.details.newName}" TO "${change.details.oldName}";\n`;
        break;
        
      case 'modify_column':
        upSql += `ALTER TABLE "${change.table}" ALTER COLUMN "${change.details.name}" TYPE ${change.details.type}`;
        
        if (change.details.using) {
          upSql += ` USING ${change.details.using}`;
        }
        
        upSql += ';\n';
        
        // Down SQL for modify_column
        if (change.details.originalType) {
          downSql += `ALTER TABLE "${change.table}" ALTER COLUMN "${change.details.name}" TYPE ${change.details.originalType}`;
          
          if (change.details.originalUsing) {
            downSql += ` USING ${change.details.originalUsing}`;
          }
          
          downSql += ';\n';
        } else {
          downSql += `-- Warning: Cannot automatically generate down migration for modify_column without original type\n`;
        }
        break;
        
      case 'add_table':
        upSql += `CREATE TABLE "${change.table}" (\n`;
        
        for (const column of change.details.columns) {
          upSql += `  "${column.name}" ${column.type}`;
          
          if (column.primaryKey) {
            upSql += ' PRIMARY KEY';
          }
          
          if (column.notNull) {
            upSql += ' NOT NULL';
          }
          
          if (column.default !== undefined) {
            upSql += ` DEFAULT ${column.default}`;
          }
          
          if (column.unique) {
            upSql += ' UNIQUE';
          }
          
          if (column.references) {
            upSql += ` REFERENCES "${column.references.table}"("${column.references.column}")`;
            
            if (column.references.onDelete) {
              upSql += ` ON DELETE ${column.references.onDelete}`;
            }
            
            if (column.references.onUpdate) {
              upSql += ` ON UPDATE ${column.references.onUpdate}`;
            }
          }
          
          upSql += ',\n';
        }
        
        // Remove trailing comma
        upSql = upSql.slice(0, -2);
        
        upSql += '\n);\n';
        
        // Down SQL for add_table is drop_table
        downSql += `DROP TABLE "${change.table}";\n`;
        break;
        
      case 'drop_table':
        upSql += `DROP TABLE "${change.table}";\n`;
        
        // Down SQL is more complex - need original table definition
        if (change.details.originalDefinition) {
          downSql += `${change.details.originalDefinition}\n`;
        } else {
          downSql += `-- Warning: Cannot automatically generate down migration for drop_table without original definition\n`;
        }
        break;
        
      default:
        logger.warn(`Unknown operation: ${change.operation}`);
        break;
    }
  }
  
  // Create the migration file
  return createMigration(name, description, upSql, downSql);
}

/**
 * Interface for schema changes module to be used in routes
 */
export const migrationPlanning = {
  initializeMigrationsTable,
  loadMigrations,
  getAppliedMigrations,
  createMigration,
  createMigrationPlan,
  executeMigrationPlan,
  rollbackLastBatch,
  rollbackMigrationBatch,
  getMigrationStatus,
  planSchemaChange
};