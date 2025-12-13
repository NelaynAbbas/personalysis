import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function createUser2() {
  console.log('Creating user ID 2 in database...');

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

    // Hash a default password for the new user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // Insert user ID 2
    const insertQuery = `
      INSERT INTO users (id, username, password, email, first_name, last_name, company_id, role, is_active, created_at, updated_at)
      VALUES (2, 'adminuser', $1, 'admin@personalysispro.com', 'Admin', 'User', 2, 'admin', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        is_active = EXCLUDED.is_active
    `;

    await client.query(insertQuery, [hashedPassword]);

    console.log('✅ User ID 2 created successfully');

    // Verify the user was created
    const verifyQuery = 'SELECT id, username, email, company_id, is_active FROM users WHERE id = 2';
    const result = await client.query(verifyQuery);
    console.log('✅ Verification - User ID 2:', result.rows[0]);

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error creating user ID 2:', error.message);
  }
}

createUser2();
