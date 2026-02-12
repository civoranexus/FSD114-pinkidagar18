const mongoose = require('mongoose');

// SRV Connection String
const uri = 'mongodb+srv://snehadagar05:Sneha123@cluster0.77ytqjj.mongodb.net/eduvillage?retryWrites=true&w=majority';

console.log('Testing SRV connection...');

mongoose.connect(uri)
    .then(() => {
        console.log('✅ SRV Connection Successful!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ SRV Connection Failed:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
        process.exit(1);
    });
