# Personalysis Pro - System Architecture

## Overview

Personalysis Pro is a comprehensive B2B SaaS platform for personality assessment and business intelligence. The system transforms personality data into actionable business insights through advanced AI-powered analytics. It serves as a multi-tenant platform where businesses can create surveys, collect responses, and generate sophisticated market intelligence reports.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based UI with strict typing
- **TanStack Query**: Efficient data fetching and caching layer
- **React Hook Form**: Form state management with validation
- **shadcn/ui + Tailwind CSS**: Consistent, accessible component library
- **Recharts**: Interactive data visualization for analytics dashboards
- **WebSocket Integration**: Real-time collaboration and live updates

### Backend Architecture
- **Node.js + Express**: RESTful API server with TypeScript
- **PostgreSQL + Drizzle ORM**: Relational database with type-safe queries
- **Passport.js**: Authentication middleware for session management
- **Express Session**: Secure session handling with database persistence
- **Google Gemini AI**: Advanced personality analysis and business intelligence
- **WebSocket Server**: Real-time communication for collaborative features

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data
- **Session Store**: Database-backed session storage for scalability
- **File Storage**: Local file system for temporary assets (can be extended to cloud storage)
- **Caching Layer**: In-memory caching for frequently accessed data

## Key Components

### User Management System
- **Multi-role Authentication**: Platform admin, business owner, business admin, analyst roles
- **Permission-based Access Control**: Granular permissions for different user capabilities
- **Session Management**: Secure session handling with automatic expiration
- **User Activity Logging**: Comprehensive audit trail for all user actions

### Survey Management
- **Dynamic Survey Builder**: Flexible survey creation with multiple question types
- **Response Collection**: Secure data collection with validation
- **Real-time Collaboration**: Multiple users can work on surveys simultaneously
- **Survey Sharing**: Public and private sharing options with access controls

### Business Intelligence Engine
- **AI-Powered Analytics**: Gemini AI integration for advanced insights
- **Competitor Analysis**: Market positioning and competitive intelligence
- **Customer Segmentation**: Automated customer persona generation
- **Revenue Forecasting**: Predictive analytics for business planning
- **Market Fit Analysis**: Product-market alignment assessment

### API Layer
- **RESTful Endpoints**: Comprehensive API for all business operations
- **API Key Management**: Secure API access for integrations
- **Rate Limiting**: Protection against abuse and overuse
- **Request Validation**: Input sanitization and schema validation

## Data Flow

### Survey Response Processing
1. User submits survey response through frontend
2. Data validation and sanitization at API layer
3. Personality trait extraction and scoring
4. Storage in PostgreSQL with audit logging
5. Real-time updates to connected clients via WebSocket
6. Trigger AI analysis for business insights

### Business Intelligence Generation
1. Aggregate survey responses by company
2. AI analysis using Gemini for pattern recognition
3. Generate competitor analysis, market segments, and forecasts
4. Cache results for performance optimization
5. Deliver insights through dashboard and API

### Real-time Collaboration
1. WebSocket connection establishment
2. User authentication and permission validation
3. Live cursor tracking and change synchronization
4. Conflict resolution for simultaneous edits
5. Persistent storage of collaboration history

## External Dependencies

### Core Services
- **PostgreSQL Database**: Primary data storage
- **Google Gemini AI**: Business intelligence and personality analysis
- **SendGrid**: Email delivery for notifications and invitations
- **Stripe**: Payment processing and subscription management

### Development Dependencies
- **Vite**: Frontend build tool and development server
- **ESBuild**: Backend bundling for production deployment
- **Drizzle Kit**: Database migrations and schema management
- **Playwright**: End-to-end testing framework

### Security & Monitoring
- **Helmet**: Security headers middleware
- **CORS**: Cross-origin request handling
- **Rate Limiting**: API protection middleware
- **Input Sanitization**: XSS and injection protection

## Deployment Strategy

### Production Environment
- **Replit Deployment**: Autoscale deployment target
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Automated schema updates
- **Health Monitoring**: System performance tracking

### Development Workflow
- **Local Development**: Hot-reload development server
- **TypeScript Compilation**: Build-time type checking
- **Testing Pipeline**: Unit, integration, and E2E tests
- **Code Quality**: ESLint and Prettier integration

### Scalability Considerations
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Redis-ready caching layer
- **Load Balancing**: Ready for horizontal scaling
- **CDN Integration**: Static asset delivery optimization

## Recent Changes  
- July 4, 2025: **COOKIE CONSENT PERFORMANCE ISSUE FIXED** - Resolved circular dependency causing excessive API calls (every second) to /api/cookie-consent endpoint
- July 4, 2025: **COOKIE CONSENT API OPTIMIZATION** - Removed redundant updatePreferences calls and fixed useCallback dependencies preventing infinite loops
- July 4, 2025: **DEVELOPMENT MODE OPTIMIZATION** - Platform now runs efficiently in development mode with proper cookie consent handling
- July 3, 2025: **PRODUCTION MODE ENABLED** - Successfully switched server to production mode with enhanced security and performance features
- July 3, 2025: **PRODUCTION FEATURES ACTIVATED** - CSRF protection, API signature verification, connection pooling, and production monitoring enabled
- July 3, 2025: **PRODUCTION CONFIGURATION** - Database connection pooling (max: 20, min: 5), auto-scaling (2-10 instances), and scheduled maintenance configured
- July 3, 2025: **CRITICAL SEO FIX** - Fixed robots.txt serving 247 validation errors by adding static file middleware before Vite catch-all route
- July 3, 2025: **ROBOTS.TXT ISSUE RESOLVED** - Server was returning HTML content instead of robots.txt file, now properly serves text/plain content
- July 3, 2025: Created comprehensive platform documentation covering all 14 major functional areas from A to Z
- June 25, 2025: **LOGO GRADIENT APPLIED THROUGHOUT** - Applied PersonalysisPro logo's exact gradient colors (primary to indigo-600) across all use-cases page elements
- June 25, 2025: **BRAND CONSISTENCY PERFECTED** - Hero title, buttons, backgrounds, and CTA section now use matching gradient from logo
- June 25, 2025: **GRADIENT HARMONY ACHIEVED** - All backgrounds now use gradient variations from-primary/5 via-indigo-50 to-primary/10 for visual consistency
- June 25, 2025: **ICON CONTAINERS ENHANCED** - Applied gradient backgrounds from-primary/10 to-indigo-100/50 with subtle shadows
- June 25, 2025: **BADGE STYLING UPGRADED** - Benefits badges now use gradient backgrounds matching logo color scheme
- June 25, 2025: **USE CASES PAGE COLORS COMPLETELY FIXED** - Updated ALL remaining hardcoded colors including backgrounds, badges, and gradients to match primary theme
- June 24, 2025: **CRITICAL FIX** - Discovered and resolved missing core API route registration causing authentication failures
- June 24, 2025: Identified fundamental integration issues preventing app functionality despite feature completeness
- June 24, 2025: Added missing health check, login, logout, and authentication verification endpoints
- June 24, 2025: Implemented proper bcrypt password hashing and verification for production security
- June 23, 2025: Created comprehensive survey template documentation covering all 9 survey types
- June 23, 2025: Documented detailed data extraction mechanisms and business intelligence outputs
- June 23, 2025: Created survey outcomes matrix showing business applications across industries
- June 23, 2025: Established complete mapping of personality traits to business predictions

## Changelog
- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.