# PersonalysisPro API Integration Guide

This guide provides comprehensive instructions for integrating with the PersonalysisPro API, including setup, authentication, and common usage patterns.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [API Key Setup](#api-key-setup)
3. [SDK Installation](#sdk-installation)
4. [Authentication](#authentication)
5. [Common Use Cases](#common-use-cases)
6. [Webhooks Configuration](#webhooks-configuration)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

## Prerequisites

Before integrating with the PersonalysisPro API, ensure you have:

- An active PersonalysisPro account with API access
- Admin or Developer role permissions
- Basic understanding of REST APIs
- Development environment with one of our supported languages

## API Key Setup

### Generating an API Key

1. Log in to your PersonalysisPro account
2. Navigate to **Account Settings** > **API Access**
3. Click **Create New API Key**
4. Provide a descriptive name for the key (e.g., "Production Integration")
5. Select the appropriate permission scopes:
   - `read:surveys` - Access survey data
   - `write:surveys` - Create and modify surveys
   - `read:responses` - Access survey responses
   - `write:responses` - Submit survey responses
   - `read:analytics` - Access analytics data
   - `admin` - Full administrative access (use with caution)
6. Click **Generate Key**
7. **Important**: Save the displayed API key securely. It will not be shown again.

### API Key Security

- Treat API keys like passwords
- Never hardcode keys in source code
- Use environment variables or secure secret managers
- Rotate keys periodically
- Limit key permissions to only what's necessary

## SDK Installation

We provide official SDK libraries for popular programming languages. Choose the installation instructions for your preferred language:

### JavaScript/Node.js

```bash
npm install personalysispro-sdk
```

```javascript
const PersonalysisPro = require('personalysispro-sdk');
// or using ES modules
import PersonalysisPro from 'personalysispro-sdk';
```

### Python

```bash
pip install personalysispro
```

```python
import personalysispro
```

### Ruby

```bash
gem install personalysispro
```

```ruby
require 'personalysispro'
```

### PHP

```bash
composer require personalysispro/personalysispro-php
```

```php
require_once 'vendor/autoload.php';
use PersonalysisPro\Client;
```

### Java

```xml
<!-- Maven -->
<dependency>
  <groupId>com.personalysispro</groupId>
  <artifactId>personalysispro-client</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
import com.personalysispro.Client;
```

### C#

```bash
dotnet add package PersonalysisPro.Client
```

```csharp
using PersonalysisPro;
```

## Authentication

All API requests require authentication using your API key.

### SDK Authentication

```javascript
// JavaScript
const client = new PersonalysisPro({
  apiKey: 'your_api_key_here'
});
```

```python
# Python
client = personalysispro.Client(api_key='your_api_key_here')
```

```ruby
# Ruby
client = PersonalysisPro::Client.new(api_key: 'your_api_key_here')
```

```php
// PHP
$client = new PersonalysisPro\Client('your_api_key_here');
```

```java
// Java
PersonalysisProClient client = new PersonalysisProClient("your_api_key_here");
```

```csharp
// C#
var client = new PersonalysisProClient("your_api_key_here");
```

### Direct API Authentication

If not using an SDK, include your API key in the request header:

```
Authorization: Bearer your_api_key_here
```

## Common Use Cases

### Retrieving Surveys

```javascript
// JavaScript
const surveys = await client.surveys.list({ limit: 10 });
```

```python
# Python
surveys = client.surveys.list(limit=10)
```

### Creating a Survey

```javascript
// JavaScript
const survey = await client.surveys.create({
  title: 'Customer Satisfaction Survey',
  description: 'Quarterly survey for existing customers',
  questions: [
    {
      text: 'How satisfied are you with our service?',
      type: 'scale',
      required: true,
      options: {
        min: 1,
        max: 10,
        min_label: 'Very dissatisfied',
        max_label: 'Very satisfied'
      }
    }
  ]
});
```

```python
# Python
survey = client.surveys.create(
  title='Customer Satisfaction Survey',
  description='Quarterly survey for existing customers',
  questions=[
    {
      'text': 'How satisfied are you with our service?',
      'type': 'scale',
      'required': True,
      'options': {
        'min': 1,
        'max': 10,
        'min_label': 'Very dissatisfied',
        'max_label': 'Very satisfied'
      }
    }
  ]
)
```

### Submitting Survey Responses

```javascript
// JavaScript
const response = await client.surveys.submitResponse(survey_id, {
  respondent: {
    email: 'customer@example.com',
    name: 'John Doe'
  },
  answers: [
    {
      question_id: 'q_123',
      value: 8
    }
  ]
});
```

```python
# Python
response = client.surveys.submit_response(survey_id, {
  'respondent': {
    'email': 'customer@example.com',
    'name': 'John Doe'
  },
  'answers': [
    {
      'question_id': 'q_123',
      'value': 8
    }
  ]
})
```

### Retrieving Analytics

```javascript
// JavaScript
const analytics = await client.surveys.getAnalytics(survey_id);
```

```python
# Python
analytics = client.surveys.get_analytics(survey_id)
```

## Webhooks Configuration

Webhooks allow your application to receive real-time notifications when specific events occur.

### Registering a Webhook

```javascript
// JavaScript
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhook',
  events: ['survey.created', 'response.submitted'],
  secret: 'your_webhook_secret'
});
```

```python
# Python
webhook = client.webhooks.create(
  url='https://your-app.com/webhook',
  events=['survey.created', 'response.submitted'],
  secret='your_webhook_secret'
)
```

### Verifying Webhook Signatures

Each webhook request includes a signature in the `X-PersonalysisPro-Signature` header. Verify this signature to ensure the request is legitimate:

```javascript
// JavaScript
const isValid = client.webhooks.verifySignature(
  req.headers['x-personalysispro-signature'],
  JSON.stringify(req.body),
  'your_webhook_secret'
);
```

```python
# Python
is_valid = client.webhooks.verify_signature(
  request.headers.get('X-PersonalysisPro-Signature'),
  request.body,
  'your_webhook_secret'
)
```

## Rate Limiting

Our API enforces rate limits to ensure fair usage:

| Plan | Rate Limit |
|------|------------|
| Standard | 100 requests/minute |
| Professional | 500 requests/minute |
| Enterprise | 2000 requests/minute |

### Handling Rate Limits

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1589547834
```

SDKs automatically handle rate limiting with exponential backoff. For direct API calls, implement your own rate limit handling:

```javascript
// JavaScript example
async function makeRequestWithRetry(requestFn, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limited
        const resetTime = error.headers['x-ratelimit-reset'];
        const waitTime = Math.max(1000, resetTime - Date.now());
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Error Handling

Our API returns standard HTTP status codes with detailed error messages:

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### SDK Error Handling

```javascript
// JavaScript
try {
  const survey = await client.surveys.get('nonexistent_id');
} catch (error) {
  console.error(`Error: ${error.message}, Code: ${error.code}`);
}
```

```python
# Python
try:
  survey = client.surveys.get('nonexistent_id')
except personalysispro.errors.NotFoundError as e:
  print(f"Error: {e.message}, Code: {e.code}")
```

## Best Practices

### Performance Optimization

1. **Use Pagination**: When retrieving large datasets, use pagination parameters:
   ```javascript
   const surveys = await client.surveys.list({ limit: 100, offset: 200 });
   ```

2. **Request Only What You Need**: Some endpoints support field selection:
   ```javascript
   const survey = await client.surveys.get(id, { fields: 'id,title,status' });
   ```

3. **Batch Operations**: Use batch endpoints for multiple operations:
   ```javascript
   const results = await client.batch.create([
     { method: 'GET', path: '/surveys/123' },
     { method: 'GET', path: '/surveys/456' }
   ]);
   ```

### Security Best Practices

1. **Use HTTPS**: Always use HTTPS for API calls
2. **Rotate API Keys**: Regularly rotate API keys
3. **Implement Timeouts**: Set reasonable timeouts on API calls
4. **Validate Webhooks**: Always verify webhook signatures

### Implementation Recommendations

1. **Use the SDK**: Official SDKs handle many edge cases for you
2. **Implement Caching**: Cache responses when appropriate
3. **Graceful Degradation**: Design your application to handle API outages
4. **Monitor Usage**: Keep track of your API usage to avoid hitting limits

## Testing

### Sandbox Environment

We provide a sandbox environment for testing:

```javascript
// JavaScript
const client = new PersonalysisPro({
  apiKey: 'your_test_api_key',
  baseUrl: 'https://api.sandbox.personalysispro.com/v1'
});
```

```python
# Python
client = personalysispro.Client(
  api_key='your_test_api_key',
  base_url='https://api.sandbox.personalysispro.com/v1'
)
```

### Test API Keys

Test API keys are available in your developer dashboard. They:
- Begin with `sk_test_`
- Don't affect production data
- Have simulated rate limits
- Return predictable responses

## Support and Resources

- [API Reference Documentation](./api-reference.md)
- [SDK Repositories](https://github.com/personalysispro)
- [Developer Forum](https://developers.personalysispro.com)
- Email support: api-support@personalysispro.com