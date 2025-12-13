const https = require('http');
require('dotenv').config();

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            json: () => JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, text: () => data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testBlogAPI() {
  const baseURL = 'http://localhost:5000'; // Server is running on port 5000

  console.log('Testing Blog API endpoints...\n');

  try {
    // Test 1: Get all categories
    console.log('1. Testing GET /api/blog/categories');
    try {
      const categoriesResponse = await makeRequest(`${baseURL}/api/blog/categories`);
      const categoriesData = await categoriesResponse.json();
      console.log(`Status: ${categoriesResponse.status}`);
      console.log(`Response:`, categoriesData);
    } catch (error) {
      console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get all articles
    console.log('2. Testing GET /api/blog/articles');
    try {
      const articlesResponse = await makeRequest(`${baseURL}/api/blog/articles`);
      const articlesData = await articlesResponse.json();
      console.log(`Status: ${articlesResponse.status}`);
      console.log(`Response:`, articlesData);
    } catch (error) {
      console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Create a test category
    console.log('3. Testing POST /api/blog/categories');
    try {
      const testCategory = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category for debugging'
      };

      const createCategoryResponse = await makeRequest(`${baseURL}/api/blog/categories`, {
        method: 'POST',
        body: testCategory
      });

      const createCategoryData = await createCategoryResponse.json();
      console.log(`Status: ${createCategoryResponse.status}`);
      console.log(`Response:`, createCategoryData);
    } catch (error) {
      console.error('Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Create a test article
    console.log('4. Testing POST /api/blog/articles');
    try {
      const testArticle = {
        title: 'Test Article',
        slug: 'test-article',
        excerpt: 'This is a test article for debugging purposes',
        content: 'This is the full content of the test article. It contains enough text to meet the minimum requirements.',
        status: 'draft',
        categoryId: 1, // Assuming category ID 1 exists
        tags: ['test', 'debug'],
        featuredImage: null,
        seo: {
          metaTitle: 'Test Article - Debug',
          metaDescription: 'This is a test article for debugging purposes',
          ogImage: null
        }
      };

      const createArticleResponse = await makeRequest(`${baseURL}/api/blog/articles`, {
        method: 'POST',
        body: testArticle
      });

      const createArticleData = await createArticleResponse.json();
      console.log(`Status: ${createArticleResponse.status}`);
      console.log(`Response:`, createArticleData);
    } catch (error) {
      console.error('Error:', error.message);
    }

  } catch (error) {
    console.error('General error:', error.message);
    console.log('\nNote: Make sure the server is running on port 3000');
    console.log('Start the server with: npm run dev');
  }
}

testBlogAPI();
