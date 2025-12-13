import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { db } from './server/db.ts';
import { users } from './shared/schema.ts';

async function checkUsers() {
  try {
    console.log('Checking existing users in database...');
    const allUsers = await db.query.users.findMany({
      columns: { id: true, username: true, email: true, companyId: true, isActive: true }
    });
    console.log('Found users:', allUsers);

    if (allUsers.length === 0) {
      console.log('No users found in database');
    } else {
      console.log('User IDs in database:', allUsers.map(u => u.id));
    }
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();
