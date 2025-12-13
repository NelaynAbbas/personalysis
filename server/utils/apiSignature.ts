import crypto from 'crypto';
import { Request } from 'express';
import { Logger } from './Logger';

const logger = new Logger('ApiSignature');

/**
 * Signature generation configuration
 */
export interface SignatureConfig {
  headerName: string;
  timestampHeaderName: string;
  expirationTimeMs: number;
  secretKey: string;
}

/**
 * Default configuration for API signature handling
 */
const DEFAULT_CONFIG: SignatureConfig = {
  headerName: 'X-API-Signature',
  timestampHeaderName: 'X-Timestamp',
  expirationTimeMs: 5 * 60 * 1000, // 5 minutes
  secretKey: process.env.API_SIGNATURE_KEY || 'survey-platform-default-signature-key'
};

/**
 * Generates a signature for the provided payload
 * @param payload - The data to sign
 * @param timestamp - Current timestamp
 * @param config - Signature configuration
 * @returns Signature string
 */
export function generateSignature(
  payload: string | object, 
  timestamp = Date.now(), 
  config: SignatureConfig = DEFAULT_CONFIG
): { signature: string; timestamp: number } {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const dataToSign = `${payloadStr}.${timestamp}`;
  
  const hmac = crypto.createHmac('sha256', config.secretKey);
  hmac.update(dataToSign);
  
  return {
    signature: hmac.digest('hex'),
    timestamp
  };
}

/**
 * Extracts and verifies the signature from a request
 * @param req - Express request object
 * @param config - Signature configuration
 * @returns Whether the signature is valid
 */
export function verifyRequestSignature(req: Request, config: SignatureConfig = DEFAULT_CONFIG): boolean {
  try {
    const signature = req.headers[config.headerName.toLowerCase()] as string;
    const timestamp = parseInt(req.headers[config.timestampHeaderName.toLowerCase()] as string, 10);
    
    if (!signature || !timestamp) {
      logger.debug('Missing signature or timestamp headers');
      return false;
    }
    
    // Check if timestamp is expired
    const currentTime = Date.now();
    if (currentTime - timestamp > config.expirationTimeMs) {
      logger.debug('Signature timestamp expired', {
        timestamp,
        currentTime,
        diff: currentTime - timestamp,
        maxDiff: config.expirationTimeMs
      });
      return false;
    }
    
    // Get request body or query parameters for signature verification
    const payload = req.method === 'GET' ? req.query : req.body;
    
    // Generate expected signature
    const { signature: expectedSignature } = generateSignature(payload, timestamp, config);
    
    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(expectedSignature)
    );
    
    if (!isValid) {
      logger.security('Invalid API signature detected', {
        provided: signature,
        expected: expectedSignature,
        timestamp,
        currentTime: Date.now(),
        payloadType: typeof payload
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Error verifying request signature', { error });
    return false;
  }
}

/**
 * Attaches a signature to the given payload
 * @param payload - The data to sign
 * @param config - Signature configuration
 * @returns Headers with signature and timestamp
 */
export function signPayload(
  payload: any, 
  config: SignatureConfig = DEFAULT_CONFIG
): Record<string, string> {
  const { signature, timestamp } = generateSignature(payload, Date.now(), config);
  
  return {
    [config.headerName]: signature,
    [config.timestampHeaderName]: timestamp.toString()
  };
}

/**
 * Helper to create the middleware for API signature verification
 * @param options - Additional options for the middleware
 * @returns Express middleware function
 */
export function createSignatureVerificationMiddleware(options: {
  config?: SignatureConfig;
  excludePaths?: string[];
  requireForPaths?: string[];
}) {
  const config = options.config || DEFAULT_CONFIG;
  const excludePaths = options.excludePaths || [];
  const requireForPaths = options.requireForPaths || [];
  
  return (req: Request, res: any, next: any) => {
    // Skip signature verification for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip API signature verification for browser requests with valid sessions
    // Browser requests use session-based authentication, not API signatures
    // Only external API clients without sessions need to provide signatures
    if (req.session && req.session.userId) {
      return next();
    }
    
    // Only verify for required paths if specified
    if (requireForPaths.length > 0 && !requireForPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Verify the signature (only for external API clients without sessions)
    if (!verifyRequestSignature(req, config)) {
      logger.security('API signature verification failed', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        headers: {
          signature: req.headers[config.headerName.toLowerCase()],
          timestamp: req.headers[config.timestampHeaderName.toLowerCase()]
        },
        userId: req.session?.userId || 'unauthenticated'
      });
      
      return res.status(401).json({
        error: 'Invalid or expired signature',
        code: 'INVALID_SIGNATURE'
      });
    }
    
    next();
  };
}