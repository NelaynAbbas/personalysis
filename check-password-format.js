import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function checkPasswordFormat() {
  console.log('Checking password format in database...');

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

    // Check password format for both users
    const usersResult = await client.query('SELECT id, username, email, password FROM users');
    console.log('Password format check:');
    usersResult.rows.forEach(user => {
      const password = user.password;
      const isHashed = password.length > 20 && (password.includes('$2b$') || password.includes('$2a$'));
      console.log(`  User ${user.id} (${user.username}):`);
      console.log(`    Password length: ${password.length}`);
      console.log(`    Starts with bcrypt hash: ${password.startsWith('$2')}`);
      console.log(`    Is likely hashed: ${isHashed}`);
      console.log(`    Password preview: ${password.substring(0, 20)}...`);
    });

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database query failed:', error.message);
  }
}

checkPasswordFormat();
