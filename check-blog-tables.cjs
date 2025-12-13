const { Client } = require('pg');
require('dotenv').config();

async function checkBlogTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if blog tables exist
    const tables = ['blog_categories', 'blog_articles'];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      console.log(`Table '${table}' exists: ${result.rows[0].exists}`);

      if (result.rows[0].exists) {
        // Get table structure
        const structure = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

        console.log(`Structure of '${table}':`);
        structure.rows.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
        });

        // Check if table has data
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`Records in '${table}': ${countResult.rows[0].count}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkBlogTables();
