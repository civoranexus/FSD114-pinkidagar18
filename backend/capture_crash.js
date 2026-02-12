const { spawn } = require('child_process');
const fs = require('fs');

console.log('--- Starting Server with Capture ---');

const child = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    env: process.env
});

let output = '';

child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
    output += data.toString();
    console.warn('STDERR:', data.toString());
});

child.on('close', (code) => {
    console.log(`--- Server Exited with Code ${code} ---`);
    fs.writeFileSync('crash_report.txt', output);
    console.log('Crash report saved to crash_report.txt');
});
