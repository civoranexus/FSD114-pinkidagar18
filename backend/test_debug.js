const mongoose = require('mongoose');

const password = 'Sneha123';
const username = 'snehadagar05';
const cluster = 'cluster0.spwsz3h.mongodb.net';

const uris = [
    {
        name: 'Standard SRV with DB',
        uri: `mongodb+srv://${username}:${password}@${cluster}/eduvillage?retryWrites=true&w=majority&appName=Cluster0`
    },
    {
        name: 'SRV with authSource=admin',
        uri: `mongodb+srv://${username}:${password}@${cluster}/eduvillage?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`
    },
    {
        name: 'SRV without DB (Admin default)',
        uri: `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`
    }
];

async function testConnections() {
    for (const test of uris) {
        console.log(`\n🔹 Testing: ${test.name}`);
        console.log(`   URI: ${test.uri.replace(password, '****')}`);

        try {
            await mongoose.disconnect();
            await mongoose.connect(test.uri, { serverSelectionTimeoutMS: 5000 });
            console.log('   ✅ SUCCESS!');
            process.exit(0);
        } catch (err) {
            console.log(`   ❌ FAILED: ${err.message}`);
            if (err.cause) console.log(`      Cause: ${err.cause}`);
            if (err.codeName) console.log(`      CodeName: ${err.codeName}`);
        }
    }
    console.log('\n❌ All attempts failed.');
}

testConnections();
