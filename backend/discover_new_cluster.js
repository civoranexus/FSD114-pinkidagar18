const mongoose = require('mongoose');
const uri = "mongodb://pinkidagar12110202_db_user:Pinki1234@cluster0-shard-00-00.77ytqjj.mongodb.net:27017/hrms_lite?ssl=true&authSource=admin&directConnection=true";

console.log('Testing direct connection to new cluster...');
mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected!');
        const info = await mongoose.connection.db.admin().command({ isMaster: 1 });
        console.log('Replica Set:', info.setName);
        console.log('Hosts:', info.hosts.join(','));
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    });
