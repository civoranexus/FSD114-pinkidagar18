const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            role: 'student'
        });
        console.log('✅ Registration Successful:', response.status, response.data);
    } catch (error) {
        console.error('❌ Registration Failed:', error.response?.status, error.response?.data);
    }
}

testRegister();
