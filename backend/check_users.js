const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/database');

dotenv.config();

const checkUsers = async () => {
    try {
        await connectDB();

        const users = await User.find({}).select('+password');
        console.log(`Found ${users.length} users:`);

        for (const user of users) {
            console.log(`- ${user.name} (${user.email}): role=${user.role}, isActive=${user.isActive}`);

            // Test common passwords
            const passwordsToTest = ['password123', 'admin123'];
            for (const pw of passwordsToTest) {
                const isMatch = await user.comparePassword(pw);
                if (isMatch) {
                    console.log(`  ✅ Matches password: "${pw}"`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkUsers();
