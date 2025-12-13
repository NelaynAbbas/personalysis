/**
 * Temporary dummy data for development purposes
 * This will be replaced with real database queries
 */

export function getClientGrowthData(months: number) {
  const now = new Date();
  const data = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Realistic growth pattern with seasonal variations
    const baseValue = 100 - i * 5; // Trend of growth over time
    const seasonality = Math.sin(date.getMonth() * Math.PI / 6) * 15; // Seasonal factor
    const randomVariation = Math.random() * 10 - 5; // Random noise
    
    data.push({
      month,
      newClients: Math.max(5, Math.round(baseValue * 0.2 + seasonality + randomVariation)),
      activeClients: Math.max(20, Math.round(baseValue * 3 + seasonality * 2 + randomVariation)),
      churnedClients: Math.max(1, Math.round(baseValue * 0.05 + Math.abs(seasonality * 0.2) + randomVariation * 0.5))
    });
  }
  
  return data;
}

export function getRevenueData(months: number) {
  const now = new Date();
  const data = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    // Revenue follows client growth with different multipliers
    const baseValue = 5000 - i * 200; // Upward trend
    const seasonality = Math.sin(date.getMonth() * Math.PI / 6) * 500; // Seasonal factor
    const randomVariation = Math.random() * 300 - 150; // Random noise
    
    const totalSubscription = Math.round(baseValue + seasonality + randomVariation);
    const oneTime = Math.round(baseValue * 0.2 + Math.abs(seasonality) * 0.3 + randomVariation * 0.5);
    
    data.push({
      month,
      subscriptionRevenue: totalSubscription,
      oneTimeRevenue: oneTime,
      totalRevenue: totalSubscription + oneTime
    });
  }
  
  return data;
}

export function getKeyMetricsData() {
  return [
    {
      id: 'total-clients',
      metric: 'Total Clients',
      value: 283,
      change: 12.4,
      trend: 'up'
    },
    {
      id: 'active-licenses',
      metric: 'Active Licenses',
      value: 1742,
      change: 8.7,
      trend: 'up'
    },
    {
      id: 'mrr',
      metric: 'Monthly Recurring Revenue',
      value: 86750,
      change: 5.3,
      trend: 'up'
    },
    {
      id: 'churn-rate',
      metric: 'Churn Rate',
      value: 2.1,
      change: -0.4,
      trend: 'down'
    }
  ];
}

export function getIndustryData() {
  return [
    { name: 'Technology', clients: 78, revenue: 32500 },
    { name: 'Healthcare', clients: 53, revenue: 21800 },
    { name: 'Finance', clients: 42, revenue: 18300 },
    { name: 'Education', clients: 38, revenue: 12700 },
    { name: 'Retail', clients: 31, revenue: 9400 },
    { name: 'Manufacturing', clients: 23, revenue: 8200 },
    { name: 'Other', clients: 18, revenue: 5100 }
  ];
}
