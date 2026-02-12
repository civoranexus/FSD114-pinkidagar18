require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

// Explicitly use the new hostname for logging to be sure
console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connection Successful!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    });
