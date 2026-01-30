const fs = require('fs');

function logError(msg) {
    fs.writeSync(1, msg + '\n');
    const fd = fs.openSync('final_error.log', 'a');
    fs.writeSync(fd, msg + '\n');
    fs.closeSync(fd);
}

process.on('uncaughtException', (err) => {
    logError('FATAL ERROR CAUGHT:');
    logError(err.name + ': ' + err.message);
    logError(err.stack);
    process.exit(1);
});

logError('Starting server require...');
try {
    require('./server.js');
    logError('Server required successfully.');
} catch (e) {
    logError('CATCH BLOCK CAUGHT ERROR:');
    logError(e.name + ': ' + e.message);
    logError(e.stack);
}
