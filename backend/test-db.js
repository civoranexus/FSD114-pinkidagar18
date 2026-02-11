const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

// FORCE Node.js to use Google DNS internally if the system DNS fails
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://pinkidagar12110202_db_user:Pinki1234@cluster0.77ytqjj.mongodb.net/eduvillage?retryWrites=true&w=majority";

if (!uri) {
    console.error('❌ Error: MONGODB_URI is not defined in .env');
    process.exit(1);
}

// Mask password for logging
const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
console.log(`🔍 Attempting to connect with URI: ${maskedUri}`);

async function testConnection() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        process.exit(0);
    } catch (err) {
        console.error('❌ CONNECTION FAILED:');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);

        console.log('\n🌐 Performing DNS Lookup Test...');
        const hostname = uri.split('@')[1].split('/')[0].split(',')[0].split(':')[0];
        dns.lookup(hostname, (dnsErr, address) => {
            if (dnsErr) {
                console.error(`❌ DNS Lookup failed for ${hostname}:`, dnsErr.message);
            } else {
                console.log(`✅ DNS Lookup successful: ${hostname} -> ${address}`);
            }
            process.exit(1);
        });
    }
}

testConnection();
