import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { pool } from './server/db.ts';

async function createSampleCategories() {
  let client;
  try {
    console.log('Creating sample blog categories...');

    // Get a client from the pool
    client = await pool.connect();

    // Sample categories to insert
    const sampleCategories = [
      {
        name: 'Workplace Psychology',
        slug: 'workplace-psychology',
        description: 'Articles about psychological principles in workplace environments',
        article_count: 0,
        is_active: true
      },
      {
        name: 'HR Trends',
        slug: 'hr-trends',
        description: 'Latest developments and trends in human resources',
        article_count: 0,
        is_active: true
      },
      {
        name: 'Business Intelligence',
        slug: 'business-intelligence',
        description: 'Content about data analysis and business insights',
        article_count: 0,
        is_active: true
      },
      {
        name: 'Ethics & Compliance',
        slug: 'ethics-compliance',
        description: 'Ethical considerations in personality assessment',
        article_count: 0,
        is_active: true
      },
      {
        name: 'Industry News',
        slug: 'industry-news',
        description: 'Latest news and updates from the personality assessment industry',
        article_count: 0,
        is_active: true
      }
    ];

    // Insert sample categories
    for (const category of sampleCategories) {
      try {
        await client.query(`
          INSERT INTO blog_categories (name, slug, description, article_count, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (slug) DO NOTHING
        `, [category.name, category.slug, category.description, category.article_count, category.is_active]);

        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.error(`❌ Error creating category ${category.name}:`, error.message);
      }
    }

    // Verify categories were created
    const result = await client.query('SELECT COUNT(*) as count FROM blog_categories');
    const count = parseInt(result.rows[0].count);
    console.log(`✅ Total categories in database: ${count}`);

    // Show all categories
    const categories = await client.query('SELECT * FROM blog_categories ORDER BY name');
    console.log('All categories:');
    categories.rows.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Articles: ${cat.article_count})`);
    });

    console.log('✅ Sample categories created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample categories:', error.message);
    console.error('Full error:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

createSampleCategories();
