import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    companyId?: number;
    userRole?: string;
    username?: string;
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    // CSRF protection extended properties
    _csrfSecret?: string;
    _csrfTokenCreatedAt?: number;
    _authChanged?: boolean;
  }
}