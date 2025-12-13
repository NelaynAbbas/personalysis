declare module 'helmet' {
  import { RequestHandler } from 'express';
  
  interface HelmetOptions {
    contentSecurityPolicy?: boolean | {
      directives?: {
        [key: string]: string[];
      };
    };
    [key: string]: any;
  }
  
  function helmet(options?: HelmetOptions): RequestHandler;
  
  export = helmet;
}