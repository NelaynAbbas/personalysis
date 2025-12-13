import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { checkDatabaseConnection } from './server/db.ts';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await checkDatabaseConnection();
    console.log('Database connection test result:', result);

    if (result.connected) {
      console.log('✅ Database connection successful!');
      console.log('Database time:', result.time);
    } else {
      console.log('❌ Database connection failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
  }
}

testConnection();
