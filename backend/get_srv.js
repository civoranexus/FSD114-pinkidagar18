const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.spwsz3h.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('Resolution failed:', err);
        return;
    }
    console.log('Resolced addresses:');
    addresses.forEach(a => console.log(a.name));
});
