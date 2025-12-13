/**
 * Global TypeScript declarations for the application
 */

// Add Logger to window object
import { Logger } from '../lib/logger';

declare global {
  interface Window {
    logger?: Logger;
  }
}

export {};