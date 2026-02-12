const { MongoClient } = require('mongodb');
const fs = require('fs');

const host = 'ac-sngwudf-shard-00-00.spwsz3h.mongodb.net';
const uri = `mongodb://snehadagar05:Sneha123@${host}:27017/eduvillage?ssl=true&authSource=admin&directConnection=true`;

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const result = await client.db("admin").command({ hello: 1 });

        fs.writeFileSync('rs_config.json', JSON.stringify(result, null, 2));
        console.log("✅ Written to rs_config.json");

    } catch (err) {
        console.error("❌ Failed:", err.message);
        fs.writeFileSync('rs_config.json', JSON.stringify({ error: err.message }));
    } finally {
        await client.close();
    }
}
run();
