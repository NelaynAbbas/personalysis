// Custom error interfaces and types for the application

// Basic API error interface
export interface ApiError extends Error {
  statusCode: number;
  status: string;
  code?: string;
  errors?: Record<string, string[]>;
  isOperational?: boolean;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  path?: string[];
}

// Database error codes from Postgres
export enum PostgresErrorCode {
  // Class 23 - Integrity Constraint Violation
  UniqueViolation = '23505',
  ForeignKeyViolation = '23503',
  CheckViolation = '23514',
  NotNullViolation = '23502',
  
  // Class 42 - Syntax Error or Access Rule Violation
  UndefinedTable = '42P01',
  UndefinedColumn = '42703',
  
  // Class 08 - Connection Exception
  ConnectionFailure = '08006',
  
  // Class 57 - Operator Intervention
  QueryCanceled = '57014',
  AdminShutdown = '57P01',
  
  // Class 53 - Insufficient Resources
  DiskFull = '53100',
  OutOfMemory = '53200',
  
  // Class 40 - Transaction Rollback
  TransactionRollback = '40000',
  
  // Class 22 - Data Exception
  InvalidTextRepresentation = '22P02',
  NumericValueOutOfRange = '22003'
}

// HTTP status codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Error response structure for API
export interface ErrorResponse {
  status: 'error' | 'fail';
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  timestamp: string;
  path?: string;
}

// Success response structure for API
export interface SuccessResponse<T = any> {
  status: 'success';
  message?: string;
  data: T;
  timestamp: string;
  path?: string;
}

// Combined response type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;