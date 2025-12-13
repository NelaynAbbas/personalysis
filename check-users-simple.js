import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function checkUsers() {
  console.log('Checking existing users in database...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  console.log('✅ DATABASE_URL found, attempting connection...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const client = await pool.connect();

    // Check users table
    const usersResult = await client.query('SELECT id, username, email, company_id, is_active FROM users');
    console.log('Found users:', usersResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('No users found in database');
    } else {
      console.log('User IDs in database:', usersResult.rows.map(u => u.id));
    }

    // Check companies table too
    const companiesResult = await client.query('SELECT id, name, email FROM companies');
    console.log('Found companies:', companiesResult.rows);

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database query failed:', error.message);
  }
}

checkUsers();
