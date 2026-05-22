// Test admin login endpoint directly
const testAdminLogin = async () => {
  const url = 'http://localhost:5000/api/admin/login';
  
  const payload = {
    email: 'admin@fashionvr.com',
    password: 'admin123',
    ipAddress: '127.0.0.1'
  };

  console.log('Testing admin login...');
  console.log('URL:', url);
  console.log('Payload:', payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Login successful!');
      console.log('Token:', data.token);
      console.log('Admin:', data.admin.name);
    } else {
      console.log('\n❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
};

testAdminLogin();
