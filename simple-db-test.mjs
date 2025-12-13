import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function testConnection() {
  console.log('Testing database connection...');

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
    const result = await client.query('SELECT NOW() as now');
    const now = result.rows[0].now;

    console.log('✅ Database connection successful!');
    console.log('Database time:', now);

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
