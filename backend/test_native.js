const { MongoClient } = require('mongodb');

const uri = "mongodb://snehadagar05:Sneha123@ac-86a25g3-shard-00-00.77ytqjj.mongodb.net:27017,ac-86a25g3-shard-00-01.77ytqjj.mongodb.net:27017,ac-86a25g3-shard-00-02.77ytqjj.mongodb.net:27017/eduvillage?ssl=true&replicaSet=atlas-zjf555-shard-0&authSource=admin&retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
    try {
        console.log("Attempting to connect with native driver...");
        await client.connect();
        console.log("✅ Native Driver Connected successfully to server");
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Ping successful");
    } catch (err) {
        console.error("❌ Native Driver Connection Failed:", err.message);
        if (err.cause) console.error("Cause:", err.cause);
    } finally {
        await client.close();
    }
}
run();
