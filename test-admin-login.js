import fetch from 'node-fetch';

async function testAdminLogin() {
  console.log('Testing admin login...');

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@personalysispro.com',
        password: 'admin123',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Admin login successful!');
      console.log('Response:', data);
    } else {
      console.log('❌ Admin login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Error testing admin login:', error.message);
  }
}

testAdminLogin();
