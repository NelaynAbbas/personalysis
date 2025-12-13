// Script to fix admin user role in database
import { config } from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
config();

async function fixAdminUserRole() {
  let client;
  try {
    console.log('🔧 Fixing admin user role in database...');

    // Connect to database using the same pattern as check-users-db.js
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? true : false,
    });

    client = await pool.connect();

    // Update admin user role from 'admin' to 'platform_admin'
    const result = await client.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, username, email, role',
      ['platform_admin', 'admin@personalysispro.com']
    );

    console.log('✅ Admin user role updated successfully:', result.rows);

    // Verify the change
    const verifyResult = await client.query(
      'SELECT id, username, email, role FROM users WHERE email = $1',
      ['admin@personalysispro.com']
    );

    console.log('✅ Verified admin user role:', verifyResult.rows[0]?.role);

    await pool.end();
    console.log('🎉 Admin user role fix completed!');

  } catch (error) {
    console.error('❌ Error fixing admin user role:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
}

fixAdminUserRole();
