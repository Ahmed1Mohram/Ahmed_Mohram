// Test Registration Script
async function testRegistration() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123456!',
    fullName: 'اختبار مستخدم جديد',
    phoneNumber: `0100${Math.floor(Math.random() * 10000000)}`
  }

  console.log('Testing registration with:', testUser)

  try {
    const response = await fetch('http://localhost:3004/api/register-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Registration successful:', result)
      console.log('User ID:', result.user?.id)
      console.log('User should now appear in admin panel')
    } else {
      console.error('❌ Registration failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run test
testRegistration()
