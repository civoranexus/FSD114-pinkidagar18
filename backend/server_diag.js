try {
    console.log('Loading server.js...');
    require('./server.js');
    console.log('Server module loaded.');
} catch (e) {
    console.error('SERVER CRASH DETECTED:');
    console.error(e.name + ': ' + e.message);
    console.error(e.stack);
    process.exit(1);
}
