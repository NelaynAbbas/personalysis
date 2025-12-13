# Service Level Agreements (SLAs)

This document outlines the service level agreements (SLAs) for PersonalysisPro, including availability guarantees, response times, and support commitments based on subscription tier.

## System Availability

### Uptime Guarantees

| Plan Level | Guaranteed Uptime | Maximum Monthly Downtime | Scheduled Maintenance |
|------------|------------------|--------------------------|----------------------|
| Standard | 99.5% | 3.65 hours | Included in downtime |
| Professional | 99.9% | 43.8 minutes | Not included in downtime |
| Enterprise | 99.95% | 21.9 minutes | Not included in downtime |

### Measurement Method

- Uptime is measured through automated monitoring from multiple geographic locations
- Measured in one-minute intervals
- System is considered "down" when:
  - API endpoints return 5xx error codes
  - Web application fails to load within 10 seconds
  - User authentication fails for system-wide reasons
  - Dashboard data cannot be retrieved

### Exclusions

The following scenarios are excluded from uptime calculations:

- Scheduled maintenance (announced 48+ hours in advance)
- Issues caused by customer's infrastructure or integrations
- Force majeure events (natural disasters, etc.)
- Suspension of service due to violation of terms
- Beta/preview features explicitly marked as such

## Response Times

### Support Ticket Response

| Plan Level | Priority | Initial Response | Resolution Target | Support Hours |
|------------|----------|------------------|-------------------|--------------|
| **Standard** | Critical | 4 hours | 8 hours | Business hours |
| | High | 8 hours | 24 hours | Business hours |
| | Medium | 24 hours | 48 hours | Business hours |
| | Low | 48 hours | 72 hours | Business hours |
| **Professional** | Critical | 2 hours | 6 hours | Extended business hours |
| | High | 4 hours | 12 hours | Extended business hours |
| | Medium | 8 hours | 24 hours | Business hours |
| | Low | 24 hours | 48 hours | Business hours |
| **Enterprise** | Critical | 30 minutes | 4 hours | 24/7 |
| | High | 1 hour | 8 hours | 24/7 |
| | Medium | 4 hours | 24 hours | Extended business hours |
| | Low | 8 hours | 48 hours | Business hours |

### Support Hours Definitions

- **Business Hours**: Monday-Friday, 9:00 AM - 5:00 PM Eastern Time, excluding holidays
- **Extended Business Hours**: Monday-Friday, 7:00 AM - 9:00 PM Eastern Time, excluding holidays
- **24/7**: 24 hours per day, 7 days per week, including holidays

## Issue Prioritization Criteria

### Critical Priority

- Complete system outage
- Data security breach
- Payment processing failure
- Issues preventing >80% of users from accessing core functionality

### High Priority

- Major feature unavailable
- Significant performance degradation
- Integration failures with critical third-party services
- Issues affecting 40-80% of users

### Medium Priority

- Non-critical feature unavailable
- Intermittent issues with specific functionality
- Minor performance degradation
- Issues affecting 10-40% of users

### Low Priority

- Cosmetic issues
- Documentation errors
- Feature requests or enhancement suggestions
- Issues affecting <10% of users

## Service Credits

If PersonalysisPro fails to meet the guaranteed uptime in any given month, customers are eligible for service credits according to the following schedule:

| Plan Level | 99-99.5% Uptime | 98-99% Uptime | <98% Uptime |
|------------|-----------------|---------------|-------------|
| Standard | 5% credit | 10% credit | 15% credit |
| Professional | 10% credit | 15% credit | 25% credit |
| Enterprise | 15% credit | 25% credit | 35% credit |

### Service Credit Terms

- Credits are calculated as a percentage of the monthly subscription fee
- Credits apply only to the affected service component
- Credits will be automatically applied to the next billing cycle
- Credits cannot be converted to cash refunds
- Credits must be requested within 30 days of the incident

## Maintenance Windows

### Scheduled Maintenance

- Standard maintenance: Sundays, 2:00 AM - 6:00 AM Eastern Time
- Advance notice: Minimum 48 hours for standard maintenance
- Emergency maintenance may occur with shorter notice for critical security patches

### Maintenance Notifications

Customers will receive maintenance notifications through:
- Email to designated technical contacts
- In-app notifications
- Status page updates

## Data Backup and Recovery

### Backup Schedule

| Plan Level | Backup Frequency | Backup Retention | Recovery Point Objective |
|------------|------------------|------------------|--------------------------|
| Standard | Daily | 30 days | 24 hours |
| Professional | Daily | 90 days | 12 hours |
| Enterprise | Hourly | 180 days | 1 hour |

### Recovery Time Objectives

| Plan Level | System Recovery | Individual Data Recovery |
|------------|----------------|--------------------------|
| Standard | 12 hours | 24 hours |
| Professional | 6 hours | 12 hours |
| Enterprise | 4 hours | 8 hours |

## Incident Communication

| Plan Level | Initial Notification | Status Updates | Post-Incident Reports |
|------------|---------------------|----------------|----------------------|
| Standard | Public status page | Public status page | Summary on request |
| Professional | Email + status page | Every 2 hours | Basic report provided |
| Enterprise | Email, SMS + status page | Every 30-60 minutes | Detailed report with root cause |

## Performance Standards

### Response Time Targets

| Component | Target Response Time | Measurement Method |
|-----------|----------------------|-------------------|
| Web UI Loading | <3 seconds | 95th percentile |
| Dashboard Rendering | <5 seconds | 95th percentile |
| API Requests | <500ms | 95th percentile |
| Report Generation | <30 seconds | 95th percentile |
| Data Import | <5 minutes per 1GB | Average |

### Concurrency Limits

| Plan Level | Maximum Concurrent Users | API Rate Limits |
|------------|--------------------------|----------------|
| Standard | 25 | 100 requests/minute |
| Professional | 100 | 500 requests/minute |
| Enterprise | Unlimited | 2000 requests/minute |

## Support Channels

| Plan Level | Available Support Channels | Named Contacts |
|------------|----------------------------|---------------|
| Standard | Email, Knowledge Base | 2 |
| Professional | Email, In-App Chat, Knowledge Base | 5 |
| Enterprise | Email, In-App Chat, Phone, Knowledge Base, Dedicated Slack | 10 |

## Training and Onboarding

| Plan Level | Initial Training | Additional Training | Documentation |
|------------|-----------------|---------------------|---------------|
| Standard | Self-service | Paid per session | Standard documentation |
| Professional | 2-hour session | 1 free session quarterly | Standard + admin guides |
| Enterprise | Customized onboarding | Unlimited sessions | Custom documentation |

## Security and Compliance

| Plan Level | Access Controls | Compliance Reports | Security Reviews |
|------------|----------------|-------------------|------------------|
| Standard | Role-based access | None | Annual |
| Professional | Role-based + IP restrictions | Summary SOC 2 | Bi-annual |
| Enterprise | Role-based + IP + MFA | Full SOC 2, custom | Quarterly |

## Reporting and Analytics

| Plan Level | Standard Reports | Custom Reports | API Access |
|------------|-----------------|---------------|------------|
| Standard | Monthly | None | Limited |
| Professional | Weekly | Quarterly | Full |
| Enterprise | Daily | Monthly | Full + dedicated endpoints |

## SLA Reviews and Updates

- SLA terms are reviewed quarterly
- Changes will be communicated 30 days in advance
- Major changes to SLA terms may require customer acknowledgment
- Historical SLA performance available in customer portal

## How to Report Issues

### Standard and Professional Plans
- Submit ticket via support portal
- Email support@personalysispro.com
- In-app help request

### Enterprise Plan
- Dedicated support hotline
- Dedicated Slack channel
- Priority email: enterprise-support@personalysispro.com
- Named customer success manager

## Requesting Service Credits

1. Log into the customer portal
2. Navigate to "Billing" > "Service Credits"
3. Select the affected time period
4. Provide incident references (if available)
5. Submit the request

Requests will be reviewed within 5 business days.

## Escalation Path

If you are not satisfied with the issue resolution or SLA compliance:

### Standard and Professional Plans
1. Request supervisor review via support portal
2. Email escalations@personalysispro.com

### Enterprise Plan
1. Contact your Customer Success Manager
2. Contact the Support Director
3. Contact the Chief Customer Officer

## Legal Considerations

- This SLA forms part of the Service Agreement
- In case of conflict, the terms of the main Service Agreement prevail
- SLA terms may vary by geographic region due to local regulations
- For full legal terms, please refer to the Master Service Agreement