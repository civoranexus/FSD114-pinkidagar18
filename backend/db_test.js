const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Wait for 5 seconds to see if any errors pop up
        console.log('Waiting for potential async errors...');
        setTimeout(() => {
            console.log('Test complete. Exiting.');
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION IN DB TEST:');
    console.error(err);
});
