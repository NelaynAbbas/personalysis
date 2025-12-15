const fs = require('fs');
const path = require('path');

// Read AdminConsole.tsx
const filePath = path.join(__dirname, 'client', 'src', 'pages', 'AdminConsole.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define all replacements
const replacements = [
  // Buttons
  ['>Create License</', '>{t(\'pages.adminConsole.createLicense\')}</'],
  ['>Add Client</', '>{t(\'pages.adminConsole.addClient\')}</'],
  ['>Logout</', '>{t(\'pages.adminConsole.logout\')}</'],

  // Tab names
  ['>Dashboard</', '>{t(\'pages.adminConsole.tabs.dashboard\')}</'],
  ['>Clients</', '>{t(\'pages.adminConsole.tabs.clients\')}</'],
  ['>Licenses</', '>{t(\'pages.adminConsole.tabs.licenses\')}</'],
  ['>Templates</', '>{t(\'pages.adminConsole.tabs.templates\')}</'],
  ['>Support</', '>{t(\'pages.adminConsole.tabs.support\')}</'],
  ['>Analytics</', '>{t(\'pages.adminConsole.tabs.analytics\')}</'],
  ['>Billing</', '>{t(\'pages.adminConsole.tabs.billing\')}</'],
  ['>Notifications</', '>{t(\'pages.adminConsole.tabs.notifications\')}</'],
  ['>Audit Logs</', '>{t(\'pages.adminConsole.tabs.auditLogs\')}</'],
  ['>Responses</', '>{t(\'pages.adminConsole.tabs.responses\')}</'],
  ['>Demo Requests</', '>{t(\'pages.adminConsole.tabs.demoRequests\')}</'],
  ['>Integrations</', '>{t(\'pages.adminConsole.tabs.integrations\')}</'],
  ['>Settings</', '>{t(\'common.settings\')}</'],
  ['>DEMO DATA</', '>{t(\'pages.adminConsole.tabs.demoData\')}</'],
  ['>Backup</', '>{t(\'pages.adminConsole.tabs.backup\')}</'],
  ['>Blog</', '>{t(\'pages.adminConsole.tabs.blog\')}</'],

  // Dashboard section
  ['<span>Time Range</span>', '<span>{t(\'pages.adminConsole.dashboard.timeRange\')}</span>'],
  ['"Select range"', 't(\'pages.adminConsole.dashboard.selectRange\')'],
  ['>Last Week</', '>{t(\'pages.adminConsole.dashboard.lastWeek\')}</'],
  ['>Last Month</', '>{t(\'pages.adminConsole.dashboard.lastMonth\')}</'],
  ['>Last 3 Months</', '>{t(\'pages.adminConsole.dashboard.last3Months\')}</'],
  ['>Last 6 Months</', '>{t(\'pages.adminConsole.dashboard.last6Months\')}</'],
  ['>Last Year</', '>{t(\'pages.adminConsole.dashboard.lastYear\')}</'],

  // Messages
  ['"Analytics data unavailable. Please check API access."', 't(\'pages.adminConsole.dashboard.analyticsUnavailable\')'],
  ['"No analytics data available"', 't(\'pages.adminConsole.dashboard.noAnalyticsData\')'],
  ['"Client Growth"', 't(\'pages.adminConsole.dashboard.clientGrowth\')'],
  ['"Total client acquisition and retention over time"', 't(\'pages.adminConsole.dashboard.clientGrowthDescription\')'],
  ['"Active Clients"', 't(\'pages.adminConsole.dashboard.activeClients\')'],
  ['"New Clients"', 't(\'pages.adminConsole.dashboard.newClients\')'],
  ['"Churned Clients"', 't(\'pages.adminConsole.dashboard.churnedClients\')'],
  ['"Client growth data unavailable"', 't(\'pages.adminConsole.dashboard.clientGrowthUnavailable\')'],
  ['"Revenue Trends"', 't(\'pages.adminConsole.dashboard.revenueTrends\')'],
  ['"Monthly revenue breakdown by type"', 't(\'pages.adminConsole.dashboard.revenueTrendsDescription\')'],
  ['"Subscription Revenue"', 't(\'pages.adminConsole.dashboard.subscriptionRevenue\')'],
  ['"One-time Revenue"', 't(\'pages.adminConsole.dashboard.oneTimeRevenue\')'],
  ['"Total Revenue"', 't(\'pages.adminConsole.dashboard.totalRevenue\')'],
  ['"Revenue data unavailable"', 't(\'pages.adminConsole.dashboard.revenueUnavailable\')'],
  ['"Industry Distribution"', 't(\'pages.adminConsole.dashboard.industryDistribution\')'],
  ['"Client distribution by industry"', 't(\'pages.adminConsole.dashboard.industryDistributionDescription\')'],
  ['"Industry data unavailable"', 't(\'pages.adminConsole.dashboard.industryUnavailable\')'],
  ['"Revenue by Industry"', 't(\'pages.adminConsole.dashboard.revenueByIndustry\')'],
  ['"Monthly revenue breakdown by industry"', 't(\'pages.adminConsole.dashboard.revenueByIndustryDescription\')'],
  ['"Revenue by industry data unavailable"', 't(\'pages.adminConsole.dashboard.revenueByIndustryUnavailable\')'],
  ['"System Health"', 't(\'pages.adminConsole.dashboard.systemHealth\')'],
  ['"Real-time performance metrics"', 't(\'pages.adminConsole.dashboard.systemHealthDescription\')'],
  ['"Live"', 't(\'pages.adminConsole.dashboard.live\')'],
  ['"Offline"', 't(\'pages.adminConsole.dashboard.offline\')'],
  ['"CPU Usage"', 't(\'pages.adminConsole.dashboard.cpuUsage\')'],
  ['"Memory Usage"', 't(\'pages.adminConsole.dashboard.memoryUsage\')'],
  ['"Active Connections"', 't(\'pages.adminConsole.dashboard.activeConnections\')'],
  ['"System Status"', 't(\'pages.adminConsole.dashboard.systemStatus\')'],
  ['"Recent Support Tickets"', 't(\'pages.adminConsole.dashboard.recentSupportTickets\')'],
  ['"Unable to load tickets."', 't(\'pages.adminConsole.dashboard.unableToLoadTickets\')'],
  ['"Unknown Client"', 't(\'pages.adminConsole.dashboard.unknownClient\')'],
  ['>View</', '>{t(\'pages.adminConsole.dashboard.view\')}</'],
  ['"No recent tickets."', 't(\'pages.adminConsole.dashboard.noRecentTickets\')'],
  ['>View All Tickets</', '>{t(\'pages.adminConsole.dashboard.viewAllTickets\')}</'],
  ['"Expiring Licenses"', 't(\'pages.adminConsole.dashboard.expiringLicenses\')'],
  ['"Unable to load licenses."', 't(\'pages.adminConsole.dashboard.unableToLoadLicenses\')'],
  ['"No licenses expiring soon."', 't(\'pages.adminConsole.dashboard.noLicensesExpiring\')'],
  ['>View All Expiring Licenses</', '>{t(\'pages.adminConsole.dashboard.viewAllExpiringLicenses\')}</'],

  // Sub tabs
  ['>Survey Templates</', '>{t(\'pages.adminConsole.templates.surveyTemplates\')}</'],
  ['>Survey Management</', '>{t(\'pages.adminConsole.templates.surveyManagement\')}</'],
  ['← Back to Survey Management', `← {t('pages.adminConsole.templates.backToSurveyManagement')}`],
  ['>Support Tickets</', '>{t(\'pages.adminConsole.support.supportTickets\')}</'],
  ['>Client Support</', '>{t(\'pages.adminConsole.support.clientSupport\')}</'],

  // Card descriptions
  ['"Backup & Restore"', 't(\'pages.adminConsole.backup.title\')'],
  ['"Manage system backups and restore points"', 't(\'pages.adminConsole.backup.description\')'],
  ['"Demo Data Generator"', 't(\'pages.adminConsole.demoData.title\')'],
  ['"Generate test data for development and testing purposes"', 't(\'pages.adminConsole.demoData.description\')'],
  ['"Blog Management"', 't(\'pages.adminConsole.blog.title\')'],
  ['"Manage blog articles and categories"', 't(\'pages.adminConsole.blog.description\')'],

  // Error messages
  ['"Access Denied"', 't(\'pages.adminConsole.accessDenied\')'],
  ['"You don\'t have permission to access the admin console."', 't(\'pages.adminConsole.accessDeniedDescription\')'],
];

// Apply all replacements
replacements.forEach(([oldStr, newStr]) => {
  content = content.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminConsole.tsx translations updated successfully!');
