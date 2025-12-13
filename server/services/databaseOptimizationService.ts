import { Logger } from '../utils/Logger';
import { db } from '../db';
import { cacheService, CacheStrategy } from './cacheService';
import { SQL, sql } from 'drizzle-orm';
import { asc, desc } from 'drizzle-orm';

const logger = new Logger('DatabaseOptimizationService');
import pg from 'pg';

// Max number of items per page for paginated queries
const MAX_PAGE_SIZE = 100;
// Default page size if not specified
const DEFAULT_PAGE_SIZE = 20;

/**
 * Service that provides optimized database operations with caching
 */
class DatabaseOptimizationService {
  constructor() {
    logger.info('Database optimization service initialized');
  }

  /**
   * Execute a SELECT query with optimized performance and caching
   * @param queryKey A unique key to identify this query in the cache
   * @param queryFn Function that returns the query to execute
   * @param params Query parameters that affect the cache key
   * @param cacheStrategy The caching strategy to use
   */
  async executeSelectQuery<T>(
    queryKey: string,
    queryFn: () => SQL,
    params: Record<string, any> = {},
    cacheStrategy: CacheStrategy = CacheStrategy.DEFAULT
  ): Promise<T[]> {
    // Only use cache if it's a cacheable strategy
    if (cacheStrategy !== CacheStrategy.NONE) {
      const cacheKey = `query:${queryKey}:${JSON.stringify(params)}`;
      
      // Try to get from cache first
      const cachedResult = cacheService.get<T[]>(cacheKey);
      if (cachedResult) {
        logger.debug('Query cache hit', { key: cacheKey });
        return cachedResult;
      }

      // Execute query
      try {
        const startTime = Date.now();
        const result = await db.execute(queryFn());
        const duration = Date.now() - startTime;
        
        // Log slow queries
        if (duration > 200) {
          logger.warn('Slow query detected', { 
            query: queryKey, 
            duration: `${duration}ms`,
            params 
          });
        }
        
        // Cache the result
        cacheService.set(cacheKey, result, cacheStrategy);
        return result;
      } catch (error) {
        logger.error('Query execution error', { 
          query: queryKey, 
          error: error instanceof Error ? error.message : String(error),
          params 
        });
        throw error;
      }
    } else {
      // Execute without caching
      return await db.execute(queryFn());
    }
  }

  /**
   * Execute a paginated SELECT query with optimized performance
   * @param queryKey A unique key to identify this query in the cache
   * @param queryFn Function that returns the base query to execute
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param sortBy Column to sort by
   * @param sortDirection 'asc' or 'desc' 
   * @param filters Additional filters
   * @param cacheStrategy The caching strategy to use
   */
  async executePaginatedQuery<T>(
    queryKey: string,
    queryFn: () => SQL,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
    sortBy: string = 'id',
    sortDirection: 'asc' | 'desc' = 'asc',
    filters: Record<string, any> = {},
    cacheStrategy: CacheStrategy = CacheStrategy.SHORT
  ): Promise<{ data: T[], total: number, page: number, pageSize: number, totalPages: number }> {
    // Validate and normalize pagination parameters
    page = Math.max(1, page);
    pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
    
    const cacheKey = `paginated:${queryKey}:${page}:${pageSize}:${sortBy}:${sortDirection}:${JSON.stringify(filters)}`;
    
    // Try to get from cache first
    const cachedResult = cacheService.get<{ data: T[], total: number, page: number, pageSize: number, totalPages: number }>(cacheKey);
    if (cachedResult && cacheStrategy !== CacheStrategy.NONE) {
      logger.debug('Paginated query cache hit', { key: cacheKey });
      return cachedResult;
    }
    
    try {
      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;
      
      // Build the base query with filters
      let baseQuery = queryFn();
      
      // First, get the total count
      const countQuery = sql`SELECT COUNT(*) FROM (${baseQuery}) as subquery`;
      const countResult = await db.execute(countQuery);
      const total = parseInt(countResult[0].count as string, 10);
      
      // Apply sorting and pagination
      const sortDirectionFn = sortDirection === 'asc' ? asc : desc;
      const paginatedQuery = sql`${baseQuery} ORDER BY ${sql.identifier(sortBy)} ${sortDirectionFn} LIMIT ${pageSize} OFFSET ${offset}`;
      
      // Execute the paginated query
      const startTime = Date.now();
      const data = await db.execute(paginatedQuery);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 200) {
        logger.warn('Slow paginated query detected', { 
          query: queryKey, 
          duration: `${duration}ms`,
          page,
          pageSize,
          filters 
        });
      }
      
      // Prepare the result
      const result = {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
      // Cache the result
      if (cacheStrategy !== CacheStrategy.NONE) {
        cacheService.set(cacheKey, result, cacheStrategy);
      }
      
      return result;
    } catch (error) {
      logger.error('Paginated query execution error', { 
        query: queryKey, 
        error: error instanceof Error ? error.message : String(error),
        page,
        pageSize,
        filters 
      });
      throw error;
    }
  }
  
  /**
   * Invalidate cache entries related to a specific entity
   * @param entityName The name of the entity (e.g., 'users', 'surveys')
   */
  invalidateEntityCache(entityName: string): void {
    // Invalidate both direct queries and paginated queries
    cacheService.invalidateByPattern(`query:${entityName}`);
    cacheService.invalidateByPattern(`paginated:${entityName}`);
    logger.debug(`Cache invalidated for entity: ${entityName}`);
  }
  
  /**
   * Build optimized SQL queries with proper indexing hints
   * @param tableName The table to query
   * @param columns Columns to select
   * @param conditions WHERE conditions
   * @param useIndex Optional index hint
   */
  buildOptimizedQuery(
    tableName: string, 
    columns: string[] = ['*'], 
    conditions: Record<string, any> = {},
    useIndex?: string
  ): SQL {
    // Start building the query
    let query = sql`SELECT ${columns.map(c => sql.identifier(c)).join(', ')} FROM ${sql.identifier(tableName)}`;
    
    // Add index hint if specified
    if (useIndex) {
      // This is PostgreSQL specific syntax
      query = sql`${query} /*+ IndexScan(${sql.identifier(tableName)} ${sql.identifier(useIndex)}) */`;
    }
    
    // Add WHERE conditions if any
    if (Object.keys(conditions).length > 0) {
      const whereConditions = Object.entries(conditions).map(([key, value]) => {
        return sql`${sql.identifier(key)} = ${value}`;
      });
      
      // Combine conditions with AND
      query = sql`${query} WHERE ${sql.join(whereConditions, sql` AND `)}`;
    }
    
    return query;
  }
  
  /**
   * Execute a bulk insert with optimal performance
   * @param tableName Table to insert into
   * @param columns Column names
   * @param values Array of value arrays
   */
  async bulkInsert(
    tableName: string,
    columns: string[],
    values: any[][]
  ): Promise<pg.QueryResult> {
    // Format columns
    const columnsList = columns.map(c => sql.identifier(c)).join(', ');
    
    // Prepare the base query
    let query = sql`INSERT INTO ${sql.identifier(tableName)} (${columnsList}) VALUES `;
    
    // Add values
    const valueChunks: SQL[] = [];
    values.forEach(rowValues => {
      valueChunks.push(sql`(${sql.join(rowValues.map(v => sql`${v}`), sql`, `)})`);
    });
    
    // Complete the query
    query = sql`${query}${sql.join(valueChunks, sql`, `)}`;
    
    // Execute the optimized bulk insert
    try {
      return await db.execute(query);
    } catch (error) {
      logger.error('Bulk insert error', { 
        table: tableName, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();