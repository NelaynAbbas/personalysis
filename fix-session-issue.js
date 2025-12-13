// Fix for corrupted session issue
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

async function fixSessionIssue() {
  console.log('🔧 Fixing session authentication issue...');

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

    // Check current database state
    console.log('📊 Current database state:');
    const usersResult = await client.query('SELECT id, username, email, company_id, is_active FROM users');
    console.log('Users:', usersResult.rows);

    const companiesResult = await client.query('SELECT id, name, email FROM companies');
    console.log('Companies:', companiesResult.rows);

    // The issue: Session has userId: 2 and companyId: 11, but these don't exist
    // Database only has userId: 1 and companyId: 1, 2

    console.log('🔍 Issue identified:');
    console.log('- Session contains userId: 2, companyId: 11');
    console.log('- Database only has userId: 1');
    console.log('- Session data is corrupted or was created with invalid values');

    // Solution 1: Create the missing user ID 2 if needed
    const userExists = usersResult.rows.some(u => u.id === 2);
    if (!userExists) {
      console.log('🔧 Creating missing user ID 2...');

      await client.query(`
        INSERT INTO users (id, username, password, email, first_name, last_name, company_id, role, is_active, created_at, updated_at)
        VALUES (2, 'clientuser', 'password123', 'client@personalysispro.com', 'Client', 'User', 2, 'client', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          is_active = EXCLUDED.is_active
      `);

      console.log('✅ User ID 2 created successfully');
    }

    // Solution 2: Create missing company ID 11 if needed
    const companyExists = companiesResult.rows.some(c => c.id === 11);
    if (!companyExists) {
      console.log('🔧 Creating missing company ID 11...');

      await client.query(`
        INSERT INTO companies (id, name, email, api_key, subscription_tier, license_status, max_users, max_surveys, max_responses, created_at, updated_at)
        VALUES (11, 'Demo Company 11', 'company11@demo.com', 'api_demo_11_${Date.now()}', 'trial', 'trial', 3, 2, 100, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email
      `);

      console.log('✅ Company ID 11 created successfully');
    }

    // Verify the fix
    console.log('✅ Verification after fix:');
    const verifyUsers = await client.query('SELECT id, username, email, company_id, is_active FROM users');
    console.log('Users:', verifyUsers.rows);

    const verifyCompanies = await client.query('SELECT id, name, email FROM companies');
    console.log('Companies:', verifyCompanies.rows);

    client.release();
    await pool.end();

    console.log('🎉 Session issue fixed! The survey creation should now work.');

  } catch (error) {
    console.error('❌ Error fixing session issue:', error.message);
  }
}

fixSessionIssue();
