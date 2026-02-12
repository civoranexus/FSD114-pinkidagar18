const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    // Determine if using SRV or standard connection string
    const isSRV = mongoUri.startsWith('mongodb+srv://');
    const connectionFormat = isSRV ? 'SRV (Atlas)' : 'Standard';

    const options = {
      family: 4, // Force IPv4
      serverSelectionTimeoutMS: 60000, // Increased to 60 seconds for slower networks
      socketTimeoutMS: 75000, // Increased to 75 seconds
      connectTimeoutMS: 60000, // Increased to 60 seconds
    };

    console.log('🔄 Connecting to MongoDB...');
    console.log(`📡 Connection Format: ${connectionFormat}`);
    console.log(`🔍 URI Prefix: ${mongoUri.substring(0, 15)}...`);
    console.log(`⏱️  Timeout Settings: ${options.serverSelectionTimeoutMS / 1000}s`);

    const conn = await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('');
    console.error('🔍 Troubleshooting Tips:');
    console.error('  1. Check if your IP 0.0.0.0/0 is active in MongoDB Atlas');
    console.error('  2. Verify database credentials (user: snehadagar05)');
    console.error('  3. Ensure the hostname is correct for SRV');
    console.error('  4. Check for any hidden characters in .env');
    console.error('');
    console.error('📝 Connection string format:', process.env.MONGODB_URI?.split('@')[0]?.replace(/\/\/.*:/, '//<credentials>:') + '@...');
    process.exit(1);
  }
};

module.exports = connectDB;