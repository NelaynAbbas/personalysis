# API Documentation

This document outlines the API endpoints available in the Personalysis Pro platform.

## Table of Contents
- [Authentication](#authentication)
- [Surveys](#surveys)
- [Survey Responses](#survey-responses)
- [AI Insights](#ai-insights)
- [Company Analytics](#company-analytics)
- [System](#system)
- [Real-time Collaboration](#real-time-collaboration)

## Authentication

### Login
**Endpoint**: `POST /api/auth/login`

Authenticates a user and creates a session.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**: 
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "companyId": "number",
  "profilePic": "string"
}
```

**Status Codes**:
- `200 OK`: Successfully authenticated
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials

### Logout
**Endpoint**: `POST /api/auth/logout`

Ends the current user session.

**Response**:
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

**Status Codes**:
- `200 OK`: Successfully logged out
- `500 Internal Server Error`: Error destroying session

### Get Current User
**Endpoint**: `GET /api/auth/me`

Returns the currently authenticated user's information.

**Response**:
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "companyId": "number",
  "profilePic": "string"
}
```

**Status Codes**:
- `200 OK`: User information retrieved
- `401 Unauthorized`: Not authenticated

### Register
**Endpoint**: `POST /api/auth/register`

Creates a new user account.

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "companyId": "number (optional)",
  "role": "string (optional)"
}
```

**Response**:
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "companyId": "number"
}
```

**Status Codes**:
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid request data
- `409 Conflict`: Username already exists

### Forgot Password
**Endpoint**: `POST /api/auth/forgot-password`

Initiates a password reset process.

**Request Body**:
```json
{
  "email": "string"
}
```

**Response**:
```json
{
  "message": "If your email is registered, you will receive a password reset link shortly."
}
```

**Status Codes**:
- `200 OK`: Request processed
- `400 Bad Request`: Email is required

### Reset Password
**Endpoint**: `POST /api/auth/reset-password`

Resets a user's password with a valid token.

**Request Body**:
```json
{
  "token": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "message": "Password has been reset successfully"
}
```

**Status Codes**:
- `200 OK`: Password reset successful
- `400 Bad Request`: Token and password are required
- `401 Unauthorized`: Invalid or expired token

### Get CSRF Token
**Endpoint**: `GET /api/auth/csrf-token`

Returns a CSRF token for form submissions.

**Response**:
```json
{
  "csrfToken": "string"
}
```

**Status Codes**:
- `200 OK`: Token generated

## Surveys

### Create Survey
**Endpoint**: `POST /api/surveys`

Creates a new survey.

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "welcomeMessage": "string",
  "completionMessage": "string",
  "surveyType": "string",
  "templateId": "number (optional)",
  "estimatedTime": "number (optional)",
  "enableAIInsights": "boolean (optional)",
  "enableSocialSharing": "boolean (optional)",
  "responseLimit": "number (optional)",
  "surveyLanguage": "string (optional)",
  "allowAnonymous": "boolean (optional)",
  "demographics": "object (optional)"
}
```

**Response**:
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "welcomeMessage": "string",
  "completionMessage": "string",
  "surveyType": "string",
  "templateId": "number",
  "estimatedTime": "number",
  "enableAIInsights": "boolean",
  "enableSocialSharing": "boolean",
  "responseLimit": "number",
  "surveyLanguage": "string",
  "allowAnonymous": "boolean",
  "demographics": "object",
  "status": "string",
  "created": "date",
  "companyId": "number"
}
```

**Status Codes**:
- `201 Created`: Survey created
- `400 Bad Request`: Missing required fields

### Get All Surveys
**Endpoint**: `GET /api/surveys`

Returns a list of all available surveys.

**Response**:
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "surveyType": "string",
    "status": "string",
    "responseCount": "number",
    "createdAt": "date",
    "estimatedTime": "number"
  }
]
```

**Status Codes**:
- `200 OK`: Surveys retrieved

### Share Survey
**Endpoint**: `POST /api/survey/share`

Generates shareable links or sends email invitations.

**Request Body**:
```json
{
  "surveyId": "string (optional)",
  "emails": "string[] (optional)",
  "message": "string (optional)",
  "title": "string (optional)",
  "customTitle": "string (optional)",
  "customDescription": "string (optional)",
  "platform": "string (optional)"
}
```

**Response when sharing via email**:
```json
{
  "success": "boolean",
  "message": "string",
  "sentTo": "string[]"
}
```

**Response when generating links**:
```json
{
  "success": "boolean",
  "surveyId": "string",
  "surveyType": "string",
  "customSettings": {
    "title": "string",
    "description": "string"
  },
  "links": {
    "direct": "string",
    "facebook": "string",
    "linkedin": "string",
    "twitter": "string"
  }
}
```

**Status Codes**:
- `200 OK`: Sharing processed

### Get Survey by ID
**Endpoint**: `GET /api/surveys/:id`

Returns details about a specific survey.

**Path Parameters**:
- `id`: Survey ID

**Response**:
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "surveyType": "string",
  "isActive": "boolean",
  "isPublic": "boolean",
  "estimatedTime": "number",
  "createdAt": "date",
  "updatedAt": "date",
  "companyId": "number"
}
```

**Status Codes**:
- `200 OK`: Survey found
- `400 Bad Request`: Invalid survey ID
- `404 Not Found`: Survey not found

### Get Survey Questions
**Endpoint**: `GET /api/survey/questions`

Returns questions for a survey type.

**Query Parameters**:
- `type`: Survey type (optional, defaults to 'general')

**Response**:
```json
[
  {
    "id": "number",
    "text": "string",
    "type": "string",
    "options": "string[] (optional)",
    "required": "boolean"
  }
]
```

**Status Codes**:
- `200 OK`: Questions retrieved

## Survey Responses

### Start Survey
**Endpoint**: `POST /api/survey/start`

Starts a new survey session.

**Request Body**:
```json
{
  "companyId": "number (optional)",
  "surveyType": "string (optional)",
  "surveyId": "number (optional)"
}
```

**Response**:
```json
{
  "sessionId": "number",
  "respondentId": "string",
  "surveyType": "string"
}
```

**Status Codes**:
- `200 OK`: Session created

### Submit Answer
**Endpoint**: `POST /api/survey/answer`

Submits an answer to a survey question.

**Request Body**:
```json
{
  "sessionId": "number",
  "questionId": "number",
  "answer": "string"
}
```

**Response**:
```json
{
  "success": "boolean"
}
```

**Status Codes**:
- `200 OK`: Answer recorded
- `400 Bad Request`: Invalid data
- `404 Not Found`: Survey session not found

### Complete Survey
**Endpoint**: `POST /api/survey/complete`

Completes a survey and generates traits.

**Request Body**:
```json
{
  "sessionId": "number",
  "demographicInfo": {
    "age": "number (optional)",
    "gender": "string (optional)",
    "location": "string (optional)",
    "education": "string (optional)",
    "income": "string (optional)",
    "occupation": "string (optional)",
    "interests": "string[] (optional)"
  }
}
```

**Response**:
```json
{
  "success": "boolean",
  "sessionId": "number",
  "traitCount": "number"
}
```

**Status Codes**:
- `200 OK`: Survey completed
- `400 Bad Request`: Invalid data
- `404 Not Found`: Survey session not found

### Get Survey Results
**Endpoint**: `GET /api/survey/results/:sessionId`

Returns results for a completed survey.

**Path Parameters**:
- `sessionId`: Session ID

**Response**:
```json
{
  "sessionId": "number",
  "respondentId": "string",
  "traits": [
    {
      "name": "string",
      "score": "number",
      "category": "string"
    }
  ],
  "demographics": "object",
  "genderStereotypes": [
    {
      "trait": "string",
      "score": "number",
      "stereotypeType": "string",
      "description": "string"
    }
  ],
  "productRecommendations": [
    {
      "category": "string",
      "products": [
        {
          "name": "string",
          "confidence": "number",
          "description": "string",
          "attributes": "string[]"
        }
      ],
      "reason": "string"
    }
  ],
  "marketSegment": "string"
}
```

**Status Codes**:
- `200 OK`: Results retrieved
- `400 Bad Request`: Invalid session ID
- `404 Not Found`: Results not found

## AI Insights

### Get AI Insights
**Endpoint**: `GET /api/survey/ai-insights/:sessionId`

Generates AI-powered insights based on survey responses.

**Path Parameters**:
- `sessionId`: Session ID

**Query Parameters**:
- `type`: Insight type (optional, defaults to 'personality')

**Response**:
```json
{
  "sessionId": "number",
  "insightType": "string",
  "insight": "string"
}
```

**Status Codes**:
- `200 OK`: Insights generated
- `400 Bad Request`: Invalid session ID
- `404 Not Found`: Survey response not found

## Company Analytics

### Get Company Analytics
**Endpoint**: `GET /api/company/:companyId/analytics`

Returns analytics for a company.

**Path Parameters**:
- `companyId`: Company ID

**Response**:
```json
{
  "responseCount": "number",
  "averageCompletionTime": "number",
  "responsesByDay": [
    {
      "date": "string",
      "count": "number"
    }
  ],
  "popularTraits": [
    {
      "trait": "string",
      "count": "number",
      "averageScore": "number"
    }
  ],
  "demographicBreakdown": "object"
}
```

**Status Codes**:
- `200 OK`: Analytics retrieved
- `400 Bad Request`: Invalid company ID
- `404 Not Found`: Company not found

### Get Company Responses
**Endpoint**: `GET /api/company/:companyId/responses`

Returns survey responses for a company.

**Path Parameters**:
- `companyId`: Company ID

**Response**:
```json
[
  {
    "id": "number",
    "surveyId": "number",
    "respondentId": "string",
    "completed": "boolean",
    "createdAt": "date",
    "demographics": "object"
  }
]
```

**Status Codes**:
- `200 OK`: Responses retrieved
- `400 Bad Request`: Invalid company ID
- `404 Not Found`: Company not found

### Export Company Data
**Endpoint**: `GET /api/company/:companyId/export`

Exports company data in a specified format.

**Path Parameters**:
- `companyId`: Company ID

**Query Parameters**:
- `format`: Export format (optional, defaults to 'json')

**Response**:
File download

**Status Codes**:
- `200 OK`: Export successful
- `400 Bad Request`: Invalid company ID
- `404 Not Found`: Company not found

### Get Competitor Analysis
**Endpoint**: `GET /api/company/:companyId/competitors`

Returns competitor analysis for a company.

**Path Parameters**:
- `companyId`: Company ID

**Response**:
```json
[
  {
    "competitorName": "string",
    "strengthScore": "number",
    "keyDifferentiators": "string[]",
    "marketSharePercentage": "number",
    "priceComparison": "string",
    "targetAudience": "string[]"
  }
]
```

**Status Codes**:
- `200 OK`: Analysis retrieved
- `400 Bad Request`: Invalid company ID
- `404 Not Found`: Company not found

### Get Market Fit Analysis
**Endpoint**: `GET /api/company/:companyId/market-fit/:productId`

Returns market fit analysis for a specific product.

**Path Parameters**:
- `companyId`: Company ID
- `productId`: Product ID

**Response**:
```json
{
  "overall": {
    "score": "number",
    "description": "string"
  },
  "segments": [
    {
      "segment": "string",
      "fitScore": "number",
      "reasons": "string[]"
    }
  ],
  "recommendedImprovements": "string[]"
}
```

**Status Codes**:
- `200 OK`: Analysis retrieved
- `400 Bad Request`: Invalid IDs
- `404 Not Found`: Company or product not found

## System

### Get System Performance
**Endpoint**: `GET /api/system/performance`

Returns system performance metrics (admin only).

**Response**:
```json
{
  "memory": {
    "rss": "number",
    "heapTotal": "number",
    "heapUsed": "number",
    "external": "number"
  },
  "uptime": "number",
  "performance": "object",
  "cache": {
    "hits": "number",
    "misses": "number",
    "size": "number",
    "groups": "object"
  },
  "rateLimiter": {
    "activeKeys": "number",
    "limitsByEndpoint": "object"
  },
  "activeConnections": {
    "total": "number"
  }
}
```

**Status Codes**:
- `200 OK`: Metrics retrieved
- `403 Forbidden`: Not authorized

## Real-time Collaboration

WebSocket endpoint at `/ws` supports real-time collaboration with the following message types:

### Join Session
```json
{
  "action": "join",
  "sessionId": "string",
  "userId": "number",
  "surveyId": "number (optional)"
}
```

### Leave Session
```json
{
  "action": "leave",
  "sessionId": "string",
  "userId": "number"
}
```

### Cursor Move
```json
{
  "action": "cursor_move",
  "sessionId": "string",
  "userId": "number",
  "cursor": {
    "x": "number",
    "y": "number",
    "element": "string (optional)"
  }
}
```

### Change Survey
```json
{
  "action": "change",
  "sessionId": "string",
  "userId": "number",
  "change": {
    "entityType": "string",
    "entityId": "number",
    "field": "string",
    "oldValue": "any",
    "newValue": "any"
  }
}
```

### Add Comment
```json
{
  "action": "comment",
  "sessionId": "string",
  "userId": "number",
  "comment": {
    "entityType": "string",
    "entityId": "number",
    "content": "string"
  }
}
```

### Resolve Comment
```json
{
  "action": "resolve_comment",
  "sessionId": "string",
  "userId": "number",
  "commentId": "number"
}
```

### Ping
```json
{
  "action": "ping"
}
```