# Personalysis Pro

A sophisticated B2B SaaS platform that transforms personality assessment into an engaging, interactive digital profiling experience with advanced technological capabilities.

## Overview

Personalysis Pro is a comprehensive solution for businesses to create, manage, and analyze personality assessments. It provides an intuitive interface for creating surveys, collecting responses, and generating AI-powered insights into personality traits, preferences, and behaviors.

## Key Features

- **Advanced Survey Creation**: Create customized personality assessment surveys with various question types and templates.
- **Real-time Collaboration**: Collaborate on survey design with team members in real-time.
- **AI-Powered Insights**: Generate comprehensive personality insights using advanced AI models.
- **Interactive Results**: View and interact with personality profiles through intuitive visualizations.
- **Business Analytics**: Analyze survey results for market research, customer segmentation, and product development.
- **Secure Data Handling**: Enterprise-grade security for sensitive personality data.
- **API Integration**: Incorporate personality assessments into existing business systems.

## Technology Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- React Hook Form for form handling
- shadcn/ui component library with Tailwind CSS
- Recharts for data visualization
- WebSocket for real-time collaboration

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- WebSocket for real-time updates
- Gemini AI integration for insights

### DevOps
- Hosted on Replit
- CI/CD automation
- Comprehensive logging and monitoring

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # Utility functions and hooks
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express server
│   ├── docs/               # API and architecture documentation
│   ├── middleware/         # Express middleware
│   ├── tests/              # Server-side tests
│   ├── utils/              # Utility functions
│   ├── auth.ts             # Authentication setup
│   ├── db.ts               # Database connection
│   ├── gemini.ts           # AI integration
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data storage interface
└── shared/                 # Shared code between client and server
    └── schema.ts           # Database schema and types
```

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-organization/personalysis-pro.git
cd personalysis-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5000`

## Development

### Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production version
- `npm run start`: Start the production server
- `npm run db:push`: Push schema changes to the database
- `npm run test`: Run tests
- `npm run lint`: Run ESLint

### Testing

The application includes comprehensive testing:

- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user flows

Run tests with:

```bash
npm run test
```

### Documentation

- API documentation is available in `server/docs/api.md`
- Architecture documentation is available in `server/docs/architecture.md`

## Deployment

The application is designed to be deployed on Replit, but can be adapted to other hosting environments.

### Replit Deployment

1. Click the "Deploy" button in Replit
2. Configure environment variables
3. Complete the deployment process

### Custom Deployment

1. Build the application:
```bash
npm run build
```

2. Set up environment variables
3. Start the server:
```bash
npm run start
```

## Security Considerations

- All API endpoints are secured with proper authentication and authorization
- Input validation is implemented for all user inputs
- CSRF protection is enabled for all state-changing requests
- Rate limiting is applied to prevent abuse
- All passwords are hashed with secure algorithms
- Session management includes security best practices

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

For questions or support, please contact the development team at support@personalysis-pro.com.

---

Personalysis Pro - Transforming personality assessment into meaningful insights.