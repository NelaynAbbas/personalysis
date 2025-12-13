import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Pool } from '@neondatabase/serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function exploreDatabase() {
  try {
    console.log('🔍 Exploring Personalysis Pro Database...\n');

    // Get basic database info
    console.log('📊 Database Information:');
    const dbInfo = await pool.query('SELECT version(), current_database(), current_user, now()');
    console.log(`  Database: ${dbInfo.rows[0].current_database}`);
    console.log(`  User: ${dbInfo.rows[0].current_user}`);
    console.log(`  PostgreSQL: ${dbInfo.rows[0].version.split(' ')[1]} ${dbInfo.rows[0].version.split(' ')[2]}`);
    console.log(`  Current Time: ${dbInfo.rows[0].now}\n`);

    // Get table list
    console.log('📋 Available Tables:');
    const tables = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tableNames = tables.rows.map(row => row.tablename);
    tableNames.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
    console.log('');

    // Show key table counts
    console.log('📈 Table Row Counts:');
    const keyTables = [
      'users', 'companies', 'surveys', 'survey_responses',
      'templates', 'clients', 'licenses'
    ];

    for (const table of keyTables) {
      if (tableNames.includes(table)) {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${count.rows[0].count} rows`);
      }
    }
    console.log('');

    // Show recent surveys
    console.log('📝 Recent Surveys:');
    const surveys = await pool.query(`
      SELECT id, title, status, created_at
      FROM surveys
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (surveys.rows.length > 0) {
      surveys.rows.forEach((survey, index) => {
        console.log(`  ${index + 1}. "${survey.title}" (ID: ${survey.id}) - ${survey.status}`);
      });
    } else {
      console.log('  No surveys found');
    }
    console.log('');

    // Show recent responses
    console.log('📊 Recent Survey Responses:');
    const responses = await pool.query(`
      SELECT sr.id, s.title as survey_title, sr.created_at, sr.completed
      FROM survey_responses sr
      JOIN surveys s ON sr.survey_id = s.id
      ORDER BY sr.created_at DESC
      LIMIT 5
    `);

    if (responses.rows.length > 0) {
      responses.rows.forEach((response, index) => {
        console.log(`  ${index + 1}. Response to "${response.survey_title}" (${response.completed ? 'Completed' : 'Incomplete'})`);
      });
    } else {
      console.log('  No responses found');
    }
    console.log('');

    console.log('✅ Database exploration completed successfully!');

  } catch (error) {
    console.error('❌ Database exploration failed:', error.message);
  } finally {
    await pool.end();
  }
}

exploreDatabase();
