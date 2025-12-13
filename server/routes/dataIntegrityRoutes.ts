/**
 * Data Integrity Routes
 * 
 * This module provides API endpoints for managing data integrity features.
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { DataIntegrityService } from '../utils/dataIntegrityService';
import { validateDatabaseConstraints } from '../utils/dataIntegrity';
import { db } from '../db';
import { sendSuccess, sendServerError, sendClientError } from '../utils/apiResponses';
import { requireAdmin } from '../middleware/authMiddleware';
import { Logger } from '../utils/Logger';

const router = express.Router();
const logger = new Logger('DataIntegrityRoutes');

/**
 * @route GET /api/integrity/status
 * @desc Get the current data integrity status
 * @access Admin only
 */
router.get('/status', requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Since we don't have getIntegrityStatus, we'll use validateDatabaseConstraints
    const constraintStatus = await validateDatabaseConstraints(db, true);
    
    return sendSuccess(res, { 
      status: {
        constraintStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting data integrity status', { error });
    return sendServerError(res, 'Failed to retrieve data integrity status');
  }
});

/**
 * @route POST /api/integrity/fix
 * @desc Fix detected data integrity issues
 * @access Admin only
 */
router.post('/fix', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const fixResults = await DataIntegrityService.fixDataIntegrityIssues();
    
    return sendSuccess(res, {
      message: 'Data integrity issues fixed successfully',
      results: fixResults
    });
  } catch (error) {
    logger.error('Error fixing data integrity issues', { error });
    return sendServerError(res, 'Failed to fix data integrity issues');
  }
});

/**
 * @route POST /api/integrity/archive
 * @desc Manually trigger data archiving
 * @access Admin only
 */
router.post('/archive', requireAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      olderThanDays: z.number().int().positive().optional(),
      dataTypes: z.array(z.string()).optional(),
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return sendClientError(res, 'Invalid input for archiving', validationResult.error);
    }
    
    const { olderThanDays, dataTypes } = validationResult.data;
    
    const archiveResults = await DataIntegrityService.archiveData({
      olderThanDays,
      dataTypes
    });
    
    return sendSuccess(res, {
      message: 'Data archived successfully',
      results: archiveResults
    });
  } catch (error) {
    logger.error('Error archiving data', { error });
    return sendServerError(res, 'Failed to archive data');
  }
});

/**
 * @route GET /api/integrity/migrations
 * @desc Get migration status
 * @access Admin only
 */
router.get('/migrations', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const migrations = await DataIntegrityService.getMigrationStatus();
    
    return sendSuccess(res, {
      pendingMigrations: migrations.pending,
      appliedMigrations: migrations.applied,
      lastRun: migrations.lastRun
    });
  } catch (error) {
    logger.error('Error getting migration status', { error });
    return sendServerError(res, 'Failed to retrieve migration status');
  }
});

/**
 * @route POST /api/integrity/migrations/plan
 * @desc Plan a schema change by creating a migration
 * @access Admin only
 */
router.post('/migrations/plan', requireAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      description: z.string().min(5).max(200),
      schemaChanges: z.object({}).passthrough(),
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return sendClientError(res, 'Invalid migration plan', validationResult.error);
    }
    
    const { description, schemaChanges } = validationResult.data;
    
    const migrationPlan = await DataIntegrityService.planMigration({
      description,
      schemaChanges
    });
    
    return sendSuccess(res, {
      message: 'Migration planned successfully',
      migrationFile: migrationPlan.fileName,
      previewSql: migrationPlan.sql
    });
  } catch (error) {
    logger.error('Error planning migration', { error });
    return sendServerError(res, 'Failed to plan migration');
  }
});

/**
 * @route POST /api/integrity/migrations/apply
 * @desc Apply pending migrations
 * @access Admin only
 */
router.post('/migrations/apply', requireAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      migrationIds: z.array(z.string()).optional(),
      applyAll: z.boolean().optional()
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return sendClientError(res, 'Invalid migration application request', validationResult.error);
    }
    
    const { migrationIds, applyAll } = validationResult.data;
    
    if (!migrationIds && !applyAll) {
      return sendClientError(res, 'Either migrationIds or applyAll must be provided');
    }
    
    const migrationResults = await DataIntegrityService.applyMigrations({
      migrationIds,
      applyAll: Boolean(applyAll)
    });
    
    return sendSuccess(res, {
      message: 'Migrations applied successfully',
      results: migrationResults
    });
  } catch (error) {
    logger.error('Error applying migrations', { error });
    return sendServerError(res, 'Failed to apply migrations');
  }
});

/**
 * @route POST /api/integrity/migrations/rollback
 * @desc Rollback the last batch of migrations
 * @access Admin only
 */
router.post('/migrations/rollback', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const rollbackResults = await DataIntegrityService.rollbackLastMigration();
    
    return sendSuccess(res, {
      message: 'Last migration batch rolled back successfully',
      results: rollbackResults
    });
  } catch (error) {
    logger.error('Error rolling back migrations', { error });
    return sendServerError(res, 'Failed to rollback migrations');
  }
});

/**
 * @route POST /api/integrity/constraints/check
 * @desc Check database constraints
 * @access Admin only  
 */
router.post('/constraints/check', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const constraintResults = await DataIntegrityService.checkDatabaseConstraints();
    
    return sendSuccess(res, {
      message: 'Database constraints checked successfully',
      results: constraintResults
    });
  } catch (error) {
    logger.error('Error checking database constraints', { error });
    return sendServerError(res, 'Failed to check database constraints');
  }
});

/**
 * @route POST /api/integrity/validate
 * @desc Validate all data in the database
 * @access Admin only
 */
router.post('/validate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      entities: z.array(z.string()).optional(),
      sampleSize: z.number().int().min(1).max(1000).optional(),
    });
    
    const validationResult = schema.safeParse(req.body);
    
    if (!validationResult.success) {
      return sendClientError(res, 'Invalid validation request', validationResult.error);
    }
    
    const { entities, sampleSize } = validationResult.data;
    
    const validationResults = await DataIntegrityService.validateDatabaseData({
      entities,
      sampleSize
    });
    
    return sendSuccess(res, {
      message: 'Data validation completed',
      results: validationResults
    });
  } catch (error) {
    logger.error('Error validating database data', { error });
    return sendServerError(res, 'Failed to validate database data');
  }
});

export default router;