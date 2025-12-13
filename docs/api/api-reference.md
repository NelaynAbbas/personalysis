# PersonalysisPro API Reference

This API reference provides comprehensive documentation for developers integrating with the PersonalysisPro platform.

## Authentication

All API requests require authentication using API keys.

### Obtaining an API Key

1. Log in to your PersonalysisPro account
2. Navigate to "Account Settings" > "API Access"
3. Click "Generate New API Key"
4. Name your key and set permissions
5. Store your key securely - it won't be displayed again

### Using Your API Key

Include your API key in all requests as a header:

```
Authorization: Bearer YOUR_API_KEY
```

## API Endpoints

### Base URL

All API endpoints begin with:

```
https://api.personalysispro.com/v1
```

### Response Format

All responses are returned in JSON format with the following structure:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Survey Management

### List Surveys

```
GET /surveys
```

Query parameters:
- `limit` (optional): Maximum number of surveys to return (default: 20, max: 100)
- `offset` (optional): Number of surveys to skip (default: 0)
- `status` (optional): Filter by status (draft, active, completed, archived)

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "survey_123",
      "title": "Customer Satisfaction Q2 2025",
      "status": "active",
      "created_at": "2025-04-15T10:30:00Z",
      "updated_at": "2025-04-15T14:22:00Z",
      "response_count": 157
    }
  ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Survey Details

```
GET /surveys/{survey_id}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "survey_123",
    "title": "Customer Satisfaction Q2 2025",
    "description": "Quarterly customer satisfaction survey for existing clients",
    "status": "active",
    "created_at": "2025-04-15T10:30:00Z",
    "updated_at": "2025-04-15T14:22:00Z",
    "response_count": 157,
    "questions": [
      {
        "id": "q_456",
        "text": "How satisfied are you with our product?",
        "type": "scale",
        "required": true,
        "options": {
          "min": 1,
          "max": 10,
          "min_label": "Very dissatisfied",
          "max_label": "Very satisfied"
        }
      }
    ],
    "settings": {
      "allow_anonymous": true,
      "collect_demographics": true,
      "close_date": "2025-06-30T23:59:59Z"
    }
  }
}
```

### Create Survey

```
POST /surveys
```

Request body:

```json
{
  "title": "New Customer Onboarding Survey",
  "description": "Survey to gather feedback from recently onboarded customers",
  "questions": [
    {
      "text": "How would you rate the onboarding process?",
      "type": "scale",
      "required": true,
      "options": {
        "min": 1,
        "max": 5,
        "min_label": "Poor",
        "max_label": "Excellent"
      }
    }
  ],
  "settings": {
    "allow_anonymous": false,
    "collect_demographics": true,
    "close_date": "2025-07-31T23:59:59Z"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "survey_789",
    "title": "New Customer Onboarding Survey",
    "status": "draft",
    "created_at": "2025-05-15T08:45:00Z",
    "updated_at": "2025-05-15T08:45:00Z",
    "response_count": 0
  }
}
```

### Update Survey

```
PUT /surveys/{survey_id}
```

Request body: Same format as create survey

### Delete Survey

```
DELETE /surveys/{survey_id}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "survey_123",
    "status": "deleted"
  }
}
```

## Survey Responses

### List Responses

```
GET /surveys/{survey_id}/responses
```

Query parameters:
- `limit` (optional): Maximum number of responses to return (default: 20, max: 100)
- `offset` (optional): Number of responses to skip (default: 0)

### Get Response Details

```
GET /surveys/{survey_id}/responses/{response_id}
```

### Submit Response

```
POST /surveys/{survey_id}/responses
```

Request body:

```json
{
  "respondent": {
    "email": "respondent@example.com",
    "name": "John Doe",
    "demographics": {
      "age": 34,
      "gender": "male",
      "location": "New York"
    }
  },
  "answers": [
    {
      "question_id": "q_456",
      "value": 8
    }
  ]
}
```

## Analytics

### Survey Analytics

```
GET /surveys/{survey_id}/analytics
```

Response:

```json
{
  "success": true,
  "data": {
    "response_count": 157,
    "completion_rate": 92.5,
    "average_time": 380,
    "question_summaries": [
      {
        "question_id": "q_456",
        "average_score": 7.8,
        "distribution": {
          "1": 2,
          "2": 5,
          "3": 8,
          "4": 12,
          "5": 15,
          "6": 18,
          "7": 25,
          "8": 32,
          "9": 22,
          "10": 18
        }
      }
    ],
    "personality_traits": {
      "openness": 68.7,
      "conscientiousness": 72.3,
      "extraversion": 54.9,
      "agreeableness": 81.2,
      "neuroticism": 42.6
    }
  }
}
```

### Competitive Analysis

```
GET /business-intelligence/competitive-analysis
```

Query parameters:
- `company_id` (required): Your company ID
- `competitors` (optional): Comma-separated list of competitor IDs

### Market Fit Analysis

```
GET /business-intelligence/market-fit
```

Query parameters:
- `company_id` (required): Your company ID
- `product_id` (required): Product ID to analyze

## Webhooks

### Register Webhook

```
POST /webhooks
```

Request body:

```json
{
  "url": "https://your-app.com/webhook-endpoint",
  "events": ["survey.created", "survey.completed", "response.submitted"],
  "secret": "your_webhook_secret"
}
```

### List Webhooks

```
GET /webhooks
```

### Delete Webhook

```
DELETE /webhooks/{webhook_id}
```

## Rate Limits

The API is rate-limited to protect our infrastructure:

- 100 requests per minute per API key
- 5,000 requests per day per API key

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1589547834
```

## Error Codes

| Code | Description |
|------|-------------|
| `authentication_error` | Invalid API key |
| `authorization_error` | Valid API key but insufficient permissions |
| `invalid_request` | Malformed request |
| `resource_not_found` | Requested resource does not exist |
| `rate_limit_exceeded` | You've exceeded the rate limit |
| `internal_error` | Server error on our end |

## SDK Libraries

We provide official SDK libraries for:

- JavaScript (Node.js and browser)
- Python
- Ruby
- PHP
- Java
- C#

Visit our [GitHub repositories](https://github.com/personalysispro) for SDK documentation and examples.

## Support

For API support, please contact api-support@personalysispro.com or visit our [Developer Forum](https://developers.personalysispro.com).