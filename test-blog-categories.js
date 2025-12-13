import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { pool, db } from './server/db.ts';
import { blogCategories } from './shared/schema.ts';

async function testBlogCategories() {
  let client;
  try {
    console.log('Testing blog categories table...');

    // Get a client from the pool
    client = await pool.connect();

    // Check if blog_categories table exists
    console.log('Checking if blog_categories table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'blog_categories'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log('Blog categories table exists:', tableExists);

    if (!tableExists) {
      console.log('❌ Blog categories table does not exist!');
      console.log('You need to run database migrations to create the table.');
      return;
    }

    // Check if there are any categories in the table
    console.log('Checking for existing categories...');
    const categoriesCheck = await client.query('SELECT COUNT(*) as count FROM blog_categories');
    const categoryCount = parseInt(categoriesCheck.rows[0].count);

    console.log('Number of categories in database:', categoryCount);

    if (categoryCount === 0) {
      console.log('❌ No categories found in database!');
      console.log('You need to create some blog categories first.');
      return;
    }

    // Fetch all categories
    console.log('Fetching all categories...');
    const categories = await client.query('SELECT * FROM blog_categories ORDER BY name');
    console.log('Categories found:', categories.rows);

    // Test the Drizzle ORM query as well
    console.log('Testing Drizzle ORM query...');
    try {
      const drizzleCategories = await db.query.blogCategories.findMany({
        orderBy: (blogCategories, { asc }) => [asc(blogCategories.name)]
      });
      console.log('Drizzle ORM categories:', drizzleCategories);
    } catch (drizzleError) {
      console.error('❌ Drizzle ORM query failed:', drizzleError.message);
    }

    console.log('✅ Blog categories test completed successfully!');

  } catch (error) {
    console.error('❌ Blog categories test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

testBlogCategories();
