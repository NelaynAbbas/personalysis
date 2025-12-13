// Test script for Business Intelligence Endpoints
import fetch from 'node-fetch';

async function testEndpoints() {
  const baseUrl = 'http://localhost:5000';
  const companyId = 1; // Use a company ID that exists in your database
  
  try {
    console.log('Testing Business Intelligence Endpoints...\n');

    // Test competitor analysis endpoint
    console.log('Testing Competitor Analysis...');
    const competitorResponse = await fetch(`${baseUrl}/api/company/${companyId}/competitors`);
    const competitors = await competitorResponse.json();
    console.log(`Status: ${competitorResponse.status}`);
    console.log(`Response: ${JSON.stringify(competitors, null, 2).substring(0, 300)}...\n`);

    // Test market fit analysis endpoint - adding a default product ID
    console.log('Testing Market Fit Analysis...');
    const productId = 'default';
    const marketFitResponse = await fetch(`${baseUrl}/api/company/${companyId}/market-fit/${productId}`);
    const marketFit = await marketFitResponse.json();
    console.log(`Status: ${marketFitResponse.status}`);
    console.log(`Response: ${JSON.stringify(marketFit, null, 2).substring(0, 300)}...\n`);

    // Test customer segments endpoint
    console.log('Testing Customer Segments...');
    const segmentsResponse = await fetch(`${baseUrl}/api/company/${companyId}/segments`);
    const segments = await segmentsResponse.json();
    console.log(`Status: ${segmentsResponse.status}`);
    console.log(`Response: ${JSON.stringify(segments, null, 2).substring(0, 300)}...\n`);

    // Test product feature priorities endpoint
    console.log('Testing Product Feature Priorities...');
    const featuresResponse = await fetch(`${baseUrl}/api/company/${companyId}/feature-priorities`);
    const features = await featuresResponse.json();
    console.log(`Status: ${featuresResponse.status}`);
    console.log(`Response: ${JSON.stringify(features, null, 2).substring(0, 300)}...\n`);

    // Test pricing strategies endpoint
    console.log('Testing Pricing Strategies...');
    const pricingResponse = await fetch(`${baseUrl}/api/company/${companyId}/pricing-strategies`);
    const pricing = await pricingResponse.json();
    console.log(`Status: ${pricingResponse.status}`);
    console.log(`Response: ${JSON.stringify(pricing, null, 2).substring(0, 300)}...\n`);

    // Test marketing strategies endpoint
    console.log('Testing Marketing Strategies...');
    const marketingResponse = await fetch(`${baseUrl}/api/company/${companyId}/marketing-strategies`);
    const marketing = await marketingResponse.json();
    console.log(`Status: ${marketingResponse.status}`);
    console.log(`Response: ${JSON.stringify(marketing, null, 2).substring(0, 300)}...\n`);

    // Test revenue forecasts endpoint
    console.log('Testing Revenue Forecasts...');
    const forecastsResponse = await fetch(`${baseUrl}/api/company/${companyId}/revenue-forecasts`);
    const forecasts = await forecastsResponse.json();
    console.log(`Status: ${forecastsResponse.status}`);
    console.log(`Response: ${JSON.stringify(forecasts, null, 2).substring(0, 300)}...\n`);

    console.log('All tests completed!');
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testEndpoints();