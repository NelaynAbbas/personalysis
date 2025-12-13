import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function fixAdminPassword() {
  console.log('Fixing admin user password to plain text...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const client = await pool.connect();

    // Update admin user to have plain text password
    const updateQuery = `
      UPDATE users
      SET password = 'admin123'
      WHERE email = 'admin@personalysispro.com'
    `;

    await client.query(updateQuery);

    console.log('✅ Admin user password updated to plain text');

    // Verify the change
    const verifyQuery = 'SELECT id, username, email, password FROM users WHERE email = $1';
    const result = await client.query(verifyQuery, ['admin@personalysispro.com']);
    console.log('✅ Verification - Admin user:', result.rows[0]);

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
  }
}

fixAdminPassword();
