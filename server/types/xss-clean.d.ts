declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  
  // Export a middleware function
  const xssClean: () => RequestHandler;
  
  export default xssClean;
}