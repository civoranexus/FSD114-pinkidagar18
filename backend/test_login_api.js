const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login for student@test.com...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'student@test.com',
            password: 'password123'
        });

        console.log('✅ Login Successful!');
        console.log('Status Code:', response.status);
        console.log('Response Message:', response.data.message);
        process.exit(0);
    } catch (err) {
        console.error('❌ Login Failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
};

testLogin();
